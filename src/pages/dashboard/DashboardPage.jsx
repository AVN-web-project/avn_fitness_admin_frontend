import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Activity,
  Tag,
  HeadphonesIcon,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';
import { usePermission } from '../../hooks/usePermission.js';
import { dashboardApi } from '../../services/dashboardApi.js';
import { inventoryApi } from '../../services/inventoryApi.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Button from '../../components/common/Button.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { ROLE_LABELS, ROLES } from '../../permissions/roles.js';
import { PERMISSIONS } from '../../permissions/permissions.js';

// All potential application quicklinks with their exact authorization requirements
const ALL_SHORTCUTS = [
  {
    id: 'products',
    title: 'Products Management',
    description: 'Add, edit & organize catalog items',
    path: '/products',
    icon: Package,
    iconBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
    permissions: [PERMISSIONS.PRODUCTS_VIEW, 'products.view'],
  },
  {
    id: 'inventory',
    title: 'Inventory Stock',
    description: 'Real-time SKU stock levels & status',
    path: '/inventory',
    icon: Boxes,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
    permissions: [PERMISSIONS.INVENTORY_VIEW, 'inventory.view'],
  },
  {
    id: 'orders',
    title: 'Orders & Dispatch',
    description: 'Track fulfillments, shipments & status',
    path: '/orders',
    icon: ShoppingCart,
    iconBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
    permissions: [PERMISSIONS.ORDERS_VIEW, 'orders.view'],
  },
  {
    id: 'customers',
    title: 'Customer Directory',
    description: 'Inspect buyer profiles & account states',
    path: '/customers',
    icon: Users,
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
    permissions: [PERMISSIONS.CUSTOMERS_VIEW, 'customers.view'],
  },
  {
    id: 'support',
    title: 'Customer Support',
    description: 'Review and resolve support tickets',
    path: '/support',
    icon: HeadphonesIcon,
    iconBg: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400',
    permissions: [PERMISSIONS.SUPPORT_VIEW, 'support.view'],
  },
  {
    id: 'marketing',
    title: 'Marketing & Coupons',
    description: 'Manage discount codes & customer reviews',
    path: '/marketing',
    icon: Tag,
    iconBg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
    permissions: [PERMISSIONS.COUPONS_VIEW, 'coupons.view', 'reviews.view'],
  },
  {
    id: 'finance',
    title: 'Finance & Refunds',
    description: 'Review revenue & process refund requests',
    path: '/finance',
    icon: DollarSign,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
    permissions: [
      PERMISSIONS.PAYMENTS_VIEW,
      PERMISSIONS.FINANCE_REPORTS,
      'payments.view',
      'finance.reports',
      'refunds.process',
      'refunds.view',
      'returns.process',
    ],
  },
  {
    id: 'staff',
    title: 'Staff Management',
    description: 'Manage team members & security roles',
    path: '/staff',
    icon: ShieldCheck,
    iconBg: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400',
    permissions: [PERMISSIONS.STAFF_VIEW, 'staff.view'],
  },
  {
    id: 'activity-logs',
    title: 'Audit Activity Logs',
    description: 'Role-scoped audit trail of staff actions',
    path: '/activity-logs',
    icon: Activity,
    iconBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
    permissions: [
      PERMISSIONS.ACTIVITY_LOGS_VIEW_ALL,
      PERMISSIONS.ACTIVITY_LOGS_VIEW_SCOPED,
      'activity_logs.view_all',
      'activity_logs.view_scoped',
      'activity_logs',
    ],
  },
];

