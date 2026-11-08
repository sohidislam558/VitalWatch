<?php

namespace Tests\Feature;

use App\Models\Admission;
use App\Models\Patient;
use App\Models\User;
use Tests\TestCase;

class AdmissionTest extends TestCase
{
    public function test_cannot_create_duplicate_active_admission(): void
    {
        [$patient, $admission] = $this->createTestPatient();

        $response = $this->withHeaders($this->getAuthHeader('nurse'))
            ->postJson('/api/admissions', [
                'patient_id' => $patient->id,
                'ward' => 'Cardiology ICU',
                'bed_number' => 'Bed 102',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['patient_id']);
    }

    public function test_doctor_can_discharge_and_admin_cannot(): void
    {
        [$patient, $admission] = $this->createTestPatient();

        // 1. Admin attempt must be strictly FORBIDDEN (403)
        $adminAttempt = $this->withHeaders($this->getAuthHeader('admin'))
            ->patchJson("/api/admissions/{$admission->id}/discharge", [
                'discharge_summary' => 'Admin discharge attempt',
            ]);
        $adminAttempt->assertStatus(403);

        // 2. Doctor can discharge successfully (200)
        auth()->forgetGuards();
        $doctorResponse = $this->withHeaders($this->getAuthHeader('doctor'))
            ->patchJson("/api/admissions/{$admission->id}/discharge", [
                'discharge_summary' => 'Patient fully evaluated and cleared for discharge by attending physician.',
            ]);

        $doctorResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'discharged',
                ],
            ]);

        $this->assertEquals('discharged', $admission->fresh()->status);
    }
}
