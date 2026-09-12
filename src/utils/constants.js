export const ORDER_STATUS = Object.freeze({
  PENDING_PAYMENT: 'pending_payment',
  PAID_CONFIRMED: 'paid_confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURN_REQUESTED: 'return_requested',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
  PAYMENT_FAILED: 'payment_failed',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  CAPTURED: 'captured',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

export const SHIPMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  LABEL_CREATED: 'label_created',
  SHIPPED: 'shipped',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  RETURNED: 'returned',
  FAILED: 'failed',
});

export const SUPPORT_STATUS = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
});

export const SUPPORT_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
});

export const PRODUCT_STATUS = Object.freeze({
  ACTIVE: 'active',
  UNAVAILABLE: 'unavailable',
  DISCONTINUED: 'discontinued',
});

export const REVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
});

export const DOMAINS = Object.freeze({
  ORDERS: 'orders',
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  SUPPORT: 'support',
  MARKETING: 'marketing',
  FINANCE: 'finance',
  STAFF: 'staff',
  AUTH: 'auth',
});
