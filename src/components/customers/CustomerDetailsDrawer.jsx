import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, User, Mail, Phone, Calendar, ShoppingBag, Wallet, Clock, Package,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

/**
 * Slide-over drawer showing a customer's full picture: profile, lifetime order
 * stats and the most recent orders.
 *
 * Data source: GET /admin/users/:id, fetched by the page when View is clicked,
 * so the drawer itself performs no requests.
 */
export const CustomerDetailsDrawer = ({ isOpen, onClose, detail, isLoading }) => {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const customer = detail?.customer || {};
  const stats = detail?.stats || {};
  const orders = detail?.orders || [];

  const money = (value) => formatCurrency(Number(value) || 0);

  const Field = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
        <div className="text-sm text-slate-900 dark:text-slate-100 font-medium break-words">
          {value || '—'}
        </div>
      </div>
    </div>
  );

  const Stat = ({ label, value, tone = 'default' }) => (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
      <div
        className={`mt-1 text-lg font-bold font-mono ${
          tone === 'accent' ? 'text-[#2563EB]' : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {value}
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                {customer.name || 'Customer'}
              </h3>
              <StatusBadge
                status={customer.isActive !== false ? 'active' : 'unavailable'}
                customLabel={customer.isActive !== false ? 'Active' : 'Disabled'}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {customer.email || '—'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-700 border-t-[#2563EB] rounded-full animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Loading customer…</p>
            </div>
          ) : (
            <>
              {/* Lifetime stats */}
              <section className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Overview
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Orders" value={stats.orderCount || 0} />
                  <Stat label="Lifetime Value" value={money(stats.lifetimeValue)} tone="accent" />
                  <Stat
                    label="Last Order"
                    value={stats.lastOrderAt ? formatDate(stats.lastOrderAt, false) : '—'}
                  />
                </div>
              </section>

              {/* Profile */}
              <section className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Profile
                </h4>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={User} label="Name" value={customer.name} />
                  <Field icon={Mail} label="Email" value={customer.email} />
                  <Field icon={Phone} label="Phone" value={customer.phone} />
                  <Field icon={Calendar} label="Joined On" value={formatDate(customer.createdAt, false)} />
                  <Field
                    icon={Clock}
                    label="Last Login"
                    value={customer.lastLoginAt ? formatDate(customer.lastLoginAt, false) : 'Never'}
                  />
                  <Field icon={ShoppingBag} label="Sign-in Method" value={customer.authProvider || 'local'} />
                </div>
              </section>

              {/* Recent orders */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Recent Orders
                  </h4>
                  {stats.orderCount > orders.length && (
                    <span className="text-[10px] text-slate-400">
                      Showing latest {orders.length} of {stats.orderCount}
                    </span>
                  )}
                </div>

                {orders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
                    <Package className="w-6 h-6 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      This customer hasn't placed any orders yet.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {orders.map((order) => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold font-mono text-slate-900 dark:text-slate-100 truncate">
                            {order.orderNumber || '—'}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatDate(order.createdAt, false)}
                            {order.items?.length ? ` · ${order.items.length} item${order.items.length === 1 ? '' : 's'}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <StatusBadge status={order.orderStatus} />
                          <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                            {money(order.pricing?.totalPayable)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CustomerDetailsDrawer;
