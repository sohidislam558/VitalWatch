<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VitalWatch Patient Alert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { background-color: #ffffff; max-width: 620px; margin: 0 auto; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background-color: #1e40af; color: #ffffff; padding: 20px 24px; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
        .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-top: 10px; }
        .badge-urgent { background-color: #fee2e2; color: #b91c1c; }
        .badge-review { background-color: #fef3c7; color: #b45309; }
        .content { padding: 24px; line-height: 1.6; font-size: 14px; }
        .meta-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .meta-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
        .meta-table td.label { font-weight: 600; color: #64748b; width: 38%; }
        .alert-box { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0; }
        .alert-item { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1; }
        .alert-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .footer { padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>VitalWatch Early Warning System</h1>
            <p>Clinical Decision Support Emergency Dispatch</p>
            @php
                $alertCount = isset($alerts) ? count($alerts) : 1;
                $hasUrgent = isset($alerts) ? collect($alerts)->contains(fn($a) => $a->priority === 'urgent') : ($alert->priority === 'urgent');
            @endphp
            <span class="badge {{ $hasUrgent ? 'badge-urgent' : 'badge-review' }}">
                Priority: {{ $hasUrgent ? 'URGENT' : 'REVIEW' }} ({{ $alertCount }} {{ $alertCount === 1 ? 'Alarm' : 'Alarms' }})
            </span>
        </div>
        <div class="content">
            <p>An early warning threshold alarm has been triggered for a monitored patient:</p>

            <table class="meta-table">
                <tr>
                    <td class="label">Patient Name:</td>
                    <td><strong>{{ $alert->patient?->name ?? 'Inpatient' }}</strong></td>
                </tr>
                <tr>
                    <td class="label">Patient Code:</td>
                    <td><strong>{{ $alert->patient?->patient_code ?? 'N/A' }}</strong></td>
                </tr>
                <tr>
                    <td class="label">Ward & Bed:</td>
                    <td>{{ $vitalRecord?->admission?->ward ?? $alert->vitalRecord?->admission?->ward ?? 'General Ward' }} — Bed {{ $vitalRecord?->admission?->bed_number ?? $alert->vitalRecord?->admission?->bed_number ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="label">Measurement Time:</td>
                    <td>{{ $vitalRecord?->measured_at?->format('Y-m-d H:i') ?? $alert->vitalRecord?->measured_at?->format('Y-m-d H:i') ?? now()->format('Y-m-d H:i') }}</td>
                </tr>
            </table>

            <div class="alert-box">
                @if(isset($alerts) && count($alerts) > 1)
                    <strong>Triggered Clinical Alarms ({{ count($alerts) }}):</strong>
                    <div style="margin-top: 8px;">
                        @foreach($alerts as $item)
                            <div class="alert-item">
                                <span class="badge {{ $item->priority === 'urgent' ? 'badge-urgent' : 'badge-review' }}" style="margin-top: 0; font-size: 10px; padding: 2px 6px;">
                                    {{ strtoupper($item->priority) }}
                                </span>
                                <strong>{{ ucwords(str_replace('_', ' ', $item->alertRule?->parameter ?? 'Vital Sign')) }}:</strong>
                                {{ $item->message }}
                            </div>
                        @endforeach
                    </div>
                @else
                    <strong>Alert Prompt:</strong> {{ $alert->message }}
                @endif
            </div>

            <p style="margin-top: 20px; font-weight: 600; color: #1e40af;">
                Action Required: Please log in to the VitalWatch physician dashboard to review the patient's bedside status and initiate bedside action.
            </p>
        </div>
        <div class="footer">
            <p>VitalWatch Patient Early Warning Notification &bull; Confidential Hospital Communication</p>
            <p>Do not reply to this automated email.</p>
        </div>
    </div>
</body>
</html>
