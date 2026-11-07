<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\AlertAcknowledgement;
use App\Models\AlertRule;
use App\Models\User;
use App\Models\VitalRecord;
use Illuminate\Database\Eloquent\Collection;

class AlertService
{
    public function __construct(
        protected AuditService $auditService,
        protected EmailNotificationService $emailService
    ) {}

    /**
     * Evaluate a new vital measurement against all active alert rules.
     * Prevents duplicate active alerts for the same rule and patient.
     *
     * @return Collection<int, Alert>
     */
    public function evaluateVitals(VitalRecord $vitalRecord, User $actor): Collection
    {
        $activeRules = AlertRule::where('is_active', true)->get();
        $generatedAlerts = new Collection();

        foreach ($activeRules as $rule) {
            $param = $rule->parameter;
            $val = (float) $vitalRecord->$param;
            $threshold = (float) $rule->threshold_value;

            $triggered = match ($rule->operator) {
                'greater_than' => $val > $threshold,
                'greater_than_or_equal' => $val >= $threshold,
                'less_than' => $val < $threshold,
                'less_than_or_equal' => $val <= $threshold,
                'equal_to' => abs($val - $threshold) < 0.001,
                default => false,
            };

            if (!$triggered) {
                continue;
            }

            // Check if there is already an active alert for this patient and rule
            $existingActiveAlert = Alert::where('patient_id', $vitalRecord->patient_id)
                ->where('alert_rule_id', $rule->id)
                ->where('status', 'active')
                ->exists();

            if ($existingActiveAlert) {
                // Prevent duplicate active alert flooding
                continue;
            }

            $message = str_replace('{val}', (string)$val, $rule->message_template);

            $alert = Alert::create([
                'patient_id' => $vitalRecord->patient_id,
                'vital_record_id' => $vitalRecord->id,
                'alert_rule_id' => $rule->id,
                'message' => $message,
                'priority' => $rule->priority,
                'status' => 'active',
            ]);

            $this->auditService->log(
                action: 'ALERT_GENERATED',
                entityType: Alert::class,
                entityId: $alert->id,
                details: [
                    'rule' => $rule->name,
                    'parameter' => $param,
                    'value' => $val,
                    'threshold' => $threshold,
                    'priority' => $rule->priority,
                ],
                user: $actor
            );

            // Send non-blocking email notification
            $this->emailService->sendAlertNotification($alert);

            $generatedAlerts->push($alert);
        }

        return $generatedAlerts;
    }

    /**
     * Mark an emergency alert as "Doctor in Action" (Doctor responding at bedside).
     * Enforces single-patient concurrency: a doctor can only attend one active case at a time.
     */
    public function markDoctorInAction(Alert $alert, User $user, ?string $note, string $ip): Alert
    {
        // Enforce concurrency limit: A doctor can only attend ONE patient at a time
        if ($user->role === 'doctor') {
            $busyAlert = Alert::where('status', 'doctor_in_action')
                ->where('id', '!=', $alert->id)
                ->whereHas('acknowledgements', function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->where('action', 'doctor_in_action');
                })
                ->with('patient.activeAdmission')
                ->first();

            if ($busyAlert) {
                $otherPatient = $busyAlert->patient?->name ?? 'another patient';
                $ward = $busyAlert->patient?->activeAdmission?->ward ?? 'Ward';
                $bed = $busyAlert->patient?->activeAdmission?->bed_number ?? '';
                $location = $bed ? " ({$ward}, Bed {$bed})" : " ({$ward})";

                throw \Illuminate\Validation\ValidationException::withMessages([
                    'doctor_in_action' => [
                        "You are currently attending patient '{$otherPatient}'{$location}. You must complete that assessment before selecting another patient."
                    ],
                ]);
            }
        }

        $alert->update(['status' => 'doctor_in_action']);

        $actionNote = $note ?: "Doctor in Action: Dr. {$user->name} is actively responding to this emergency at bedside.";

        AlertAcknowledgement::create([
            'alert_id' => $alert->id,
            'user_id' => $user->id,
            'action' => 'doctor_in_action',
            'note' => $actionNote,
            'created_at' => now(),
        ]);

        $this->auditService->log(
            action: 'DOCTOR_IN_ACTION',
            entityType: Alert::class,
            entityId: $alert->id,
            details: ['doctor_id' => $user->id, 'doctor_name' => $user->name, 'note' => $actionNote],
            user: $user,
            ipAddress: $ip
        );

        return $alert->fresh(['patient', 'vitalRecord', 'alertRule', 'acknowledgements.user']);
    }

    /**
     * Acknowledge an active alert.
     */
    public function acknowledge(Alert $alert, User $user, ?string $note, string $ip): Alert
    {
        $alert->update(['status' => 'acknowledged']);

        AlertAcknowledgement::create([
            'alert_id' => $alert->id,
            'user_id' => $user->id,
            'action' => 'acknowledged',
            'note' => $note,
            'created_at' => now(),
        ]);

        $this->auditService->log(
            action: 'ALERT_ACKNOWLEDGED',
            entityType: Alert::class,
            entityId: $alert->id,
            details: ['note' => $note],
            user: $user,
            ipAddress: $ip
        );

        return $alert->fresh(['patient', 'vitalRecord', 'alertRule', 'acknowledgements.user']);
    }

    /**
     * Resolve an alert (Doctor or Admin).
     */
    public function resolve(Alert $alert, User $user, ?string $note, string $ip): Alert
    {
        $alert->update(['status' => 'resolved']);

        AlertAcknowledgement::create([
            'alert_id' => $alert->id,
            'user_id' => $user->id,
            'action' => 'resolved',
            'note' => $note,
            'created_at' => now(),
        ]);

        $this->auditService->log(
            action: 'ALERT_RESOLVED',
            entityType: Alert::class,
            entityId: $alert->id,
            details: ['note' => $note],
            user: $user,
            ipAddress: $ip
        );

        return $alert->fresh(['patient', 'vitalRecord', 'alertRule', 'acknowledgements.user']);
    }
}

