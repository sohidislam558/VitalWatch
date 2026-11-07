import React, { useState, useEffect } from 'react';
import { patientService } from '../../services/patientService';
import { reportService } from '../../services/reportService';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import ReportPreview from '../../components/reports/ReportPreview';
import Select from '../../components/common/Select';
import DateRangePicker from '../../components/common/DateRangePicker';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { FileText, Download, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await patientService.getPatients({ per_page: 100 });
        const list = res.data?.data || [];
        setPatients(list);
        if (list.length > 0) {
          setSelectedPatientId(list[0].id);
        }
      } catch {
        toast.error('Failed to load patient roster.');
      }
    }
    loadPatients();
  }, []);

  const loadReport = async () => {
    if (!selectedPatientId) return;
    setLoading(true);
    try {
      const res = await reportService.getReportPreview(selectedPatientId, {
        start_date: startDate ? `${startDate} 00:00:00` : undefined,
        end_date: endDate ? `${endDate} 23:59:59` : undefined,
      });
      setReportData(res.data);
    } catch {
      toast.error('Failed to compile patient report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadReport();
    }
  }, [selectedPatientId, startDate, endDate]);

  const handleDownloadPdf = async () => {
    if (!selectedPatientId) return;
    setDownloadLoading(true);
    try {
      await reportService.downloadReportPdf(selectedPatientId, {
        start_date: startDate ? `${startDate} 00:00:00` : undefined,
        end_date: endDate ? `${endDate} 23:59:59` : undefined,
      });
      toast.success('Patient PDF report downloaded.');
    } catch {
      toast.error('Failed to generate PDF report.');
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="no-print">
        <PageHeader
          title="Clinical Patient Monitoring Reports"
          subtitle="Generate formal clinical summaries, printable history, and multi-page PDF documents"
        />

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Select
              label="Select Patient"
              id="report_patient"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              options={patients.map((p) => ({
                value: p.id,
                label: `${p.patient_code} — ${p.name}`,
              }))}
            />
          </div>

          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date Range
              </label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold self-end pb-2"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Compiling clinical report dataset..." />
      ) : reportData ? (
        <ReportPreview
          data={reportData}
          onDownloadPdf={handleDownloadPdf}
          downloadLoading={downloadLoading}
        />
      ) : (
        <EmptyState
          title="Select a Patient"
          description="Choose a patient from the dropdown above to preview and export monitoring data."
        />
      )}
    </PageContainer>
  );
}

