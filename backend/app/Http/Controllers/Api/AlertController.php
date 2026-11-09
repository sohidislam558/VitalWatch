<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Services\AlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    public function __construct(protected AlertService $alertService)
    {
    }

    /**
     * Query alerts with status, priority, patient, and date filters.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Alert::class);

        $query = Alert::with(['patient.activeAdmission', 'vitalRecord', 'alertRule', 'acknowledgements.user'])
            ->orderByRaw("FIELD(status, 'active', 'acknowledged', 'resolved') ASC")
            ->orderByRaw("FIELD(priority, 'urgent', 'review') ASC")
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->end_date);
        }

        $alerts = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Alerts retrieved.',
            'data' => $alerts,
        ]);
    }

    /**
     * Alert details.
     */
    public function show(int $id): JsonResponse
    {
        $alert = Alert::with([
            'patient.activeAdmission',
            'vitalRecord.recorder',
            'alertRule',
            'acknowledgements.user',
        ])->findOrFail($id);

        $this->authorize('view', $alert);

        return response()->json([
            'success' => true,
            'message' => 'Alert details retrieved.',
            'data' => $alert,
        ]);
    }

    /**
     * Mark alert as "Doctor in Action".
     */
    public function doctorInAction(Request $request, int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $this->authorize('doctorInAction', $alert);

        $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $updated = $this->alertService->markDoctorInAction(
            $alert,
            $request->user(),
            $request->input('note'),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Status updated: Doctor in Action. Bedside attendance logged.',
            'data' => $updated,
        ]);
    }

    /**
     * Simple option for doctor when assessment is done.
     * Completes bedside action, marks alert resolved, and frees doctor to attend another patient.
     */
    public function assessmentDone(Request $request, int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $this->authorize('resolve', $alert);

        $doctorName = $request->user()->name;
        $note = $request->input('note') ?: "Bedside clinical assessment completed by Dr. {$doctorName}. Emergency resolved.";

        $updated = $this->alertService->resolve(
            $alert,
            $request->user(),
            $note,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Assessment marked done. Case resolved.',
            'data' => $updated,
        ]);
    }

    /**
     * Request an immediate emergency ICU transfer for the alert's patient.
     */
    public function requestIcuTransfer(Request $request, int $id): JsonResponse
    {
        $alert = Alert::with('patient.activeAdmission')->findOrFail($id);
        $this->authorize('doctorInAction', $alert);

        $admission = $alert->patient?->activeAdmission;
        if (!$admission) {
            return response()->json([
                'success' => false,
                'message' => 'No active hospital admission record found for this patient.',
            ], 422);
        }

        $admissionService = app(\App\Services\AdmissionService::class);
        $updatedAdmission = $admissionService->requestIcuTransfer(
            $admission,
            $request->user(),
            $request->input('note'),
            $request->input('target_ward', 'Intensive Care Unit (ICU)')
        );

        return response()->json([
            'success' => true,
            'message' => 'Emergency ICU transfer requested. Hospital staff and ICU notified.',
            'data' => [
                'admission' => $updatedAdmission,
                'alert' => $alert,
            ],
        ]);
    }

    /**
     * Acknowledge alert with optional clinical note.
     */
    public function acknowledge(Request $request, int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $this->authorize('acknowledge', $alert);

        $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $updated = $this->alertService->acknowledge(
            $alert,
            $request->user(),
            $request->input('note'),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Alert acknowledged successfully.',
            'data' => $updated,
        ]);
    }

    /**
     * Resolve alert with clinical disposition note.
     */
    public function resolve(Request $request, int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $this->authorize('resolve', $alert);

        $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $updated = $this->alertService->resolve(
            $alert,
            $request->user(),
            $request->input('note'),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Alert resolved successfully.',
            'data' => $updated,
        ]);
    }

    /**
     * Retrieve full acknowledgement history for an alert.
     */
    public function history(int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $this->authorize('view', $alert);

        $history = $alert->acknowledgements()->with('user')->get();

        return response()->json([
            'success' => true,
            'message' => 'Alert history retrieved.',
            'data' => $history,
        ]);
    }
}

