<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Admission extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'ward',
        'bed_number',
        'admitted_at',
        'discharged_at',
        'status',
        'icu_transfer_requested',
        'icu_transfer_requested_at',
        'icu_transfer_requested_by',
        'target_icu_ward',
        'icu_transfer_notes',
        'icu_transferred',
        'icu_transferred_at',
    ];

    protected function casts(): array
    {
        return [
            'admitted_at' => 'datetime',
            'discharged_at' => 'datetime',
            'icu_transfer_requested' => 'boolean',
            'icu_transfer_requested_at' => 'datetime',
            'icu_transferred' => 'boolean',
            'icu_transferred_at' => 'datetime',
        ];
    }

    public function icuTransferRequester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'icu_transfer_requested_by');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function vitalRecords(): HasMany
    {
        return $this->hasMany(VitalRecord::class)->orderBy('measured_at', 'desc');
    }
}

