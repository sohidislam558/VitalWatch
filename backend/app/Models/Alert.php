<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Alert extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'vital_record_id',
        'alert_rule_id',
        'message',
        'priority',
        'status',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function vitalRecord(): BelongsTo
    {
        return $this->belongsTo(VitalRecord::class);
    }

    public function alertRule(): BelongsTo
    {
        return $this->belongsTo(AlertRule::class);
    }

    public function acknowledgements(): HasMany
    {
        return $this->hasMany(AlertAcknowledgement::class)->orderBy('created_at', 'desc');
    }

    public function emailLogs(): HasMany
    {
        return $this->hasMany(EmailLog::class);
    }
}

