<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(protected AuthService $authService)
    {
    }

    /**
     * Register a new hospital staff member.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'hospital_id_number' => ['required', 'string', 'max:64'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'in:nurse,doctor'],
        ], [
            'role.in' => 'Administrator registration is prohibited. Only Nurse or Doctor accounts may be created.',
            'hospital_id_number.required' => 'Hospital Identity Number is required for staff verification.',
        ]);

        $result = $this->authService->register(
            $validated,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Staff account registered successfully.',
            'data' => [
                'user' => $result['user'],
                'token' => $result['token'],
            ],
        ], 201);
    }

    /**
     * Authenticate staff user and return bearer token + user.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            $request->validated(),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Logged in successfully.',
            'data' => [
                'user' => $result['user'],
                'token' => $result['token'],
            ],
        ]);
    }

    /**
     * Terminate the authenticated staff session.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout(
            $request->user(),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
            'data' => null,
        ]);
    }

    /**
     * Return authenticated user profile and roles.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'User profile retrieved.',
            'data' => [
                'user' => $request->user(),
            ],
        ]);
    }
}

