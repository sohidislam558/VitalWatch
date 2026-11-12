import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/settingsService';
import { useAuth } from '../../hooks/useAuth';
import PageContainer from '../../components/layout/PageContainer';
import SituationMonitor from '../../components/dashboard/SituationMonitor';
import { onTelemetryUpdate } from '../../utils/realtime';
import {
  ShieldCheck,
  Activity,
  HeartHandshake,
  Stethoscope,
  Users,
  Bed,
  Sliders,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Search,
  ArrowRight,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPortal() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab switch between Activity Stream and Situation Monitor
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' or 'monitor'

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [patientsRes, summaryRes, activitiesRes] = await Promise.all([
        dashboardService.getMonitoringPatients(),
        dashboardService.getSummary(),
        dashboardService.getActivities(),
      ]);

      setPatients(patientsRes.data?.data || []);
      setSummary(summaryRes.data || null);
      setActivities(activitiesRes.data || []);
    } catch {
      toast.error('Failed to load administrator telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Silent background real-time sync every 2.5s
    const interval = setInterval(() => {
      loadData(true);
    }, 2500);

    const unsubscribe = onTelemetryUpdate(() => {
      loadData(true);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [loadData]);

  // Activity Stream Filter and Search States
  const [activitySearch, setActivitySearch] = useState('');
  const [activityCategory, setActivityCategory] = useState('all');

  // Filtered activities
  const filteredActivities = activities.filter((item) => {
    // Category filter
    if (activityCategory === 'vitals') {
      if (item.action !== 'RECORD_VITALS' && item.role !== 'nurse') return false;
    } else if (activityCategory === 'doctor') {
      if (
        !item.action.startsWith('DOCTOR_') &&
        !item.action.startsWith('ALERT_') &&
        item.role !== 'doctor'
      )
        return false;
    } else if (activityCategory === 'transfers') {
      if (!item.action.includes('ICU') && !item.action.includes('STEP_DOWN')) return false;
    } else if (activityCategory === 'admissions') {
      if (
        !item.action.startsWith('PATIENT_ADMITTED') &&
        !item.action.startsWith('PATIENT_DISCHARGED') &&
        !item.action.startsWith('PATIENT_REGISTERED')
      )
        return false;
    }

    // Search query
    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase();
      const summaryMatch = item.summary?.toLowerCase().includes(q);
      const userMatch = item.user_name?.toLowerCase().includes(q);
      const actionMatch = item.action?.toLowerCase().includes(q);
      const detailsMatch = item.details && JSON.stringify(item.details).toLowerCase().includes(q);
      if (!summaryMatch && !userMatch && !actionMatch && !detailsMatch) return false;
    }

    return true;
  });

  // Group activities date-wise (Today, Yesterday, or formatted date string)
  const groupActivitiesByDate = (items) => {
    const groups = {};
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    items.forEach((item) => {
      const itemDate = new Date(item.created_at);
      const itemDayStr = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).toDateString();

      let title = '';
      if (itemDayStr === todayStr) {
        title = `Today — ${itemDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else if (itemDayStr === yesterdayStr) {
        title = `Yesterday — ${itemDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else {
        title = itemDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      }

      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(item);
    });

    return groups;
  };

  const groupedActivities = groupActivitiesByDate(filteredActivities);

  // Render clean human-readable details without raw JSON stringification
  const renderActivityDetails = (item) => {
    const details = item.details;
    if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
      return null;
    }

    // 1. Bedside Vital Signs Recording
    if (item.action === 'RECORD_VITALS') {
      return (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
          {details.heart_rate != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-100">
              <span>❤️ HR: {details.heart_rate} bpm</span>
            </span>
          )}
          {details.systolic_bp != null && details.diastolic_bp != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              <span>🩸 BP: {details.systolic_bp}/{details.diastolic_bp} mmHg</span>
            </span>
          )}
          {details.spo2 != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 font-semibold border border-cyan-100">
              <span>🫁 SpO2: {details.spo2}%</span>
            </span>
          )}
          {details.temperature != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-100">
              <span>🌡️ Temp: {details.temperature}°C</span>
            </span>
          )}
          {details.respiratory_rate != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
              <span>🌬️ RR: {details.respiratory_rate}/min</span>
            </span>
          )}
          {details.clinical_notes && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 italic border border-slate-200">
              <span>📝 Note: "{details.clinical_notes}"</span>
            </span>
          )}
        </div>
      );
    }

    // 2. Emergency ICU Transfer Requested
    if (item.action === 'EMERGENCY_ICU_TRANSFER_REQUESTED') {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200">
            🚨 Target: {details.target_ward || 'ICU'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
            From: {details.current_ward} • Bed {details.current_bed}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
            Dr. {details.requester_name || item.user_name}
          </span>
          {details.notes && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 italic border border-amber-200">
              "{details.notes}"
            </span>
          )}
        </div>
      );
    }

    // 3. Patient Transferred to ICU
    if (item.action === 'PATIENT_TRANSFERRED_TO_ICU') {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
            🚑 Transferred to ICU
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
            {details.from_ward} ({details.from_bed}) ➔ {details.to_ward} ({details.to_bed})
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
            Completed by: {details.transferred_by || item.user_name}
          </span>
        </div>
      );
    }

    // 4. Ward Step-Down Requested
    if (item.action === 'STEP_DOWN_REQUESTED') {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold border border-teal-200">
            🏥 Target: {details.target_ward || 'General Medical Ward'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
            Current: {details.current_ward} • Bed {details.current_bed}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
            Dr. {details.requester_name || item.user_name}
          </span>
          {details.notes && (
            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 italic border border-teal-200">
              "{details.notes}"
            </span>
          )}
        </div>
      );
    }

    // 5. Patient Stepped Down to General Ward
    if (item.action === 'PATIENT_STEPPED_DOWN') {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold border border-teal-200">
            🏥 Stepped Down to General Ward
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
            {details.from_ward} ({details.from_bed}) ➔ {details.to_ward} ({details.to_bed})
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
            Allocated by: {details.transferred_by || item.user_name}
          </span>
        </div>
      );
    }

    // 6. Doctor in Action
    if (item.action === 'DOCTOR_IN_ACTION') {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
            🩺 Bedside Attendance: Dr. {item.user_name}
          </span>
          {details.message && (
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium border border-rose-100">
              🚨 {details.message}
            </span>
          )}
          {details.notes && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 italic border border-slate-200">
              "{details.notes}"
            </span>
          )}
        </div>
      );
    }

    // 7. Alert Resolved or Auto Resolved
    if (item.action.startsWith('ALERT_RESOLVED') || item.action.startsWith('ALERT_AUTO_RESOLVED')) {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
            ✅ Alarm Resolved
          </span>
          {details.rule && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Rule: {details.rule}
            </span>
          )}
        </div>
      );
    }

    // 8. Patient Admitted
    if (item.action === 'PATIENT_ADMITTED') {
      return (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100">
            Ward: {details.ward} • Bed {details.bed_number}
          </span>
          {details.diagnosis && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Diagnosis: {details.diagnosis}
            </span>
          )}
        </div>
      );
    }

    // 9. Generic clean key-value tags (No raw JSON dump!)
    const ignoredKeys = ['patient_id', 'requester_id', 'actor_id', 'user_id', 'id'];
    const entries = Object.entries(details).filter(
      ([k, v]) => !ignoredKeys.includes(k) && v !== null && v !== undefined && typeof v !== 'object'
    );

    if (entries.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
        {entries.map(([key, val]) => (
          <span
            key={key}
            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200"
          >
            <span className="font-semibold text-slate-700 capitalize">{key.replace(/_/g, ' ')}:</span> {String(val)}
          </span>
        ))}
      </div>
    );
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Hospital Administration & Clinical Governance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome, <span className="font-semibold text-slate-700">{user?.name}</span> (Administrator) • Live Activity Stream & System Controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Real-Time Sync</span>
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Admitted Patients</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary?.total_admitted_patients ?? patients.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs">
          <div className="text-[11px] font-semibold text-red-600 uppercase">Active Alarms</div>
          <div className="text-2xl font-extrabold text-red-700 mt-1">
            {summary?.active_alerts_count ?? 0}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Monitored Wards</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary?.active_wards_count ?? 4}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Vitals Recorded (24h)</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {summary?.vitals_recorded_24h ?? patients.length * 2}
          </div>
        </div>
      </div>

      {/* Admin Quick Control Shortcuts */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Hospital Governance Shortcuts
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            to="/users"
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Staff Accounts</div>
              <div className="text-[10px] text-slate-500">Doctors & Nurses</div>
            </div>
          </Link>

          <Link
            to="/settings/rules"
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Threshold Rules</div>
              <div className="text-[10px] text-slate-500">Early Warning Bounds</div>
            </div>
          </Link>

          <Link
            to="/patients"
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Bed className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Patient Directory</div>
              <div className="text-[10px] text-slate-500">Manage Patients & Records</div>
            </div>
          </Link>

          <Link
            to="/reports"
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Clinical Reports</div>
              <div className="text-[10px] text-slate-500">PDF Telemetry Export</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Tabs: Live Activity Feed vs Situation Monitor */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'activity'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Hospital Activity Stream ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('monitor')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'monitor'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Patient Situation Monitor ({patients.length})</span>
        </button>
      </div>

      {/* TAB 1: LIVE ACTIVITY STREAM (Organized & Date-Wise Formation) */}
      {activeTab === 'activity' && (
        <div className="space-y-5">
          {/* Top Info Banner */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Real-Time Clinical Activity Audit Log
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Organized date-wise stream tracking nurse vital entries, physician bedside interventions, ICU escalations, and ward step-down de-escalations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 text-[11px] font-mono border border-white/10">
                {activities.length} Total Events
              </span>
            </div>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Search audit events by staff, patient, or notes..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-slate-50/50"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setActivityCategory('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activityCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({activities.length})
              </button>
              <button
                type="button"
                onClick={() => setActivityCategory('vitals')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activityCategory === 'vitals'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Nurse Vitals ({activities.filter((a) => a.action === 'RECORD_VITALS' || a.role === 'nurse').length})
              </button>
              <button
                type="button"
                onClick={() => setActivityCategory('doctor')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activityCategory === 'doctor'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                }`}
              >
                Physician Bedside ({activities.filter((a) => a.action.startsWith('DOCTOR_') || a.action.startsWith('ALERT_') || a.role === 'doctor').length})
              </button>
              <button
                type="button"
                onClick={() => setActivityCategory('transfers')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activityCategory === 'transfers'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Transfers ({activities.filter((a) => a.action.includes('ICU') || a.action.includes('STEP_DOWN')).length})
              </button>
              <button
                type="button"
                onClick={() => setActivityCategory('admissions')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activityCategory === 'admissions'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Admissions ({activities.filter((a) => a.action.startsWith('PATIENT_ADMITTED') || a.action.startsWith('PATIENT_DISCHARGED') || a.action.startsWith('PATIENT_REGISTERED')).length})
              </button>
            </div>
          </div>

          {/* Date-Wise Grouped Activity List */}
          {Object.keys(groupedActivities).length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
              <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Activity Events Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                No logs match your current filter or search criteria. Try selecting "All" or clearing the search box.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([dateTitle, items]) => (
                <div key={dateTitle} className="space-y-3">
                  {/* Date Section Header */}
                  <div className="flex items-center gap-2.5 px-1 pt-1">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                      {dateTitle}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold">
                      {items.length} {items.length === 1 ? 'record' : 'records'}
                    </span>
                    <div className="flex-1 h-px bg-slate-200 ml-2" />
                  </div>

                  {/* Date Items Card */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
                    {items.map((item) => {
                      const isNurseAction = item.role === 'nurse' || item.action === 'RECORD_VITALS';
                      const isDoctorAction = item.role === 'doctor' || item.action === 'DOCTOR_IN_ACTION' || item.action === 'ALERT_RESOLVED';
                      const isIcuTransfer = item.action.includes('ICU');
                      const isStepDown = item.action.includes('STEP_DOWN');
                      const isAutoResolved = item.action === 'ALERT_AUTO_RESOLVED_BY_NEW_VITALS';
                      const isAlertGenerated = item.action === 'ALERT_GENERATED';

                      // Badge background & icon styling
                      let iconBg = 'bg-slate-100 text-slate-700';
                      let icon = <Activity className="w-4 h-4" />;

                      if (isStepDown) {
                        iconBg = 'bg-teal-100 text-teal-800';
                        icon = <Bed className="w-4 h-4" />;
                      } else if (isIcuTransfer) {
                        iconBg = 'bg-rose-100 text-rose-800';
                        icon = <Bed className="w-4 h-4" />;
                      } else if (isDoctorAction) {
                        iconBg = 'bg-cyan-100 text-cyan-800';
                        icon = <Stethoscope className="w-4 h-4" />;
                      } else if (isNurseAction) {
                        iconBg = 'bg-blue-100 text-blue-800';
                        icon = <HeartHandshake className="w-4 h-4" />;
                      } else if (isAutoResolved) {
                        iconBg = 'bg-emerald-100 text-emerald-800';
                        icon = <CheckCircle2 className="w-4 h-4" />;
                      } else if (isAlertGenerated) {
                        iconBg = 'bg-red-100 text-red-800';
                        icon = <AlertTriangle className="w-4 h-4" />;
                      }

                      return (
                        <div
                          key={item.id}
                          className="p-4 hover:bg-slate-50/80 transition-colors flex items-start gap-3.5"
                        >
                          {/* Action Icon */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${iconBg}`}>
                            {icon}
                          </div>

                          {/* Details Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 leading-tight">
                                {item.summary}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider ${
                                  item.role === 'nurse'
                                    ? 'bg-blue-100 text-blue-800'
                                    : item.role === 'doctor'
                                    ? 'bg-cyan-100 text-cyan-800'
                                    : item.role === 'admin'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.role}
                              </span>
                            </div>

                            {/* Human-readable detail tags (ZERO raw JSON) */}
                            {renderActivityDetails(item)}
                          </div>

                          {/* Time */}
                          <div className="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1 font-mono flex-shrink-0 self-start mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(item.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SITUATION MONITOR */}
      {activeTab === 'monitor' && (
        <SituationMonitor
          patients={patients}
          loading={loading}
          onRefresh={() => loadData(true)}
        />
      )}
    </PageContainer>
  );
}

