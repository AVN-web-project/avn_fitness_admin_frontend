import React, { useEffect, useState } from 'react';
import { RefreshCw, Filter } from 'lucide-react';
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

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (entityFilter === 'STAFF' || entityFilter === 'Staff') {
        params.domain = 'STAFF';
      } else if (entityFilter) {
        params.targetEntity = entityFilter;
      }

      const res = await staffApi.getActivityLogs(params);

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

  const DETAIL_LABELS = {
    staffName: 'Staff',
    staffEmail: 'Email',
    assignedRole: 'Role',
    employeeId: 'Employee ID',
    phone: 'Phone',
    sku: 'SKU',
    productName: 'Product',
    previousStock: 'Previous Stock',
    newStock: 'New Stock',
    previousStatus: 'From Status',
    newStatus: 'To Status',
    productStatus: 'Status',
    statusChanged: 'Status Changed',
    orderNumber: 'Order',
    from: 'From',
    to: 'To',
    note: 'Note',
    notes: 'Notes',
    reason: 'Reason',
    carrier: 'Carrier',
    trackingNumber: 'Tracking #',
    code: 'Code',
    discountType: 'Discount Type',
    discountValue: 'Discount Value',
    variantCount: 'Variants',
    updatedFields: 'Updated Fields',
    refundAmount: 'Refund Amount',
    paymentTransactionId: 'Txn ID',
    ticketNumber: 'Ticket #',
    name: 'Name',
    slug: 'Slug',
  };

  const LEAD_KEYS = ['staffName', 'sku', 'code', 'orderNumber', 'ticketNumber', 'name'];
  // Legacy payout references are superseded by the order's Txn ID
  const HIDDEN_DETAIL_KEYS = ['refundTransactionId'];

  const humanizeDetailKey = (key) =>
    DETAIL_LABELS[key] ||
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

  const formatDetailValue = (value) => {
    if (value === null || value === undefined || value === '') return '\u2014';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.length ? value.join(', ') : '\u2014';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const CHANGE_PAIRS = [
    { from: 'previousStatus', to: 'newStatus', label: 'Status' },
    { from: 'previousStock', to: 'newStock', label: 'Stock' },
    { from: 'from', to: 'to', label: 'Status' },
  ];

  const renderChangePair = (label, fromValue, toValue) => (
    <div className="flex items-center gap-1.5 font-mono text-[11px] flex-wrap">
      <span className="text-slate-500 font-sans">{label}:</span>
      <span className="line-through text-slate-400">{String(fromValue)}</span>
      <span>&rarr;</span>
      <span>{String(toValue)}</span>
    </div>
  );

  const renderDetails = (details, row) => {
    if (!details || Object.keys(details).length === 0) {
      return <span className="text-slate-400 text-xs">\u2014</span>;
    }

    const entries = Object.entries(details).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    );
    if (entries.length === 0) {
      return <span className="text-slate-400 text-xs">\u2014</span>;
    }

    // Change pairs (status / stock) rendered as visual old -> new chips
    const consumed = new Set(['context']);
    const changeRows = [];
    for (const pair of CHANGE_PAIRS) {
      if (
        details[pair.from] !== undefined &&
        details[pair.to] !== undefined &&
        !consumed.has(pair.from)
      ) {
        consumed.add(pair.from);
        consumed.add(pair.to);
        changeRows.push(renderChangePair(pair.label, details[pair.from], details[pair.to]));
      }
    }
    // Inventory events sometimes record only productStatus as the "to" value
    if (
      details.sku &&
      details.previousStatus !== undefined &&
      details.newStatus === undefined &&
      details.productStatus !== undefined
    ) {
      consumed.add('productStatus');
      changeRows.push(renderChangePair('Status', details.previousStatus, details.productStatus));
    }

    // For refund events the refunded order's Txn ID is the headline; otherwise the subject
    const isRefundEvent = row.action === 'REFUND_RECORDED';
    const leadEntry = isRefundEvent && details.paymentTransactionId
      ? ['paymentTransactionId', details.paymentTransactionId]
      : entries.find(([k]) => LEAD_KEYS.includes(k));
    if (leadEntry) consumed.add(leadEntry[0]);
    const leadSubKey = leadEntry
      ? (leadEntry[0] === 'staffName' ? 'staffEmail' : 'productName')
      : null;
    if (leadSubKey) consumed.add(leadSubKey);

    // Remaining key -> value rows: nothing dropped, nothing truncated
    const remaining = entries.filter(
      ([k]) => !consumed.has(k) && !HIDDEN_DETAIL_KEYS.includes(k)
    );
    const contextEntry = remaining.find(([k]) => k === 'context');
    const MONO_KEYS = ['employeeId', 'trackingNumber', 'paymentTransactionId', 'refundTransactionId', 'slug', 'ticketNumber'];

    return (
      <div className="space-y-1 text-xs">
        {isRefundEvent && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-500">
            Refund
          </span>
        )}
        {leadEntry && (
          <div>
            {isRefundEvent && details.paymentTransactionId && (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-500">
                Txn ID:{' '}
              </span>
            )}
            <span className="font-mono text-slate-900 dark:text-slate-100">
              {formatDetailValue(leadEntry[1])}
            </span>
            {leadSubKey && details[leadSubKey] && (
              <span className="text-slate-500 font-sans ml-1 text-[11px]">
                ({formatDetailValue(details[leadSubKey])})
              </span>
            )}
          </div>
        )}

        {changeRows}

        {isRefundEvent && !details.paymentTransactionId && (
          <div className="text-[11px] text-slate-400 italic">
            Txn ID: not captured (refund recorded before this update)
          </div>
        )}

        {remaining
          .filter(([k]) => k !== 'context')
          .map(([key, value]) => (
            <div key={key} className="text-[11px] text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-500 dark:text-slate-500">
                {humanizeDetailKey(key)}:
              </span>{' '}
              {key === 'refundAmount' ? (
                <span className="font-mono">₹{Number(value).toLocaleString('en-IN')}</span>
              ) : (
                <span className={MONO_KEYS.includes(key) ? 'font-mono' : ''}>
                  {formatDetailValue(value)}
                </span>
              )}
            </div>
          ))}

        {contextEntry && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            {formatDetailValue(contextEntry[1])}
          </div>
        )}
      </div>
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
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Emp ID: {row.employeeId || '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Domain',
      key: 'domain',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
          {row.domain === 'STAFF' || row.targetEntity === 'Staff' ? 'Staff' : (row.domain || row.targetEntity || 'System')}
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
      render: (row) => renderDetails(row.details, row),
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
              <option value="STAFF">Staff Management</option>
              <option value="Product">Products & Inventory</option>
              <option value="Category">Categories</option>
              <option value="Order">Orders & Shipments</option>
              <option value="Coupon">Coupons</option>
              <option value="Review">Reviews</option>
              <option value="SupportRequest">Support</option>
              <option value="Payment">Finance & Payments</option>
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
