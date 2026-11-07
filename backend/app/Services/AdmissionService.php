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
    public function __construct(protected AuditService $auditService)
    {
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
}

