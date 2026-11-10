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
     * Get occupied and available bed numbers for wards.
     */
    public function beds(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Admission::class);

        $ward = $request->query('ward');
        $overview = $this->admissionService->getBedsOverview($ward);

        return response()->json([
            'success' => true,
            'message' => 'Bed occupancy overview retrieved.',
            'data' => $overview,
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

    /**
     * Request an emergency ICU transfer.
     */
    public function requestIcuTransfer(Request $request, int $id): JsonResponse
    {
        $admission = Admission::with('patient')->findOrFail($id);
        $this->authorize('requestIcuTransfer', $admission);

        $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
            'target_ward' => ['nullable', 'string', 'max:100'],
        ]);

        $updated = $this->admissionService->requestIcuTransfer(
            $admission,
            $request->user(),
            $request->input('notes'),
            $request->input('target_ward', 'Intensive Care Unit (ICU)')
        );

        return response()->json([
            'success' => true,
            'message' => 'Emergency ICU transfer requested. Hospital staff and ICU notified.',
            'data' => $updated,
        ]);
    }

    /**
     * Complete an emergency ICU transfer by assigning an available ICU bed.
     */
    public function completeIcuTransfer(Request $request, int $id): JsonResponse
    {
        $admission = Admission::with('patient')->findOrFail($id);
        $this->authorize('completeIcuTransfer', $admission);

        $request->validate([
            'ward' => ['required', 'string', 'max:100'],
            'bed_number' => ['required', 'string', 'max:50'],
        ]);

        $updated = $this->admissionService->completeIcuTransfer(
            $admission,
            $request->user(),
            $request->input('ward'),
            $request->input('bed_number'),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => "Patient successfully transferred to {$updated->ward} ({$updated->bed_number}).",
            'data' => $updated,
        ]);
    }

    /**
     * Cancel / revoke an emergency ICU transfer request.
     */
    public function cancelIcuTransfer(Request $request, int $id): JsonResponse
    {
        $admission = Admission::with('patient')->findOrFail($id);
        $this->authorize('requestIcuTransfer', $admission);

        $updated = $this->admissionService->cancelIcuTransfer(
            $admission,
            $request->user(),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Emergency ICU transfer request cancelled.',
            'data' => $updated,
        ]);
    }

    /**
     * Request step-down from ICU back to a general ward / normal bed for a stabilized patient.
     */
    public function requestStepDown(Request $request, int $id): JsonResponse
    {
        $admission = Admission::with('patient')->findOrFail($id);
        $this->authorize('requestStepDown', $admission);

        $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
            'target_ward' => ['nullable', 'string', 'max:100'],
        ]);

        $updated = $this->admissionService->requestStepDown(
            $admission,
            $request->user(),
            $request->input('notes'),
            $request->input('target_ward', 'General Medical Ward')
        );

        return response()->json([
            'success' => true,
            'message' => 'Ward step-down requested. Patient is stable and queued for general bed allocation.',
            'data' => $updated,
        ]);
    }

    /**
     * Complete ward step-down transfer by assigning an available general bed.
     */
    public function completeStepDown(Request $request, int $id): JsonResponse
    {
        $admission = Admission::with('patient')->findOrFail($id);
        $this->authorize('completeStepDown', $admission);

        $request->validate([
            'ward' => ['required', 'string', 'max:100'],
            'bed_number' => ['required', 'string', 'max:50'],
        ]);

        $updated = $this->admissionService->completeStepDown(
            $admission,
            $request->user(),
            $request->input('ward'),
            $request->input('bed_number'),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => "Patient successfully stepped down to {$updated->ward} ({$updated->bed_number}).",
            'data' => $updated,
        ]);
    }

    /**
     * Cancel / revoke a ward step-down request.
     */
    public function cancelStepDown(Request $request, int $id): JsonResponse
    {
        $admission = Admission::with('patient')->findOrFail($id);
        $this->authorize('cancelStepDown', $admission);

        $updated = $this->admissionService->cancelStepDown(
            $admission,
            $request->user(),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Ward step-down request cancelled.',
            'data' => $updated,
        ]);
    }
}

