<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AlertRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'parameter',
        'operator',
        'threshold_value',
        'priority',
        'message_template',
        'is_active',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'threshold_value' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}

