<?php

namespace App\Services;

use App\Models\Admission;
use App\Models\Patient;
use App\Models\User;
use App\Models\VitalRecord;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VitalService
{
    public function __construct(
        protected AlertService $alertService,
        protected AuditService $auditService
    ) {}

    /**
     * List vital records with filters.
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = VitalRecord::with(['patient', 'admission', 'recorder', 'alerts'])
            ->orderBy('measured_at', 'desc');

        if (!empty($filters['patient_id'])) {
            $query->where('patient_id', $filters['patient_id']);
        }

        if (!empty($filters['admission_id'])) {
            $query->where('admission_id', $filters['admission_id']);
        }

        if (!empty($filters['start_date'])) {
            $query->where('measured_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->where('measured_at', '<=', $filters['end_date']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Store a manual vital measurement and evaluate against alert engine.
     * Guaranteed immutable: each record is an insert, never an update.
     */
    public function record(array $data, User $actor, string $ip): array
    {
        return DB::transaction(function () use ($data, $actor, $ip) {
            $patient = Patient::findOrFail($data['patient_id']);

            // Validate that the admission belongs to this patient and is currently ACTIVE
            $admission = Admission::where('id', $data['admission_id'])
                ->where('patient_id', $patient->id)
                ->first();

            if (!$admission) {
                throw ValidationException::withMessages([
                    'admission_id' => ['The specified admission does not belong to this patient.'],
                ]);
            }

            if ($admission->status !== 'admitted') {
                throw ValidationException::withMessages([
                    'admission_id' => ['Cannot record vital signs for a discharged admission. The patient must have an active admission.'],
                ]);
            }

            $vitalRecord = VitalRecord::create([
                'patient_id' => $patient->id,
                'admission_id' => $admission->id,
                'recorded_by' => $actor->id,
                'heart_rate' => $data['heart_rate'],
                'systolic_bp' => $data['systolic_bp'],
                'diastolic_bp' => $data['diastolic_bp'],
                'spo2' => $data['spo2'],
                'temperature' => $data['temperature'],
                'respiratory_rate' => $data['respiratory_rate'],
                'notes' => $data['notes'] ?? null,
                'measured_at' => $data['measured_at'] ?? now(),
            ]);

            // Trigger Alert Engine
            $alerts = $this->alertService->evaluateVitals($vitalRecord, $actor);

            // Auto-update / resolve previous alerts if the newly recorded vitals returned to safe bounds
            $activePatientAlerts = \App\Models\Alert::where('patient_id', $patient->id)
                ->whereIn('status', ['active', 'doctor_in_action', 'acknowledged'])
                ->with('alertRule')
                ->get();

            foreach ($activePatientAlerts as $existingAlert) {
                $rule = $existingAlert->alertRule;
                if (!$rule) continue;

                $param = $rule->parameter;
                $currentVal = (float) $vitalRecord->$param;
                $threshold = (float) $rule->threshold_value;

                $stillBreaching = match ($rule->operator) {
                    'greater_than' => $currentVal > $threshold,
                    'greater_than_or_equal' => $currentVal >= $threshold,
                    'less_than' => $currentVal < $threshold,
                    'less_than_or_equal' => $currentVal <= $threshold,
                    'equal_to' => abs($currentVal - $threshold) < 0.001,
                    default => false,
                };

                // If parameter is no longer breaching the rule, auto-resolve it!
                if (!$stillBreaching) {
                    $existingAlert->update(['status' => 'resolved']);
                    \App\Models\AlertAcknowledgement::create([
                        'alert_id' => $existingAlert->id,
                        'user_id' => $actor->id,
                        'action' => 'resolved',
                        'note' => "Follow-up vitals recorded: {$param} stabilized at safe level ({$currentVal}). Alert auto-resolved.",
                        'created_at' => now(),
                    ]);

                    $this->auditService->log(
                        action: 'ALERT_AUTO_RESOLVED_BY_NEW_VITALS',
                        entityType: \App\Models\Alert::class,
                        entityId: $existingAlert->id,
                        details: ['parameter' => $param, 'new_value' => $currentVal],
                        user: $actor,
                        ipAddress: $ip
                    );
                }
            }

            $this->auditService->log(
                action: 'RECORD_VITALS',
                entityType: VitalRecord::class,
                entityId: $vitalRecord->id,
                details: [
                    'patient_id' => $patient->id,
                    'patient_code' => $patient->patient_code,
                    'alerts_generated' => $alerts->count(),
                ],
                user: $actor,
                ipAddress: $ip
            );

            return [
                'vital_record' => $vitalRecord->load(['patient', 'admission', 'recorder', 'alerts']),
                'alerts' => $alerts,
            ];
        });
    }

    /**
     * Retrieve time-series vital history for charts.
     */
    public function getHistoryForPatient(int $patientId, ?string $startDate = null, ?string $endDate = null): Collection
    {
        $query = VitalRecord::where('patient_id', $patientId)
            ->with(['recorder'])
            ->orderBy('measured_at', 'asc');

        if ($startDate) {
            $query->where('measured_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('measured_at', '<=', $endDate);
        }

        return $query->get();
    }
}

