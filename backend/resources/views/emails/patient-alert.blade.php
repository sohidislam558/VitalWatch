<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VitalWatch Patient Alert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { background-color: #ffffff; max-width: 580px; margin: 0 auto; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
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
        .footer { padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>VitalWatch Early Warning System</h1>
            <p>Clinical Decision Support Notification</p>
            <span class="badge {{ $alert->priority === 'urgent' ? 'badge-urgent' : 'badge-review' }}">
                Priority: {{ strtoupper($alert->priority) }}
            </span>
        </div>
        <div class="content">
            <p>An early warning threshold alert has been triggered for a monitored patient:</p>

            <table class="meta-table">
                <tr>
                    <td class="label">Patient Code:</td>
                    <td><strong>{{ $alert->patient->patient_code }}</strong></td>
                </tr>
                <tr>
                    <td class="label">Ward & Bed:</td>
                    <td>{{ $alert->vitalRecord?->admission?->ward ?? 'General' }} — Bed {{ $alert->vitalRecord?->admission?->bed_number ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="label">Triggered Parameter:</td>
                    <td>{{ ucwords(str_replace('_', ' ', $alert->alertRule->parameter ?? 'Vital Sign')) }}</td>
                </tr>
                <tr>
                    <td class="label">Measurement Time:</td>
                    <td>{{ $alert->vitalRecord?->measured_at?->format('Y-m-d H:i') ?? now()->format('Y-m-d H:i') }}</td>
                </tr>
            </table>

            <div class="alert-box">
                <strong>Alert Prompt:</strong> {{ $alert->message }}
            </div>

            <p style="margin-top: 20px; font-weight: 600; color: #1e40af;">
                Action Required: Please log in to the VitalWatch dashboard to review the patient's bedside status and acknowledge or resolve this notification.
            </p>
        </div>
        <div class="footer">
            <p>VitalWatch Patient Early Warning Notification &bull; Confidential Hospital Communication</p>
            <p>Do not reply to this automated email.</p>
        </div>
    </div>
</body>
</html>

