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
        $response = $this->withHeaders($this->getAuthHeader('doctor'))
            ->getJson('/api/patients?search=PAT-2026-0001');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }
}

