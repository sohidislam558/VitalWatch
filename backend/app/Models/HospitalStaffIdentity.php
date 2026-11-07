<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HospitalStaffIdentity extends Model
{
    use HasFactory;

    protected $fillable = [
        'identity_number',
        'role',
        'department',
        'issued_to_name',
        'is_claimed',
        'claimed_at',
        'claimed_by_user_id',
    ];

    protected $casts = [
        'is_claimed' => 'boolean',
        'claimed_at' => 'datetime',
    ];

    public function claimedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'claimed_by_user_id');
    }
}

