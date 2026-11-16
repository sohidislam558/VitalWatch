import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { vitalService } from '../../services/vitalService';
import { usePagination } from '../../hooks/usePagination';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import VitalHistoryTable from '../../components/vitals/VitalHistoryTable';
import DateRangePicker from '../../components/common/DateRangePicker';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { onTelemetryUpdate } from '../../utils/realtime';
import { Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VitalHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patient_id');

  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const { page, perPage, totalPages, totalItems, setPage, updatePaginationData } = usePagination(1, 15);

  const fetchVitals = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await vitalService.getVitals({
        patient_id: patientIdParam ? Number(patientIdParam) : undefined,
        start_date: startDate ? `${startDate} 00:00:00` : undefined,
        end_date: endDate ? `${endDate} 23:59:59` : undefined,
        page,
        per_page: perPage,
      });
      setVitals(res.data?.data || []);
      updatePaginationData(res.data);
    } catch {
      if (!isBackground) {
        toast.error('Failed to load vital records.');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [patientIdParam, startDate, endDate, page, perPage]);

  // Initial fetch and real-time live sync listeners
  useEffect(() => {
    fetchVitals(false);

    // Cross-tab and same-tab real-time telemetry synchronization
    const unsubscribe = onTelemetryUpdate(() => {
      fetchVitals(true);
    });

    // 12-second periodic background refresh for absolute real-time sync
    const interval = setInterval(() => {
      fetchVitals(true);
    }, 12000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchVitals]);

  const clearPatientFilter = () => {
    searchParams.delete('patient_id');
    setSearchParams(searchParams);
    setPage(1);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Vital Trend Logs"
        subtitle="Chronological telemetry & bedside vital measurements across inpatient wards"
        actions={
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Real-Time Sync</span>
          </span>
        }
      />

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-700">Filter Range:</span>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(d) => {
              setStartDate(d);
              setPage(1);
            }}
            onEndDateChange={(d) => {
              setEndDate(d);
              setPage(1);
            }}
          />

          {patientIdParam && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Filtered by Patient #{patientIdParam}</span>
              <button
                type="button"
                onClick={clearPatientFilter}
                className="ml-1 text-blue-600 hover:text-blue-900 font-bold cursor-pointer"
                title="Remove patient filter and view all patient vitals"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        {(startDate || endDate || patientIdParam) && (
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              if (patientIdParam) {
                clearPatientFilter();
              } else {
                setPage(1);
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving chronological vital measurements..." />
      ) : (
        <VitalHistoryTable vitals={vitals} showPatient={true} />
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        perPage={perPage}
        onPageChange={setPage}
      />
    </PageContainer>
  );
}

