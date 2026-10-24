import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Package, MapPin, CreditCard, Clock, Ticket, User, Phone, Mail,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl.js';

/**
 * Slide-over drawer showing the COMPLETE order — line items, shipping address,
 * full pricing breakdown, payment details, applied coupon and status history.
 *
 * Data source: the row from GET /operations/orders, which returns full order
 * documents (no projection), so no extra fetch is required.
 */
export const OrderDetailsDrawer = ({ isOpen, onClose, order }) => {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const items = order.items || [];
  const pricing = order.pricing || {};
  const address = order.shippingAddress || {};
  const payment = order.paymentInfo || {};
  const history = order.statusHistory || [];
  const coupon = order.appliedCoupon;

  const money = (value) => formatCurrency(Number(value) || 0);
  const has = (value) => value !== undefined && value !== null && Number(value) !== 0;

  const Section = ({ icon: Icon, title, children }) => (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-slate-400" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </h4>
      </div>
      {children}
    </section>
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
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold font-mono text-slate-900 dark:text-slate-100">
                {order.orderNumber || order._id}
              </h3>
              <StatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Placed {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-6">
          {/* Customer */}
          <Section icon={User} title="Customer">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {order.user?.name || address.fullName || 'Customer'}
              </div>
              {(order.user?.email || order.user?.phone) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {order.user?.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> {order.user.email}
                    </span>
                  )}
                  {order.user?.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {order.user.phone}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Section>

          {/* Items */}
          <Section icon={Package} title={`Items (${items.length})`}>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, idx) => (
                <div key={item._id || `${item.variantSku}-${idx}`} className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={resolveMediaUrl(item.image)}
                      loading="lazy"
                      decoding="async"
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = '/placeholder-product.png'; }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {item.variantTitle || 'Standard'}
                      <span className="mx-1.5 text-slate-300 dark:text-slate-600">|</span>
                      <span className="font-mono">{item.variantSku || '—'}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {money(item.subtotal)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.quantity} × {money(item.price)}
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="p-4 text-sm text-slate-500 dark:text-slate-400">No line items on this order.</div>
              )}
            </div>
          </Section>

          {/* Shipping address */}
          <Section icon={MapPin} title="Shipping Address">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-700 dark:text-slate-300 space-y-0.5">
              <div className="font-medium text-slate-800 dark:text-slate-200">{address.fullName || '—'}</div>
              {address.phone && <div className="text-xs text-slate-500 dark:text-slate-400">{address.phone}</div>}
              <div className="pt-1">{address.street || '—'}</div>
              <div>
                {[address.city, address.state].filter(Boolean).join(', ')}
                {address.pincode ? ` - ${address.pincode}` : ''}
              </div>
              <div>{address.country || 'India'}</div>
            </div>
          </Section>

          {/* Pricing breakdown */}
          <Section icon={CreditCard} title="Pricing Breakdown">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="text-slate-800 dark:text-slate-200">{money(pricing.subtotal)}</span>
              </div>
              {has(pricing.discount) && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount{coupon?.code ? ` (${coupon.code})` : ''}</span>
                  <span>− {money(pricing.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {Number(pricing.shippingFee) > 0 ? money(pricing.shippingFee) : 'Free'}
                </span>
              </div>
              {has(pricing.handlingFee) && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Handling fee</span>
                  <span className="text-slate-800 dark:text-slate-200">{money(pricing.handlingFee)}</span>
                </div>
              )}
              {has(pricing.codSurcharge) && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>COD surcharge</span>
                  <span className="text-slate-800 dark:text-slate-200">{money(pricing.codSurcharge)}</span>
                </div>
              )}
              {has(pricing.tax) && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tax</span>
                  <span className="text-slate-800 dark:text-slate-200">{money(pricing.tax)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-base font-bold text-slate-900 dark:text-slate-100">
                <span>Total payable</span>
                <span>{money(pricing.totalPayable)}</span>
              </div>
            </div>
          </Section>

          {/* Payment */}
          <Section icon={CreditCard} title="Payment">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Provider</div>
                <div className="text-slate-800 dark:text-slate-200 capitalize">
                  {payment.provider === 'mock' ? 'Online test' : (payment.provider || '—')}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Method</div>
                <div className="text-slate-800 dark:text-slate-200 uppercase">{payment.method || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Payment status</div>
                <div className="text-slate-800 dark:text-slate-200 capitalize">{payment.paymentStatus || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Paid at</div>
                <div className="text-slate-800 dark:text-slate-200">
                  {payment.paidAt ? formatDate(payment.paidAt) : '—'}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">Transaction ID</div>
                <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all">
                  {payment.transactionId || '—'}
                </div>
              </div>
              {payment.paymentOrderId && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Provider order ID</div>
                  <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all">
                    {payment.paymentOrderId}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Coupon */}
          {coupon?.code && (
            <Section icon={Ticket} title="Applied Coupon">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between text-sm">
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{coupon.code}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  − {money(coupon.discountAmount)}
                </span>
              </div>
            </Section>
          )}

          {/* Status history */}
          <Section icon={Clock} title="Status History">
            <ol className="relative border-l border-slate-200 dark:border-slate-800 ml-2 space-y-4">
              {history.map((entry, idx) => (
                <li key={idx} className="ml-4">
                  <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={entry.status} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{entry.note}</p>
                  )}
                  {entry.changedByRole && (
                    <p className="text-[11px] text-slate-400 mt-0.5 capitalize">by {entry.changedByRole}</p>
                  )}
                </li>
              ))}
              {history.length === 0 && (
                <li className="ml-4 text-sm text-slate-500 dark:text-slate-400">No status history recorded.</li>
              )}
            </ol>
          </Section>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrderDetailsDrawer;
