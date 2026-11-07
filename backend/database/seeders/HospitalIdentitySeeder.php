<?php

namespace Database\Seeders;

use App\Models\HospitalStaffIdentity;
use Illuminate\Database\Seeder;

class HospitalIdentitySeeder extends Seeder
{
    /**
     * Seed authorized hospital staff identities.
     * These badge numbers verify that a registering doctor or nurse truly belongs to the hospital.
     */
    public function run(): void
    {
        $identities = [
            // Authorized Doctors
            ['identity_number' => 'VW-DOC-1001', 'role' => 'doctor', 'department' => 'Cardiology', 'issued_to_name' => 'Cardiology Attending'],
            ['identity_number' => 'VW-DOC-1002', 'role' => 'doctor', 'department' => 'Intensive Care Unit (ICU)', 'issued_to_name' => 'Critical Care Specialist'],
            ['identity_number' => 'VW-DOC-1003', 'role' => 'doctor', 'department' => 'Emergency Department', 'issued_to_name' => 'Emergency Physician'],
            ['identity_number' => 'VW-DOC-1004', 'role' => 'doctor', 'department' => 'Pulmonology', 'issued_to_name' => 'Respiratory Care Physician'],
            ['identity_number' => 'VW-DOC-1005', 'role' => 'doctor', 'department' => 'Internal Medicine', 'issued_to_name' => 'Internal Medicine Attending'],

            // Authorized Nurses & Caregivers
            ['identity_number' => 'VW-NUR-2001', 'role' => 'nurse', 'department' => 'Cardiology ICU', 'issued_to_name' => 'ICU Bedside Nurse'],
            ['identity_number' => 'VW-NUR-2002', 'role' => 'nurse', 'department' => 'General Medical Ward', 'issued_to_name' => 'Charge Nurse'],
            ['identity_number' => 'VW-NUR-2003', 'role' => 'nurse', 'department' => 'Emergency Triage', 'issued_to_name' => 'Triage Nurse Specialist'],
            ['identity_number' => 'VW-NUR-2004', 'role' => 'nurse', 'department' => 'Surgical Recovery', 'issued_to_name' => 'Staff Nurse (RN)'],
            ['identity_number' => 'VW-NUR-2005', 'role' => 'nurse', 'department' => 'Telemetry Observation', 'issued_to_name' => 'Telemetry Nurse'],
            ['identity_number' => 'VW-NUR-2006', 'role' => 'nurse', 'department' => 'Pediatric Care', 'issued_to_name' => 'Pediatric Nurse'],
            ['identity_number' => 'VW-NUR-2007', 'role' => 'nurse', 'department' => 'Oncology Care', 'issued_to_name' => 'Caregiver / BSN'],
        ];

        foreach ($identities as $data) {
            HospitalStaffIdentity::firstOrCreate(
                ['identity_number' => $data['identity_number']],
                $data
            );
        }
    }
}

