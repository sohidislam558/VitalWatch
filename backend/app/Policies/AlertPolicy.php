<?php

namespace App\Policies;

use App\Models\Alert;
use App\Models\User;

class AlertPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse'], true);
    }

    public function view(User $user, Alert $alert): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse'], true);
    }

    public function acknowledge(User $user, Alert $alert): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse'], true) && $alert->status === 'active';
    }

    public function doctorInAction(User $user, Alert $alert): bool
    {
        return in_array($user->role, ['admin', 'doctor'], true) && in_array($alert->status, ['active', 'acknowledged'], true);
    }

    public function resolve(User $user, Alert $alert): bool
    {
        // Physicians / Doctors and Admins can formally resolve clinical alerts
        return in_array($user->role, ['admin', 'doctor'], true) && in_array($alert->status, ['active', 'acknowledged', 'doctor_in_action'], true);
    }

    public function delete(User $user, Alert $alert): bool
    {
        // Alerts cannot be deleted; they must be acknowledged/resolved for traceability
        return false;
    }
}

