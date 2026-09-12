import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  HeadphonesIcon,
  Tag,
  DollarSign,
  UserCheck,
  Activity,
  Dumbbell,
} from 'lucide-react';
import { usePermission } from '../../hooks/usePermission.js';
import { PERMISSIONS } from '../../permissions/permissions.js';

export const NAVIGATION_ITEMS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    permission: null, // accessible by all authenticated staff
  },
  {
    label: 'Products',
    icon: Package,
    path: '/products',
    permission: PERMISSIONS.PRODUCTS_VIEW,
  },
  {
    label: 'Inventory',
    icon: Boxes,
    path: '/inventory',
    permission: PERMISSIONS.INVENTORY_VIEW,
  },
  {
    label: 'Orders',
    icon: ShoppingCart,
    path: '/orders',
    permission: PERMISSIONS.ORDERS_VIEW,
  },
  {
    label: 'Customers',
    icon: Users,
    path: '/customers',
    permission: PERMISSIONS.CUSTOMERS_VIEW,
  },
  {
    label: 'Customer Support',
    icon: HeadphonesIcon,
    path: '/support',
    permission: PERMISSIONS.SUPPORT_VIEW,
  },
  {
    label: 'Marketing & Coupons',
    icon: Tag,
    path: '/marketing',
    permission: PERMISSIONS.COUPONS_VIEW,
  },
  {
    label: 'Finance',
    icon: DollarSign,
    path: '/finance',
    permission: PERMISSIONS.PAYMENTS_VIEW,
  },
  {
    label: 'Staff Management',
    icon: UserCheck,
    path: '/staff',
    permission: PERMISSIONS.STAFF_VIEW,
  },
  {
    label: 'Activity Logs',
    icon: Activity,
    path: '/activity-logs',
    permission: 'activity_logs',
  },
];

export const Sidebar = () => {
  const { can, canAny } = usePermission();

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
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 select-none z-20">
      {/* Brand Logo Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Dumbbell className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
            AVN FITNESS
          </span>
          <span className="block text-[10px] font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
            Management Portal
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Main Menu
        </div>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer / System Info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
        <span>v1.0.0 (Phase 1)</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Backend Live
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
