import React from 'react';
import { Activity, Clock } from 'lucide-react';
import { formatDateTime } from '../../utils/formatDate';

export default function RecentActivity({ activities = [] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-800">Hospital Staff Clinical Activity</h3>
      </div>

      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No recent activity recorded.</p>
        ) : (
          activities.map((act, i) => (
            <div key={i} className="flex items-start gap-3 text-xs border-b border-slate-50 pb-2.5 last:border-0">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-slate-800 font-medium">
                  {act.action.replace('_', ' ')} &bull; <span className="text-slate-500">{act.entity_type.split('\\').pop()}</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  {act.user?.name || 'System'} &bull; {formatDateTime(act.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

