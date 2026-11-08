<?php

namespace App\Policies;

use App\Models\Admission;
use App\Models\User;

class AdmissionPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse'], true);
    }

    public function view(User $user, Admission $admission): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse'], true);
    }

    public function create(User $user): bool
    {
        // Only nurses can admit patients
        return $user->role === 'nurse';
    }

    public function discharge(User $user, Admission $admission): bool
    {
        // Only doctors can formally discharge an admitted patient
        return $user->role === 'doctor' && $admission->status === 'admitted';
    }
}

