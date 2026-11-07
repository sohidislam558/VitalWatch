import React, { useState, useEffect, useCallback } from 'react';
import { alertService } from '../../services/alertService';
import { usePagination } from '../../hooks/usePagination';
import { useNotification } from '../../context/NotificationContext';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import AlertTable from '../../components/alerts/AlertTable';
import AlertAcknowledgeModal from '../../components/alerts/AlertAcknowledgeModal';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import { RefreshCw, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Alerts() {
  const { refreshAlerts } = useNotification();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // default show active

  // Pagination
  const { page, perPage, totalPages, totalItems, setPage, updatePaginationData } = usePagination(1, 15);

  // Triage modal
  const [targetAlert, setTargetAlert] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await alertService.getAlerts({
        priority: priorityFilter || undefined,
        status: statusFilter || undefined,
        page,
        per_page: perPage,
      });
      setAlerts(res.data?.data || []);
      updatePaginationData(res.data);
    } catch {
      toast.error('Failed to load alert registry.');
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, statusFilter, page, perPage]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAcknowledge = async (alertId, note) => {
    setTriageLoading(true);
    try {
      await alertService.acknowledgeAlert(alertId, note);
      toast.success('Alert acknowledged by staff.');
      setTargetAlert(null);
      fetchAlerts();
      refreshAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to acknowledge alert.');
    } finally {
      setTriageLoading(false);
    }
  };

  const handleResolve = async (alertId, note) => {
    setTriageLoading(true);
    try {
      await alertService.resolveAlert(alertId, note);
      toast.success('Alert marked as resolved.');
      setTargetAlert(null);
      fetchAlerts();
      refreshAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve alert.');
    } finally {
      setTriageLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Early Warning Alerts & Clinical Triage"
        subtitle="Automated threshold violation notifications requiring healthcare staff attention"
        actions={
          <Button size="sm" variant="outline" icon={RefreshCw} onClick={fetchAlerts}>
            Refresh Queue
          </Button>
        }
      />

      {/* Filter Tabs & Selectors */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['active', 'acknowledged', 'resolved', ''].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs rounded-md font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === '' ? 'All Alerts' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-slate-300 rounded-md px-3 py-1.5 text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent Priority</option>
            <option value="review">Clinical Review</option>
          </select>
        </div>
      </div>

      <AlertTable
        alerts={alerts}
        loading={loading}
        onOpenTriage={(a) => setTargetAlert(a)}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        perPage={perPage}
        onPageChange={setPage}
      />

      <AlertAcknowledgeModal
        isOpen={!!targetAlert}
        onClose={() => setTargetAlert(null)}
        alert={targetAlert}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
        loading={triageLoading}
      />
    </PageContainer>
  );
}

