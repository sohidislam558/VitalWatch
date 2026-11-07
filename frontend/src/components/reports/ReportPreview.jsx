import React from 'react';
import { formatDateTime, formatDate, calculateAge } from '../../utils/formatDate';
import { formatHeartRate, formatBloodPressure, formatSpO2, formatTemperature, formatRespiratoryRate } from '../../utils/formatVitals';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import { Printer, Download, Activity, ShieldCheck } from 'lucide-react';

export default function ReportPreview({
  data,
  onDownloadPdf,
  downloadLoading = false,
}) {
  if (!data || !data.patient) return null;

  const { patient, vitalRecords = [], alerts = [] } = data;

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="no-print flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Hospital Patient Monitoring Report</h4>
          <p className="text-xs text-slate-500">Official printable clinical summary</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Printer} onClick={handleBrowserPrint}>
            Print Page
          </Button>
          <Button size="sm" icon={Download} onClick={onDownloadPdf} loading={downloadLoading}>
            Download PDF Report
          </Button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white p-8 sm:p-12 rounded-lg border border-slate-200 shadow-sm text-slate-900 printable-document">
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

        {/* Clinical Disclaimer */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-start gap-3 bg-slate-50 p-3 rounded text-[11px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <p>
            <strong>CLINICAL SAFETY NOTICE:</strong> DEMONSTRATION ONLY — NOT CLINICALLY VALIDATED. VitalWatch is an academic software decision-support prototype. It does not replace independent human clinical judgment or treatment guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}

