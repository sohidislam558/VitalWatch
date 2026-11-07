<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VitalWatch API Gateway — Hospital Early Warning System</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%232563EB'/><path d='M20 52 L35 52 L42 32 L50 68 L58 42 L65 52 L80 52' stroke='%23FFFFFF' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></svg>">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .container {
            max-width: 820px;
            width: 100%;
            background: #1e293b;
            border-radius: 16px;
            border: 1px solid #334155;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
        }
        .header {
            padding: 32px;
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            border-bottom: 1px solid #2563eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
        }
        .header-title h1 {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .header-title p {
            color: #bfdbfe;
            font-size: 13px;
            margin-top: 4px;
        }
        .live-badge {
            background-color: #10b981;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 6px 12px;
            border-radius: 9999px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .live-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #ffffff;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
        }
        .content {
            padding: 32px;
        }
        .hero-banner {
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 20px;
        }
        .hero-banner-text h2 {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 6px;
        }
        .hero-banner-text p {
            font-size: 13px;
            color: #94a3b8;
            max-width: 480px;
            line-height: 1.5;
        }
        .btn-portal {
            background-color: #2563eb;
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4);
            transition: all 0.2s ease;
        }
        .btn-portal:hover {
            background-color: #1d4ed8;
            transform: translateY(-1px);
        }
        .grid-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .stat-card {
            background: #0f172a;
            border: 1px solid #334155;
            padding: 16px;
            border-radius: 8px;
        }
        .stat-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: #94a3b8;
            margin-bottom: 6px;
        }
        .stat-val {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
        }
        .creds-box {
            background: #1e293b;
            border: 1px dashed #475569;
            border-radius: 8px;
            padding: 18px;
            margin-bottom: 20px;
        }
        .creds-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: #38bdf8;
            margin-bottom: 12px;
        }
        .creds-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px;
            font-size: 12px;
        }
        .cred-item {
            background: #0f172a;
            padding: 10px 14px;
            border-radius: 6px;
            border: 1px solid #334155;
        }
        .cred-role {
            font-weight: 700;
            color: #93c5fd;
        }
        .cred-email {
            font-family: monospace;
            color: #e2e8f0;
            margin-top: 2px;
        }
        .footer {
            border-top: 1px solid #334155;
            padding: 16px 32px;
            background: #0f172a;
            font-size: 11px;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
        }
        .footer a {
            color: #38bdf8;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-title">
                <h1>
                    <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
                        <rect width="100" height="100" rx="20" fill="#FFFFFF"/>
                        <path d="M20 52 L35 52 L42 32 L50 68 L58 42 L65 52 L80 52" stroke="#1E40AF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    VitalWatch REST API Gateway
                </h1>
                <p>A Web-Based Hospital Patient Vital Signs Monitoring and Early Warning System</p>
            </div>
            <div class="live-badge">
                <span class="live-dot"></span>
                API Server Active
            </div>
        </div>

        <div class="content">
            <!-- Primary Action Banner -->
            <div class="hero-banner">
                <div class="hero-banner-text">
                    <h2>Looking for the Hospital Web Application?</h2>
                    <p>
                        The interactive React frontend runs on port <strong>5173</strong>. Click the button below to launch the clinical monitoring portal.
                    </p>
                    <div style="margin-top: 8px; font-size: 11px; color: #64748b;">
                        Direct links: <a href="http://localhost:5173" style="color: #60a5fa;">http://localhost:5173</a> &bull; <a href="http://127.0.0.1:5173" style="color: #60a5fa;">http://127.0.0.1:5173</a>
                    </div>
                </div>
                <a id="portal-btn" href="http://localhost:5173" class="btn-portal" target="_blank" rel="noopener noreferrer">
                    Open Hospital Portal &rarr;
                </a>
                <script>
                    (function() {
                        var btn = document.getElementById('portal-btn');
                        if (btn) {
                            var host = window.location.hostname || 'localhost';
                            btn.href = window.location.protocol + '//' + host + ':5173';
                        }
                    })();
                </script>
            </div>

            <!-- Health Status -->
            <div class="grid-stats">
                <div class="stat-card">
                    <div class="stat-label">Database Connection</div>
                    <div class="stat-val" style="color: #34d399;">Connected</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">MySQL vitalwatch_db</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Admitted Inpatients</div>
                    <div class="stat-val">{{ \App\Models\Admission::where('status', 'admitted')->count() }}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Active in wards</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Early Warning Alerts</div>
                    <div class="stat-val" style="color: #f87171;">{{ \App\Models\Alert::where('status', 'active')->count() }}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Pending clinical triage</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Alert Engine Rules</div>
                    <div class="stat-val">{{ \App\Models\AlertRule::where('is_active', true)->count() }}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Configured & active</div>
                </div>
            </div>

            <!-- Demonstration Credentials -->
            <div class="creds-box">
                <div class="creds-title">Default Demonstration Login Accounts (Password: <code>password</code>)</div>
                <div class="creds-grid">
                    <div class="cred-item">
                        <div class="cred-role">Administrator</div>
                        <div class="cred-email">admin@vitalwatch.hospital</div>
                    </div>
                    <div class="cred-item">
                        <div class="cred-role">Attending Physician (Doctor)</div>
                        <div class="cred-email">doctor.sarah@vitalwatch.hospital</div>
                    </div>
                    <div class="cred-item">
                        <div class="cred-role">Floor / Ward Nurse</div>
                        <div class="cred-email">nurse.john@vitalwatch.hospital</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <span>VitalWatch Academic Software Prototype &bull; DEMONSTRATION ONLY</span>
            <span>REST Endpoints: <a href="/api/dashboard/summary">/api/dashboard/summary</a> | <a href="/api/alert-rules">/api/alert-rules</a></span>
        </div>
    </div>
</body>
</html>
