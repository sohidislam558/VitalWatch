<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Vital\StoreVitalRequest;
use App\Models\Patient;
use App\Models\VitalRecord;
use App\Services\VitalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VitalController extends Controller
{
    public function __construct(protected VitalService $vitalService)
    {
    }

    /**
     * List recent vital signs with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', VitalRecord::class);

        $vitals = $this->vitalService->list(
            $request->only(['patient_id', 'admission_id', 'start_date', 'end_date']),
            (int) $request->input('per_page', 15)
        );

        return response()->json([
            'success' => true,
            'message' => 'Vital records retrieved.',
            'data' => $vitals,
        ]);
    }

    /**
     * Manually record a new vital signs observation.
     * Evaluates alert rules inside the service.
     */
    public function store(StoreVitalRequest $request): JsonResponse
    {
        $this->authorize('create', VitalRecord::class);

        $result = $this->vitalService->record(
            $request->validated(),
            $request->user(),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Vital record saved successfully.',
            'data' => [
                'vital_record' => $result['vital_record'],
                'alerts_triggered' => $result['alerts'],
            ],
        ], 201);
    }

    /**
     * Retrieve single vital record details.
     */
    public function show(int $id): JsonResponse
    {
        $record = VitalRecord::with(['patient', 'admission', 'recorder', 'alerts.alertRule'])->findOrFail($id);
        $this->authorize('view', $record);

        return response()->json([
            'success' => true,
            'message' => 'Vital record details retrieved.',
            'data' => $record,
        ]);
    }

    /**
     * Retrieve patient vital history for Recharts graphs.
     */
    public function patientVitals(Request $request, int $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);
        $this->authorize('view', $patient);

        $history = $this->vitalService->getHistoryForPatient(
            $patientId,
            $request->input('start_date'),
            $request->input('end_date')
        );

        return response()->json([
            'success' => true,
            'message' => 'Patient vital history retrieved.',
            'data' => $history,
        ]);
    }
}

