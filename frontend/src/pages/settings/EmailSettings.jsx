import React from 'react';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import { Mail, CheckCircle2, ShieldCheck, Terminal } from 'lucide-react';

export default function EmailSettings() {
  return (
    <PageContainer>
      <PageHeader
        title="Email Notification Settings"
        subtitle="SMTP early warning notification parameters and local test worker instructions"
      />

      <div className="space-y-6 max-w-4xl">
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">SMTP Notification Pipeline Status</h3>
              <p className="text-xs text-slate-500">Configured via Laravel backend .env environment parameters</p>
            </div>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-slate-700">
            <p>
              When a vital sign record breaches an active early warning threshold rule, VitalWatch dispatches an alert notification to hospital physicians and administrators.
            </p>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Resilient Non-Blocking Delivery Architecture
              </h4>
              <p className="text-slate-600">
                Email sending runs with non-blocking error interception. If local SMTP credentials are not configured or connection fails, the error is recorded to the <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">email_logs</code> database table with status <code className="text-red-700 bg-red-50 px-1 rounded">failed</code>.
                <strong> The patient's vital records and generated alerts are always safely preserved.</strong>
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600" />
                Local Development SMTP Options (Optional)
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>
                  <strong>Mailtrap:</strong> Free online fake SMTP sandbox for testing. Update <code className="bg-slate-100 px-1 rounded font-mono">MAIL_HOST=sandbox.smtp.mailtrap.io</code> in <code className="bg-slate-100 px-1 rounded font-mono">backend/.env</code>.
                </li>
                <li>
                  <strong>Mailpit / MailHog:</strong> Lightweight local fake email capture server running on port 1025.
                </li>
                <li>
                  <strong>Log Driver:</strong> Set <code className="bg-slate-100 px-1 rounded font-mono">MAIL_MAILER=log</code> in <code className="bg-slate-100 px-1 rounded font-mono">backend/.env</code> to write outgoing alert emails directly to <code className="bg-slate-100 px-1 rounded font-mono">backend/storage/logs/laravel.log</code>.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

