<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_code',
        'name',
        'date_of_birth',
        'gender',
        'contact',
        'address',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date:Y-m-d',
        ];
    }

    public function admissions(): HasMany
    {
        return $this->hasMany(Admission::class)->orderBy('admitted_at', 'desc');
    }

    public function activeAdmission(): HasOne
    {
        return $this->hasOne(Admission::class)->where('status', 'admitted')->latestOfMany();
    }

    public function vitalRecords(): HasMany
    {
        return $this->hasMany(VitalRecord::class)->orderBy('measured_at', 'desc');
    }

    public function latestVitalRecord(): HasOne
    {
        return $this->hasOne(VitalRecord::class)->latestOfMany('measured_at');
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class)->orderBy('created_at', 'desc');
    }

    public function activeAlerts(): HasMany
    {
        return $this->hasMany(Alert::class)->where('status', 'active')->orderBy('created_at', 'desc');
    }
}

