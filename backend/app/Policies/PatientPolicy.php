<?php

namespace App\Policies;

use App\Models\Patient;
use App\Models\User;

class PatientPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse'], true);
    }

    public function view(User $user, Patient $patient): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'nurse'], true);
    }

    public function update(User $user, Patient $patient): bool
    {
        return in_array($user->role, ['admin', 'nurse'], true);
    }

    public function delete(User $user, Patient $patient): bool
    {
        // Safe archival only: cannot delete patients with recorded admissions or vitals
        return $user->isAdmin() && $patient->vitalRecords()->count() === 0 && $patient->admissions()->count() === 0;
    }
}

