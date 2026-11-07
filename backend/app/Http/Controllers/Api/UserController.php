<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct(protected AuditService $auditService)
    {
    }

    /**
     * List hospital users with search, role, and status filters.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()->orderBy('id', 'asc');

        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', $search)
                  ->orWhere('email', 'LIKE', $search);
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->paginate($request->input('per_page', 10));

        return response()->json([
            'success' => true,
            'message' => 'Staff users retrieved.',
            'data' => $users,
        ]);
    }

    /**
     * Store new staff account.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        $this->auditService->log(
            action: 'USER_CREATED',
            entityType: User::class,
            entityId: $user->id,
            details: ['email' => $user->email, 'role' => $user->role],
            user: $request->user(),
            ipAddress: $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Staff user created successfully.',
            'data' => $user,
        ], 201);
    }

    /**
     * Retrieve single user details.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $this->authorize('view', $user);

        return response()->json([
            'success' => true,
            'message' => 'Staff user details retrieved.',
            'data' => $user,
        ]);
    }

    /**
     * Update user details.
     */
    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $this->authorize('update', $user);

        $data = $request->validated();
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        $this->auditService->log(
            action: 'USER_UPDATED',
            entityType: User::class,
            entityId: $user->id,
            details: ['email' => $user->email, 'role' => $user->role],
            user: $request->user(),
            ipAddress: $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Staff user updated successfully.',
            'data' => $user,
        ]);
    }

    /**
     * Toggle user active/inactive status.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $this->authorize('updateStatus', $user);

        $request->validate([
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $user->update(['status' => $request->status]);

        $this->auditService->log(
            action: 'USER_STATUS_CHANGED',
            entityType: User::class,
            entityId: $user->id,
            details: ['status' => $user->status],
            user: $request->user(),
            ipAddress: $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => "User status set to {$user->status}.",
            'data' => $user,
        ]);
    }
}

