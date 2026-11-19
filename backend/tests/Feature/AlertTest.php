<?php

namespace Tests\Feature;

use App\Models\Alert;
use Tests\TestCase;

class AlertTest extends TestCase
{
    public function test_threshold_crossing_triggers_urgent_alert(): void
    {
        [$patient, $admission] = $this->createTestPatient();

        $nurseHeaders = $this->getAuthHeader('nurse');

        // Heart rate 145 bpm breaches >120 bpm rule
        $payload = [
            'patient_id' => $patient->id,
            'admission_id' => $admission->id,
            'heart_rate' => 145.0,
            'systolic_bp' => 120.0,
            'diastolic_bp' => 80.0,
            'spo2' => 98.0,
            'temperature' => 37.0,
            'respiratory_rate' => 18.0,
            'measured_at' => now()->toDateTimeString(),
        ];

        $response = $this->withHeaders($nurseHeaders)
            ->postJson('/api/vitals', $payload);

        $response->assertStatus(201);

        $this->assertDatabaseHas('alerts', [
            'patient_id' => $patient->id,
            'priority' => 'urgent',
        ]);
    }

    public function test_doctor_can_acknowledge_alert(): void
    {
        [$patient, $admission] = $this->createTestPatient();
        $nurseHeaders = $this->getAuthHeader('nurse');

        $this->withHeaders($nurseHeaders)->postJson('/api/vitals', [
            'patient_id' => $patient->id,
            'admission_id' => $admission->id,
            'heart_rate' => 145.0,
            'systolic_bp' => 120.0,
            'diastolic_bp' => 80.0,
            'spo2' => 98.0,
            'temperature' => 37.0,
            'respiratory_rate' => 18.0,
            'measured_at' => now()->toDateTimeString(),
        ]);

        $alert = Alert::where('patient_id', $patient->id)->where('status', 'active')->first();
        $this->assertNotNull($alert);

        $response = $this->withHeaders($this->getAuthHeader('doctor'))
            ->patchJson("/api/alerts/{$alert->id}/acknowledge", [
                'note' => 'Reviewed with ward staff. Attending bedside.',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'acknowledged',
                ],
            ]);

        $this->assertDatabaseHas('alert_acknowledgements', [
            'alert_id' => $alert->id,
            'action' => 'acknowledged',
        ]);
    }

    public function test_doctor_can_resolve_alert_and_resolution_is_idempotent(): void
    {
        [$patient, $admission] = $this->createTestPatient();
        $nurseHeaders = $this->getAuthHeader('nurse');

        $this->withHeaders($nurseHeaders)->postJson('/api/vitals', [
            'patient_id' => $patient->id,
            'admission_id' => $admission->id,
            'heart_rate' => 145.0,
            'systolic_bp' => 120.0,
            'diastolic_bp' => 80.0,
            'spo2' => 98.0,
            'temperature' => 37.0,
            'respiratory_rate' => 18.0,
            'measured_at' => now()->toDateTimeString(),
        ]);

        $alert = Alert::where('patient_id', $patient->id)->where('status', 'active')->first();
        $this->assertNotNull($alert);

        $docHeaders = $this->getAuthHeader('doctor');

        // 1. First resolution call
        $response1 = $this->withHeaders($docHeaders)
            ->patchJson("/api/alerts/{$alert->id}/resolve", [
                'note' => 'Bedside assessment completed, patient stabilized.',
            ]);

        $response1->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'resolved',
                ],
            ]);

        $this->assertEquals(1, \App\Models\AlertAcknowledgement::where('alert_id', $alert->id)->where('action', 'resolved')->count());
        $auditLogsCount1 = \App\Models\AuditLog::where('action', 'ALERT_RESOLVED')->where('entity_id', $alert->id)->count();
        $this->assertEquals(1, $auditLogsCount1);

        // 2. Second (idempotent retry) resolution call on the already-resolved alert
        auth()->forgetGuards();
        $response2 = $this->withHeaders($docHeaders)
            ->patchJson("/api/alerts/{$alert->id}/resolve", [
                'note' => 'Bedside assessment completed, patient stabilized.',
            ]);

        $response2->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'resolved',
                ],
            ]);

        // Acknowledgements and audit logs must remain exactly 1, not duplicated
        $this->assertEquals(1, \App\Models\AlertAcknowledgement::where('alert_id', $alert->id)->where('action', 'resolved')->count());
        $this->assertEquals(1, \App\Models\AuditLog::where('action', 'ALERT_RESOLVED')->where('entity_id', $alert->id)->count());
    }
}

