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

    /**
     * Delete a specific audit log event by ID (Admin only).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin role required.',
            ], 403);
        }

        $log = AuditLog::findOrFail($id);
        $log->delete();

        return response()->json([
            'success' => true,
            'message' => "Activity log event #{$id} has been deleted successfully.",
        ]);
    }

    /**
     * Delete audit logs by specific date or date range (Admin only).
     */
    public function deleteByDate(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin role required.',
            ], 403);
        }

        $request->validate([
            'date' => ['nullable', 'date'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $query = AuditLog::query();
        $date = $request->input('date');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        if ($date) {
            $query->whereDate('created_at', $date);
            $count = $query->delete();

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$count} activity log records for {$date}.",
                'data' => ['deleted_count' => $count],
            ]);
        }

        if ($startDate || $endDate) {
            if ($startDate) {
                $query->where('created_at', '>=', $startDate . ' 00:00:00');
            }
            if ($endDate) {
                $query->where('created_at', '<=', $endDate . ' 23:59:59');
            }

            $count = $query->delete();
            $rangeDesc = ($startDate && $endDate)
                ? "between {$startDate} and {$endDate}"
                : ($startDate ? "from {$startDate} onwards" : "up to {$endDate}");

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$count} activity log records {$rangeDesc}.",
                'data' => ['deleted_count' => $count],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Please provide a date or date range to delete logs.',
        ], 422);
    }

    /**
     * Delete/Purge all activity logs (Admin only).
     */
    public function destroyAll(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin role required.',
            ], 403);
        }

        $count = AuditLog::count();
        AuditLog::query()->delete();

        return response()->json([
            'success' => true,
            'message' => "All {$count} activity log records have been permanently cleared.",
            'data' => ['deleted_count' => $count],
        ]);
    }
}

