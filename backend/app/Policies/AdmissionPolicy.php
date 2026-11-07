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
        return in_array($user->role, ['admin', 'nurse'], true);
    }

    public function discharge(User $user, Admission $admission): bool
    {
        return in_array($user->role, ['admin', 'doctor'], true);
    }
}

