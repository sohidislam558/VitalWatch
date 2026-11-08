<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VitalRecord;

class VitalRecordPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse'], true);
    }

    public function view(User $user, VitalRecord $vitalRecord): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse'], true);
    }

    public function create(User $user): bool
    {
        // Only bedside nurses can record vital signs
        return $user->role === 'nurse';
    }

    /**
     * Past clinical vital records are completely immutable.
     * No staff member, including administrators, can rewrite or erase past measurements.
     */
    public function update(User $user, VitalRecord $vitalRecord): bool
    {
        return false;
    }

    public function delete(User $user, VitalRecord $vitalRecord): bool
    {
        return false;
    }
}

