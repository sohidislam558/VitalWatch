import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { User, Shield, Mail, Calendar, Key } from 'lucide-react';
import { formatDateTime } from '../../utils/formatDate';
import { ROLE_LABELS } from '../../utils/constants';

export default function ProfileSettings() {
  const { user } = useAuth();

  return (
    <PageContainer>
      <PageHeader
        title="Staff Profile & Security"
        subtitle="Current authenticated hospital credentials and system authorization level"
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 max-w-2xl">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5 mb-5">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl border border-blue-200">
            {user?.name?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role] || user?.role}</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" /> Email Address:
            </span>
            <span className="font-semibold text-slate-900 font-mono">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" /> Assigned Role Tier:
            </span>
            <span className="font-semibold capitalize text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
              {user?.role}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-slate-500 flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-400" /> Account Status:
            </span>
            <StatusBadge status={user?.status} size="sm" />
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" /> Account Created:
            </span>
            <span className="text-slate-700">{formatDateTime(user?.created_at)}</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

