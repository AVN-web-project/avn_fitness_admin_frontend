import React, { useEffect, useState } from 'react';
import { RefreshCw, Activity, Filter } from 'lucide-react';
import { staffApi } from '../../services/staffApi.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import Button from '../../components/common/Button.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import { usePermission } from '../../hooks/usePermission.js';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';
import { ROLE_LABELS } from '../../permissions/roles.js';
import { formatDate } from '../../utils/formatDate.js';

export const ActivityLogsPage = () => {
  const { isSuperAdmin } = useAdminAuth();
  const { can } = usePermission();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entityFilter, setEntityFilter] = useState('');

  const pagination = usePagination(1, 20);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await staffApi.getActivityLogs({
        page: pagination.page,
        limit: pagination.limit,
        targetEntity: entityFilter || undefined,
      });

      setLogs(res.logs || res.items || []);
      if (res.pagination) {
        pagination.setTotal(res.pagination.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, entityFilter]);

  const renderDetails = (details) => {
    if (!details || Object.keys(details).length === 0) {
      return <span className="text-slate-400 text-xs">—</span>;
    }

    if (details.sku && details.previousStock !== undefined && details.newStock !== undefined) {
      return (
        <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
          <strong className="text-slate-900 dark:text-slate-100">{details.sku}</strong>:{' '}
          <span className="line-through text-slate-400">{details.previousStock}</span> &rarr;{' '}
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{details.newStock}</span>
        </span>
      );
    }

    if (details.from && details.to) {
      return (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
          {details.from} &rarr; <strong>{details.to}</strong>
        </span>
      );
    }

    return (
      <span className="text-xs text-slate-500 font-mono line-clamp-1">
        {JSON.stringify(details).replace(/["{}]/g, ' ')}
      </span>
    );
  };

  const columns = [
    {
      header: 'Operator',
      key: 'userName',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{row.userName}</span>
          <span className="block text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            {ROLE_LABELS[row.userRole] || row.userRole}
          </span>
        </div>
      ),
    },
    {
      header: 'Domain',
      key: 'targetEntity',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
          {row.targetEntity || 'System'}
        </span>
      ),
    },
    {
      header: 'Action Taken',
      key: 'action',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
          {row.action}
        </span>
      ),
    },
    {
      header: 'Audit Context / Changes',
      key: 'details',
      render: (row) => renderDetails(row.details),
    },
    {
      header: 'Timestamp',
      key: 'createdAt',
      render: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSuperAdmin ? 'Global Activity Logs' : 'Domain Activity Logs'}
        subtitle={
          isSuperAdmin
            ? 'Complete audit trail of all staff activities across every domain.'
            : 'Operational audit trail scoped to your assigned management domain.'
        }
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {isSuperAdmin ? (
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Domain:
            </label>
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                pagination.resetPage();
              }}
              className="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Domains</option>
              <option value="Product">Products & Inventory</option>
              <option value="Category">Categories</option>
              <option value="Order">Orders & Shipments</option>
              <option value="Coupon">Coupons</option>
              <option value="Review">Reviews</option>
              <option value="SupportRequest">Support</option>
              <option value="User">Users</option>
            </select>
          </div>
        ) : <div />}

        <Button variant="secondary" size="sm" leftIcon={RefreshCw} onClick={fetchLogs}>
          Refresh Logs
        </Button>
      </div>

      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={logs}
          isLoading={loading}
          error={error}
          onRetry={fetchLogs}
          emptyTitle="No activity recorded"
          emptyMessage="There are currently no staff activity log entries to display."
        />

        {!loading && !error && logs.length > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onNext={pagination.nextPage}
            onPrev={pagination.prevPage}
            hasNext={pagination.hasNextPage}
            hasPrev={pagination.hasPrevPage}
          />
        )}
      </div>
    </div>
  );
};

export default ActivityLogsPage;
