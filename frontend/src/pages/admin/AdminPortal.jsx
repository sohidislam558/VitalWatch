import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/settingsService';
import { useAuth } from '../../hooks/useAuth';
import PageContainer from '../../components/layout/PageContainer';
import SituationMonitor from '../../components/dashboard/SituationMonitor';
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
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
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
  }, [loadData]);

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

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
          <span>{refreshing ? 'Refreshing Feed...' : 'Refresh Activity Feed'}</span>
        </button>
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
              <div className="text-[10px] text-slate-500">Admissions & Wards</div>
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

      {/* TAB 1: LIVE ACTIVITY STREAM (Tracks nurse vitals & doctor actions) */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Real-Time Clinical Activity Log
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chronological audit of all vital recordings by nurses and bedside actions by attending doctors.
                </p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Auto-Audited
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No activity records logged yet.
              </div>
            ) : (
              activities.map((item) => {
                const isNurseAction = item.role === 'nurse' || item.action === 'RECORD_VITALS';
                const isDoctorAction = item.role === 'doctor' || item.action === 'DOCTOR_IN_ACTION' || item.action === 'ALERT_RESOLVED';
                const isAutoResolved = item.action === 'ALERT_AUTO_RESOLVED_BY_NEW_VITALS';
                const isAlertGenerated = item.action === 'ALERT_GENERATED';

                return (
                  <div key={item.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-start gap-3">
                    {/* Action Icon Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isDoctorAction
                          ? 'bg-cyan-100 text-cyan-700'
                          : isNurseAction
                          ? 'bg-blue-100 text-blue-700'
                          : isAutoResolved
                          ? 'bg-emerald-100 text-emerald-700'
                          : isAlertGenerated
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isDoctorAction && <Stethoscope className="w-4 h-4" />}
                      {isNurseAction && <HeartHandshake className="w-4 h-4" />}
                      {isAutoResolved && <CheckCircle2 className="w-4 h-4" />}
                      {isAlertGenerated && <AlertTriangle className="w-4 h-4" />}
                      {!isDoctorAction && !isNurseAction && !isAutoResolved && !isAlertGenerated && (
                        <Activity className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{item.summary}</span>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                            item.role === 'nurse'
                              ? 'bg-blue-100 text-blue-800'
                              : item.role === 'doctor'
                              ? 'bg-cyan-100 text-cyan-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.role}
                        </span>
                      </div>

                      {item.details && Object.keys(item.details).length > 0 && (
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                          {JSON.stringify(item.details)}
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div className="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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

