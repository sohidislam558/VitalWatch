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

    public function test_doctor_can_request_emergency_icu_transfer_and_nurse_can_complete(): void
    {
        // Patient admitted in General Medical Ward, Bed 201
        [$patient, $admission] = $this->createTestPatient('General Medical Ward', 'Bed 201');

        // 1. Doctor requests Emergency ICU Transfer
        $docHeaders = $this->getAuthHeader('doctor');
        $transferReq = $this->withHeaders($docHeaders)
            ->postJson("/api/admissions/{$admission->id}/request-icu-transfer", [
                'target_ward' => 'Intensive Care Unit (ICU)',
                'notes' => 'Patient deteriorating rapidly with severe respiratory distress. Urgent ICU bed needed.',
            ]);

        $transferReq->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'icu_transfer_requested' => true,
                    'target_icu_ward' => 'Intensive Care Unit (ICU)',
                ],
            ]);

        $this->assertTrue($admission->fresh()->icu_transfer_requested);

        // 2. Nurse allocates available ICU bed to complete transfer
        auth()->forgetGuards();
        $nurseHeaders = $this->getAuthHeader('nurse');
        $completeReq = $this->withHeaders($nurseHeaders)
            ->postJson("/api/admissions/{$admission->id}/complete-icu-transfer", [
                'ward' => 'Intensive Care Unit (ICU)',
                'bed_number' => 'ICU-03',
            ]);

        $completeReq->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ward' => 'Intensive Care Unit (ICU)',
                    'bed_number' => 'ICU-03',
                    'icu_transfer_requested' => false,
                ],
            ]);

        $fresh = $admission->fresh();
        $this->assertEquals('Intensive Care Unit (ICU)', $fresh->ward);
        $this->assertEquals('ICU-03', $fresh->bed_number);
        $this->assertFalse($fresh->icu_transfer_requested);
        $this->assertTrue($fresh->icu_transferred);
    }

    public function test_cannot_request_icu_transfer_if_patient_already_in_icu(): void
    {
        // Patient admitted directly in an ICU ward: Cardiology ICU
        [$patient, $admission] = $this->createTestPatient('Cardiology ICU', 'Bed 101');

        $docHeaders = $this->getAuthHeader('doctor');
        $response = $this->withHeaders($docHeaders)
            ->postJson("/api/admissions/{$admission->id}/request-icu-transfer", [
                'target_ward' => 'Intensive Care Unit (ICU)',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['icu_transfer']);
    }

    public function test_icu_observation_lifecycle_after_transfer_and_assessment_done(): void
    {
        [$patient, $admission] = $this->createTestPatient('General Medical Ward', 'Bed 205');

        // 1. Trigger critical vitals -> emergency alert
        $nurseHeaders = $this->getAuthHeader('nurse');
        $this->withHeaders($nurseHeaders)->postJson('/api/vitals', [
            'patient_id' => $patient->id,
            'admission_id' => $admission->id,
            'heart_rate' => 140, // high heart rate alert
            'systolic_bp' => 120,
            'diastolic_bp' => 80,
            'spo2' => 97,
            'temperature' => 37.0,
            'respiratory_rate' => 16,
            'measured_at' => now()->toDateTimeString(),
        ]);

        // 2. Doctor attends: Doctor in Action
        $alert = \App\Models\Alert::where('patient_id', $patient->id)->where('status', 'active')->first();
        $docHeaders = $this->getAuthHeader('doctor');
        $this->withHeaders($docHeaders)->patchJson("/api/alerts/{$alert->id}/doctor-in-action");

        // 3. Doctor requests ICU transfer
        $this->withHeaders($docHeaders)->postJson("/api/admissions/{$admission->id}/request-icu-transfer", [
            'target_ward' => 'Intensive Care Unit (ICU)',
        ]);

        // 4. Nurse completes ICU bed transfer to ICU-05
        auth()->forgetGuards();
        $this->withHeaders($nurseHeaders)->postJson("/api/admissions/{$admission->id}/complete-icu-transfer", [
            'ward' => 'Intensive Care Unit (ICU)',
            'bed_number' => 'ICU-05',
        ]);

        $this->assertTrue($admission->fresh()->icu_transferred);

        // 5. Doctor CANNOT request ICU again now that patient is in ICU
        auth()->forgetGuards();
        $reRequest = $this->withHeaders($docHeaders)->postJson("/api/admissions/{$admission->id}/request-icu-transfer");
        $reRequest->assertStatus(422)
            ->assertJsonValidationErrors(['icu_transfer']);

        // 6. Doctor completes assessment ("Assessment Done")
        $this->withHeaders($docHeaders)->patchJson("/api/alerts/{$alert->id}/assessment-done");

        // 7. Situation Monitor must NOT show "Normal & Stable". It must show "Under ICU Observation"
        $monitorRes = $this->withHeaders($docHeaders)->getJson('/api/dashboard/patients');
        $monitorRes->assertStatus(200);

        $patientData = collect($monitorRes->json('data.data'))->firstWhere('id', $patient->id);
        $this->assertEquals('icu_observation', $patientData['situation_status']);
        $this->assertEquals('Under ICU Observation', $patientData['situation_label']);

        // 8. Follow-up normal vitals recorded after transfer -> updates to "Under ICU Observation: Patient Stabilizing"
        sleep(1);
        auth()->forgetGuards();
        $this->withHeaders($nurseHeaders)->postJson('/api/vitals', [
            'patient_id' => $patient->id,
            'admission_id' => $admission->id,
            'heart_rate' => 74,
            'systolic_bp' => 118,
            'diastolic_bp' => 78,
            'spo2' => 98,
            'temperature' => 36.8,
            'respiratory_rate' => 15,
            'measured_at' => now()->toDateTimeString(),
        ]);

        $monitorRes2 = $this->withHeaders($docHeaders)->getJson('/api/dashboard/patients');
        $patientData2 = collect($monitorRes2->json('data.data'))->firstWhere('id', $patient->id);
        $this->assertEquals('Under ICU Observation: Patient Stabilizing', $patientData2['situation_label']);
    }

    public function test_doctor_can_request_ward_step_down_and_nurse_can_complete(): void
    {
        // 1. Create patient in ICU
        [$patient, $admission] = $this->createTestPatient('Intensive Care Unit (ICU)', 'ICU-02');
        $admission->update(['icu_transferred' => true]);

        $docHeaders = $this->getAuthHeader('doctor');
        $nurseHeaders = $this->getAuthHeader('nurse');

        // 2. Doctor requests ward step-down
        $stepDownRes = $this->withHeaders($docHeaders)
            ->postJson("/api/admissions/{$admission->id}/request-step-down", [
                'target_ward' => 'General Medical Ward',
                'notes' => 'Patient has recovered and is stable for general ward care.',
            ]);

        $stepDownRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'step_down_requested' => true,
                    'target_step_down_ward' => 'General Medical Ward',
                ],
            ]);

        // Situation monitor shows step-down requested
        auth()->forgetGuards();
        $monitorRes = $this->withHeaders($docHeaders)->getJson('/api/dashboard/patients');
        $patientData = collect($monitorRes->json('data.data'))->firstWhere('id', $patient->id);
        $this->assertEquals('Under ICU Observation: Step-Down to Ward Requested', $patientData['situation_label']);

        // 3. Nurse completes step-down to General Medical Ward, Bed 109
        auth()->forgetGuards();
        $completeRes = $this->withHeaders($nurseHeaders)
            ->postJson("/api/admissions/{$admission->id}/complete-step-down", [
                'ward' => 'General Medical Ward',
                'bed_number' => 'Bed 109',
            ]);

        $completeRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'ward' => 'General Medical Ward',
                    'bed_number' => 'Bed 109',
                    'step_down_completed' => true,
                    'icu_transferred' => false,
                ],
            ]);

        $freshAdmission = $admission->fresh();
        $this->assertEquals('General Medical Ward', $freshAdmission->ward);
        $this->assertEquals('Bed 109', $freshAdmission->bed_number);
        $this->assertFalse($freshAdmission->icu_transferred);
        $this->assertTrue($freshAdmission->step_down_completed);

        // 4. Verify dashboard patient status reflects successful step-down
        auth()->forgetGuards();
        $monitorRes2 = $this->withHeaders($docHeaders)->getJson('/api/dashboard/patients');
        $patientData2 = collect($monitorRes2->json('data.data'))->firstWhere('id', $patient->id);
        $this->assertEquals('Stepped Down to General Ward: Normal & Stable', $patientData2['situation_label']);
    }
}
