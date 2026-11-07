import React, { useState, useEffect, useCallback } from 'react';
import { vitalService } from '../../services/vitalService';
import { usePagination } from '../../hooks/usePagination';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import VitalHistoryTable from '../../components/vitals/VitalHistoryTable';
import DateRangePicker from '../../components/common/DateRangePicker';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VitalHistory() {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const { page, perPage, totalPages, totalItems, setPage, updatePaginationData } = usePagination(1, 15);

  const fetchVitals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vitalService.getVitals({
        start_date: startDate ? `${startDate} 00:00:00` : undefined,
        end_date: endDate ? `${endDate} 23:59:59` : undefined,
        page,
        per_page: perPage,
      });
      setVitals(res.data?.data || []);
      updatePaginationData(res.data);
    } catch {
      toast.error('Failed to load vital records.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page, perPage]);

  useEffect(() => {
    fetchVitals();
  }, [fetchVitals]);

  return (
    <PageContainer>
      <PageHeader
        title="Hospital Vital Signs Observation Logs"
        subtitle="Immutable chronological audit trail of all bedside measurements"
        actions={
          <Button size="sm" variant="outline" icon={RefreshCw} onClick={fetchVitals}>
            Refresh Logs
          </Button>
        }
      />

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
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
        </div>

        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setPage(1);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            Clear Date Filters
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving chronological vital measurements..." />
      ) : (
        <VitalHistoryTable vitals={vitals} />
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

