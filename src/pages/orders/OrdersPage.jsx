import React, { useEffect, useState } from 'react';
import { Truck, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { ordersApi } from '../../services/ordersApi.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import SearchInput from '../../components/common/SearchInput.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { ORDER_STATUS } from '../../utils/constants.js';

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Dispatch Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isReturnReviewModalOpen, setIsReturnReviewModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Dispatch Form
  const [carrier, setCarrier] = useState('Delhivery');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState(4);

  // Status Change Form
  const [newStatus, setNewStatus] = useState('');

  // Return Review Form
  const [returnReviewAction, setReturnReviewAction] = useState('approve');
  const [returnReviewNotes, setReturnReviewNotes] = useState('');

  const pagination = usePagination(1, 20);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ordersApi.getOrders({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
      });

      setOrders(res.orders || res.items || []);
      if (res.pagination) {
        pagination.setTotal(res.pagination.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch customer orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, debouncedSearch]);

  const handleOpenDispatch = (order) => {
    setSelectedOrder(order);
    setCarrier(order.shipping?.carrier || 'Delhivery');
    setTrackingNumber(order.shipping?.trackingNumber || `TRK${Date.now().toString().slice(-8)}`);
    setEstimatedDeliveryDays(4);
    setActionError('');
    setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionLoading(true);
    setActionError('');

    try {
      await ordersApi.dispatchOrder(selectedOrder._id, {
        carrier,
        trackingNumber,
        // Backend expects a concrete date (estimatedDeliveryDate), not a day count
        estimatedDeliveryDate: estimatedDeliveryDays
          ? new Date(Date.now() + Number(estimatedDeliveryDays) * 86400000).toISOString()
          : undefined,
      });
      setIsDispatchModalOpen(false);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err) {
      setActionError(err.message || 'Failed to dispatch order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenStatus = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setActionError('');
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !newStatus) return;
    setActionLoading(true);
    setActionError('');

    try {
      await ordersApi.updateOrderStatus(selectedOrder._id, newStatus);
      setIsStatusModalOpen(false);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err) {
      setActionError(err.message || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReturnReview = (order, action = 'approve') => {
    setSelectedOrder(order);
    setReturnReviewAction(action);
    setReturnReviewNotes('');
    setActionError('');
    setIsReturnReviewModalOpen(true);
  };

  const handleReturnReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionLoading(true);
    setActionError('');

    try {
      await ordersApi.reviewReturnRequest(selectedOrder._id, {
        action: returnReviewAction,
        notes: returnReviewNotes,
      });
      setIsReturnReviewModalOpen(false);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err) {
      setActionError(err.message || 'Failed to review return request.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Order #',
      key: 'orderNumber',
      render: (row) => (
        <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
          {row.orderNumber || row._id}
        </div>
      ),
    },
    {
      header: 'Customer',
      key: 'user',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800 dark:text-slate-200">
            {row.user?.name || row.shippingAddress?.fullName || 'Customer'}
          </div>
          <div className="text-xs text-slate-400">{row.user?.email || row.shippingAddress?.phone}</div>
        </div>
      ),
    },
    {
      header: 'Date',
      key: 'createdAt',
      render: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Total',
      key: 'pricing',
      render: (row) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(row.pricing?.totalPayable || row.totalAmount || 0)}
        </span>
      ),
    },
    {
      header: 'Payment / Refund',
      key: 'paymentInfo',
      render: (row) => {
        const provider = String(row.paymentInfo?.provider || 'unknown').toLowerCase();
        const method = String(row.paymentInfo?.method || '').toUpperCase();
        const paymentStatus = String(row.paymentInfo?.paymentStatus || 'pending').toLowerCase();
        const isRefundEligible = row.orderStatus === ORDER_STATUS.CANCELLED &&
          provider !== 'cod' &&
          paymentStatus === 'captured';

        return (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {provider === 'mock' ? 'Online test' : provider.toUpperCase()}
              {method && method !== 'COD' ? ` · ${method}` : ''}
            </div>
            <div className="text-[11px] capitalize text-slate-500 dark:text-slate-400">
              {paymentStatus}
            </div>
            {isRefundEligible && <StatusBadge status="success" text="Refund eligible" />}
          </div>
        );
      },
    },
    {
      header: 'Status',
      key: 'orderStatus',
      render: (row) => <StatusBadge status={row.orderStatus} />,
    },
    {
      header: 'Fulfillment Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.orderStatus === 'paid_confirmed' || row.orderStatus === 'processing' ? (
            <Button
              variant="primary"
              size="sm"
              className="text-xs py-1 px-2"
              leftIcon={Truck}
              onClick={() => handleOpenDispatch(row)}
            >
              Dispatch
            </Button>
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            className="text-xs py-1 px-2"
            onClick={() => handleOpenStatus(row)}
          >
            Status
          </Button>

          {row.orderStatus === 'return_requested' ? (
            <>
              <Button
                variant="primary"
                size="sm"
                className="text-xs py-1 px-2"
                leftIcon={ShieldCheck}
                onClick={() => handleOpenReturnReview(row, 'approve')}
              >
                Accept Return
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="text-xs py-1 px-2"
                onClick={() => handleOpenReturnReview(row, 'reject')}
              >
                Decline Return
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Operations"
        subtitle="Manage order fulfillment, shipments, cancellations, and returns."
      />

      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search by order # or customer..."
        />
        <Button variant="secondary" size="sm" leftIcon={RefreshCw} onClick={fetchOrders}>
          Refresh
        </Button>
      </div>

      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={orders}
          isLoading={loading}
          error={error}
          onRetry={fetchOrders}
          emptyTitle="No orders placed yet"
        />

        {!loading && !error && orders.length > 0 && (
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

      {/* Dispatch Order Modal */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title={`Dispatch Order: ${selectedOrder?.orderNumber || selectedOrder?._id}`}
        maxWidth="max-w-md"
      >
        {actionError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <form onSubmit={handleDispatchSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Courier / Carrier Name
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Delhivery">Delhivery</option>
              <option value="BlueDart">Blue Dart Express</option>
              <option value="DTDC">DTDC</option>
              <option value="Ekart">Ekart Logistics</option>
              <option value="Shadowfax">Shadowfax</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              AWB / Tracking Number
            </label>
            <input
              type="text"
              required
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. DLV123984920"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Estimated Delivery (Days)
            </label>
            <input
              type="number"
              min={1}
              required
              value={estimatedDeliveryDays}
              onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsDispatchModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading} leftIcon={Truck}>
              Mark as Shipped
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Order Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Order Status"
        maxWidth="max-w-md"
      >
        {actionError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Select New Order State
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={ORDER_STATUS.PAID_CONFIRMED}>Paid & Confirmed</option>
              <option value={ORDER_STATUS.PROCESSING}>Processing in Warehouse</option>
              <option value={ORDER_STATUS.DELIVERED}>Delivered</option>
              {newStatus === ORDER_STATUS.RETURNED ? (
                <option value={ORDER_STATUS.RETURNED}>Returned</option>
              ) : null}
            </select>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              Save Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Return Request Modal */}
      <Modal
        isOpen={isReturnReviewModalOpen}
        onClose={() => setIsReturnReviewModalOpen(false)}
        title="Review Return Request"
        maxWidth="max-w-md"
      >
        {actionError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <form onSubmit={handleReturnReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Decision
            </label>
            <select
              value={returnReviewAction}
              onChange={(e) => setReturnReviewAction(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="approve">Accept return</option>
              <option value="reject">Decline return</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Review Notes
            </label>
            <textarea
              rows={3}
              required
              value={returnReviewNotes}
              onChange={(e) => setReturnReviewNotes(e.target.value)}
              placeholder="Add a note about this decision"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsReturnReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading} leftIcon={ShieldCheck}>
              Save Decision
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrdersPage;