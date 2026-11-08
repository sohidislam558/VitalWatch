import React, { useState } from 'react';
import { Menu, Bell, LogOut, User, Activity, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { unreadAlertCount } = useNotification();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Local Ward Time: <strong className="text-slate-700">{currentTime}</strong></span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Alerts quick badge link (Doctor and Nurse only) */}
        {user?.role !== 'admin' && (
          <Link
            to="/alerts"
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            title="Active Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadAlertCount}
              </span>
            )}
          </Link>
        )}

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-none">{user?.name}</p>
              <span className="inline-block text-[10px] text-slate-500 uppercase tracking-wider mt-0.5 font-medium">
                {user?.role}
              </span>
            </div>
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 py-1 z-50 border border-slate-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>

                <Link
                  to="/settings/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" /> Profile Details
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left border-t border-slate-100"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

