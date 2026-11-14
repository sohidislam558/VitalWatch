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

            $isPatientUnderDoctorCare = Alert::where('patient_id', $vitalRecord->patient_id)
                ->where('status', 'doctor_in_action')
                ->first();

            $initialStatus = $isPatientUnderDoctorCare ? 'doctor_in_action' : 'active';

            $alert = Alert::create([
                'patient_id' => $vitalRecord->patient_id,
                'vital_record_id' => $vitalRecord->id,
                'alert_rule_id' => $rule->id,
                'message' => $message,
                'priority' => $rule->priority,
                'status' => $initialStatus,
            ]);

            if ($isPatientUnderDoctorCare) {
                $attendingAck = $isPatientUnderDoctorCare->acknowledgements()
                    ->where('action', 'doctor_in_action')
                    ->latest()
                    ->first();
                if ($attendingAck) {
                    AlertAcknowledgement::create([
                        'alert_id' => $alert->id,
                        'user_id' => $attendingAck->user_id,
                        'action' => 'doctor_in_action',
                        'note' => "Attached to active bedside case: Critical alarm triggered during treatment.",
                        'created_at' => now(),
                    ]);
                }
            }

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
     * Enforces single-patient concurrency: a doctor can only attend one active patient at a time.
     * Transitions all active alerts for this patient into 'doctor_in_action' in a single clinical action.
     */
    public function markDoctorInAction(Alert $alert, User $user, ?string $note, string $ip): Alert
    {
        // Enforce concurrency limit: A doctor can only attend ONE patient at a time
        if ($user->role === 'doctor') {
            $busyAlert = Alert::where('status', 'doctor_in_action')
                ->where('patient_id', '!=', $alert->patient_id)
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

        $actionNote = $note ?: "Doctor in Action: " . User::formatDoctorName($user->name) . " is actively responding to emergency alarms at bedside.";

        // Transition ALL active emergency alerts for this patient to doctor_in_action!
        $patientAlerts = Alert::where('patient_id', $alert->patient_id)
            ->where('status', 'active')
            ->get();

        foreach ($patientAlerts as $pAlert) {
            $pAlert->update(['status' => 'doctor_in_action']);
            AlertAcknowledgement::create([
                'alert_id' => $pAlert->id,
                'user_id' => $user->id,
                'action' => 'doctor_in_action',
                'note' => $actionNote,
                'created_at' => now(),
            ]);
        }

        // Ensure the target alert itself is updated
        $alert->update(['status' => 'doctor_in_action']);
        AlertAcknowledgement::firstOrCreate(
            ['alert_id' => $alert->id, 'user_id' => $user->id, 'action' => 'doctor_in_action'],
            ['note' => $actionNote, 'created_at' => now()]
        );

        $this->auditService->log(
            action: 'DOCTOR_IN_ACTION',
            entityType: Alert::class,
            entityId: $alert->id,
            details: [
                'doctor_id' => $user->id,
                'doctor_name' => $user->name,
                'patient_id' => $alert->patient_id,
                'note' => $actionNote,
                'patient_alerts_count' => $patientAlerts->count(),
            ],
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
     * Resolves all active and doctor_in_action alerts for this patient in a single clinical resolution.
     */
    public function resolve(Alert $alert, User $user, ?string $note, string $ip): Alert
    {
        $actionNote = $note ?: "Bedside assessment completed by " . User::formatDoctorName($user->name) . ". Clinical alert resolved.";

        // Resolve ALL active, acknowledged, or doctor_in_action alerts for this patient!
        $patientAlerts = Alert::where('patient_id', $alert->patient_id)
            ->whereIn('status', ['active', 'doctor_in_action', 'acknowledged'])
            ->get();

        foreach ($patientAlerts as $pAlert) {
            $pAlert->update(['status' => 'resolved']);
            AlertAcknowledgement::create([
                'alert_id' => $pAlert->id,
                'user_id' => $user->id,
                'action' => 'resolved',
                'note' => $actionNote,
                'created_at' => now(),
            ]);
        }

        $alert->update(['status' => 'resolved']);

        $this->auditService->log(
            action: 'ALERT_RESOLVED',
            entityType: Alert::class,
            entityId: $alert->id,
            details: [
                'note' => $actionNote,
                'patient_id' => $alert->patient_id,
                'resolved_alerts_count' => $patientAlerts->count(),
            ],
            user: $user,
            ipAddress: $ip
        );

        return $alert->fresh(['patient', 'vitalRecord', 'alertRule', 'acknowledgements.user']);
    }
}

