import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { settingsService } from '../../services/settingsService';
import { useAuth } from '../../hooks/useAuth';
import { canManageAlertRules } from '../../utils/permissions';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Sliders, Plus, Edit, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlertRules() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getAlertRules();
      setRules(res.data || []);
    } catch {
      toast.error('Failed to load alert rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const openAddModal = () => {
    setEditingRule(null);
    reset({
      name: '',
      parameter: 'heart_rate',
      operator: 'greater_than',
      threshold_value: '',
      priority: 'urgent',
      message_template: 'Heart rate abnormal ({val} bpm). Bedside review required.',
    });
    setModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    reset({
      name: rule.name,
      parameter: rule.parameter,
      operator: rule.operator,
      threshold_value: rule.threshold_value,
      priority: rule.priority,
      message_template: rule.message_template,
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setSaveLoading(true);
    try {
      if (editingRule) {
        await settingsService.updateAlertRule(editingRule.id, formData);
        toast.success('Alert threshold rule updated.');
      } else {
        await settingsService.createAlertRule(formData);
        toast.success('New alert rule established.');
      }
      setModalOpen(false);
      loadRules();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rule save failed.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggleStatus = async (rule) => {
    try {
      await settingsService.toggleAlertRule(rule.id, !rule.is_active);
      toast.success(`Rule has been ${!rule.is_active ? 'activated' : 'deactivated'}.`);
      loadRules();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed.');
    }
  };

  const isAdmin = canManageAlertRules(user);

  return (
    <PageContainer>
      <PageHeader
        title="Configurable Alert Engine Rules"
        subtitle="Manage physiological triggers and priority levels for automated patient alerts"
        actions={
          isAdmin && (
            <Button icon={Plus} onClick={openAddModal}>
              New Alert Rule
            </Button>
          )
        }
      />

      {loading ? (
        <LoadingSpinner text="Retrieving configured alert engine rules..." />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3 text-left">Rule Name</th>
                <th className="px-4 py-3 text-left">Parameter</th>
                <th className="px-4 py-3 text-left">Evaluation Logic</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Prompt Message Template</th>
                <th className="px-4 py-3 text-center">Status</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rules.map((rule) => {
                const operatorSymbol = {
                  greater_than: '>',
                  greater_than_or_equal: '>=',
                  less_than: '<',
                  less_than_or_equal: '<=',
                  equal_to: '==',
                }[rule.operator] || rule.operator;

                return (
                  <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{rule.name}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono capitalize">
                      {rule.parameter.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {operatorSymbol} {Number(rule.threshold_value).toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rule.priority} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-sm truncate">{rule.message_template}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={rule.is_active ? 'active' : 'inactive'}
                        label={rule.is_active ? 'Active' : 'Disabled'}
                        size="sm"
                      />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(rule)}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded"
                            title="Edit Threshold"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(rule)}
                            className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                              rule.is_active
                                ? 'text-slate-600 bg-slate-100 hover:bg-slate-200 border-slate-300'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                            }`}
                          >
                            {rule.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Rule Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRule ? `Edit Rule: ${editingRule.name}` : 'Configure New Early Warning Rule'}
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input
            label="Rule Name / Description"
            id="rule_name"
            placeholder="e.g. [DEMO] Critical Bradycardia (<45 bpm)"
            required
            error={errors.name?.message}
            {...register('name', { required: 'Rule name is required' })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Vital Parameter"
              id="parameter"
              required
              options={[
                { value: 'heart_rate', label: 'Heart Rate (bpm)' },
                { value: 'systolic_bp', label: 'Systolic BP (mmHg)' },
                { value: 'diastolic_bp', label: 'Diastolic BP (mmHg)' },
                { value: 'spo2', label: 'Oxygen Saturation (%)' },
                { value: 'temperature', label: 'Body Temperature (°C)' },
                { value: 'respiratory_rate', label: 'Respiratory Rate (/min)' },
              ]}
              {...register('parameter')}
            />

            <Select
              label="Evaluation Operator"
              id="operator"
              required
              options={[
                { value: 'greater_than', label: 'Greater Than (>)' },
                { value: 'greater_than_or_equal', label: 'Greater Than or Equal (>=)' },
                { value: 'less_than', label: 'Less Than (<)' },
                { value: 'less_than_or_equal', label: 'Less Than or Equal (<=)' },
                { value: 'equal_to', label: 'Equal To (==)' },
              ]}
              {...register('operator')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Numerical Cutoff Threshold"
              id="threshold_value"
              type="number"
              step="0.1"
              placeholder="e.g. 120.0"
              required
              error={errors.threshold_value?.message}
              {...register('threshold_value', { required: 'Threshold value is required' })}
            />

            <Select
              label="Alert Priority Tier"
              id="priority"
              required
              options={[
                { value: 'urgent', label: 'Urgent Priority' },
                { value: 'review', label: 'Clinical Review' },
              ]}
              {...register('priority')}
            />
          </div>

          <Input
            label="Alert Prompt Template"
            id="message_template"
            placeholder="e.g. Critical high pulse ({val} bpm). Immediate bedside triage requested."
            helperText="Use {val} where you want the measured number to appear."
            required
            error={errors.message_template?.message}
            {...register('message_template', { required: 'Message template is required' })}
          />

          <div className="pt-3 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveLoading}>
              Save Rule Configuration
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

