<?php

namespace App\Services;

use App\Models\HospitalStaffIdentity;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(protected AuditService $auditService)
    {
    }

    /**
     * Register a new staff user and issue Sanctum token after verifying hospital identity.
     */
    public function register(array $data, string $ipAddress): array
    {
        $role = $data['role'] ?? 'nurse';
        if ($role === 'admin') {
            throw ValidationException::withMessages([
                'role' => ['Administrator accounts cannot be self-registered. Only the seeded administrator is permitted.'],
            ]);
        }

        $idNum = strtoupper(trim($data['hospital_id_number']));
        $identity = HospitalStaffIdentity::where('identity_number', $idNum)->first();

        if (!$identity) {
            throw ValidationException::withMessages([
                'hospital_id_number' => ["Verification failed: Badge #{$idNum} is not found in the hospital staff registry. Contact administration."],
            ]);
        }

        if ($identity->role !== $role) {
            throw ValidationException::withMessages([
                'hospital_id_number' => ["Badge #{$idNum} is registered as {$identity->role}, but you selected {$role}."],
            ]);
        }

        if ($identity->is_claimed) {
            throw ValidationException::withMessages([
                'hospital_id_number' => ["Badge #{$idNum} has already been claimed and registered by another staff member."],
            ]);
        }

        $email = trim(strtolower($data['email']));

        $user = User::create([
            'name' => $data['name'],
            'email' => $email,
            'hospital_id_number' => $idNum,
            'password' => Hash::make($data['password']),
            'role' => $role,
            'status' => 'active',
        ]);

        $identity->update([
            'is_claimed' => true,
            'claimed_at' => now(),
            'claimed_by_user_id' => $user->id,
        ]);

        $token = $user->createToken('VitalWatchStaffAuth')->plainTextToken;

        $this->auditService->log(
            action: 'USER_REGISTERED',
            entityType: User::class,
            entityId: $user->id,
            details: ['email' => $user->email, 'role' => $user->role, 'hospital_id_number' => $idNum],
            user: $user,
            ipAddress: $ipAddress
        );

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Authenticate staff user and issue Sanctum token.
     */
    public function login(array $credentials, string $ipAddress): array
    {
        $email = trim(strtolower($credentials['email']));
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            $this->auditService->log(
                action: 'LOGIN_FAILED',
                entityType: User::class,
                details: ['email' => $email],
                ipAddress: $ipAddress
            );

            throw ValidationException::withMessages([
                'email' => ['Authentication failed. Please check credentials.'],
            ]);
        }

        if ($user->status !== 'active') {
            $this->auditService->log(
                action: 'LOGIN_BLOCKED_INACTIVE',
                entityType: User::class,
                entityId: $user->id,
                user: $user,
                ipAddress: $ipAddress
            );

            throw ValidationException::withMessages([
                'email' => ['Your account is inactive. Please contact a hospital administrator.'],
            ]);
        }

        // Create Sanctum personal access token
        $token = $user->createToken('VitalWatchStaffAuth')->plainTextToken;

        $this->auditService->log(
            action: 'LOGIN_SUCCESS',
            entityType: User::class,
            entityId: $user->id,
            user: $user,
            ipAddress: $ipAddress
        );

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Revoke current session/token.
     */
    public function logout(User $user, string $ipAddress): void
    {
        if ($user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        $this->auditService->log(
            action: 'LOGOUT',
            entityType: User::class,
            entityId: $user->id,
            user: $user,
            ipAddress: $ipAddress
        );
    }
}

