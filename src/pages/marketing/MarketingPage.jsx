import React, { useEffect, useState } from 'react';
import { Plus, Tag, MessageSquare, AlertCircle, RefreshCw, Check, X, Shield, Megaphone } from 'lucide-react';
import { marketingApi } from '../../services/marketingApi.js';
import { useToast } from '../../hooks/useToast.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import { useAutoRefreshContext } from '../../context/AutoRefreshContext.jsx';
import { useDataCache, cacheKey } from '../../context/DataCacheContext.jsx';

export const MarketingPage = () => {
  const [activeTab, setActiveTab] = useState('coupons'); // coupons | reviews | announcement
  const toast = useToast();

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(true);
  const [couponError, setCouponError] = useState(null);

  // Create Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponFormLoading, setCouponFormLoading] = useState(false);
  const [couponFormError, setCouponFormError] = useState('');
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minCartValue: 499,
    maxDiscountAmount: 300,
    validTillDays: 30,
  });

  // Storefront announcement strip state
  const [announcement, setAnnouncement] = useState({ isEnabled: false, message: '', type: 'custom' });
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');

  const fetchAnnouncement = async () => {
    setAnnouncementLoading(true);
    setAnnouncementError('');

    try {
      const res = await marketingApi.getAnnouncementStrip();
      const data =
        res?.announcementStrip ??
        res?.data?.announcementStrip ??
        res?.data ??
        res;

      setAnnouncement({
        isEnabled: data?.isEnabled ?? false,
        message: data?.message ?? '',
        type: data?.type ?? 'custom',
      });
    } catch (err) {
      console.error('Announcement fetch error:', err);
      setAnnouncementError(err.message || 'Failed to load announcement strip.');
    } finally {
      setAnnouncementLoading(false);
    }
  };

  // Load the saved announcement when the Marketing page first mounts.
  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    setAnnouncementSaving(true);
    setAnnouncementError('');

    try {
      const res = await marketingApi.updateAnnouncementStrip(announcement);
      const data =
        res?.announcementStrip ??
        res?.data?.announcementStrip ??
        res?.data ??
        res;

      if (data && typeof data === 'object') {
        setAnnouncement({
          isEnabled: data.isEnabled ?? announcement.isEnabled,
          message: data.message ?? announcement.message,
          type: data.type ?? announcement.type,
        });
      }

      toast.success('Storefront announcement strip saved.');
    } catch (err) {
      console.error('Announcement save error:', err);
      setAnnouncementError(err.message || 'Failed to save announcement strip.');
    } finally {
      setAnnouncementSaving(false);
    }
  };

  // Reviews Moderation State
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

  const fetchCoupons = async ({ silent = false } = {}) => {
    const key = 'coupons';

    const cached = cache.read(key);
    if (cached && !silent) {
      setCoupons(cached.coupons || cached.items || []);
      setCouponLoading(false);
    }

    try {
      if (!silent) setCouponLoading(true);
      setCouponError(null);
      const res = await marketingApi.getCoupons();
      setCoupons(res.coupons || res.items || []);
      cache.write(key, res);
      markUpdated();
    } catch (err) {
      setCouponError(err.message || 'Failed to load promotional coupons.');
    } finally {
      setCouponLoading(false);
    }
  };

  const fetchReviews = async ({ silent = false } = {}) => {
    const key = 'reviews';

    const cached = cache.read(key);
    if (cached && !silent) {
      setReviews(cached.reviews || cached.items || []);
      setReviewsLoading(false);
    }

    try {
      if (!silent) setReviewsLoading(true);
      setReviewsError(null);
      const res = await marketingApi.getReviewsForModeration();
      setReviews(res.reviews || res.items || []);
      cache.write(key, res);
      markUpdated();
    } catch (err) {
      setReviewsError(err.message || 'Failed to load reviews for moderation.');
    } finally {
      setReviewsLoading(false);
    }
  };

  const { markUpdated } = useAutoRefreshContext();
  const cache = useDataCache();
  useAutoRefresh(fetchCoupons, { intervalMs: 60000 });
  useAutoRefresh(fetchReviews, { intervalMs: 60000 });

  useEffect(() => {
    if (activeTab === 'coupons') {
      fetchCoupons();
    } else if (activeTab === 'reviews') {
      fetchReviews();
    } else {
      fetchAnnouncement();
    }
  }, [activeTab]);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCouponFormError('');
    setCouponFormLoading(true);

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + Number(couponForm.validTillDays));

      await marketingApi.createCoupon({
        code: couponForm.code.toUpperCase().trim(),
        description: couponForm.description,
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minCartValue: Number(couponForm.minCartValue),
        maxDiscountAmount: Number(couponForm.maxDiscountAmount) || undefined,
        startDate,
        endDate,
        isActive: true,
      });

      setIsCouponModalOpen(false);
      setCouponForm({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        minCartValue: 499,
        maxDiscountAmount: 300,
        validTillDays: 30,
      });
      await fetchCoupons();
    } catch (err) {
      setCouponFormError(err.message || 'Failed to create coupon voucher.');
    } finally {
      setCouponFormLoading(false);
    }
  };

  const handleToggleCoupon = async (couponId) => {
    try {
      await marketingApi.toggleCouponStatus(couponId);
      await fetchCoupons();
      toast.success('Coupon status updated.');
    } catch (err) {
      toast.error(err.message || 'Failed to toggle coupon status.');
    }
  };

  const handleModerateReview = async (reviewId, status) => {
    try {
      await marketingApi.moderateReview(reviewId, status);
      await fetchReviews();
      toast.success(`Review ${status}.`);
    } catch (err) {
      toast.error(err.message || 'Failed to moderate review.');
    }
  };

  const couponColumns = [
    {
      header: 'Coupon Code',
      key: 'code',
      render: (row) => (
        <span className="font-mono font-bold tracking-wider text-blue-600 dark:text-blue-400">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Discount',
      key: 'discountValue',
      render: (row) =>
        row.discountType === 'percentage' ? `${row.discountValue}% OFF` : `₹${row.discountValue} OFF`,
    },
    {
      header: 'Min Cart Value',
      key: 'minCartValue',
      render: (row) => `₹${row.minCartValue || 0}`,
    },
    {
      header: 'Expires',
      key: 'endDate',
      render: (row) => formatDate(row.endDate || row.validTill, false),
    },
    {
      header: 'Status',
      key: 'isActive',
      render: (row) => (
        <StatusBadge
          status={row.isActive ? 'active' : 'unavailable'}
          customLabel={row.isActive ? 'Active' : 'Deactivated'}
        />
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <Button
          variant={row.isActive ? 'danger' : 'success'}
          size="sm"
          className="text-xs py-1 px-2.5"
          onClick={() => handleToggleCoupon(row._id)}
        >
          {row.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  const reviewColumns = [
    {
      header: 'Product Item',
      key: 'product',
      render: (row) => (
        <div className="font-semibold text-slate-900 dark:text-slate-100">
          {row.product?.name || 'Product'}
        </div>
      ),
    },
    {
      header: 'Customer Review',
      key: 'content',
      render: (row) => (
        <div className="max-w-md">
          <div className="text-xs font-semibold text-amber-500">★ {row.rating} / 5 Stars</div>
          <div className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">{row.title}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{row.comment || row.content}</div>
        </div>
      ),
    },
    {
      header: 'Submitted',
      key: 'createdAt',
      render: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Moderation Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status !== 'published' && (
            <Button
              variant="success"
              size="sm"
              className="text-xs py-1 px-2"
              leftIcon={Check}
              onClick={() => handleModerateReview(row._id, 'published')}
            >
              Approve
            </Button>
          )}
          {row.status !== 'hidden' && (
            <Button
              variant="danger"
              size="sm"
              className="text-xs py-1 px-2"
              leftIcon={X}
              onClick={() => handleModerateReview(row._id, 'hidden')}
            >
              Hide
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing & Campaigns"
        subtitle="Manage coupons, review moderation, and storefront announcements."
        action={
          activeTab === 'coupons' ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => {
                setCouponFormError('');
                setIsCouponModalOpen(true);
              }}
            >
              Create Coupon
            </Button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'coupons'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Active Coupons & Vouchers</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Review Moderation Queue</span>
        </button>

        <button
          onClick={() => setActiveTab('announcement')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'announcement'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcement Strip</span>
        </button>
      </div>

      {activeTab === 'coupons' ? (
        <DataTable
          columns={couponColumns}
          data={coupons}
          isLoading={couponLoading}
          error={couponError}
          onRetry={fetchCoupons}
          emptyTitle="No coupons created yet"
        />
      ) : activeTab === 'reviews' ? (
        <DataTable
          columns={reviewColumns}
          data={reviews}
          isLoading={reviewsLoading}
          error={reviewsError}
          onRetry={fetchReviews}
          emptyTitle="No reviews pending moderation"
        />
      ) : (
        <div className="max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"><Megaphone className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Storefront Announcement Strip</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Display a message above the homepage hero. Use it for festive offers, stock clearance or occasional campaigns.</p>
            </div>
          </div>
          {announcementError && <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-sm text-rose-700 dark:text-rose-300">{announcementError}</div>}
          {announcementLoading ? <div className="py-8 text-center text-sm text-slate-500">Loading announcement settings…</div> : (
            <form onSubmit={handleSaveAnnouncement} className="space-y-5">
              <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <span><span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Display announcement strip</span><span className="block text-xs text-slate-500 mt-1">Turn the strip on or hide it without deleting the message.</span></span>
                <input type="checkbox" checked={!!announcement.isEnabled} onChange={(e) => setAnnouncement({ ...announcement, isEnabled: e.target.checked })} className="w-5 h-5 accent-blue-600" />
              </label>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">Announcement category</label>
                <select value={announcement.type || 'custom'} onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value })} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
                  <option value="festive">Festive</option><option value="stock_clearance">Stock Clearance</option><option value="seasonal_sale">Seasonal Sale</option><option value="special_offer">Special Offer</option><option value="custom">Custom Announcement</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Message</label><span className="text-xs text-slate-400">{(announcement.message || '').length}/240</span></div>
                <textarea required maxLength={240} rows={3} value={announcement.message || ''} onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })} placeholder="e.g. FESTIVE SALE IS LIVE — UP TO 40% OFF SELECTED GEAR" className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-y" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-2">Live preview</label>
                <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-4 py-4 text-center">
                  <p className="font-heading text-xs sm:text-sm font-black italic tracking-[0.16em] uppercase text-[var(--text-main)]">{announcement.message || 'YOUR ANNOUNCEMENT WILL APPEAR HERE'}</p>
                </div>
                <p className="text-xs text-slate-500 mt-2">Preview uses the storefront's footer-marquee-inspired bold italic typography and subtle border treatment.</p>
              </div>
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800"><Button type="submit" variant="primary" isLoading={announcementSaving}>Save Announcement</Button></div>
            </form>
          )}
        </div>
      )}

      {/* Create Coupon Modal */}
      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        title="Create Promotional Coupon Voucher"
        maxWidth="max-w-md"
      >
        {couponFormError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{couponFormError}</span>
          </div>
        )}

        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Coupon Code
            </label>
            <input
              type="text"
              required
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. SUMMER20"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Discount Type
              </label>
              <select
                value={couponForm.discountType}
                onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Flat Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Discount Value
              </label>
              <input
                type="number"
                min={1}
                required
                value={couponForm.discountValue}
                onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Min Cart Value (₹)
              </label>
              <input
                type="number"
                min={0}
                required
                value={couponForm.minCartValue}
                onChange={(e) => setCouponForm({ ...couponForm, minCartValue: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Validity (Days)
              </label>
              <input
                type="number"
                min={1}
                required
                value={couponForm.validTillDays}
                onChange={(e) => setCouponForm({ ...couponForm, validTillDays: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Description
            </label>
            <input
              type="text"
              required
              value={couponForm.description}
              onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
              placeholder="e.g. 20% discount on orders above ₹999"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsCouponModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={couponFormLoading}>
              Publish Coupon
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MarketingPage;
