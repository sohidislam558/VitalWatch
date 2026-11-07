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
                'ward' => 'General Ward 4B',
                'bed_number' => '4B-10',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['patient_id']);
    }

    public function test_admin_can_discharge_admission(): void
    {
        [$patient, $admission] = $this->createTestPatient();

        $response = $this->withHeaders($this->getAuthHeader('admin'))
            ->patchJson("/api/admissions/{$admission->id}/discharge");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'discharged',
                ],
            ]);

        $this->assertEquals('discharged', $admission->fresh()->status);
    }
}

