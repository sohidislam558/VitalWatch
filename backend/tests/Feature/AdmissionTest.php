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

    public function test_cannot_admit_to_already_occupied_bed(): void
    {
        // Patient 1 admitted in Cardiology ICU, Bed 101
        [$patient1, $admission1] = $this->createTestPatient('Cardiology ICU', 'Bed 101');

        // Create Patient 2 without active admission
        $patient2 = Patient::create([
            'patient_code' => 'PAT-TEST-002',
            'name' => 'Second Patient',
            'date_of_birth' => '1992-06-12',
            'gender' => 'female',
        ]);

        // Attempt to admit Patient 2 into the SAME occupied Bed 101 in Cardiology ICU
        $response = $this->withHeaders($this->getAuthHeader('nurse'))
            ->postJson('/api/admissions', [
                'patient_id' => $patient2->id,
                'ward' => 'Cardiology ICU',
                'bed_number' => 'Bed 101',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['bed_number']);
    }

    public function test_can_fetch_occupied_and_available_beds_by_ward(): void
    {
        [$patient1, $admission1] = $this->createTestPatient('Cardiology ICU', 'Bed 101');

        $response = $this->withHeaders($this->getAuthHeader('nurse'))
            ->getJson('/api/admissions/beds?ward=Cardiology%20ICU');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.ward', 'Cardiology ICU');

        $availableBeds = $response->json('data.available_beds');
        $occupiedBeds = array_column($response->json('data.occupied_beds'), 'bed_number');

        $this->assertContains('Bed 101', $occupiedBeds);
        $this->assertNotContains('Bed 101', $availableBeds);
        $this->assertContains('Bed 102', $availableBeds);
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
