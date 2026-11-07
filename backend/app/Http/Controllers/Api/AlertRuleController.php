<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AlertRule\StoreAlertRuleRequest;
use App\Http\Requests\AlertRule\UpdateAlertRuleRequest;
use App\Models\AlertRule;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertRuleController extends Controller
{
    public function __construct(protected AuditService $auditService)
    {
    }

    /**
     * List configured alert rules.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AlertRule::class);

        $query = AlertRule::with('approver')->orderBy('parameter', 'asc');

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $rules = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Alert rules retrieved.',
            'data' => $rules,
        ]);
    }

    /**
     * Store new alert rule (Admin only).
     */
    public function store(StoreAlertRuleRequest $request): JsonResponse
    {
        $this->authorize('create', AlertRule::class);

        $data = $request->validated();
        $data['approved_by'] = $request->user()->id;

        $rule = AlertRule::create($data);

        $this->auditService->log(
            action: 'ALERT_RULE_CREATED',
            entityType: AlertRule::class,
            entityId: $rule->id,
            details: $data,
            user: $request->user(),
            ipAddress: $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Alert rule created successfully.',
            'data' => $rule->load('approver'),
        ], 201);
    }

    /**
     * Update existing alert rule.
     */
    public function update(UpdateAlertRuleRequest $request, int $id): JsonResponse
    {
        $rule = AlertRule::findOrFail($id);
        $this->authorize('update', $rule);

        $data = $request->validated();
        $rule->update($data);

        $this->auditService->log(
            action: 'ALERT_RULE_UPDATED',
            entityType: AlertRule::class,
            entityId: $rule->id,
            details: $data,
            user: $request->user(),
            ipAddress: $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Alert rule updated successfully.',
            'data' => $rule->fresh('approver'),
        ]);
    }

    /**
     * Enable or disable alert rule.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $rule = AlertRule::findOrFail($id);
        $this->authorize('update', $rule);

        $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $rule->update(['is_active' => $request->is_active]);

        $statusStr = $rule->is_active ? 'activated' : 'deactivated';

        $this->auditService->log(
            action: 'ALERT_RULE_STATUS_CHANGED',
            entityType: AlertRule::class,
            entityId: $rule->id,
            details: ['is_active' => $rule->is_active],
            user: $request->user(),
            ipAddress: $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => "Alert rule has been {$statusStr}.",
            'data' => $rule,
        ]);
    }
}

