<?php

namespace App\Policies;

use App\Models\AlertRule;
use App\Models\User;

class AlertRulePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse'], true);
    }

    public function view(User $user, AlertRule $rule): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse'], true);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, AlertRule $rule): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, AlertRule $rule): bool
    {
        return $user->isAdmin();
    }
}

