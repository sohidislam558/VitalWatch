<?php

namespace App\Services;

use App\Models\Admission;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdmissionService
{
    public function __construct(
        protected AuditService $auditService,
        protected EmailNotificationService $emailService
    ) {
    }

    /**
     * List admissions with filters.
     */
    public function list(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = Admission::with(['patient'])->orderBy('admitted_at', 'desc');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['ward'])) {
            $query->where('ward', $filters['ward']);
        }

        if (!empty($filters['patient_id'])) {
            $query->where('patient_id', $filters['patient_id']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->whereHas('patient', function ($q) use ($search) {
                $q->where('name', 'LIKE', $search)
                  ->orWhere('patient_code', 'LIKE', $search);
            });
        }

        return $query->paginate($perPage);
    }

    /**
     * Admit a patient. Strictly prevents duplicate active admissions.
     */
    public function admit(array $data, User $actor, string $ip): Admission
    {
        return DB::transaction(function () use ($data, $actor, $ip) {
            $patient = Patient::findOrFail($data['patient_id']);

            // Lock and check for existing active admission
            $existingActive = Admission::where('patient_id', $patient->id)
                ->where('status', 'admitted')
                ->lockForUpdate()
                ->first();

            if ($existingActive) {
                throw ValidationException::withMessages([
                    'patient_id' => [
                        "Patient {$patient->patient_code} is already actively admitted in {$existingActive->ward} (Bed: {$existingActive->bed_number}). Please discharge the existing admission before creating a new one."
                    ],
                ]);
            }

            // Check if the bed in this ward is already occupied by another patient
            $bedOccupied = Admission::where('ward', $data['ward'])
                ->where('bed_number', $data['bed_number'])
                ->where('status', 'admitted')
                ->with('patient')
                ->lockForUpdate()
                ->first();

            if ($bedOccupied) {
                $occupantName = $bedOccupied->patient?->name ?? 'another patient';
                $occupantCode = $bedOccupied->patient?->patient_code ?? 'patient';
                throw ValidationException::withMessages([
                    'bed_number' => [
                        "{$data['bed_number']} in {$data['ward']} is currently occupied by {$occupantName} ({$occupantCode}). Please choose an available bed."
                    ],
                ]);
            }

            $admission = Admission::create([
                'patient_id' => $patient->id,
                'ward' => $data['ward'],
                'bed_number' => $data['bed_number'],
                'admitted_at' => $data['admitted_at'] ?? now(),
                'status' => 'admitted',
            ]);

            $this->auditService->log(
                action: 'PATIENT_ADMITTED',
                entityType: Admission::class,
                entityId: $admission->id,
                details: [
                    'patient_id' => $patient->id,
                    'patient_code' => $patient->patient_code,
                    'ward' => $admission->ward,
                    'bed_number' => $admission->bed_number,
                ],
                user: $actor,
                ipAddress: $ip
            );

            return $admission->load('patient');
        });
    }

    /**
     * Discharge a patient.
     */
    public function discharge(Admission $admission, User $actor, string $ip): Admission
    {
        return DB::transaction(function () use ($admission, $actor, $ip) {
            if ($admission->status === 'discharged') {
                throw ValidationException::withMessages([
                    'admission' => ['This admission record has already been discharged.'],
                ]);
            }

            $admission->update([
                'status' => 'discharged',
                'discharged_at' => now(),
            ]);

            $this->auditService->log(
                action: 'PATIENT_DISCHARGED',
                entityType: Admission::class,
                entityId: $admission->id,
                details: [
                    'patient_id' => $admission->patient_id,
                    'ward' => $admission->ward,
                    'bed_number' => $admission->bed_number,
                    'discharged_at' => $admission->discharged_at->toDateTimeString(),
                ],
                user: $actor,
                ipAddress: $ip
            );

            return $admission->fresh(['patient']);
        });
    }

    /**
     * Get occupied and available bed numbers for all or a specific ward.
     */
    public function getBedsOverview(?string $filterWard = null): array
    {
        $standardBeds = [
            'Cardiology ICU' => ['Bed 101', 'Bed 102', 'Bed 103', 'Bed 104', 'Bed 105', 'Bed 106', 'Bed 107', 'Bed 108', 'Bed 109', 'Bed 110'],
            'Intensive Care Unit (ICU)' => ['ICU-01', 'ICU-02', 'ICU-03', 'ICU-04', 'ICU-05', 'ICU-06', 'ICU-07', 'ICU-08', 'ICU-09', 'ICU-10'],
            'Emergency Department' => ['ER-01', 'ER-02', 'ER-03', 'ER-04', 'ER-05', 'ER-06', 'ER-07', 'ER-08', 'ER-09', 'ER-10'],
            'General Medical Ward' => ['Bed 201', 'Bed 202', 'Bed 203', 'Bed 204', 'Bed 205', 'Bed 206', 'Bed 207', 'Bed 208', 'Bed 209', 'Bed 210'],
            'Surgical Recovery' => ['SURG-01', 'SURG-02', 'SURG-03', 'SURG-04', 'SURG-05', 'SURG-06', 'SURG-07', 'SURG-08', 'SURG-09', 'SURG-10'],
            'Telemetry Observation' => ['TEL-01', 'TEL-02', 'TEL-03', 'TEL-04', 'TEL-05', 'TEL-06', 'TEL-07', 'TEL-08', 'TEL-09', 'TEL-10'],
            'Pediatric Ward' => ['PED-01', 'PED-02', 'PED-03', 'PED-04', 'PED-05', 'PED-06', 'PED-07', 'PED-08', 'PED-09', 'PED-10'],
            'Respiratory Care Unit' => ['RCU-01', 'RCU-02', 'RCU-03', 'RCU-04', 'RCU-05', 'RCU-06', 'RCU-07', 'RCU-08', 'RCU-09', 'RCU-10'],
        ];

        $activeAdmissions = Admission::where('status', 'admitted')
            ->with('patient')
            ->get();

        $occupiedByWard = [];
        foreach ($activeAdmissions as $adm) {
            $occupiedByWard[$adm->ward][] = [
                'bed_number' => $adm->bed_number,
                'patient_id' => $adm->patient_id,
                'patient_name' => $adm->patient?->name,
                'patient_code' => $adm->patient?->patient_code,
            ];
        }

        $wards = $filterWard ? [$filterWard] : array_keys($standardBeds);
        $result = [];

        foreach ($wards as $ward) {
            $configured = $standardBeds[$ward] ?? ['Bed 101', 'Bed 102', 'Bed 103', 'Bed 104', 'Bed 105', 'Bed 106', 'Bed 107', 'Bed 108', 'Bed 109', 'Bed 110'];
            $occupiedList = $occupiedByWard[$ward] ?? [];
            $occupiedBeds = array_column($occupiedList, 'bed_number');

            $allBeds = array_values(array_unique(array_merge($configured, $occupiedBeds)));
            $availableBeds = array_values(array_diff($allBeds, $occupiedBeds));

            $result[$ward] = [
                'ward' => $ward,
                'total_beds' => count($allBeds),
                'available_count' => count($availableBeds),
                'occupied_count' => count($occupiedBeds),
                'available_beds' => $availableBeds,
                'occupied_beds' => $occupiedList,
            ];
        }

        return $filterWard ? ($result[$filterWard] ?? [
            'ward' => $filterWard,
            'total_beds' => 10,
            'available_count' => 10,
            'occupied_count' => 0,
            'available_beds' => ['Bed 101', 'Bed 102', 'Bed 103', 'Bed 104', 'Bed 105', 'Bed 106', 'Bed 107', 'Bed 108', 'Bed 109', 'Bed 110'],
            'occupied_beds' => [],
        ]) : $result;
    }

    /**
     * Request an emergency ICU transfer for an admitted patient.
     */
    public function requestIcuTransfer(Admission $admission, User $requester, ?string $notes = null, ?string $targetWard = 'Intensive Care Unit (ICU)'): Admission
    {
        $icuWards = ['Intensive Care Unit (ICU)', 'Cardiology ICU'];
        if (in_array($admission->ward, $icuWards, true) || $admission->icu_transferred) {
            throw ValidationException::withMessages([
                'icu_transfer' => ["Patient is already admitted in {$admission->ward}. Emergency ICU transfer cannot be re-requested for patients already in the ICU."],
            ]);
        }

        if ($admission->icu_transfer_requested) {
            throw ValidationException::withMessages([
                'icu_transfer' => ["An emergency ICU transfer request is already pending for this patient."],
            ]);
        }

        return DB::transaction(function () use ($admission, $requester, $notes, $targetWard) {
            $admission->update([
                'icu_transfer_requested' => true,
                'icu_transfer_requested_at' => now(),
                'icu_transfer_requested_by' => $requester->id,
                'target_icu_ward' => $targetWard ?: 'Intensive Care Unit (ICU)',
                'icu_transfer_notes' => $notes ?: "Immediate ICU transfer requested by Dr. {$requester->name}. Critical bedside condition.",
            ]);

            $this->auditService->log(
                action: 'EMERGENCY_ICU_TRANSFER_REQUESTED',
                entityType: Admission::class,
                entityId: $admission->id,
                details: [
                    'patient_id' => $admission->patient_id,
                    'patient_name' => $admission->patient?->name,
                    'current_ward' => $admission->ward,
                    'current_bed' => $admission->bed_number,
                    'target_ward' => $admission->target_icu_ward,
                    'requester_id' => $requester->id,
                    'requester_name' => $requester->name,
                    'notes' => $admission->icu_transfer_notes,
                ],
                user: $requester
            );

            // Send instant emergency notification
            $this->emailService->sendIcuTransferNotification($admission, $requester);

            return $admission->fresh(['patient', 'icuTransferRequester']);
        });
    }

    /**
     * Complete an emergency ICU transfer by assigning an available ICU bed.
     */
    public function completeIcuTransfer(Admission $admission, User $actor, string $newWard, string $newBed, string $ip): Admission
    {
        return DB::transaction(function () use ($admission, $actor, $newWard, $newBed, $ip) {
            // Verify new bed is available
            $bedOccupied = Admission::where('ward', $newWard)
                ->where('bed_number', $newBed)
                ->where('status', 'admitted')
                ->where('id', '!=', $admission->id)
                ->with('patient')
                ->first();

            if ($bedOccupied) {
                $occupant = $bedOccupied->patient?->name ?? 'another patient';
                throw ValidationException::withMessages([
                    'bed_number' => ["Bed '{$newBed}' in '{$newWard}' is currently occupied by {$occupant}. Please select an available bed."],
                ]);
            }

            $oldWard = $admission->ward;
            $oldBed = $admission->bed_number;

            $admission->update([
                'ward' => $newWard,
                'bed_number' => $newBed,
                'icu_transfer_requested' => false,
                'icu_transferred' => true,
                'icu_transferred_at' => now(),
                'icu_transfer_notes' => "Transfer completed from {$oldWard} ({$oldBed}) to {$newWard} ({$newBed}) by {$actor->name}.",
            ]);

            $this->auditService->log(
                action: 'PATIENT_TRANSFERRED_TO_ICU',
                entityType: Admission::class,
                entityId: $admission->id,
                details: [
                    'patient_id' => $admission->patient_id,
                    'from_ward' => $oldWard,
                    'from_bed' => $oldBed,
                    'to_ward' => $newWard,
                    'to_bed' => $newBed,
                    'transferred_by' => $actor->name,
                ],
                user: $actor,
                ipAddress: $ip
            );

            return $admission->fresh(['patient', 'icuTransferRequester']);
        });
    }

    /**
     * Cancel / revoke an ICU transfer request.
     */
    public function cancelIcuTransfer(Admission $admission, User $actor, string $ip): Admission
    {
        $admission->update([
            'icu_transfer_requested' => false,
        ]);

        $this->auditService->log(
            action: 'ICU_TRANSFER_REQUEST_CANCELLED',
            entityType: Admission::class,
            entityId: $admission->id,
            details: [
                'patient_id' => $admission->patient_id,
                'cancelled_by' => $actor->name,
            ],
            user: $actor,
            ipAddress: $ip
        );

        return $admission->fresh(['patient']);
    }

    /**
     * Request step-down / transfer back to a general ward for a stable ICU patient.
     */
    public function requestStepDown(Admission $admission, User $requester, ?string $notes = null, ?string $targetWard = 'General Medical Ward'): Admission
    {
        $icuWards = ['Intensive Care Unit (ICU)', 'Cardiology ICU'];
        if (!in_array($admission->ward, $icuWards, true) && !$admission->icu_transferred) {
            throw ValidationException::withMessages([
                'step_down' => ["Patient is currently in {$admission->ward}, not an intensive care unit. Step-down transfer is only applicable for patients in the ICU."],
            ]);
        }

        if ($admission->step_down_requested) {
            throw ValidationException::withMessages([
                'step_down' => ["A step-down ward transfer request is already pending for this patient."],
            ]);
        }

        // Patient must be clinically stable before requesting step-down
        $hasActiveAlerts = $admission->patient?->alerts()
            ->whereIn('status', ['active', 'doctor_in_action'])
            ->exists();

        if ($hasActiveAlerts) {
            throw ValidationException::withMessages([
                'step_down' => ["Patient has unresolved emergency alarms. Complete the clinical assessment and ensure vitals are stable before requesting step-down to a general ward."],
            ]);
        }

        return DB::transaction(function () use ($admission, $requester, $notes, $targetWard) {
            $admission->update([
                'step_down_requested' => true,
                'step_down_requested_at' => now(),
                'step_down_requested_by' => $requester->id,
                'target_step_down_ward' => $targetWard ?: 'General Medical Ward',
                'step_down_notes' => $notes ?: "Step-down to general ward requested by Dr. {$requester->name}. Patient condition is stable and ready for step-down care.",
            ]);

            $this->auditService->log(
                action: 'STEP_DOWN_REQUESTED',
                entityType: Admission::class,
                entityId: $admission->id,
                details: [
                    'patient_id' => $admission->patient_id,
                    'patient_name' => $admission->patient?->name,
                    'current_ward' => $admission->ward,
                    'current_bed' => $admission->bed_number,
                    'target_ward' => $admission->target_step_down_ward,
                    'requester_id' => $requester->id,
                    'requester_name' => $requester->name,
                    'notes' => $admission->step_down_notes,
                ],
                user: $requester
            );

            return $admission->fresh(['patient', 'stepDownRequester']);
        });
    }

    /**
     * Complete step-down transfer by allocating an available general ward bed.
     */
    public function completeStepDown(Admission $admission, User $actor, string $newWard, string $newBed, string $ip): Admission
    {
        $icuWards = ['Intensive Care Unit (ICU)', 'Cardiology ICU'];
        if (in_array($newWard, $icuWards, true)) {
            throw ValidationException::withMessages([
                'ward' => ["Step-down target ward must be a general or step-down ward, not an intensive care unit."],
            ]);
        }

        return DB::transaction(function () use ($admission, $actor, $newWard, $newBed, $ip) {
            $bedOccupied = Admission::where('ward', $newWard)
                ->where('bed_number', $newBed)
                ->where('status', 'admitted')
                ->where('id', '!=', $admission->id)
                ->with('patient')
                ->first();

            if ($bedOccupied) {
                $occupant = $bedOccupied->patient?->name ?? 'another patient';
                throw ValidationException::withMessages([
                    'bed_number' => ["Bed '{$newBed}' in '{$newWard}' is currently occupied by {$occupant}. Please select an available bed."],
                ]);
            }

            $oldWard = $admission->ward;
            $oldBed = $admission->bed_number;

            $admission->update([
                'ward' => $newWard,
                'bed_number' => $newBed,
                'step_down_requested' => false,
                'step_down_completed' => true,
                'step_down_completed_at' => now(),
                'icu_transferred' => false, // Reset ICU transferred flag!
                'target_step_down_ward' => null,
                'step_down_notes' => "Step-down completed from {$oldWard} ({$oldBed}) to {$newWard} ({$newBed}) by {$actor->name}.",
            ]);

            $this->auditService->log(
                action: 'PATIENT_STEPPED_DOWN',
                entityType: Admission::class,
                entityId: $admission->id,
                details: [
                    'patient_id' => $admission->patient_id,
                    'from_ward' => $oldWard,
                    'from_bed' => $oldBed,
                    'to_ward' => $newWard,
                    'to_bed' => $newBed,
                    'transferred_by' => $actor->name,
                ],
                user: $actor,
                ipAddress: $ip
            );

            return $admission->fresh(['patient', 'stepDownRequester']);
        });
    }

    /**
     * Cancel / revoke a step-down request.
     */
    public function cancelStepDown(Admission $admission, User $actor, string $ip): Admission
    {
        $admission->update([
            'step_down_requested' => false,
        ]);

        $this->auditService->log(
            action: 'STEP_DOWN_CANCELLED',
            entityType: Admission::class,
            entityId: $admission->id,
            details: [
                'patient_id' => $admission->patient_id,
                'cancelled_by' => $actor->name,
            ],
            user: $actor,
            ipAddress: $ip
        );

        return $admission->fresh(['patient']);
    }
}

