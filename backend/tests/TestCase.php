<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use DatabaseTransactions;

    protected function getAuthHeader(string $role = 'admin'): array
    {
        auth()->forgetGuards();
        $user = User::where('role', $role)->where('status', 'active')->first();
        if (!$user) {
            $user = User::create([
                'name' => "Test " . ucfirst($role),
                'email' => "test.{$role}." . uniqid() . "@vitalwatch.hospital",
                'password' => bcrypt('password'),
                'role' => $role,
                'status' => 'active',
            ]);
        }
        $token = $user->createToken('test-token')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    protected function createTestPatient(string $ward = 'Cardiology ICU', string $bed = 'Bed 101'): array
    {
        $patient = \App\Models\Patient::create([
            'patient_code' => 'TEST-' . uniqid(),
            'name' => 'Test Patient ' . rand(100, 999),
            'date_of_birth' => '1985-05-15',
            'gender' => 'male',
            'contact' => '+15550001111',
            'address' => 'Hospital Ward Bedside',
        ]);

        $admission = \App\Models\Admission::create([
            'patient_id' => $patient->id,
            'admission_code' => 'ADM-' . uniqid(),
            'admitted_at' => now(),
            'ward' => $ward,
            'bed_number' => $bed,
            'diagnosis' => 'Observation',
            'status' => 'admitted',
        ]);

        return [$patient, $admission];
    }
}
