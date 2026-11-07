import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Activity,
  HeartHandshake,
  Stethoscope,
  ShieldCheck,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Mail,
  Clock,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (email) => {
    try {
      await login({ email, password: 'password' });
      toast.success(`Signed in as ${email}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Quick login failed. Please sign in manually.');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">VitalWatch</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-full">
                Hospital Telemetry
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all shadow-blue-600/20 flex items-center gap-1.5"
            >
              <span>Staff Registration</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-white via-blue-50/30 to-slate-50 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Web-Based Patient Vital Signs Monitoring & Early Warning Support</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Real-Time Patient Vitals &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
              Instant Clinical Action
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A purpose-engineered hospital system linking bedside nurses, attending physicians, and hospital administration with plain-English situation monitoring, emergency alerts, and automated recovery.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <span>Open Hospital Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Staff Registration</span>
            </Link>
          </div>

          {/* Clinical Security Notice */}
          <div className="mt-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure Hospital Role-Based Authentication & Verified Staff Registry</span>
          </div>
        </div>
      </section>

      {/* 3 User Roles Architecture Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Role-Tailored Architecture</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Three Distinct Hospital Portals. Zero Clinical Confusion.
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Every staff member gets a streamlined workspace designed strictly for their clinical responsibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Nurse */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-50/40 to-white border border-blue-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-md shadow-blue-500/20">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Role 1</div>
                <h4 className="text-lg font-bold text-slate-900">Registered Nurse / Caregiver</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Dedicated bedside data-entry station with zero administrative clutter:
                </p>
                <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Input Vitals:</strong> Fast recording of HR, BP, SpO2, Temperature, and Respiration.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Situation Monitor:</strong> Instantly read plain-English patient descriptions (e.g. "Normal & Stable").</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Auto-Resolution:</strong> Entering normalized vitals clears active alarms automatically.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                  Bedside Vitals Entry & Situation Telemetry <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Card 2: Doctor */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-cyan-50/40 to-white border border-cyan-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center mb-4 shadow-md shadow-cyan-500/20">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 mb-1">Role 2</div>
                <h4 className="text-lg font-bold text-slate-900">Registered Doctor / Physician</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  High-priority situation telemetry & bedside emergency action:
                </p>
                <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Read-Only Vitals:</strong> Clean telemetry and historical charts without data-entry inputs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Gmail SMTP Emergency Alerts:</strong> Critical threshold alarms dispatched immediately to physician email.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Doctor in Action:</strong> 1-click attendance button confirming doctor is attending patient bedside.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-cyan-600 flex items-center gap-1">
                  Emergency Attendance & Trend Analysis <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Card 3: Admin */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-100/60 to-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4 shadow-md shadow-slate-900/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Role 3</div>
                <h4 className="text-lg font-bold text-slate-900">Hospital Administrator</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Full hospital operations governance & live staff activity stream:
                </p>
                <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-900 flex-shrink-0 mt-0.5" />
                    <span><strong>Live Activity Feed:</strong> Chronological audit of every nurse vital entry & doctor action.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-900 flex-shrink-0 mt-0.5" />
                    <span><strong>Threshold Rule Control:</strong> Calibrate min/max vital alarm trigger limits hospital-wide.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-900 flex-shrink-0 mt-0.5" />
                    <span><strong>Staff & Patient Governance:</strong> Manage users, hospital admissions, and PDF reports.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                  Live Activity Audit & Hospital Governance <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Situation Monitor Feature Preview */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Plain-English Clinical Clarity</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              The VitalWatch Situation Monitor
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Every patient card transforms raw clinical telemetry into plain, human-readable status so staff can react without hesitation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stable */}
            <div className="bg-white p-4 rounded-xl border-2 border-emerald-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Bed 104 • John Doe</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                  Stable
                </span>
              </div>
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200/50 mb-2">
                Normal & Stable: All recorded vitals are within normal clinical thresholds.
              </div>
              <div className="text-[11px] text-slate-500 space-y-1">
                <div>HR: <strong>72 bpm</strong> • BP: <strong>120/80</strong></div>
                <div>SpO2: <strong>98%</strong> • Temp: <strong>36.8°C</strong></div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-white p-4 rounded-xl border-2 border-amber-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Bed 208 • Sarah Connor</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                  Attention
                </span>
              </div>
              <div className="text-xs font-semibold text-amber-700 bg-amber-50 p-2 rounded border border-amber-200/50 mb-2">
                Attention Needed: Moderate Tachycardia (HR 108 bpm). Monitor bedside.
              </div>
              <div className="text-[11px] text-slate-500 space-y-1">
                <div>HR: <strong className="text-amber-600">108 bpm</strong> • BP: <strong>125/84</strong></div>
                <div>SpO2: <strong>96%</strong> • Temp: <strong>37.2°C</strong></div>
              </div>
            </div>

            {/* Emergency */}
            <div className="bg-white p-4 rounded-xl border-2 border-red-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Bed 301 • Robert Smith</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-800 animate-pulse">
                  Emergency
                </span>
              </div>
              <div className="text-xs font-semibold text-red-700 bg-red-50 p-2 rounded border border-red-200/50 mb-2">
                CRITICAL: Severe Hypoxemia (SpO2 86%). Attending doctor notified via Gmail SMTP!
              </div>
              <div className="text-[11px] text-slate-500 space-y-1">
                <div>HR: <strong>118 bpm</strong> • BP: <strong>140/92</strong></div>
                <div>SpO2: <strong className="text-red-600">86%</strong> • Temp: <strong>37.9°C</strong></div>
              </div>
            </div>

            {/* Doctor in Action */}
            <div className="bg-white p-4 rounded-xl border-2 border-blue-300 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Bed 112 • Emily Davis</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 font-mono">
                  In Action
                </span>
              </div>
              <div className="text-xs font-semibold text-blue-800 bg-blue-50 p-2 rounded border border-blue-200/50 mb-2">
                Doctor in Action: Dr. Sarah is actively attending bedside. Awaiting follow-up vitals.
              </div>
              <div className="text-[11px] text-slate-500 space-y-1">
                <div>HR: <strong>124 bpm</strong> • BP: <strong>155/95</strong></div>
                <div>SpO2: <strong>91%</strong> • Follow-up pending</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-white font-bold text-sm">VitalWatch</span>
                <span className="text-xs text-slate-400 ml-2">Hospital Early Warning Support System</span>
              </div>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-4">
              <Link to="/login" className="hover:text-white transition-colors">Portal Login</Link>
              <Link to="/register" className="hover:text-white transition-colors">Staff Registration</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
            
          </div>
        </div>
      </footer>
    </div>
  );
}

