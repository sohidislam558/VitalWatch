<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    private User $admin;
    private User $nurse;
    private User $doctor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::firstOrCreate(
            ['email' => 'test_admin_audit@vitalwatch.hospital'],
            [
                'name' => 'Admin User',
                'role' => 'admin',
                'status' => 'active',
                'password' => bcrypt('password'),
                'hospital_id_number' => 'ADM-AUD-001',
            ]
        );

        $this->nurse = User::firstOrCreate(
            ['email' => 'test_nurse_audit@vitalwatch.hospital'],
            [
                'name' => 'Nurse Farzana', // tests name sanitization
                'role' => 'nurse',
                'status' => 'active',
                'password' => bcrypt('password'),
                'hospital_id_number' => 'NUR-AUD-001',
            ]
        );

        $this->doctor = User::firstOrCreate(
            ['email' => 'test_doctor_audit@vitalwatch.hospital'],
            [
                'name' => 'Dr. Atika', // tests name sanitization
                'role' => 'doctor',
                'status' => 'active',
                'password' => bcrypt('password'),
                'hospital_id_number' => 'DOC-AUD-001',
            ]
        );
    }

    public function test_name_mutator_and_formatters_prevent_duplicate_prefixes(): void
    {
        // Mutator should have cleaned the name
        $this->assertEquals('Farzana', $this->nurse->name);
        $this->assertEquals('Atika', $this->doctor->name);

        // Formatters should produce single prefix
        $this->assertEquals('Nurse Farzana', User::formatNurseName($this->nurse->name));
        $this->assertEquals('Nurse Farzana', User::formatNurseName('Nurse Farzana'));
        $this->assertEquals('Nurse Farzana', User::formatNurseName('Nurse Nurse Farzana'));

        $this->assertEquals('Dr. Atika', User::formatDoctorName($this->doctor->name));
        $this->assertEquals('Dr. Atika', User::formatDoctorName('Dr. Atika'));
        $this->assertEquals('Dr. Atika', User::formatDoctorName('Dr. Dr. Atika'));
    }

    public function test_admin_can_delete_specific_audit_log(): void
    {
        $log = AuditLog::create([
            'user_id' => $this->nurse->id,
            'action' => 'RECORD_VITALS',
            'entity_type' => 'VitalRecord',
            'entity_id' => 1,
            'details' => ['heart_rate' => 80],
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/audit-logs/{$log->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('audit_logs', ['id' => $log->id]);
    }

    public function test_non_admin_cannot_delete_audit_log(): void
    {
        $log = AuditLog::create([
            'user_id' => $this->nurse->id,
            'action' => 'RECORD_VITALS',
            'entity_type' => 'VitalRecord',
            'entity_id' => 1,
            'details' => ['heart_rate' => 80],
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->nurse, 'sanctum')
            ->deleteJson("/api/audit-logs/{$log->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('audit_logs', ['id' => $log->id]);
    }

    public function test_admin_can_delete_audit_logs_by_date(): void
    {
        $targetDate = '2026-11-10';
        $otherDate = '2026-11-12';

        AuditLog::create([
            'user_id' => $this->doctor->id,
            'action' => 'DOCTOR_IN_ACTION',
            'entity_type' => 'Alert',
            'entity_id' => 1,
            'created_at' => "{$targetDate} 10:00:00",
        ]);

        AuditLog::create([
            'user_id' => $this->nurse->id,
            'action' => 'RECORD_VITALS',
            'entity_type' => 'VitalRecord',
            'entity_id' => 2,
            'created_at' => "{$targetDate} 14:00:00",
        ]);

        $keepLog = AuditLog::create([
            'user_id' => $this->nurse->id,
            'action' => 'RECORD_VITALS',
            'entity_type' => 'VitalRecord',
            'entity_id' => 3,
            'created_at' => "{$otherDate} 09:00:00",
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/audit-logs/delete-by-date', [
                'date' => $targetDate,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['deleted_count' => 2],
            ]);

        $this->assertEquals(1, AuditLog::count());
        $this->assertDatabaseHas('audit_logs', ['id' => $keepLog->id]);
    }

    public function test_admin_can_delete_all_audit_logs(): void
    {
        AuditLog::create([
            'user_id' => $this->nurse->id,
            'action' => 'RECORD_VITALS',
            'entity_type' => 'VitalRecord',
            'entity_id' => 1,
            'created_at' => now()->subDay(),
        ]);
        AuditLog::create([
            'user_id' => $this->doctor->id,
            'action' => 'DOCTOR_IN_ACTION',
            'entity_type' => 'Alert',
            'entity_id' => 2,
            'created_at' => now(),
        ]);

        $this->assertEquals(2, AuditLog::count());

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson('/api/audit-logs/all');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['deleted_count' => 2],
            ]);

        $this->assertEquals(0, AuditLog::count());
    }

    public function test_dashboard_activities_supports_calendar_date_filtering(): void
    {
        AuditLog::create([
            'user_id' => $this->nurse->id,
            'action' => 'RECORD_VITALS',
            'entity_type' => 'VitalRecord',
            'entity_id' => 1,
            'created_at' => '2026-11-05 10:00:00',
        ]);
        AuditLog::create([
            'user_id' => $this->doctor->id,
            'action' => 'DOCTOR_IN_ACTION',
            'entity_type' => 'Alert',
            'entity_id' => 2,
            'created_at' => '2026-11-10 11:00:00',
        ]);
        AuditLog::create([
            'user_id' => $this->doctor->id,
            'action' => 'DOCTOR_IN_ACTION',
            'entity_type' => 'Alert',
            'entity_id' => 3,
            'created_at' => '2026-11-14 12:00:00',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/dashboard/activities?start_date=2026-11-09&end_date=2026-11-11');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertStringStartsWith('2026-11-10', $data[0]['created_at']);
    }
}
