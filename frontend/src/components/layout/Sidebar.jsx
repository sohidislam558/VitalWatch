import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bed,
  Activity,
  AlertTriangle,
  FileText,
  UserCheck,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../context/NotificationContext';
import { canManageUsers, canManageAlertRules, canRecordVitals } from '../../utils/permissions';

export default function Sidebar({ onClose }) {
  const { user } = useAuth();
  const { unreadAlertCount } = useNotification();

  const isNurse = user?.role === 'nurse';
  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';

  let links = [];

  if (isNurse) {
    links = [
      { to: '/dashboard', label: 'Situation Monitor', icon: LayoutDashboard },
      { to: '/vitals/add', label: 'Record Vital Signs', icon: Activity },
      { to: '/patients', label: 'Patient Directory', icon: Users },
      { to: '/vitals/history', label: 'Vital Trend Logs', icon: Activity },
    ];
  } else if (isDoctor) {
    links = [
      { to: '/dashboard', label: 'Situation Telemetry', icon: LayoutDashboard },
      {
        to: '/alerts',
        label: 'Emergency Alarms',
        icon: AlertTriangle,
        badge: unreadAlertCount > 0 ? unreadAlertCount : null,
      },
      { to: '/patients', label: 'Patient Directory', icon: Users },
      { to: '/vitals/history', label: 'Vital Trend Logs', icon: Activity },
      { to: '/reports', label: 'Clinical Reports', icon: FileText },
    ];
  } else {
    // Admin (Full Hospital Access)
    links = [
      { to: '/dashboard', label: 'Hospital Overview', icon: LayoutDashboard },
      { to: '/patients', label: 'Patient Directory', icon: Users },
      { to: '/admissions', label: 'Ward Admissions', icon: Bed },
      { to: '/vitals/add', label: 'Record Vital Signs', icon: Activity },
      { to: '/vitals/history', label: 'Vital Trend Logs', icon: Activity },
      {
        to: '/alerts',
        label: 'Early Warning Alerts',
        icon: AlertTriangle,
        badge: unreadAlertCount > 0 ? unreadAlertCount : null,
      },
      { to: '/reports', label: 'Clinical Reports', icon: FileText },
      { to: '/users', label: 'Staff Accounts', icon: UserCheck },
      { to: '/settings/rules', label: 'Alert Threshold Rules', icon: Sliders },
    ];
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-wide">VitalWatch</h1>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Hospital Monitor</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Clinical Modules
        </div>

        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Notice Banner */}
      <div className="p-3 mx-3 mb-3 rounded-md bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-400 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="leading-tight text-[10px]">
          Academic prototype. Demonstration thresholds only.
        </p>
      </div>

      {/* User Info Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs uppercase">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role} Staff</p>
          </div>
        </div>
      </div>
    </div>
  );
}

