<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Log a system audit event. Never records sensitive secrets.
     */
    public function log(
        string $action,
        string $entityType,
        ?int $entityId = null,
        ?array $details = null,
        ?User $user = null,
        ?string $ipAddress = null
    ): AuditLog {
        // Strip sensitive fields
        if ($details) {
            unset($details['password'], $details['password_confirmation'], $details['token']);
        }

        return AuditLog::create([
            'user_id' => $user?->id ?? auth()->id(),
            'action' => strtoupper($action),
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details,
            'ip_address' => $ipAddress ?? Request::ip(),
            'created_at' => now(),
        ]);
    }
}

