<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VitalRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'admission_id',
        'recorded_by',
        'heart_rate',
        'systolic_bp',
        'diastolic_bp',
        'spo2',
        'temperature',
        'respiratory_rate',
        'notes',
        'measured_at',
    ];

    protected function casts(): array
    {
        return [
            'heart_rate' => 'float',
            'systolic_bp' => 'float',
            'diastolic_bp' => 'float',
            'spo2' => 'float',
            'temperature' => 'float',
            'respiratory_rate' => 'float',
            'measured_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }
}

