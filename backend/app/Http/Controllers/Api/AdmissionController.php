<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admission\StoreAdmissionRequest;
use App\Models\Admission;
use App\Services\AdmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdmissionController extends Controller
{
    public function __construct(protected AdmissionService $admissionService)
    {
    }

    /**
     * List hospital admissions.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Admission::class);

        $admissions = $this->admissionService->list(
            $request->only(['status', 'ward', 'patient_id', 'search']),
            (int) $request->input('per_page', 10)
        );

        return response()->json([
            'success' => true,
            'message' => 'Admissions retrieved successfully.',
            'data' => $admissions,
        ]);
    }

    /**
     * Admit a patient to a ward and bed.
     */
    public function store(StoreAdmissionRequest $request): JsonResponse
    {
        $this->authorize('create', Admission::class);

        $admission = $this->admissionService->admit(
            $request->validated(),
            $request->user(),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Patient admitted successfully.',
            'data' => $admission,
        ], 201);
    }

    /**
     * View admission details.
     */
    public function show(int $id): JsonResponse
    {
        $admission = Admission::with(['patient', 'vitalRecords.recorder'])->findOrFail($id);
        $this->authorize('view', $admission);

        return response()->json([
            'success' => true,
            'message' => 'Admission details retrieved.',
            'data' => $admission,
        ]);
    }

    /**
     * Discharge a patient from their current admission.
     */
    public function discharge(Request $request, int $id): JsonResponse
    {
        $admission = Admission::findOrFail($id);
        $this->authorize('discharge', $admission);

        $discharged = $this->admissionService->discharge(
            $admission,
            $request->user(),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Patient discharged successfully.',
            'data' => $discharged,
        ]);
    }
}

