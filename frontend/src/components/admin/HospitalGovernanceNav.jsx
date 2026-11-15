import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Sliders,
  Bed,
  FileText,
  Activity,
  ShieldCheck,
} from 'lucide-react';

export default function HospitalGovernanceNav({
  activeSection = 'overview',
  onSelectSection,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'overview',
      label: 'Activity Stream & Telemetry',
      subtitle: 'Audit Log & Situation Monitor',
      icon: Activity,
      path: '/dashboard',
      color: 'slate',
    },
    {
      id: 'users',
      label: 'Staff Accounts',
      subtitle: 'Physicians & Nurses',
      icon: Users,
      path: '/dashboard?section=users',
      standalonePath: '/users',
      color: 'blue',
    },
    {
      id: 'rules',
      label: 'Threshold Rules',
      subtitle: 'Early Warning Bounds',
      icon: Sliders,
      path: '/dashboard?section=rules',
      standalonePath: '/settings/rules',
      color: 'amber',
    },
    {
      id: 'patients',
      label: 'Patient Directory',
      subtitle: 'Roster & Admissions',
      icon: Bed,
      path: '/dashboard?section=patients',
      standalonePath: '/patients',
      color: 'emerald',
    },
    {
      id: 'reports',
      label: 'Clinical Reports',
      subtitle: 'PDF Telemetry Export',
      icon: FileText,
      path: '/dashboard?section=reports',
      standalonePath: '/reports',
      color: 'purple',
    },
  ];

  const handleClick = (item) => {
    if (onSelectSection) {
      onSelectSection(item.id);
      // Synchronize browser history / URL query parameter without full reload
      if (item.id === 'overview') {
        navigate('/dashboard', { replace: false });
      } else {
        navigate(`/dashboard?section=${item.id}`, { replace: false });
      }
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 sticky top-2 z-20 backdrop-blur-md bg-white/95 transition-all">
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Hospital Governance Navigation
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">• Persistent Admin Controls</span>
        </div>
        <div className="text-[11px] font-semibold text-slate-500 hidden md:block">
          Select an administrative module below
        </div>
      </div>

      <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2" aria-label="Hospital Governance">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          const colorClasses = {
            slate: isActive
              ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20'
              : 'hover:bg-slate-50 border-slate-200 text-slate-700',
            blue: isActive
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25'
              : 'hover:bg-blue-50/60 border-slate-200 text-slate-700 hover:border-blue-300',
            amber: isActive
              ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/25'
              : 'hover:bg-amber-50/60 border-slate-200 text-slate-700 hover:border-amber-300',
            emerald: isActive
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
              : 'hover:bg-emerald-50/60 border-slate-200 text-slate-700 hover:border-emerald-300',
            purple: isActive
              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25'
              : 'hover:bg-purple-50/60 border-slate-200 text-slate-700 hover:border-purple-300',
          }[item.color];

          const iconBg = isActive
            ? 'bg-white/20 text-white'
            : {
                slate: 'bg-slate-100 text-slate-700',
                blue: 'bg-blue-100 text-blue-700',
                amber: 'bg-amber-100 text-amber-700',
                emerald: 'bg-emerald-100 text-emerald-700',
                purple: 'bg-purple-100 text-purple-700',
              }[item.color];

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item)}
              className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer relative group ${colorClasses}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${iconBg}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <div
                  className={`text-[10px] truncate ${
                    isActive ? 'text-white/80' : 'text-slate-500'
                  }`}
                >
                  {item.subtitle}
                </div>
              </div>

              {isActive && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
