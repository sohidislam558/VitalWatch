<?php

namespace App\Services;

use App\Models\Admission;
use App\Models\Alert;
use App\Models\AuditLog;
use App\Models\Patient;
use App\Models\VitalRecord;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class DashboardService
{
    /**
     * Compute real-time hospital telemetry KPI summary from MySQL.
     */
    public function getSummary(): array
    {
        $totalAdmitted = Admission::where('status', 'admitted')->count();

        // Patients with at least one vital record during their current admission
        $patientsWithVitals = Patient::whereHas('activeAdmission', function ($q) {
            $q->has('vitalRecords');
        })->count();

        // Unique patients with alarms (only one alarm per patient)
        $activeAlertsPatients = Alert::whereIn('status', ['active', 'doctor_in_action'])->distinct('patient_id')->count('patient_id');
        $urgentAlertsPatients = Alert::where('status', 'active')->where('priority', 'urgent')->distinct('patient_id')->count('patient_id');
        $doctorInActionAlertsPatients = Alert::where('status', 'doctor_in_action')->distinct('patient_id')->count('patient_id');
        $reviewAlertsPatients = Alert::where('status', 'active')->where('priority', 'review')->distinct('patient_id')->count('patient_id');
        $unacknowledgedAlertsPatients = Alert::where('status', 'active')
            ->doesntHave('acknowledgements')
            ->distinct('patient_id')
            ->count('patient_id');

        return [
            'total_admitted' => $totalAdmitted,
            'patients_with_vitals' => $patientsWithVitals,
            'active_alerts' => $activeAlertsPatients,
            'urgent_alerts' => $urgentAlertsPatients,
            'doctor_in_action_alerts' => $doctorInActionAlertsPatients,
            'review_alerts' => $reviewAlertsPatients,
            'unacknowledged_alerts' => $unacknowledgedAlertsPatients,
        ];
    }

    /**
     * Retrieve patient monitoring list with clear, simple human-readable situation descriptions.
     */
    public function getPatients(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Patient::whereHas('activeAdmission')
            ->with([
                'activeAdmission',
                'latestVitalRecord.recorder',
                'alerts' => fn($q) => $q->whereIn('status', ['active', 'doctor_in_action'])->with(['alertRule', 'acknowledgements.user']),
            ])
            ->orderBy('id', 'asc');

        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', $search)
                  ->orWhere('patient_code', 'LIKE', $search);
            });
        }

        if (!empty($filters['ward'])) {
            $query->whereHas('activeAdmission', function ($q) use ($filters) {
                $q->where('ward', $filters['ward']);
            });
        }

        $paginator = $query->paginate($perPage);

        // Transform collection to attach simple human-readable clinical situation descriptions
        $paginator->getCollection()->transform(function ($patient) {
            $activeAlerts = $patient->alerts;
            $vitals = $patient->latestVitalRecord;

            $doctorInActionAlerts = $activeAlerts->where('status', 'doctor_in_action');
            $urgentAlerts = $activeAlerts->where('status', 'active')->where('priority', 'urgent');
            $reviewAlerts = $activeAlerts->where('status', 'active')->where('priority', 'review');

            if ($doctorInActionAlerts->isNotEmpty()) {
                $ackDoctor = $doctorInActionAlerts->first()->acknowledgements->where('action', 'doctor_in_action')->last()?->user?->name;
                $doctorText = $ackDoctor ? "Dr. {$ackDoctor}" : "Attending Doctor";

                $status = 'doctor_in_action';
                $combined = $doctorInActionAlerts->pluck('message')->unique()->implode(' • ');

                // Check if current vitals are stabilizing or worsening
                $hasBreach = false;
                if ($vitals) {
                    $activeRules = \App\Models\AlertRule::where('is_active', true)->get();
                    foreach ($activeRules as $rule) {
                        $p = $rule->parameter;
                        if (isset($vitals->$p)) {
                            $v = (float) $vitals->$p;
                            $t = (float) $rule->threshold_value;
                            $breached = match ($rule->operator) {
                                'greater_than' => $v > $t,
                                'greater_than_or_equal' => $v >= $t,
                                'less_than' => $v < $t,
                                'less_than_or_equal' => $v <= $t,
                                'equal_to' => abs($v - $t) < 0.001,
                                default => false,
                            };
                            if ($breached) {
                                $hasBreach = true;
                                break;
                            }
                        }
                    }
                }

                if ($vitals && !$hasBreach) {
                    $statusLabel = 'Doctor in Action: Patient Stabilizing';
                    $situationDescription = "{$doctorText} attending bedside: Patient Stabilizing. Latest vitals (HR: {$vitals->heart_rate} bpm, BP: {$vitals->systolic_bp}/{$vitals->diastolic_bp}, SpO2: {$vitals->spo2}%) normalized to safe bounds. Awaiting final assessment completion.";
                    $badgeColor = 'blue';
                } elseif ($hasBreach) {
                    $statusLabel = 'Doctor in Action: Critical Deterioration';
                    $situationDescription = "{$doctorText} attending bedside: Critical Deterioration detected ({$combined})! Continued bedside intervention required.";
                    $badgeColor = 'red';
                } else {
                    $statusLabel = 'Doctor in Action';
                    $situationDescription = "{$doctorText} is actively attending bedside to manage: {$combined}";
                    $badgeColor = 'blue';
                }
            } elseif ($urgentAlerts->isNotEmpty()) {
                $status = 'emergency';
                $statusLabel = 'Emergency Attention';
                $combined = $urgentAlerts->pluck('message')->unique()->implode(' • ');
                $situationDescription = "EMERGENCY ALARM: {$combined}. Attending Physician notified via Gmail SMTP.";
                $badgeColor = 'red';
            } elseif ($reviewAlerts->isNotEmpty()) {
                $status = 'review';
                $statusLabel = 'Attention Needed';
                $combined = $reviewAlerts->pluck('message')->unique()->implode(' • ');
                $situationDescription = "NOTICE: {$combined}. Monitor patient carefully.";
                $badgeColor = 'amber';
            } elseif ($vitals) {
                $status = 'stable';
                $statusLabel = 'Normal & Stable';
                $situationDescription = "All vital signs within safe bounds (HR: {$vitals->heart_rate} bpm, BP: {$vitals->systolic_bp}/{$vitals->diastolic_bp}, SpO2: {$vitals->spo2}%). Patient resting comfortably.";
                $badgeColor = 'emerald';
            } else {
                $status = 'pending_vitals';
                $statusLabel = 'Awaiting Vitals';
                $situationDescription = "Newly admitted to {$patient->activeAdmission?->ward}. Initial vital signs entry pending by nurse.";
                $badgeColor = 'slate';
            }

            $patient->situation_status = $status;
            $patient->situation_label = $statusLabel;
            $patient->situation_description = $situationDescription;
            $patient->situation_color = $badgeColor;

            return $patient;
        });

        return $paginator;
    }

    /**
     * Retrieve active alert stream sorted urgent ahead of review.
     */
    public function getAlerts(int $limit = 10): Collection
    {
        return Alert::whereIn('status', ['active', 'doctor_in_action'])
            ->with([
                'patient.activeAdmission',
                'vitalRecord.recorder',
                'alertRule',
                'acknowledgements.user',
            ])
            ->orderByRaw("FIELD(status, 'active', 'doctor_in_action') ASC")
            ->orderByRaw("FIELD(priority, 'urgent', 'review') ASC")
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get();
    }

    /**
     * Retrieve full chronological hospital activity stream for Admin oversight.
     * Shows all vitals taken by nurses and all actions taken by doctors.
     */
    public function getActivities(int $limit = 40): Collection
    {
        return AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get()
            ->map(function ($log) {
                $role = $log->user?->role ?? 'system';
                $userName = $log->user?->name ?? 'System';
                $details = is_array($log->details) ? $log->details : [];

                $ruleName = $details['rule'] ?? 'Threshold breached';
                $patientName = $details['name'] ?? 'Patient';
                $patientCode = $details['patient_code'] ?? '';
                $ward = $details['ward'] ?? 'Ward';
                $bed = $details['bed_number'] ?? '';

                $summary = match ($log->action) {
                    'RECORD_VITALS' => "Nurse {$userName} entered bedside vital signs (Patient ID: #{$log->entity_id})",
                    'DOCTOR_IN_ACTION' => "Doctor {$userName} responded to emergency alarm: 'Doctor in Action' (Alert #{$log->entity_id})",
                    'ALERT_ACKNOWLEDGED' => "{$userName} acknowledged early warning alert #{$log->entity_id}",
                    'ALERT_RESOLVED' => "Doctor {$userName} formally resolved alert #{$log->entity_id}",
                    'ALERT_AUTO_RESOLVED_BY_NEW_VITALS' => "System: Alert #{$log->entity_id} auto-resolved following normal vitals recorded by Nurse {$userName}",
                    'ALERT_GENERATED' => "Early Warning Alert triggered: {$ruleName}",
                    'PATIENT_REGISTERED' => "Staff {$userName} registered patient '{$patientName}' ({$patientCode})",
                    'PATIENT_ADMITTED' => "Patient admitted to {$ward} (Bed {$bed}) by {$userName}",
                    'PATIENT_DISCHARGED' => "Patient discharged from {$ward} by {$userName}",
                    'LOGIN_SUCCESS' => "{$userName} signed in to hospital portal",
                    default => "{$userName} performed {$log->action}",
                };

                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'role' => $role,
                    'user_name' => $userName,
                    'summary' => $summary,
                    'details' => $details,
                    'created_at' => $log->created_at,
                ];
            });
    }
}
