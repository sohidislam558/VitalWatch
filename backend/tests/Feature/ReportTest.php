<?php

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\User;
use Tests\TestCase;

class ReportTest extends TestCase
{
    public function test_can_retrieve_patient_report_preview_json(): void
    {
        [$patient, $admission] = $this->createTestPatient();

        $response = $this->withHeaders($this->getAuthHeader('doctor'))
            ->getJson("/api/reports/patients/{$patient->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'patient',
                    'vitalRecords',
                    'alerts',
                ],
            ]);
    }

    public function test_can_download_patient_report_pdf(): void
    {
        [$patient, $admission] = $this->createTestPatient();

        $response = $this->withHeaders($this->getAuthHeader('doctor'))
            ->get("/api/reports/patients/{$patient->id}/pdf");

        $response->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');
    }
}

