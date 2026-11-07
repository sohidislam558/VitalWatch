<?php

namespace Database\Seeders;

use App\Models\Admission;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PatientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $patients = [
            [
                'patient_code' => 'PAT-2026-0001',
                'name' => 'John Anderson',
                'date_of_birth' => '1968-04-12',
                'gender' => 'male',
                'contact' => '+1 (555) 234-5678',
                'address' => '742 Evergreen Terrace, Springfield',
                'admissions' => [
                    [
                        'ward' => 'Intensive Care Unit (ICU)',
                        'bed_number' => 'ICU-02',
                        'admitted_at' => Carbon::now()->subDays(3)->format('Y-m-d H:i:s'),
                        'discharged_at' => null,
                        'status' => 'admitted',
                    ],
                ],
            ],
            [
                'patient_code' => 'PAT-2026-0002',
                'name' => 'Margaret Taylor',
                'date_of_birth' => '1954-11-23',
                'gender' => 'female',
                'contact' => '+1 (555) 345-6789',
                'address' => '120 Oakridge Lane, Metropolis',
                'admissions' => [
                    [
                        'ward' => 'Cardiology Ward',
                        'bed_number' => 'CARD-04',
                        'admitted_at' => Carbon::now()->subDays(5)->format('Y-m-d H:i:s'),
                        'discharged_at' => null,
                        'status' => 'admitted',
                    ],
                ],
            ],
            [
                'patient_code' => 'PAT-2026-0003',
                'name' => 'Robert Davis',
                'date_of_birth' => '1982-08-15',
                'gender' => 'male',
                'contact' => '+1 (555) 456-7890',
                'address' => '58 Pine Street, Riverdale',
                'admissions' => [
                    [
                        'ward' => 'Respiratory Ward',
                        'bed_number' => 'RESP-01',
                        'admitted_at' => Carbon::now()->subDays(2)->format('Y-m-d H:i:s'),
                        'discharged_at' => null,
                        'status' => 'admitted',
                    ],
                ],
            ],
            [
                'patient_code' => 'PAT-2026-0004',
                'name' => 'Alice Brown',
                'date_of_birth' => '1995-02-19',
                'gender' => 'female',
                'contact' => '+1 (555) 567-8901',
                'address' => '303 Cedar Court, Gotham',
                'admissions' => [
                    [
                        'ward' => 'General Ward 3A',
                        'bed_number' => '3A-08',
                        'admitted_at' => Carbon::now()->subDay()->format('Y-m-d H:i:s'),
                        'discharged_at' => null,
                        'status' => 'admitted',
                    ],
                ],
            ],
            [
                'patient_code' => 'PAT-2026-0005',
                'name' => 'Samuel Green',
                'date_of_birth' => '1971-06-30',
                'gender' => 'male',
                'contact' => '+1 (555) 678-9012',
                'address' => '89 Maple Avenue, Star City',
                'admissions' => [
                    [
                        'ward' => 'Neurology Ward',
                        'bed_number' => 'NEURO-03',
                        'admitted_at' => Carbon::now()->subHours(18)->format('Y-m-d H:i:s'),
                        'discharged_at' => null,
                        'status' => 'admitted',
                    ],
                ],
            ],
            [
                'patient_code' => 'PAT-2026-0006',
                'name' => 'Helen White',
                'date_of_birth' => '1948-09-05',
                'gender' => 'female',
                'contact' => '+1 (555) 789-0123',
                'address' => '44 Birch Boulevard, Coast City',
                'admissions' => [
                    [
                        // Past historical admission that was discharged
                        'ward' => 'General Ward 2B',
                        'bed_number' => '2B-12',
                        'admitted_at' => Carbon::now()->subDays(20)->format('Y-m-d H:i:s'),
                        'discharged_at' => Carbon::now()->subDays(14)->format('Y-m-d H:i:s'),
                        'status' => 'discharged',
                    ],
                    [
                        // Current active re-admission
                        'ward' => 'Intensive Care Unit (ICU)',
                        'bed_number' => 'ICU-05',
                        'admitted_at' => Carbon::now()->subDays(1)->format('Y-m-d H:i:s'),
                        'discharged_at' => null,
                        'status' => 'admitted',
                    ],
                ],
            ],
        ];

        foreach ($patients as $item) {
            $patient = Patient::updateOrCreate(
                ['patient_code' => $item['patient_code']],
                [
                    'name' => $item['name'],
                    'date_of_birth' => $item['date_of_birth'],
                    'gender' => $item['gender'],
                    'contact' => $item['contact'],
                    'address' => $item['address'],
                ]
            );

            foreach ($item['admissions'] as $admData) {
                Admission::updateOrCreate(
                    [
                        'patient_id' => $patient->id,
                        'ward' => $admData['ward'],
                        'bed_number' => $admData['bed_number'],
                        'admitted_at' => $admData['admitted_at'],
                    ],
                    [
                        'discharged_at' => $admData['discharged_at'],
                        'status' => $admData['status'],
                    ]
                );
            }
        }
    }
}

