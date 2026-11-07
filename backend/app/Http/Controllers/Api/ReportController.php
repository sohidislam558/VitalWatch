<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(protected ReportService $reportService)
    {
    }

    /**
     * Preview patient monitoring dataset (JSON).
     */
    public function show(Request $request, int $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);
        $this->authorize('view', $patient);

        $data = $this->reportService->getPatientReportData(
            $patientId,
            $request->input('start_date'),
            $request->input('end_date')
        );

        return response()->json([
            'success' => true,
            'message' => 'Report dataset retrieved.',
            'data' => $data,
        ]);
    }

    /**
     * Generate & stream Dompdf patient monitoring PDF.
     */
    public function downloadPdf(Request $request, int $patientId)
    {
        $patient = Patient::findOrFail($patientId);
        $this->authorize('view', $patient);

        return $this->reportService->generatePdf(
            $patientId,
            $request->input('start_date'),
            $request->input('end_date'),
            $request->user(),
            $request->ip()
        );
    }
}

