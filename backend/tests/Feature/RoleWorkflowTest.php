<?php

namespace Tests\Feature;

use App\Models\Admission;
use App\Models\Alert;
use App\Models\AlertRule;
use App\Models\Patient;
use App\Models\User;
use Tests\TestCase;

class RoleWorkflowTest extends TestCase
{
    public function test_staff_can_register_as_nurse_and_doctor(): void
    {
        $nurseEmail = 'nurse.test.' . uniqid() . '@vitalwatch.hospital';
        $docEmail = 'doc.test.' . uniqid() . '@vitalwatch.hospital';

        // Prepare test badge identities
        $nurseBadge = 'VW-NUR-' . rand(1000, 9999);
        $docBadge = 'VW-DOC-' . rand(1000, 9999);
        \App\Models\HospitalStaffIdentity::create([
            'identity_number' => $nurseBadge,
            'role' => 'nurse',
            'department' => 'ICU',
        ]);
        \App\Models\HospitalStaffIdentity::create([
            'identity_number' => $docBadge,
            'role' => 'doctor',
            'department' => 'Cardiology',
        ]);

        // 1. Verify Admin self-registration is strictly REJECTED
        $adminAttempt = $this->postJson('/api/auth/register', [
            'name' => 'Hacker Admin',
            'email' => 'fake.admin@vitalwatch.hospital',
            'hospital_id_number' => $nurseBadge,
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
            'role' => 'admin',
        ]);
        $adminAttempt->assertStatus(422);

        // 2. Verify invalid hospital badge is REJECTED
        $invalidBadgeAttempt = $this->postJson('/api/auth/register', [
            'name' => 'Nurse Unknown',
            'email' => 'nurse.unknown@vitalwatch.hospital',
            'hospital_id_number' => 'FAKE-BADGE-999',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
            'role' => 'nurse',
        ]);
        $invalidBadgeAttempt->assertStatus(422);

        // 3. Register as Nurse with valid badge
        $nurseResponse = $this->postJson('/api/auth/register', [
            'name' => 'Nurse Emily Watson',
            'email' => $nurseEmail,
            'hospital_id_number' => $nurseBadge,
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
            'role' => 'nurse',
        ]);

        $nurseResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'nurse');

        $this->assertDatabaseHas('users', [
            'email' => $nurseEmail,
            'hospital_id_number' => $nurseBadge,
            'role' => 'nurse',
        ]);

        // 4. Register as Doctor with valid badge
        $docResponse = $this->postJson('/api/auth/register', [
            'name' => 'Dr. Robert Smith',
            'email' => $docEmail,
            'hospital_id_number' => $docBadge,
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
            'role' => 'doctor',
        ]);

