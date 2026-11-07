<?php

namespace App\Services;

use App\Models\Admission;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class PatientService
{
    public function __construct(protected AuditService $auditService)
    {
    }

    /**
     * Query patients with search, ward, and pagination.
     */
    public function list(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = Patient::query()
            ->with(['activeAdmission', 'latestVitalRecord'])
            ->orderBy('id', 'desc');

        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', $search)
                  ->orWhere('patient_code', 'LIKE', $search)
                  ->orWhere('contact', 'LIKE', $search);
            });
        }

        if (!empty($filters['ward'])) {
            $query->whereHas('activeAdmission', function ($q) use ($filters) {
                $q->where('ward', $filters['ward']);
            });
        }

        if (isset($filters['status']) && $filters['status'] === 'admitted') {
            $query->whereHas('activeAdmission');
        } elseif (isset($filters['status']) && $filters['status'] === 'discharged') {
            $query->whereDoesntHave('activeAdmission');
        }

        return $query->paginate($perPage);
    }

    /**
     * Generate sequential unique patient code.
     */
    public function generatePatientCode(): string
    {
        $year = date('Y');
        $lastPatient = Patient::where('patient_code', 'LIKE', "PAT-{$year}-%")
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = 1;
        if ($lastPatient && preg_match('/PAT-\d{4}-(\d+)/', $lastPatient->patient_code, $matches)) {
            $nextNumber = ((int) $matches[1]) + 1;
        }

        return sprintf("PAT-%s-%04d", $year, $nextNumber);
    }

    /**
     * Register a new patient and optionally admit to ward in a single transaction.
     */
    public function create(array $data, User $actor, string $ip): Patient
    {
        return DB::transaction(function () use ($data, $actor, $ip) {
            if (empty($data['patient_code'])) {
                $data['patient_code'] = $this->generatePatientCode();
            }

            $patientFields = Arr::only($data, [
                'patient_code', 'name', 'date_of_birth', 'gender', 'contact', 'address',
            ]);

            $patient = Patient::create($patientFields);

            if (!empty($data['ward']) && !empty($data['bed_number'])) {
                Admission::create([
                    'patient_id' => $patient->id,
                    'ward' => $data['ward'],
                    'bed_number' => $data['bed_number'],
                    'diagnosis' => $data['diagnosis'] ?? 'General Observation',
                    'attending_physician' => $data['attending_physician'] ?? null,
                    'admitted_at' => now(),
                    'status' => 'admitted',
                ]);
            }

            $this->auditService->log(
                action: 'PATIENT_REGISTERED',
                entityType: Patient::class,
                entityId: $patient->id,
                details: [
                    'patient_code' => $patient->patient_code,
                    'name' => $patient->name,
                    'ward' => $data['ward'] ?? null,
                    'bed' => $data['bed_number'] ?? null,
                ],
                user: $actor,
                ipAddress: $ip
            );

            return $patient->fresh(['activeAdmission']);
        });
    }

    /**
     * Update patient demographics.
     */
    public function update(Patient $patient, array $data, User $actor, string $ip): Patient
    {
        $patient->update($data);

        $this->auditService->log(
            action: 'PATIENT_UPDATED',
            entityType: Patient::class,
            entityId: $patient->id,
            details: $data,
            user: $actor,
            ipAddress: $ip
        );

        return $patient->fresh(['activeAdmission', 'latestVitalRecord']);
    }

    /**
     * Retrieve complete patient profile for details view.
     */
    public function getDetails(int $id): Patient
    {
        return Patient::with([
            'activeAdmission',
            'admissions' => fn($q) => $q->orderBy('admitted_at', 'desc'),
            'latestVitalRecord.recorder',
            'vitalRecords' => fn($q) => $q->with('recorder')->orderBy('measured_at', 'desc')->take(30),
            'alerts' => fn($q) => $q->with(['alertRule', 'acknowledgements.user'])->orderBy('created_at', 'desc')->take(20),
        ])->findOrFail($id);
    }
}