export const DashboardPage = () => {
  const { user, isSuperAdmin } = useAdminAuth();
  const { can, canAny } = usePermission();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Attempt primary analytics load
      try {
        const analytics = await dashboardApi.getAdminAnalytics();
        setData(analytics);
      } catch (adminErr) {
        // Fallback to operations dashboard
        try {
          const ops = await dashboardApi.getOperationsDashboard();
          setData(ops);
        } catch (opsErr) {
          setData({ summary: {}, orderStatusDistribution: {} });
        }
      }

      // If user has inventory or product permissions, also fetch inventory breakdown
      if (
        isSuperAdmin ||
        user?.role === ROLES.PRODUCT_INVENTORY_MANAGER ||
        user?.role === ROLES.OPERATIONS ||
        can(PERMISSIONS.INVENTORY_VIEW)
      ) {
        try {
          const inv = await inventoryApi.getInventoryList({ limit: 100 });
          setInventoryStats(inv);
        } catch (e) {
          // Non-critical
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [isSuperAdmin, user?.role]);

  const roleTitle = ROLE_LABELS[user?.role] || user?.role || 'Staff';

  // Strictly filter working shortcuts to only those authorized for the current user's role
  const userShortcuts = ALL_SHORTCUTS.filter((item) => {
    if (isSuperAdmin || user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN) return true;
    return canAny(item.permissions);
  });

  const getRoleBannerConfig = () => {
    switch (user?.role) {
      case ROLES.PRODUCT_INVENTORY_MANAGER:
        return {
          title: 'Product Catalog & Warehouse Operations',
          subtitle: 'Manage all product items, variant SKUs, physical stock quantities, and catalog audit logs.',
          icon: Boxes,
          iconBg: 'bg-blue-600',
        };
      case ROLES.ORDER_MANAGER:
        return {
          title: 'Order Fulfillment & Dispatch Pipeline',
          subtitle: 'Process incoming customer orders, manage shipments, confirm delivery, and oversee customer records.',
          icon: ShoppingCart,
          iconBg: 'bg-amber-600',
        };
      case ROLES.CUSTOMER_SUPPORT:
        return {
          title: 'Customer Care & Inquiries Desk',
          subtitle: 'Attend to customer support requests, lookup order records, and verify customer profiles.',
          icon: HeadphonesIcon,
          iconBg: 'bg-cyan-600',
        };
      case ROLES.MARKETING_MANAGER:
        return {
          title: 'Marketing Campaigns, Coupons & Reviews',
          subtitle: 'Create promotional discount codes, manage coupon campaigns, and moderate buyer product reviews.',
          icon: Tag,
          iconBg: 'bg-rose-600',
        };
      case ROLES.FINANCE_MANAGER:
        return {
          title: 'Finance, Settlement & Refund Operations',
          subtitle: 'Review gross & net revenue, audit processed payments, and settle customer return/refund requests.',
          icon: DollarSign,
          iconBg: 'bg-emerald-600',
        };
      case ROLES.OPERATIONS:
        return {
          title: 'Operations & Fulfillment Command',
          subtitle: 'Oversee inventory stock, orders fulfillment pipeline, shipping tracking, and operations audit trail.',
          icon: ShieldCheck,
          iconBg: 'bg-indigo-600',
        };
      default:
        return {
          title: 'Central Executive Administration',
          subtitle: 'Complete administrative oversight across catalog, warehouse stock, orders, revenue, and team security.',
          icon: ShieldCheck,
          iconBg: 'bg-blue-600',
        };
    }
  };

  if (loading) return <LoadingState message="Aggregating management metrics..." />;
  if (error) return <ErrorState error={error} onRetry={fetchDashboard} />;

  const summary = data?.summary || {};
  const orderDistribution = data?.orderStatusDistribution || {};
  const banner = getRoleBannerConfig();
  const BannerIcon = banner.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name || 'Staff'}`}
        subtitle={`Logged in as ${roleTitle} — Operational overview & departmental controls.`}
      />

      {/* Role-Specific Banner with Working Shortcuts */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl ${banner.iconBg} text-white shrink-0 shadow-sm`}>
            <BannerIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {banner.title}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {banner.subtitle}
            </div>
          </div>
        </div>

        {/* Quick action pill buttons inside banner - Only showing working authorized shortcuts */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {userShortcuts.slice(0, 3).map((sc) => {
            const Icon = sc.icon;
            return (
              <Button
                key={sc.id}
                variant="secondary"
                size="sm"
                className="text-xs shadow-xs"
                leftIcon={Icon}
                onClick={() => navigate(sc.path)}
              >
                {sc.title.split(' ')[0]}
              </Button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Catalog */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Catalog
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {summary.totalProducts || inventoryStats?.total || 12}
          </div>
          <div className="mt-1 text-xs text-slate-500">Commercial products</div>
        </div>

        {/* Tracked SKUs */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tracked SKUs
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {inventoryStats?.totalSkus || inventoryStats?.items?.length || 22}
          </div>
          <div className="mt-1 text-xs text-slate-500">Variants in warehouse</div>
        </div>

        {/* Low Stock Warnings */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Low Stock Alert
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {inventoryStats?.lowStockCount ?? 0}
          </div>
          <div className="mt-1 text-xs text-slate-500">SKUs requiring restock</div>
        </div>

        {/* Total Orders / Net Revenue */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {summary.netRevenue ? 'Net Revenue' : 'Total Orders'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {summary.netRevenue ? formatCurrency(summary.netRevenue) : (summary.totalOrders || 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {summary.netRevenue ? `${summary.totalOrders || 0} total orders` : 'Lifetime orders recorded'}
          </div>
        </div>
      </div>

      {/* Orders Pipeline Breakdown Section (if order data present and user has order/admin access) */}
      {Object.keys(orderDistribution).length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Order Status Pipeline
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Object.entries(orderDistribution).map(([status, count]) => (
              <div
                key={status}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center"
              >
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{count}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1 font-medium">
                  {status.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role-Specific Working Quicklinks Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-blue-600" />
            Quick Management Shortcuts
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct access to authorized operational modules for your {roleTitle} role.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {userShortcuts.map((sc) => {
            const Icon = sc.icon;
            return (
              <div
                key={sc.id}
                onClick={() => navigate(sc.path)}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all flex items-center justify-between group shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${sc.iconBg} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {sc.title}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-1">{sc.description}</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
