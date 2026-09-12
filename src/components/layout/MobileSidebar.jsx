import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, Dumbbell } from 'lucide-react';
import { NAVIGATION_ITEMS } from './Sidebar.jsx';
import { usePermission } from '../../hooks/usePermission.js';
import { PERMISSIONS } from '../../permissions/permissions.js';

export const MobileSidebar = ({ isOpen, onClose }) => {
  const { can, canAny } = usePermission();

  if (!isOpen) return null;

  const filteredNavItems = NAVIGATION_ITEMS.filter((item) => {
    if (!item.permission) return true;

    if (item.path === '/activity-logs') {
      return canAny([
        PERMISSIONS.ACTIVITY_LOGS_VIEW_ALL,
        PERMISSIONS.ACTIVITY_LOGS_VIEW_SCOPED,
        'activity_logs.view_all',
        'activity_logs.view_scoped',
      ]);
    }

    if (item.path === '/finance') {
      return canAny([
        PERMISSIONS.PAYMENTS_VIEW,
        PERMISSIONS.FINANCE_REPORTS,
        'payments.view',
        'finance.reports',
      ]);
    }

    return can(item.permission);
  });

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="relative flex flex-col w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Dumbbell className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-slate-100">
              AVN FITNESS
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar;
