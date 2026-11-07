<?php

namespace Database\Seeders;

use App\Models\Admission;
use App\Models\Alert;
use App\Models\AlertAcknowledgement;
use App\Models\AlertRule;
use App\Models\Patient;
use App\Models\User;
use App\Models\VitalRecord;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class VitalRecordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        $rules = AlertRule::where('is_active', true)->get();

        $patients = Patient::with('activeAdmission')->get();

        foreach ($patients as $patient) {
            $admission = $patient->activeAdmission;
            if (!$admission) {
                continue;
            }

            // Create 5 successive vital recordings for each patient over the last 24 hours
            $measurements = [
                ['subHours' => 20, 'hr' => 74.0,  'sbp' => 122.0, 'dbp' => 78.0, 'spo2' => 98.0, 'temp' => 36.6, 'rr' => 16.0],
                ['subHours' => 15, 'hr' => 78.0,  'sbp' => 125.0, 'dbp' => 80.0, 'spo2' => 97.0, 'temp' => 36.8, 'rr' => 17.0],
                ['subHours' => 10, 'hr' => 82.0,  'sbp' => 130.0, 'dbp' => 84.0, 'spo2' => 96.0, 'temp' => 37.1, 'rr' => 18.0],
                ['subHours' => 5,  'hr' => 88.0,  'sbp' => 136.0, 'dbp' => 88.0, 'spo2' => 95.0, 'temp' => 37.4, 'rr' => 19.0],
                ['subHours' => 1,  'hr' => 85.0,  'sbp' => 128.0, 'dbp' => 82.0, 'spo2' => 97.0, 'temp' => 36.9, 'rr' => 16.0],
            ];

            // Specific variation for demonstration scenarios:
            if ($patient->patient_code === 'PAT-2026-0001') {
                // John Anderson develops Severe Tachycardia (>120 bpm)
                $measurements[3]['hr'] = 126.0;
                $measurements[4]['hr'] = 124.0;
            } elseif ($patient->patient_code === 'PAT-2026-0002') {
                // Margaret Taylor develops Severe Systolic Hypertension (>160 mmHg)
                $measurements[3]['sbp'] = 168.0;
                $measurements[4]['sbp'] = 164.0;
            } elseif ($patient->patient_code === 'PAT-2026-0003') {
                // Robert Davis develops Hypoxia (SpO2 < 92%)
                $measurements[3]['spo2'] = 89.0;
                $measurements[4]['spo2'] = 91.0;
            } elseif ($patient->patient_code === 'PAT-2026-0004') {
                // Alice Brown develops High Fever (>= 38.5)
                $measurements[3]['temp'] = 38.9;
                $measurements[4]['temp'] = 38.6;
            }

            foreach ($measurements as $item) {
                $measuredAt = Carbon::now()->subHours($item['subHours']);
                $vitalRecord = VitalRecord::create([
                    'patient_id' => $patient->id,
                    'admission_id' => $admission->id,
                    'recorded_by' => $admin->id,
                    'heart_rate' => $item['hr'],
                    'systolic_bp' => $item['sbp'],
                    'diastolic_bp' => $item['dbp'],
                    'spo2' => $item['spo2'],
                    'temperature' => $item['temp'],
                    'respiratory_rate' => $item['rr'],
                    'notes' => 'Routine rounding observation.',
                    'measured_at' => $measuredAt,
                    'created_at' => $measuredAt,
                    'updated_at' => $measuredAt,
                ]);

                // Check rules and generate demonstration alerts
                foreach ($rules as $rule) {
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

                    if ($triggered) {
                        // Check if an alert for this rule already exists for this vital record
                        $alert = Alert::firstOrCreate(
                            [
                                'vital_record_id' => $vitalRecord->id,
                                'alert_rule_id' => $rule->id,
                            ],
                            [
                                'patient_id' => $patient->id,
                                'message' => str_replace('{val}', (string)$val, $rule->message_template),
                                'priority' => $rule->priority,
                                'status' => 'active',
                                'created_at' => $measuredAt,
                                'updated_at' => $measuredAt,
                            ]
                        );

                        // If it was the older reading (subHours >= 5), seed an acknowledgement
                        if ($item['subHours'] >= 5 && $alert->wasRecentlyCreated) {
                            $alert->update(['status' => 'acknowledged']);
                            AlertAcknowledgement::create([
                                'alert_id' => $alert->id,
                                'user_id' => $admin->id,
                                'action' => 'acknowledged',
                                'note' => 'Staff notified bedside team. Monitoring patient continuously.',
                                'created_at' => $measuredAt->copy()->addMinutes(15),
                            ]);
                        }
                    }
                }
            }
        }
    }
}