        $docResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'doctor');

        $this->assertDatabaseHas('users', [
            'email' => $docEmail,
            'hospital_id_number' => $docBadge,
            'role' => 'doctor',
        ]);
    }

    public function test_complete_hospital_clinical_cycle_nurse_doctor_admin(): void
    {
        // STEP 1: Nurse registers and admits Patient 1 directly
        $nurseHeaders = $this->getAuthHeader('nurse');
        $patient1Response = $this->withHeaders($nurseHeaders)->postJson('/api/patients', [
            'name' => 'Michael Scott',
            'date_of_birth' => '1965-03-15',
            'gender' => 'male',
            'ward' => 'Cardiology ICU',
            'bed_number' => 'Bed 101',
            'diagnosis' => 'Acute Observation',
        ]);
        $patient1Response->assertStatus(201);
        $patient1Id = $patient1Response->json('data.id');
        $patient1 = Patient::with('activeAdmission')->findOrFail($patient1Id);
        $admission1 = $patient1->activeAdmission;
        $this->assertNotNull($admission1);

        // Ensure alert rules for heart_rate > 120 AND spo2 < 90 exist
        AlertRule::firstOrCreate(
            ['parameter' => 'heart_rate', 'operator' => 'greater_than', 'threshold_value' => 120],
            ['name' => 'Severe Tachycardia', 'priority' => 'urgent', 'is_active' => true, 'message_template' => 'High heart rate: {val} bpm']
        );
        AlertRule::firstOrCreate(
            ['parameter' => 'spo2', 'operator' => 'less_than', 'threshold_value' => 90],
            ['name' => 'Severe Hypoxemia', 'priority' => 'urgent', 'is_active' => true, 'message_template' => 'Low oxygen saturation: {val}%']
        );

        // STEP 2: Verify Doctor CANNOT record vitals (Blocked by Policy: 403 Forbidden)
        $doctorHeaders = $this->getAuthHeader('doctor');
        $doctorVitalAttempt = $this->withHeaders($doctorHeaders)->postJson('/api/vitals', [
            'patient_id' => $patient1->id,
            'admission_id' => $admission1->id,
            'heart_rate' => 80,
            'systolic_bp' => 120,
            'diastolic_bp' => 80,
            'spo2' => 98,
            'temperature' => 37.0,
            'respiratory_rate' => 16,
            'measured_at' => now()->toDateTimeString(),
        ]);
        $doctorVitalAttempt->assertStatus(403);

        // STEP 3: Nurse records multiple critical vitals on Patient 1 (HR: 135 bpm, SpO2: 85%)
        auth()->forgetGuards();
        $nurseVitalRecord1 = $this->withHeaders($nurseHeaders)->postJson('/api/vitals', [
            'patient_id' => $patient1->id,
            'admission_id' => $admission1->id,
            'heart_rate' => 135,
            'systolic_bp' => 140,
            'diastolic_bp' => 90,
            'spo2' => 85,
            'temperature' => 37.5,
            'respiratory_rate' => 20,
            'measured_at' => now()->toDateTimeString(),
        ]);
        $nurseVitalRecord1->assertStatus(201);

        // Verify MULTIPLE active alerts were created for Patient 1 (HR and SpO2)
        $patient1Alerts = Alert::where('patient_id', $patient1->id)->where('status', 'active')->get();
        $this->assertGreaterThanOrEqual(2, $patient1Alerts->count(), 'Patient 1 should have multiple emergency alerts for unstable vitals');
        $primaryAlert1 = $patient1Alerts->first();

        // STEP 4: Doctor responds to Patient 1 with a SINGLE "Doctor in Action"
        // This MUST transition ALL active alerts for Patient 1 to 'doctor_in_action'
        auth()->forgetGuards();
        $doctorAction1 = $this->withHeaders($doctorHeaders)->patchJson("/api/alerts/{$primaryAlert1->id}/doctor-in-action", [
            'note' => 'Dr. Robert attending bedside for Patient 1.',
        ]);
        $doctorAction1->assertStatus(200)
            ->assertJsonPath('success', true);

        // Assert ALL alerts for Patient 1 are now 'doctor_in_action'
        $untransitedAlerts = Alert::where('patient_id', $patient1->id)->where('status', '!=', 'doctor_in_action')->count();
        $this->assertEquals(0, $untransitedAlerts, 'All alerts for Patient 1 must be moved to doctor_in_action together');

        // STEP 5: Nurse admits Patient 2 and records critical vitals on Patient 2
        auth()->forgetGuards();
        $patient2Response = $this->withHeaders($nurseHeaders)->postJson('/api/patients', [
            'name' => 'Dwight Schrute',
            'date_of_birth' => '1970-01-20',
            'gender' => 'male',
            'ward' => 'Emergency Department',
            'bed_number' => 'Bed 205',
            'diagnosis' => 'Acute Respiratory Distress',
        ]);
        $patient2Response->assertStatus(201);
        $patient2Id = $patient2Response->json('data.id');
        $patient2 = Patient::with('activeAdmission')->findOrFail($patient2Id);

        $nurseVitalRecord2 = $this->withHeaders($nurseHeaders)->postJson('/api/vitals', [
            'patient_id' => $patient2->id,
            'admission_id' => $patient2->activeAdmission->id,
            'heart_rate' => 142,
            'systolic_bp' => 150,
            'diastolic_bp' => 95,
            'spo2' => 89,
            'temperature' => 38.5,
            'respiratory_rate' => 24,
            'measured_at' => now()->toDateTimeString(),
        ]);
        $nurseVitalRecord2->assertStatus(201);

        $alert2 = Alert::where('patient_id', $patient2->id)->where('status', 'active')->latest()->first();
        $this->assertNotNull($alert2, 'Emergency alert should have been generated for Patient 2');

        // STEP 6: Same Doctor attempts to select Patient 2 for "Doctor in Action" while busy with Patient 1
        // MUST BE REJECTED with 422 Concurrency Validation
        auth()->forgetGuards();
        $doctorBlockedAttempt = $this->withHeaders($doctorHeaders)->patchJson("/api/alerts/{$alert2->id}/doctor-in-action", [
            'note' => 'Trying to attend Patient 2 as well.',
        ]);
        $doctorBlockedAttempt->assertStatus(422)
            ->assertJsonValidationErrors(['doctor_in_action']);

        // STEP 7: Doctor finishes bedside assessment on Patient 1 using 1-click "Assessment Done"
        auth()->forgetGuards();
        $assessmentDoneRes = $this->withHeaders($doctorHeaders)->patchJson("/api/alerts/{$primaryAlert1->id}/assessment-done");
        $assessmentDoneRes->assertStatus(200)
            ->assertJsonPath('success', true);

        // Assert ALL alerts for Patient 1 are now resolved!
        $unresolvedAlerts = Alert::where('patient_id', $patient1->id)->where('status', '!=', 'resolved')->count();
        $this->assertEquals(0, $unresolvedAlerts, 'All alerts for Patient 1 must be resolved together when assessment is done');

        // STEP 8: Now that Doctor is released, Doctor can claim Patient 2 for "Doctor in Action"
        auth()->forgetGuards();
        $doctorAction2 = $this->withHeaders($doctorHeaders)->patchJson("/api/alerts/{$alert2->id}/doctor-in-action", [
            'note' => 'Dr. Robert attending bedside for Patient 2.',
        ]);
        $doctorAction2->assertStatus(200)
            ->assertJsonPath('success', true);

        $alert2->refresh();
        $this->assertEquals('doctor_in_action', $alert2->status);

        // STEP 9: Nurse records subsequent normal vitals for Patient 2 -> Auto-resolves!
        auth()->forgetGuards();
        $nurseFollowUp = $this->withHeaders($nurseHeaders)->postJson('/api/vitals', [
            'patient_id' => $patient2->id,
            'admission_id' => $patient2->activeAdmission->id,
            'heart_rate' => 74,
            'systolic_bp' => 120,
            'diastolic_bp' => 80,
            'spo2' => 99,
            'temperature' => 36.8,
            'respiratory_rate' => 15,
            'measured_at' => now()->toDateTimeString(),
        ]);
        $nurseFollowUp->assertStatus(201);

        $alert2->refresh();
        $this->assertEquals('resolved', $alert2->status, 'Alert 2 must auto-resolve after follow-up normal vitals');

        // STEP 10: Admin accesses live hospital activity stream
        auth()->forgetGuards();
        $adminHeaders = $this->getAuthHeader('admin');
        $adminActivities = $this->withHeaders($adminHeaders)->getJson('/api/dashboard/activities');
        $adminActivities->assertStatus(200);
        $stream = $adminActivities->json('data');

        $this->assertNotEmpty($stream);
        $actions = array_column($stream, 'action');
        $this->assertContains('RECORD_VITALS', $actions);
        $this->assertContains('DOCTOR_IN_ACTION', $actions);
        $this->assertContains('ALERT_RESOLVED', $actions);
        $this->assertContains('ALERT_AUTO_RESOLVED_BY_NEW_VITALS', $actions);
    }
}
