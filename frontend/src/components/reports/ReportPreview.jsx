import React, { useState, useMemo } from 'react';
import { formatDateTime, formatDate, calculateAge } from '../../utils/formatDate';
import {
  formatHeartRate,
  formatBloodPressure,
  formatSpO2,
  formatTemperature,
  formatRespiratoryRate,
} from '../../utils/formatVitals';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import VitalChart from '../vitals/VitalChart';
import {
  Printer,
  Download,
  Activity,
  ShieldCheck,
  TrendingUp,
  ClipboardList,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Heart,
  Thermometer,
  Wind,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  User,
  Stethoscope,
} from 'lucide-react';

export default function ReportPreview({
  data,
  onDownloadPdf,
  downloadLoading = false,
}) {
  if (!data || !data.patient) return null;

  const { patient, vitalRecords = [], alerts = [] } = data;

  const [activeTab, setActiveTab] = useState('trends'); // 'trends' | 'vitals_log' | 'alarms' | 'printable'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Calculate Executive Vitals Metrics
  const kpiStats = useMemo(() => {
    if (!vitalRecords || vitalRecords.length === 0) {
      return {
        avgHR: null, minHR: null, maxHR: null,
        avgSys: null, avgDia: null, maxSys: null, maxDia: null,
        avgSpO2: null, minSpO2: null,
        avgTemp: null, maxTemp: null,
        avgRR: null,
        totalReadings: 0,
        totalAlerts: alerts.length,
        resolvedAlerts: alerts.filter(a => a.status === 'resolved' || a.status === 'auto_resolved').length,
      };
    }

    const validHR = vitalRecords.map((r) => Number(r.heart_rate)).filter((v) => !isNaN(v) && v > 0);
    const validSys = vitalRecords.map((r) => Number(r.systolic_bp)).filter((v) => !isNaN(v) && v > 0);
    const validDia = vitalRecords.map((r) => Number(r.diastolic_bp)).filter((v) => !isNaN(v) && v > 0);
    const validSpO2 = vitalRecords.map((r) => Number(r.spo2)).filter((v) => !isNaN(v) && v > 0);
    const validTemp = vitalRecords.map((r) => Number(r.temperature)).filter((v) => !isNaN(v) && v > 0);
    const validRR = vitalRecords.map((r) => Number(r.respiratory_rate)).filter((v) => !isNaN(v) && v > 0);

    const avgHR = validHR.length ? Math.round(validHR.reduce((a, b) => a + b, 0) / validHR.length) : null;
    const minHR = validHR.length ? Math.min(...validHR) : null;
    const maxHR = validHR.length ? Math.max(...validHR) : null;

    const avgSys = validSys.length ? Math.round(validSys.reduce((a, b) => a + b, 0) / validSys.length) : null;
    const avgDia = validDia.length ? Math.round(validDia.reduce((a, b) => a + b, 0) / validDia.length) : null;
    const maxSys = validSys.length ? Math.max(...validSys) : null;
    const maxDia = validDia.length ? Math.max(...validDia) : null;

    const avgSpO2 = validSpO2.length ? Math.round(validSpO2.reduce((a, b) => a + b, 0) / validSpO2.length) : null;
    const minSpO2 = validSpO2.length ? Math.min(...validSpO2) : null;

    const avgTemp = validTemp.length ? (validTemp.reduce((a, b) => a + b, 0) / validTemp.length).toFixed(1) : null;
    const maxTemp = validTemp.length ? Math.max(...validTemp).toFixed(1) : null;

    const avgRR = validRR.length ? Math.round(validRR.reduce((a, b) => a + b, 0) / validRR.length) : null;

    const resolvedAlerts = alerts.filter(
      (a) => a.status === 'resolved' || a.status === 'auto_resolved'
    ).length;

    return {
      avgHR, minHR, maxHR,
      avgSys, avgDia, maxSys, maxDia,
      avgSpO2, minSpO2,
      avgTemp, maxTemp,
      avgRR,
      totalReadings: vitalRecords.length,
      totalAlerts: alerts.length,
      resolvedAlerts,
    };
  }, [vitalRecords, alerts]);

  // Paginated records for Bedside Vitals Log tab
  const totalPages = Math.ceil(vitalRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return vitalRecords.slice(start, start + pageSize);
  }, [vitalRecords, currentPage, pageSize]);

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP ACTION & PATIENT SUMMARY BANNER (Screen Only) */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-mono font-bold">
              {patient.patient_code}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
              {patient.active_admission
                ? `${patient.active_admission.ward} • Bed ${patient.active_admission.bed_number}`
                : 'Discharged'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {patient.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {calculateAge(patient.date_of_birth)} yrs, {patient.gender} • Born {formatDate(patient.date_of_birth)} • Comprehensive Clinical Telemetry Dossier
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Button variant="outline" size="sm" icon={Printer} onClick={handleBrowserPrint}>
            Print Formal Sheet
          </Button>
          <Button size="sm" icon={Download} onClick={onDownloadPdf} loading={downloadLoading}>
            Export PDF Dossier
          </Button>
        </div>
      </div>

      {/* 2. EXECUTIVE VITALS KPI METRIC STRIP (Screen Only) */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Heart Rate KPI */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Heart Rate (Avg)
            </span>
            <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {kpiStats.avgHR ? `${kpiStats.avgHR}` : '—'}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1">bpm</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Range: {kpiStats.minHR ?? '—'} – {kpiStats.maxHR ?? '—'} bpm
          </p>
        </div>

        {/* Blood Pressure KPI */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Blood Pressure (Mean)
            </span>
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {kpiStats.avgSys && kpiStats.avgDia ? `${kpiStats.avgSys}/${kpiStats.avgDia}` : '—'}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1">mmHg</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Peak: {kpiStats.maxSys ?? '—'}/{kpiStats.maxDia ?? '—'} mmHg
          </p>
        </div>

        {/* SpO2 KPI */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Oxygenation (SpO2)
            </span>
            <div className="w-6 h-6 rounded-md bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Wind className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {kpiStats.avgSpO2 ? `${kpiStats.avgSpO2}%` : '—'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Min Recorded: {kpiStats.minSpO2 ? `${kpiStats.minSpO2}%` : '—'}
          </p>
        </div>

        {/* Temperature KPI */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Core Temp (Avg)
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Thermometer className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {kpiStats.avgTemp ? `${kpiStats.avgTemp}` : '—'}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1">°C</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Max: {kpiStats.maxTemp ? `${kpiStats.maxTemp}°C` : '—'}
          </p>
        </div>

        {/* Early Warning Alarms KPI */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Early Warning Safety
            </span>
            <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {kpiStats.totalAlerts}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1">alarms</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">
            {kpiStats.resolvedAlerts} Resolved • {kpiStats.totalReadings} Bedside Logs
          </p>
        </div>
      </div>

      {/* 3. CLINICAL DOSSIER TABS NAVIGATION (Screen Only) */}
      <div className="no-print border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('trends')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'trends'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Visual Telemetry Trends</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vitals_log')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'vitals_log'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Bedside Vitals Log ({vitalRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alarms')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'alarms'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Incident & Alarm History ({alerts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('printable')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'printable'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Hospital Printable Sheet</span>
        </button>
      </div>

      {/* 4. TAB CONTENT 1: VISUAL TRENDS (Screen Only) */}
      {activeTab === 'trends' && (
        <div className="no-print space-y-4">
          <VitalChart records={vitalRecords} />

          {/* Physiological Reference Reference Strip */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Standard Clinical Reference Norms (Adult Inpatient)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[11px]">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block">Heart Rate</span>
                <span className="font-bold text-slate-800 font-mono">60 – 100 bpm</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block">Blood Pressure</span>
                <span className="font-bold text-slate-800 font-mono">90-120 / 60-80 mmHg</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block">SpO2 (Room Air)</span>
                <span className="font-bold text-slate-800 font-mono">95 – 100%</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block">Core Temp</span>
                <span className="font-bold text-slate-800 font-mono">36.5 – 37.5 °C</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block">Respiratory Rate</span>
                <span className="font-bold text-slate-800 font-mono">12 – 20 /min</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 2: BEDSIDE VITALS LOG (Screen Only) */}
      {activeTab === 'vitals_log' && (
        <div className="no-print bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Chronological Bedside Measurements Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed telemetry log entries with soft physiological threshold highlights
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
              Total: {vitalRecords.length} records
            </span>
          </div>

          {vitalRecords.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No bedside measurements recorded for this patient yet.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-36">Measured At</th>
                      <th className="py-2.5 px-3 text-right">Heart Rate</th>
                      <th className="py-2.5 px-3 text-right">Blood Pressure</th>
                      <th className="py-2.5 px-3 text-right">SpO2</th>
                      <th className="py-2.5 px-3 text-right">Temp</th>
                      <th className="py-2.5 px-3 text-right">Resp Rate</th>
                      <th className="py-2.5 px-4 min-w-[200px]">Clinical Observations</th>
                      <th className="py-2.5 px-4 w-36">Recording Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRecords.map((r) => {
                      const hr = Number(r.heart_rate);
                      const isHrAbnormal = hr > 100 || hr < 60;
                      const sys = Number(r.systolic_bp);
                      const isBpAbnormal = sys >= 140 || sys <= 90;
                      const spo2 = Number(r.spo2);
                      const isSpo2Low = spo2 < 95;
                      const temp = Number(r.temperature);
                      const isTempHigh = temp >= 38.0;

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                            {formatDateTime(r.measured_at)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            <span
                              className={
                                isHrAbnormal
                                  ? 'px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200'
                                  : 'text-slate-800'
                              }
                            >
                              {formatHeartRate(r.heart_rate)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            <span
                              className={
                                isBpAbnormal
                                  ? 'px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                                  : 'text-slate-800'
                              }
                            >
                              {formatBloodPressure(r.systolic_bp, r.diastolic_bp)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            <span
                              className={
                                isSpo2Low
                                  ? 'px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 font-bold border border-cyan-200'
                                  : 'text-slate-800'
                              }
                            >
                              {formatSpO2(r.spo2)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            <span
                              className={
                                isTempHigh
                                  ? 'px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200'
                                  : 'text-slate-800'
                              }
                            >
                              {formatTemperature(r.temperature)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {formatRespiratoryRate(r.respiratory_rate)}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">
                            {r.clinical_notes ? (
                              <span className="italic text-slate-800">"{r.clinical_notes}"</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap font-medium">
                            {r.recorder?.name || 'Staff Member'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, vitalRecords.length)} of {vitalRecords.length} records
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                    <span className="font-bold text-slate-700 px-1">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 6. TAB CONTENT 3: CLINICAL INCIDENT & ALARM TIMELINE (Screen Only) */}
      {activeTab === 'alarms' && (
        <div className="no-print space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Telemetry Alarms Triggered</h4>
              <p className="text-xs text-slate-500 mt-1">
                All bedside vitals for this timeframe were within safe early-warning clinical thresholds.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const isResolved = alert.status === 'resolved' || alert.status === 'auto_resolved';
                return (
                  <div
                    key={alert.id}
                    className={`bg-white rounded-xl border p-4 shadow-xs transition-colors ${
                      isResolved ? 'border-slate-200' : 'border-rose-300 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={alert.priority} size="sm" />
                        <StatusBadge status={alert.status} size="sm" />
                        <span className="text-xs font-bold text-slate-800">
                          {alert.message}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDateTime(alert.created_at)}</span>
                      </span>
                    </div>

                    {/* Acknowledgements / Physician Actions */}
                    {alert.acknowledgements && alert.acknowledgements.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Clinical Interventions & Triage Actions
                        </span>
                        {alert.acknowledgements.map((ack, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2.5 text-xs"
                          >
                            <Stethoscope className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">
                                  {ack.user?.name || 'Attending Staff'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {formatDateTime(ack.created_at)}
                                </span>
                              </div>
                              <p className="text-slate-700 mt-1">
                                {ack.note || 'Acknowledged and patient evaluated at bedside.'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        Pending clinical triage or doctor bedside action.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. FORMAL HOSPITAL PRINTABLE DOCUMENT (Always printed during window.print(), shown in tab 'printable') */}
      <div
        className={`bg-white p-8 sm:p-12 rounded-xl border border-slate-200 shadow-sm text-slate-900 printable-document ${
          activeTab === 'printable' ? 'block' : 'hidden print:block'
        }`}
      >
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-blue-700 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-blue-900">VitalWatch Clinical Report</h1>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Patient Vital Signs & Early Warning Monitoring Summary
              </p>
            </div>
          </div>
          <div className="text-right text-xs">
            <p className="text-slate-500 font-medium">Generation Timestamp:</p>
            <p className="font-bold text-slate-900">{new Date().toLocaleString()}</p>
            <p className="text-[11px] text-slate-400">Ref: VW-DOC-{patient.id}-{Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        {/* Patient Demographics & Admission Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mb-6 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-slate-500 font-semibold block uppercase text-[10px]">Patient Code</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{patient.patient_code}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block uppercase text-[10px]">Full Legal Name</span>
              <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block uppercase text-[10px]">DOB / Age / Gender</span>
              <span className="font-medium text-slate-800">
                {formatDate(patient.date_of_birth)} ({calculateAge(patient.date_of_birth)} yrs, {patient.gender})
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block uppercase text-[10px]">Ward & Assigned Bed</span>
              <span className="font-bold text-blue-800">
                {patient.active_admission ? `${patient.active_admission.ward} (Bed ${patient.active_admission.bed_number})` : 'Discharged'}
              </span>
            </div>
          </div>
        </div>

        {/* Executive Vitals Overview Strip (Printable) */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-md text-xs">
          <h3 className="font-bold uppercase tracking-wider text-slate-700 text-[10px] mb-2 border-b border-slate-200 pb-1">
            Executive Physiological Metrics Summary
          </h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-slate-500 block text-[10px]">Average Heart Rate</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{kpiStats.avgHR ? `${kpiStats.avgHR} bpm` : '—'}</span>
              <span className="text-[10px] text-slate-400 block">({kpiStats.minHR || '—'} – {kpiStats.maxHR || '—'})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Mean Blood Pressure</span>
              <span className="font-bold text-slate-900 text-sm font-mono">
                {kpiStats.avgSys && kpiStats.avgDia ? `${kpiStats.avgSys}/${kpiStats.avgDia} mmHg` : '—'}
              </span>
              <span className="text-[10px] text-slate-400 block">Peak: {kpiStats.maxSys || '—'}/{kpiStats.maxDia || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Average SpO2</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{kpiStats.avgSpO2 ? `${kpiStats.avgSpO2}%` : '—'}</span>
              <span className="text-[10px] text-slate-400 block">Min: {kpiStats.minSpO2 ? `${kpiStats.minSpO2}%` : '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Total Alarms Triggered</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{kpiStats.totalAlerts}</span>
              <span className="text-[10px] text-emerald-600 block">{kpiStats.resolvedAlerts} Resolved</span>
            </div>
          </div>
        </div>

        {/* 1. Vital Signs History Table */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-2 mb-3">
            1. Bedside Physiological Measurements History ({vitalRecords.length} entries)
          </h3>

          {vitalRecords.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No vital readings recorded for this report timeframe.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs divide-y divide-slate-200 border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-left">Date & Time</th>
                    <th className="px-3 py-2 text-right">Heart Rate</th>
                    <th className="px-3 py-2 text-right">Blood Pressure</th>
                    <th className="px-3 py-2 text-right">SpO2</th>
                    <th className="px-3 py-2 text-right">Temp</th>
                    <th className="px-3 py-2 text-right">Resp Rate</th>
                    <th className="px-3 py-2 text-left">Recording Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vitalRecords.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{formatDateTime(r.measured_at)}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">{formatHeartRate(r.heart_rate)}</td>
                      <td className="px-3 py-2 text-right text-slate-800">{formatBloodPressure(r.systolic_bp, r.diastolic_bp)}</td>
                      <td className="px-3 py-2 text-right text-slate-800">{formatSpO2(r.spo2)}</td>
                      <td className="px-3 py-2 text-right text-slate-800">{formatTemperature(r.temperature)}</td>
                      <td className="px-3 py-2 text-right text-slate-800">{formatRespiratoryRate(r.respiratory_rate)}</td>
                      <td className="px-3 py-2 text-slate-600">{r.recorder?.name || 'Staff Member'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. Early Warning Alert History */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-2 mb-3">
            2. Early Warning Trigger Logs ({alerts.length} events)
          </h3>

          {alerts.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No threshold alerts triggered during this observation period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs divide-y divide-slate-200 border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-left">Triggered</th>
                    <th className="px-3 py-2 text-left">Priority</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Alert Prompt Description</th>
                    <th className="px-3 py-2 text-left">Clinical Triage Staff / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alerts.map((a) => (
                    <tr key={a.id}>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDateTime(a.created_at)}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={a.priority} size="sm" />
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={a.status} size="sm" />
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">{a.message}</td>
                      <td className="px-3 py-2 text-[11px] text-slate-600">
                        {a.acknowledgements && a.acknowledgements.length > 0 ? (
                          a.acknowledgements.map((ack, idx) => (
                            <div key={idx}>
                              <strong>{ack.user?.name}:</strong> {ack.note || 'Acknowledged'}
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Pending triage</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 3. Formal Clinical Sign-Off Section */}
        <div className="mt-12 pt-6 border-t-2 border-slate-300">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-6">
                Attending Physician Sign-Off & Verification
              </p>
              <div className="border-b border-slate-400 w-3/4 mb-1"></div>
              <p className="font-bold text-slate-900">Dr. ___________________________</p>
              <p className="text-slate-500 text-[11px]">Medical License #: ______________</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-6">
                Clinical Audit & Date
              </p>
              <div className="border-b border-slate-400 w-3/4 mb-1"></div>
              <p className="font-bold text-slate-900">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-slate-500 text-[11px]">VitalWatch Automated Audit Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
