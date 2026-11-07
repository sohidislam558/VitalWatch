<?php

namespace Database\Seeders;

use App\Models\AlertRule;
use App\Models\User;
use Illuminate\Database\Seeder;

class AlertRuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * NOTICE: All rules are strictly for ACADEMIC DEMONSTRATION ONLY — NOT CLINICALLY VALIDATED.
     */
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();

        $rules = [
            [
                'name' => '[DEMO] Severe Tachycardia (>120 bpm)',
                'parameter' => 'heart_rate',
                'operator' => 'greater_than',
                'threshold_value' => 120.0,
                'priority' => 'urgent',
                'message_template' => 'Heart rate exceeds 120 bpm ({val} bpm). Immediate clinical review requested.',
                'is_active' => true,
                'approved_by' => $admin?->id,
            ],
            [
                'name' => '[DEMO] Severe Bradycardia (<50 bpm)',
                'parameter' => 'heart_rate',
                'operator' => 'less_than',
                'threshold_value' => 50.0,
                'priority' => 'urgent',
                'message_template' => 'Heart rate dropped below 50 bpm ({val} bpm). Prompt bedside review required.',
                'is_active' => true,
                'approved_by' => $admin?->id,
            ],
            [
                'name' => '[DEMO] Critical Hypoxia (SpO2 < 92%)',
                'parameter' => 'spo2',
                'operator' => 'less_than',
                'threshold_value' => 92.0,
                'priority' => 'urgent',
                'message_template' => 'Oxygen saturation fell below 92% ({val}%). Check oxygen delivery and airway.',
                'is_active' => true,
                'approved_by' => $admin?->id,
            ],
            [
                'name' => '[DEMO] High Pyrexia / Fever (>= 38.5°C)',
                'parameter' => 'temperature',
                'operator' => 'greater_than_or_equal',
                'threshold_value' => 38.5,
                'priority' => 'review',
                'message_template' => 'Body temperature elevated at {val}°C. Review antipyretic protocol.',
                'is_active' => true,
                'approved_by' => $admin?->id,
            ],
            [
                'name' => '[DEMO] Severe Systolic Hypertension (>160 mmHg)',
                'parameter' => 'systolic_bp',
                'operator' => 'greater_than',
                'threshold_value' => 160.0,
                'priority' => 'urgent',
                'message_template' => 'Systolic BP exceeds 160 mmHg ({val} mmHg). Review antihypertensive orders.',
                'is_active' => true,
                'approved_by' => $admin?->id,
            ],
            [
                'name' => '[DEMO] Tachypnea (>24 breaths/min)',
                'parameter' => 'respiratory_rate',
                'operator' => 'greater_than',
                'threshold_value' => 24.0,
                'priority' => 'review',
                'message_template' => 'Elevated respiratory rate at {val} breaths/min. Observe breathing pattern.',
                'is_active' => true,
                'approved_by' => $admin?->id,
            ],
            [
                'name' => '[DEMO] Severe Bradypnea (<10 breaths/min)',
                'parameter' => 'respiratory_rate',
                'operator' => 'less_than',
                'threshold_value' => 10.0,
                'priority' => 'urgent',
                'message_template' => 'Respiratory depression at {val} breaths/min. Immediate airway assessment.',
                'is_active' => true,
                'approved_by' => $admin?->id,
            ],
        ];

        foreach ($rules as $rule) {
            AlertRule::updateOrCreate(
                ['name' => $rule['name']],
                $rule
            );
        }
    }
}

