<?php

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\User;
use Tests\TestCase;

class PatientTest extends TestCase
{
    public function test_nurse_can_register_new_patient(): void
    {
        $payload = [
            'name' => 'Test Patient Omega',
            'date_of_birth' => '1990-05-15',
            'gender' => 'male',
            'contact' => '+1 555 999 8888',
            'address' => '100 Test Blvd',
        ];

        $response = $this->withHeaders($this->getAuthHeader('nurse'))
            ->postJson('/api/patients', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.name', 'Test Patient Omega');

        $this->assertDatabaseHas('patients', [
            'name' => 'Test Patient Omega',
        ]);
    }

    public function test_patient_search_by_code(): void
    {
        [$patient] = $this->createTestPatient();

        $response = $this->withHeaders($this->getAuthHeader('doctor'))
            ->getJson("/api/patients?search={$patient->patient_code}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_admin_cannot_register_patient(): void
    {
        $payload = [
            'name' => 'Admin Registered Patient',
            'date_of_birth' => '1985-05-15',
            'gender' => 'male',
        ];

        $response = $this->withHeaders($this->getAuthHeader('admin'))
            ->postJson('/api/patients', $payload);

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_patient_and_cascade(): void
    {
        [$patient] = $this->createTestPatient();
        $this->assertDatabaseHas('patients', ['id' => $patient->id]);

        $response = $this->withHeaders($this->getAuthHeader('admin'))
            ->deleteJson("/api/patients/{$patient->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('patients', ['id' => $patient->id]);
    }

    public function test_doctor_and_nurse_cannot_delete_patient(): void
    {
        [$patient] = $this->createTestPatient();

        // Doctor attempt
        $docResponse = $this->withHeaders($this->getAuthHeader('doctor'))
            ->deleteJson("/api/patients/{$patient->id}");
        $docResponse->assertStatus(403);

        // Nurse attempt
        auth()->forgetGuards();
        $nurseResponse = $this->withHeaders($this->getAuthHeader('nurse'))
            ->deleteJson("/api/patients/{$patient->id}");
        $nurseResponse->assertStatus(403);

        $this->assertDatabaseHas('patients', ['id' => $patient->id]);
    }

    public function test_only_doctor_can_discharge_patient(): void
    {
        [$patient, $admission] = $this->createTestPatient();

        // Admin cannot discharge
        $adminAttempt = $this->withHeaders($this->getAuthHeader('admin'))
            ->patchJson("/api/admissions/{$admission->id}/discharge", [
                'discharge_summary' => 'Admin attempt',
            ]);
        $adminAttempt->assertStatus(403);

        // Nurse cannot discharge
        auth()->forgetGuards();
        $nurseAttempt = $this->withHeaders($this->getAuthHeader('nurse'))
            ->patchJson("/api/admissions/{$admission->id}/discharge", [
                'discharge_summary' => 'Nurse attempt',
            ]);
        $nurseAttempt->assertStatus(403);

        // Doctor can discharge
        auth()->forgetGuards();
        $docAttempt = $this->withHeaders($this->getAuthHeader('doctor'))
            ->patchJson("/api/admissions/{$admission->id}/discharge", [
                'discharge_summary' => 'Doctor clinical discharge: Patient recovered.',
            ]);
        $docAttempt->assertStatus(200);

        $admission->refresh();
        $this->assertEquals('discharged', $admission->status);
    }
}
