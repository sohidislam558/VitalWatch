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

    /**
     * Mutator to sanitize person name and strip duplicate doctor/nurse prefixes.
     */
    protected function name(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            set: fn (?string $value) => self::cleanPersonName($value),
        );
    }

    /**
     * Strips leading Dr. / Doctor / Nurse prefixes cleanly.
     */
    public static function cleanPersonName(?string $name): string
    {
        if (!$name) {
            return '';
        }
        $cleaned = trim($name);
        while (preg_match('/^(dr\.?|doctor|nurse)\s+/i', $cleaned)) {
            $cleaned = trim(preg_replace('/^(dr\.?|doctor|nurse)\s+/i', '', $cleaned));
        }
        return $cleaned;
    }

    /**
     * Format a doctor's name safely without double prefixing.
     */
    public static function formatDoctorName(?string $name): string
    {
        $clean = self::cleanPersonName($name);
        return $clean ? "Dr. {$clean}" : 'Attending Physician';
    }

    /**
     * Format a nurse's name safely without double prefixing.
     */
    public static function formatNurseName(?string $name): string
    {
        $clean = self::cleanPersonName($name);
        return $clean ? "Nurse {$clean}" : 'Ward Nurse';
    }

    /**
     * Format a name according to staff role.
     */
    public static function formatRoleName(?string $name, ?string $role = null): string
    {
        if (!$name) {
            return 'Staff';
        }
        if ($role === 'doctor') {
            return self::formatDoctorName($name);
        }
        if ($role === 'nurse') {
            return self::formatNurseName($name);
        }
        return self::cleanPersonName($name);
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
