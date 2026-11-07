<?php

namespace Tests\Feature;

use App\Models\Admission;
use App\Models\Patient;
use App\Models\User;
use Tests\TestCase;

class VitalTest extends TestCase
{
    public function test_nurse_can_record_valid_vitals(): void
    {
        [$patient, $admission] = $this->createTestPatient();

        $payload = [
            'patient_id' => $patient->id,
            'admission_id' => $admission->id,
            'heart_rate' => 76.0,
            'systolic_bp' => 120.0,
            'diastolic_bp' => 80.0,
            'spo2' => 99.0,
            'temperature' => 36.8,
            'respiratory_rate' => 16.0,
            'notes' => 'Stable bedside reading.',
            'measured_at' => now()->toDateTimeString(),
        ];

        $response = $this->withHeaders($this->getAuthHeader('nurse'))
            ->postJson('/api/vitals', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('vital_records', [
            'patient_id' => $patient->id,
            'heart_rate' => 76.0,
        ]);
    }

    public function test_invalid_vital_out_of_bounds_rejected(): void
    {
        [$patient, $admission] = $this->createTestPatient();

        $payload = [
            'patient_id' => $patient->id,
            'admission_id' => $admission->id,
            'heart_rate' => 999.0, // Invalid physiological bound
            'systolic_bp' => 120.0,
            'diastolic_bp' => 80.0,
            'spo2' => 99.0,
            'temperature' => 36.8,
            'respiratory_rate' => 16.0,
        ];

        $response = $this->withHeaders($this->getAuthHeader('nurse'))
            ->postJson('/api/vitals', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['heart_rate']);
    }
}

