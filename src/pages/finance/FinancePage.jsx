import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  RotateCcw,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  Receipt,
  ShieldCheck,
  Eye,
  RefreshCw,
  Filter,
  Wallet,
  Percent,
  Check,
  X,
  Clock,
  Ban,
} from 'lucide-react';
import { financeApi } from '../../services/financeApi.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import SearchInput from '../../components/common/SearchInput.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export const FinancePage = () => {
  // Navigation Section: 'returns' (Returns & Cancellations) or 'sales' (Sales & Processed Payments)
  const [activeSection, setActiveSection] = useState('returns');

  // Success / Error Toast
  const [toast, setToast] = useState({ type: '', message: '' });

  // ----------------------------------------------------
  // SECTION 1: Returns & Cancellations State
  // ----------------------------------------------------
  const [returnRequests, setReturnRequests] = useState([]);
  const [returnMetrics, setReturnMetrics] = useState({
    returnRequestedCount: 0,
    pendingRefundCount: 0,
    refundedCount: 0,
    totalRefundedAmount: 0,
    totalRequests: 0,
  });
  const [returnFilter, setReturnFilter] = useState('all'); // 'all', 'return_requested', 'pending_refund', 'refunded'
  const [returnSearch, setReturnSearch] = useState('');
  const debouncedReturnSearch = useDebounce(returnSearch, 300);
  const returnPagination = usePagination(1, 10);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState(null);

  // Return Action Modals
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [customRefundAmount, setCustomRefundAmount] = useState(0);

  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState(null);
  const [refundTxnId, setRefundTxnId] = useState('');
  const [refundAmountInput, setRefundAmountInput] = useState(0);
  const [refundReason, setRefundReason] = useState('');

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // ----------------------------------------------------
  // SECTION 2: Sales & Processed Payments State
  // ----------------------------------------------------
  const [payments, setPayments] = useState([]);
  const [salesStats, setSalesStats] = useState({
    grossVolume: 0,
    totalDiscounts: 0,
    netRevenue: 0,
    totalRefunds: 0,
    totalTransactions: 0,
    capturedTransactions: 0,
    refundedTransactions: 0,
    averageOrderValue: 0,
  });
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // 'all', 'captured', 'refunded', 'pending'
  const [paymentProviderFilter, setPaymentProviderFilter] = useState('all'); // 'all', 'razorpay', 'upi', 'cod'
  const [paymentSearch, setPaymentSearch] = useState('');
  const debouncedPaymentSearch = useDebounce(paymentSearch, 300);
  const paymentPagination = usePagination(1, 15);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Transaction Inspection Modal
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);
  const [isPaymentDetailModalOpen, setIsPaymentDetailModalOpen] = useState(false);

  // Show temporary toast
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4500);
  };

  // ----------------------------------------------------
  // Fetch Functions
  // ----------------------------------------------------
  const fetchReturnsAndCancellations = async () => {
    try {
      setReturnLoading(true);
      setReturnError(null);
      const res = await financeApi.getReturnsAndCancellations({
        page: returnPagination.page,
        limit: returnPagination.limit,
        filterType: returnFilter !== 'all' ? returnFilter : undefined,
        search: debouncedReturnSearch || undefined,
      });

      setReturnRequests(res.requests || []);
      if (res.metrics) setReturnMetrics(res.metrics);
      if (res.pagination) returnPagination.setTotal(res.pagination.total || 0);
    } catch (err) {
      setReturnError(err.message || 'Failed to load return & cancellation requests.');
    } finally {
      setReturnLoading(false);
    }
  };

  const fetchPaymentsAndSales = async () => {
    try {
      setPaymentLoading(true);
      setPaymentError(null);
      const res = await financeApi.getPaymentsList({
        page: paymentPagination.page,
        limit: paymentPagination.limit,
        status: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        provider: paymentProviderFilter !== 'all' ? paymentProviderFilter : undefined,
        search: debouncedPaymentSearch || undefined,
      });

      setPayments(res.payments || []);
      if (res.stats) setSalesStats(res.stats);
      if (res.pagination) paymentPagination.setTotal(res.pagination.total || 0);
    } catch (err) {
      setPaymentError(err.message || 'Failed to load payment transactions.');
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'returns') {
      fetchReturnsAndCancellations();
    } else {
      fetchPaymentsAndSales();
    }
  }, [
    activeSection,
    returnPagination.page,
    returnFilter,
    debouncedReturnSearch,
    paymentPagination.page,
    paymentStatusFilter,
    paymentProviderFilter,
    debouncedPaymentSearch,
  ]);

  // ----------------------------------------------------
  // Action Handlers
  // ----------------------------------------------------
  const handleOpenReviewModal = (order) => {
    setSelectedOrderForReview(order);
    setReviewAction('approve');
    setReviewNotes('');
    setCustomRefundAmount(order.pricing?.totalPayable || 0);
    setActionError('');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedOrderForReview) return;
    try {
      setIsActionSubmitting(true);
      setActionError('');

      await financeApi.reviewReturnRequest(selectedOrderForReview._id, {
        action: reviewAction,
        notes: reviewNotes,
        refundAmount: reviewAction === 'approve' ? Number(customRefundAmount) : undefined,
      });

      showToast(
        'success',
        `Return request for ${selectedOrderForReview.orderNumber} successfully ${reviewAction}d.`
      );
      setIsReviewModalOpen(false);
      setSelectedOrderForReview(null);
      await fetchReturnsAndCancellations();
    } catch (err) {
      setActionError(err.message || 'Failed to submit return request review.');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleOpenRefundModal = (order) => {
    setSelectedOrderForRefund(order);
    const payable = order.returnRequest?.refundAmount || order.pricing?.totalPayable || 0;
    setRefundAmountInput(payable);
    setRefundTxnId(`REF-TXN-${Date.now().toString().slice(-6)}`);
    setRefundReason(order.returnRequest?.reason || order.cancellation?.reason || 'Customer refund settlement');
    setActionError('');
    setIsRefundModalOpen(true);
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    if (!selectedOrderForRefund) return;
    try {
      setIsActionSubmitting(true);
      setActionError('');

      await financeApi.recordRefund(selectedOrderForRefund._id, {
        refundTransactionId: refundTxnId,
        refundAmount: Number(refundAmountInput),
        reason: refundReason,
      });

      showToast(
        'success',
        `Refund of ₹${Number(refundAmountInput).toLocaleString('en-IN')} recorded for Order ${selectedOrderForRefund.orderNumber}.`
      );
      setIsRefundModalOpen(false);
      setSelectedOrderForRefund(null);
      await fetchReturnsAndCancellations();
      if (activeSection === 'sales') await fetchPaymentsAndSales();
    } catch (err) {
      setActionError(err.message || 'Failed to record refund.');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // SECTION 1 COLUMNS: Returns & Cancellations Table
  // ----------------------------------------------------
  const returnColumns = [
    {
      header: 'Order # & Date',
      key: 'orderNumber',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
            {row.orderNumber}
          </span>
          <div className="text-[11px] text-slate-400">
            {formatDate(row.createdAt)}
          </div>
        </div>
      ),
    },
    {
      header: 'Customer Details',
      key: 'customer',
      render: (row) => (
        <div>
          <div className="font-medium text-xs text-slate-900 dark:text-slate-100">
            {row.shippingAddress?.fullName || row.user?.name || 'Customer'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {row.shippingAddress?.phone || row.user?.phone || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Payable Amount',
      key: 'totalPayable',
      render: (row) => (
        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 font-mono">
          {formatCurrency(row.pricing?.totalPayable || 0)}
        </span>
      ),
    },
    {
      header: 'Request Type',
      key: 'type',
      render: (row) => {
        const isCancellation = row.orderStatus === 'cancelled' || row.cancellation?.isCancelled;
        return isCancellation ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Ban className="w-3 h-3" /> Cancellation
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <RotateCcw className="w-3 h-3" /> Return Request
          </span>
        );
      },
    },
    {
      header: 'Reason / Notes',
      key: 'reason',
      render: (row) => {
        const reason = row.returnRequest?.reason || row.cancellation?.reason || 'No specific reason provided';
        return (
          <div className="max-w-[200px] text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
            {reason}
          </div>
        );
      },
    },
    {
      header: 'Processing Status',
      key: 'orderStatus',
      render: (row) => {
        if (row.orderStatus === 'refunded') {
          return <StatusBadge status="success" text="Refund Settled" />;
        }
        if (row.orderStatus === 'returned') {
          return <StatusBadge status="info" text="Return Approved (Ready for Refund)" />;
        }
        if (row.orderStatus === 'cancelled') {
          return <StatusBadge status="warning" text="Cancelled (Pending Refund)" />;
        }
        if (row.orderStatus === 'return_requested') {
          return <StatusBadge status="warning" text="Pending Return Review" />;
        }
        return <StatusBadge status="neutral" text={row.orderStatus} />;
      },
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => {
        if (row.orderStatus === 'return_requested') {
          return (
            <Button
              variant="primary"
              size="sm"
              className="text-xs py-1 px-2.5"
              leftIcon={ShieldCheck}
              onClick={() => handleOpenReviewModal(row)}
            >
              Review Request
            </Button>
          );
        }

        if (row.orderStatus === 'returned' || row.orderStatus === 'cancelled') {
          return (
            <Button
              variant="warning"
              size="sm"
              className="text-xs py-1 px-2.5"
              leftIcon={DollarSign}
              onClick={() => handleOpenRefundModal(row)}
            >
              Process Refund
            </Button>
          );
        }

        return (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      },
    },
  ];

  // ----------------------------------------------------
  // SECTION 2 COLUMNS: Tabulated Payments Table
  // ----------------------------------------------------
  const paymentColumns = [
    {
      header: 'Transaction Reference',
      key: 'transactionId',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {row.transactionId}
          </span>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Order: <strong className="text-slate-600 dark:text-slate-300 font-mono">{row.orderNumber}</strong>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer Details',
      key: 'customerName',
      render: (row) => (
        <div>
          <div className="font-medium text-xs text-slate-900 dark:text-slate-100">{row.customerName}</div>
          <div className="text-[11px] text-slate-400 font-mono line-clamp-1">{row.customerEmail}</div>
        </div>
      ),
    },
    {
      header: 'Payment Method',
      key: 'provider',
      render: (row) => {
        const prov = (row.provider || 'razorpay').toLowerCase();
        let label = 'Razorpay Gateway';
        let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';

        if (prov === 'upi') {
          label = 'UPI Instant';
          badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
        } else if (prov === 'cod') {
          label = 'Cash on Delivery';
          badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
        }

        return (
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${badgeStyle}`}>
            <CreditCard className="w-3 h-3" />
            {label}
          </span>
        );
      },
    },
    {
      header: 'Amount Paid',
      key: 'amount',
      render: (row) => (
        <span className="font-bold font-mono text-xs text-slate-900 dark:text-slate-100">
          {formatCurrency(row.amount || 0)}
        </span>
      ),
    },
    {
      header: 'Payment Status',
      key: 'paymentStatus',
      render: (row) => {
        if (row.paymentStatus === 'refunded') {
          return <StatusBadge status="danger" text="Refunded" />;
        }
        if (row.paymentStatus === 'captured' || row.paymentStatus === 'paid') {
          return <StatusBadge status="success" text="Captured / Paid" />;
        }
        if (row.paymentStatus === 'failed') {
          return <StatusBadge status="danger" text="Failed" />;
        }
        return <StatusBadge status="warning" text="Pending Verification" />;
      },
    },
    {
      header: 'Processed Timestamp',
      key: 'paidAt',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(row.paidAt || row.createdAt)}
        </span>
      ),
    },
    {
      header: 'Audit',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          className="text-xs py-1 px-2"
          leftIcon={Eye}
          onClick={() => {
            setSelectedPaymentDetail(row);
            setIsPaymentDetailModalOpen(true);
          }}
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Finance & Revenue Operations"
        subtitle="Two dedicated portals: Process return & cancellation refund workflows, and audit platform revenue with live processed payment transactions."
      />

      {/* Global Toast */}
      {toast.message && (
        <div
          className={`p-3.5 border rounded-xl text-sm flex items-center gap-2.5 shadow-sm animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Domain Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveSection('returns')}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
            activeSection === 'returns'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          1. Returns & Cancellation Requests
          {returnMetrics.returnRequestedCount + returnMetrics.pendingRefundCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
              {returnMetrics.returnRequestedCount + returnMetrics.pendingRefundCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection('sales')}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
            activeSection === 'sales'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          2. Sales Revenue & Processed Payments
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: RETURNS & CANCELLATION REQUESTS PORTAL         */}
      {/* ======================================================== */}
      {activeSection === 'returns' && (
        <div className="space-y-6">
          {/* Section 1 Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setReturnFilter('return_requested')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                returnFilter === 'return_requested'
                  ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Return Reviews Needed
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                {returnMetrics.returnRequestedCount}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Awaiting return approval or rejection
              </p>
            </div>

            <div
              onClick={() => setReturnFilter('pending_refund')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                returnFilter === 'pending_refund'
                  ? 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Pending Refund Payouts
                </span>
                <RotateCcw className="w-4 h-4 text-rose-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
                {returnMetrics.pendingRefundCount}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Returned or cancelled orders needing payout
              </p>
            </div>

            <div
              onClick={() => setReturnFilter('refunded')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                returnFilter === 'refunded'
                  ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Completed Refunds
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {returnMetrics.refundedCount}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Settled customer transactions
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Refund Value
                </span>
                <DollarSign className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {formatCurrency(returnMetrics.totalRefundedAmount)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Total refunded to customers
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Filter:
              </span>
              <button
                onClick={() => setReturnFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  returnFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                All Requests ({returnMetrics.totalRequests})
              </button>
              <button
                onClick={() => setReturnFilter('return_requested')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  returnFilter === 'return_requested'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                Return Requested ({returnMetrics.returnRequestedCount})
              </button>
              <button
                onClick={() => setReturnFilter('pending_refund')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  returnFilter === 'pending_refund'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                Pending Refund ({returnMetrics.pendingRefundCount})
              </button>
              <button
                onClick={() => setReturnFilter('refunded')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  returnFilter === 'refunded'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                Refund Completed ({returnMetrics.refundedCount})
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SearchInput
                value={returnSearch}
                onChange={setReturnSearch}
                placeholder="Search order #, customer name..."
                className="w-full sm:w-64"
              />
              <Button
                variant="secondary"
                size="sm"
                leftIcon={RefreshCw}
                onClick={fetchReturnsAndCancellations}
              />
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={returnColumns}
            data={returnRequests}
            isLoading={returnLoading}
            error={returnError}
            onRetry={fetchReturnsAndCancellations}
            emptyTitle="No Return or Cancellation Requests"
            emptyMessage="There are currently no orders in return_requested, returned, or cancelled status matching your query."
          />

          {!returnLoading && !returnError && returnRequests.length > 0 && (
            <Pagination
              page={returnPagination.page}
              totalPages={returnPagination.totalPages}
              total={returnPagination.total}
              limit={returnPagination.limit}
              onNext={returnPagination.nextPage}
              onPrev={returnPagination.prevPage}
              hasNext={returnPagination.hasNextPage}
              hasPrev={returnPagination.hasPrevPage}
            />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: SALES REVENUE & PROCESSED PAYMENTS PORTAL       */}
      {/* ======================================================== */}
      {activeSection === 'sales' && (
        <div className="space-y-6">
          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Gross Merchandise Value
                </span>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {formatCurrency(salesStats.grossVolume)}
              </div>
              <div className="mt-1 text-xs text-slate-500">Total catalog order value</div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Discounts Granted
                </span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrency(salesStats.totalDiscounts)}
              </div>
              <div className="mt-1 text-xs text-slate-500">Promotions & coupon reductions</div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Refunds Deducted
                </span>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
                {formatCurrency(salesStats.totalRefunds)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {salesStats.refundedTransactions} refunded orders
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Net Realized Revenue
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(salesStats.netRevenue)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                AOV: <strong className="text-slate-700 dark:text-slate-300 font-mono">₹{salesStats.averageOrderValue?.toLocaleString('en-IN')}</strong> ({salesStats.capturedTransactions} captured)
              </div>
            </div>
          </div>

          {/* Section 2 Header & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Processed Payments Directory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tabulated records of all financial transactions processed through payment gateways on this platform.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={RefreshCw}
                onClick={fetchPaymentsAndSales}
              >
                Refresh Payments
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <SearchInput
                value={paymentSearch}
                onChange={setPaymentSearch}
                placeholder="Search transaction ID, order #, customer..."
                className="w-full"
              />

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                  Status:
                </label>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value);
                    paymentPagination.resetPage();
                  }}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="captured">Captured / Success</option>
                  <option value="refunded">Refunded</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                  Provider:
                </label>
                <select
                  value={paymentProviderFilter}
                  onChange={(e) => {
                    setPaymentProviderFilter(e.target.value);
                    paymentPagination.resetPage();
                  }}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Providers</option>
                  <option value="razorpay">Razorpay Gateway</option>
                  <option value="upi">UPI Instant</option>
                  <option value="cod">Cash on Delivery</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <DataTable
              columns={paymentColumns}
              data={payments}
              isLoading={paymentLoading}
              error={paymentError}
              onRetry={fetchPaymentsAndSales}
              emptyTitle="No Processed Transactions Found"
              emptyMessage="No payment transactions match your search filter criteria."
            />

            {!paymentLoading && !paymentError && payments.length > 0 && (
              <Pagination
                page={paymentPagination.page}
                totalPages={paymentPagination.totalPages}
                total={paymentPagination.total}
                limit={paymentPagination.limit}
                onNext={paymentPagination.nextPage}
                onPrev={paymentPagination.prevPage}
                hasNext={paymentPagination.hasNextPage}
                hasPrev={paymentPagination.hasPrevPage}
              />
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: REVIEW RETURN REQUEST                           */}
      {/* ======================================================== */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Review Return Request: ${selectedOrderForReview?.orderNumber}`}
      >
        {selectedOrderForReview && (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {actionError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs">
                {actionError}
              </div>
            )}

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedOrderForReview.shippingAddress?.fullName || 'Customer'} (
                  {selectedOrderForReview.shippingAddress?.phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Order Payable:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {formatCurrency(selectedOrderForReview.pricing?.totalPayable || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer's Return Reason:</span>
                <span className="font-medium text-amber-700 dark:text-amber-300 italic">
                  "{selectedOrderForReview.returnRequest?.reason || 'Standard return'}"
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Decision Action
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewAction('approve')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                  Approve Return
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('reject')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                    reviewAction === 'reject'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <X className="w-4 h-4 text-rose-600" />
                  Reject Return
                </button>
              </div>
            </div>

            {reviewAction === 'approve' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Approved Refund Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedOrderForReview.pricing?.totalPayable || 999999}
                  value={customRefundAmount}
                  onChange={(e) => setCustomRefundAmount(e.target.value)}
                  className="w-full text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Inspection & Review Notes
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Items returned in original seal, quality inspection passed..."
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setIsReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={reviewAction === 'approve' ? 'primary' : 'danger'}
                size="sm"
                isLoading={isActionSubmitting}
              >
                Confirm Decision
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: PROCESS / RECORD REFUND                         */}
      {/* ======================================================== */}
      <Modal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        title={`Process Refund Payout: ${selectedOrderForRefund?.orderNumber}`}
      >
        {selectedOrderForRefund && (
          <form onSubmit={handleSubmitRefund} className="space-y-4">
            {actionError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs">
                {actionError}
              </div>
            )}

            <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Reference:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {selectedOrderForRefund.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {selectedOrderForRefund.shippingAddress?.fullName || selectedOrderForRefund.user?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway Order ID:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {selectedOrderForRefund.paymentInfo?.paymentOrderId || 'Manual / Cash'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Refund Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                value={refundAmountInput}
                onChange={(e) => setRefundAmountInput(e.target.value)}
                className="w-full text-base font-bold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bank / Gateway Refund Transaction ID
              </label>
              <input
                type="text"
                value={refundTxnId}
                onChange={(e) => setRefundTxnId(e.target.value)}
                placeholder="e.g. rzp_ref_98124018"
                className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Settlement Reason & Documentation
              </label>
              <textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setIsRefundModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isActionSubmitting}
                leftIcon={DollarSign}
              >
                Execute Refund Record
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: TRANSACTION AUDIT INSPECTION                   */}
      {/* ======================================================== */}
      <Modal
        isOpen={isPaymentDetailModalOpen}
        onClose={() => setIsPaymentDetailModalOpen(false)}
        title={`Payment Audit: ${selectedPaymentDetail?.transactionId}`}
      >
        {selectedPaymentDetail && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px]">Associated Order</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {selectedPaymentDetail.orderNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Provider Gateway</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">
                  {selectedPaymentDetail.provider}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Payment Status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                  {selectedPaymentDetail.paymentStatus}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Processed At</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {formatDate(selectedPaymentDetail.paidAt)}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Financial Breakdown
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Gross Catalog Subtotal:</span>
                <span className="font-mono">{formatCurrency(selectedPaymentDetail.subtotal)}</span>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Discount / Coupon Applied:</span>
                <span className="font-mono">-{formatCurrency(selectedPaymentDetail.discount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tax & Shipping:</span>
                <span className="font-mono">
                  {formatCurrency((selectedPaymentDetail.tax || 0) + (selectedPaymentDetail.shippingFee || 0))}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Total Net Collected:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedPaymentDetail.amount)}
                </span>
              </div>
            </div>

            {selectedPaymentDetail.refundInfo && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1">
                <span className="font-bold text-rose-700 dark:text-rose-300 block">Refund Record</span>
                <div className="text-slate-600 dark:text-slate-300">
                  Amount: <strong className="font-mono">{formatCurrency(selectedPaymentDetail.refundInfo.refundAmount)}</strong>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Reason: {selectedPaymentDetail.refundInfo.reason}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setIsPaymentDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FinancePage;
