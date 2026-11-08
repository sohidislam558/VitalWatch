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
        // Only registered nurses can register / onboard patients
        return $user->role === 'nurse';
    }

    public function update(User $user, Patient $patient): bool
    {
        return in_array($user->role, ['admin', 'nurse'], true);
    }

    public function delete(User $user, Patient $patient): bool
    {
        // Admin only can delete any patient's entry or information
        return $user->isAdmin();
    }
}

