<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\StorePatientRequest;
use App\Http\Requests\Patient\UpdatePatientRequest;
use App\Models\Patient;
use App\Services\PatientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function __construct(protected PatientService $patientService)
    {
    }

    /**
     * List registered patients with filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Patient::class);

        $patients = $this->patientService->list(
            $request->only(['search', 'ward', 'status']),
            (int) $request->input('per_page', 10)
        );

        return response()->json([
            'success' => true,
            'message' => 'Patients retrieved successfully.',
            'data' => $patients,
        ]);
    }

    /**
     * Register a new patient.
     */
    public function store(StorePatientRequest $request): JsonResponse
    {
        $this->authorize('create', Patient::class);

        $patient = $this->patientService->create(
            $request->validated(),
            $request->user(),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Patient registered successfully.',
            'data' => $patient,
        ], 201);
    }

    /**
     * Retrieve complete patient profile, active admission, and recent vitals.
     */
    public function show(int $id): JsonResponse
    {
        $patient = $this->patientService->getDetails($id);
        $this->authorize('view', $patient);

        return response()->json([
            'success' => true,
            'message' => 'Patient details retrieved.',
            'data' => $patient,
        ]);
    }

    /**
     * Update patient demographic information.
     */
    public function update(UpdatePatientRequest $request, int $id): JsonResponse
    {
        $patient = Patient::findOrFail($id);
        $this->authorize('update', $patient);

        $updatedPatient = $this->patientService->update(
            $patient,
            $request->validated(),
            $request->user(),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Patient information updated successfully.',
            'data' => $updatedPatient,
        ]);
    }

    /**
     * Retrieve full admission history for patient.
     */
    public function admissions(int $id): JsonResponse
    {
        $patient = Patient::findOrFail($id);
        $this->authorize('view', $patient);

        $admissions = $patient->admissions()->with('vitalRecords')->get();

        return response()->json([
            'success' => true,
            'message' => 'Patient admission history retrieved.',
            'data' => $admissions,
        ]);
    }

    /**
     * Delete patient record and cascade all child data (Admin only).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $patient = Patient::findOrFail($id);
        $this->authorize('delete', $patient);

        $this->patientService->delete($patient, $request->user(), $request->ip());

        return response()->json([
            'success' => true,
            'message' => "Patient {$patient->patient_code} ({$patient->name}) and all associated records deleted successfully.",
        ]);
    }
}

