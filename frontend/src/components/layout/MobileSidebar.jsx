import React from 'react';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';

export default function MobileSidebar({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-xs flex-1 flex-col bg-slate-900 z-50">
        <div className="absolute top-0 right-0 -mr-12 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <Sidebar onClose={onClose} />
      </div>
    </div>
  );
}

