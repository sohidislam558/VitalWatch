<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'hospital_id_number',
        'password',
        'role',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isDoctor(): bool
    {
        return $this->role === 'doctor';
    }

    public function isNurse(): bool
    {
        return $this->role === 'nurse';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function vitalRecords(): HasMany
    {
        return $this->hasMany(VitalRecord::class, 'recorded_by');
    }

    public function alertAcknowledgements(): HasMany
    {
        return $this->hasMany(AlertAcknowledgement::class, 'user_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }

    public function approvedAlertRules(): HasMany
    {
        return $this->hasMany(AlertRule::class, 'approved_by');
    }
}
