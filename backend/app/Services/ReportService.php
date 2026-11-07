<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class ReportService
{
    public function __construct(protected AuditService $auditService)
    {
    }

    /**
     * Compile dataset for report preview.
     */
    public function getPatientReportData(int $patientId, ?string $startDate = null, ?string $endDate = null): array
    {
        $patient = Patient::with(['activeAdmission'])->findOrFail($patientId);

        $vitalQuery = $patient->vitalRecords()->with('recorder')->orderBy('measured_at', 'desc');
        $alertQuery = $patient->alerts()->with(['alertRule', 'acknowledgements.user'])->orderBy('created_at', 'desc');

        if ($startDate) {
            $vitalQuery->where('measured_at', '>=', $startDate);
            $alertQuery->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $vitalQuery->where('measured_at', '<=', $endDate);
            $alertQuery->where('created_at', '<=', $endDate);
        }

        return [
            'patient' => $patient,
            'vitalRecords' => $vitalQuery->get(),
            'alerts' => $alertQuery->get(),
        ];
    }

    /**
     * Generate multi-page PDF stream via Dompdf.
     */
    public function generatePdf(int $patientId, ?string $startDate = null, ?string $endDate = null, ?User $actor = null, ?string $ip = null): \Illuminate\Http\Response
    {
        $data = $this->getPatientReportData($patientId, $startDate, $endDate);

        $pdf = Pdf::loadView('reports.patient-report', $data)
            ->setPaper('a4', 'portrait')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', false);

        if ($actor) {
            $this->auditService->log(
                action: 'REPORT_GENERATED_PDF',
                entityType: Patient::class,
                entityId: $patientId,
                details: [
                    'patient_code' => $data['patient']->patient_code,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                user: $actor,
                ipAddress: $ip
            );
        }

        $fileName = "vitalwatch-report-{$data['patient']->patient_code}-" . date('Ymd-His') . ".pdf";

        return $pdf->download($fileName);
    }
}

