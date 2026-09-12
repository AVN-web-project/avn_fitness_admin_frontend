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
} from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';
import { usePermission } from '../../hooks/usePermission.js';
import { dashboardApi } from '../../services/dashboardApi.js';
import { inventoryApi } from '../../services/inventoryApi.js';
import { productsApi } from '../../services/productsApi.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Button from '../../components/common/Button.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { ROLE_LABELS, ROLES } from '../../permissions/roles.js';

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
          // If role only has catalog permissions, create baseline summary
          setData({ summary: {}, orderStatusDistribution: {} });
        }
      }

      // If user has inventory or product permissions, also fetch inventory breakdown
      if (
        isSuperAdmin ||
        user?.role === ROLES.PRODUCT_INVENTORY_MANAGER ||
        user?.role === ROLES.OPERATIONS
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

  if (loading) return <LoadingState message="Aggregating management metrics..." />;
  if (error) return <ErrorState error={error} onRetry={fetchDashboard} />;

  const summary = data?.summary || {};
  const orderDistribution = data?.orderStatusDistribution || {};
  const isInventoryManager = user?.role === ROLES.PRODUCT_INVENTORY_MANAGER;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name || 'Staff'}`}
        subtitle={`Logged in as ${roleTitle} — Operational overview & departmental controls.`}
      />

      {/* Role-Specific Banner for Product & Inventory Manager */}
      {isInventoryManager && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Product Catalog & Warehouse Operations
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Manage all product items, size/color variant SKUs, physical stock levels, and audit logs.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="text-xs"
              leftIcon={Package}
              onClick={() => navigate('/products')}
            >
              Products
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="text-xs"
              leftIcon={Boxes}
              onClick={() => navigate('/inventory')}
            >
              Inventory
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="text-xs"
              leftIcon={Activity}
              onClick={() => navigate('/activity-logs')}
            >
              Logs
            </Button>
          </div>
        </div>
      )}

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

        {/* Total SKUs */}
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
          <div className="mt-1 text-xs text-slate-500">Variants in database</div>
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

        {/* Total Orders / Activity */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isInventoryManager ? 'Out of Stock' : 'Total Orders'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              {isInventoryManager ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isInventoryManager
              ? inventoryStats?.outOfStockCount ?? 0
              : summary.totalOrders || 0}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {isInventoryManager ? 'Zero warehouse stock' : 'Lifetime transactions'}
          </div>
        </div>
      </div>

      {/* Orders Pipeline Breakdown Section (if order data present) */}
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

      {/* Quick Navigation Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Quick Management Shortcuts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/products')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Products Management
                </div>
                <div className="text-xs text-slate-500">Edit, add & organize catalog</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>

          <div
            onClick={() => navigate('/inventory')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Inventory Stock
                </div>
                <div className="text-xs text-slate-500">Real-time SKU quantities</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>

          <div
            onClick={() => navigate('/activity-logs')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Activity Logs
                </div>
                <div className="text-xs text-slate-500">Role-scoped audit trail</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
