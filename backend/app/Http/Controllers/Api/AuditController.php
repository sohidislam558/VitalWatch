<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    /**
     * Retrieve paginated system audit trail (Admin only).
     */
    public function index(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin role required.',
            ], 403);
        }

        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('action', 'LIKE', $search)
                  ->orWhere('entity_type', 'LIKE', $search)
                  ->orWhere('ip_address', 'LIKE', $search);
            });
        }

        $logs = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'message' => 'Audit logs retrieved.',
            'data' => $logs,
        ]);
    }
}

