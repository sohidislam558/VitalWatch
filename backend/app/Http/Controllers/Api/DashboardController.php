<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(protected DashboardService $dashboardService)
    {
    }

    /**
     * Central KPI summary counters.
     */
    public function summary(): JsonResponse
    {
        $summary = $this->dashboardService->getSummary();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard summary statistics retrieved.',
            'data' => $summary,
        ]);
    }

    /**
     * Active patient monitoring telemetry list.
     */
    public function patients(Request $request): JsonResponse
    {
        $patients = $this->dashboardService->getPatients(
            $request->only(['search', 'ward', 'alert_status']),
            (int) $request->input('per_page', 50)
        );

        return response()->json([
            'success' => true,
            'message' => 'Monitoring patients retrieved.',
            'data' => $patients,
        ]);
    }

    /**
     * Active alerts queue.
     */
    public function alerts(Request $request): JsonResponse
    {
        $alerts = $this->dashboardService->getAlerts(
            (int) $request->input('limit', 10)
        );

        return response()->json([
            'success' => true,
            'message' => 'Active alerts retrieved.',
            'data' => $alerts,
        ]);
    }

    /**
     * Hospital live activity stream (Admin oversight of nurse inputs & doctor actions).
     */
    public function activities(Request $request): JsonResponse
    {
        $activities = $this->dashboardService->getActivities(
            (int) $request->input('limit', 30)
        );

        return response()->json([
            'success' => true,
            'message' => 'Hospital activities retrieved.',
            'data' => $activities,
        ]);
    }
}

