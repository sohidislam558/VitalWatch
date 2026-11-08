<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Patient Monitoring Report - {{ $patient->patient_code }}</title>
    <style>
        @page {
            margin: 28px 30px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #1e293b;
            line-height: 1.4;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .header-title {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
            letter-spacing: -0.5px;
        }
        .header-subtitle {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .meta-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 10px 12px;
            margin-bottom: 16px;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
        }
        .meta-table td {
            padding: 3px 6px;
            vertical-align: top;
        }
        .meta-label {
            color: #64748b;
            font-weight: 600;
            width: 18%;
        }
        .meta-val {
            color: #0f172a;
            font-weight: 500;
            width: 32%;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #1e3a8a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin: 16px 0 8px 0;
            text-transform: uppercase;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 10px;
        }
        table.data-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 700;
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            text-align: left;
        }
        table.data-table td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
        }
        table.data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-urgent {
            background-color: #fee2e2;
            color: #b91c1c;
        }
        .badge-review {
            background-color: #fef3c7;
            color: #b45309;
        }
        .badge-resolved {
            background-color: #dcfce7;
            color: #15803d;
        }
        .badge-active {
            background-color: #f1f5f9;
            color: #475569;
        }
        .footer {
            margin-top: 24px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
        }
        .disclaimer {
            font-size: 9px;
            color: #64748b;
            background-color: #f1f5f9;
            padding: 6px 10px;
            border-radius: 4px;
            margin-top: 14px;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td>
                <div class="header-title">VitalWatch Hospital System</div>
                <div class="header-subtitle">Patient Vital Signs Monitoring & Early Warning Summary</div>
            </td>
            <td style="text-align: right;">
                <div style="font-size: 10px; color: #64748b;">Report Generated:</div>
                <div style="font-weight: bold; color: #0f172a;">{{ now()->format('Y-m-d H:i:s') }}</div>
                <div style="font-size: 9px; color: #64748b;">Ref: VW-REP-{{ $patient->id }}-{{ time() }}</div>
            </td>
        </tr>
    </table>

    <div class="meta-box">
        <table class="meta-table">
            <tr>
                <td class="meta-label">Patient Code:</td>
                <td class="meta-val"><strong>{{ $patient->patient_code }}</strong></td>
                <td class="meta-label">Current Ward:</td>
                <td class="meta-val">{{ $patient->activeAdmission?->ward ?? 'Discharged / None' }}</td>
            </tr>
            <tr>
                <td class="meta-label">Patient Name:</td>
                <td class="meta-val">{{ $patient->name }}</td>
                <td class="meta-label">Bed Number:</td>
                <td class="meta-val">{{ $patient->activeAdmission?->bed_number ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="meta-label">Date of Birth:</td>
                <td class="meta-val">{{ $patient->date_of_birth?->format('Y-m-d') }} ({{ $patient->date_of_birth ? $patient->date_of_birth->age : 'N/A' }} yrs)</td>
                <td class="meta-label">Admitted Date:</td>
                <td class="meta-val">{{ $patient->activeAdmission?->admitted_at?->format('Y-m-d H:i') ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="meta-label">Gender:</td>
                <td class="meta-val">{{ ucfirst($patient->gender) }}</td>
                <td class="meta-label">Admission Status:</td>
                <td class="meta-val">{{ ucfirst($patient->activeAdmission?->status ?? 'Discharged') }}</td>
            </tr>
        </table>
    </div>

    <div class="section-title">1. Vital Signs Measurement History</div>
    @if($vitalRecords->isEmpty())
        <p style="color: #64748b; font-style: italic;">No vital signs recorded for the selected period.</p>
    @else
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 17%;">Date & Time</th>
                    <th style="width: 11%;">HR (bpm)</th>
                    <th style="width: 14%;">BP (mmHg)</th>
                    <th style="width: 11%;">SpO2 (%)</th>
                    <th style="width: 11%;">Temp (°C)</th>
                    <th style="width: 11%;">RR (/min)</th>
                    <th style="width: 25%;">Recorded By</th>
                </tr>
            </thead>
            <tbody>
                @foreach($vitalRecords as $record)
                <tr>
                    <td>{{ $record->measured_at?->format('Y-m-d H:i') }}</td>
                    <td><strong>{{ number_format($record->heart_rate, 1) }}</strong></td>
                    <td>{{ number_format($record->systolic_bp, 0) }}/{{ number_format($record->diastolic_bp, 0) }}</td>
                    <td>{{ number_format($record->spo2, 1) }}%</td>
                    <td>{{ number_format($record->temperature, 1) }}°C</td>
                    <td>{{ number_format($record->respiratory_rate, 1) }}</td>
                    <td>{{ $record->recorder?->name ?? 'Staff' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="section-title">2. Early Warning Alert History</div>
    @if($alerts->isEmpty())
        <p style="color: #64748b; font-style: italic;">No early warning alerts triggered during this period.</p>
    @else
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 16%;">Triggered At</th>
                    <th style="width: 12%;">Priority</th>
                    <th style="width: 12%;">Status</th>
                    <th style="width: 35%;">Alert Prompt Message</th>
                    <th style="width: 25%;">Triage Notes / Staff</th>
                </tr>
            </thead>
            <tbody>
                @foreach($alerts as $alert)
                <tr>
                    <td>{{ $alert->created_at?->format('Y-m-d H:i') }}</td>
                    <td>
                        <span class="badge {{ $alert->priority === 'urgent' ? 'badge-urgent' : 'badge-review' }}">
                            {{ strtoupper($alert->priority) }}
                        </span>
                    </td>
                    <td>
                        <span class="badge {{ $alert->status === 'resolved' ? 'badge-resolved' : 'badge-active' }}">
                            {{ ucfirst($alert->status) }}
                        </span>
                    </td>
                    <td>{{ $alert->message }}</td>
                    <td>
                        @if($alert->acknowledgements->isNotEmpty())
                            @foreach($alert->acknowledgements as $ack)
                                <div><strong>{{ $ack->user?->name }}:</strong> {{ $ack->note ?? 'Acknowledged' }}</div>
                            @endforeach
                        @else
                            <span style="color: #94a3b8;">Pending triage</span>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @endif



    <div class="footer">
        VitalWatch Hospital Information System &bull; Confidential Patient Healthcare Record &bull; Page 1 of 1
    </div>
</body>
</html>

