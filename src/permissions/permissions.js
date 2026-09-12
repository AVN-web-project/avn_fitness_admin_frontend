export const PERMISSIONS = {
  // Products & Categories
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_MANAGE: 'categories.manage',

  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_ADJUST: 'inventory.adjust',

  // Orders, Shipments, Returns & Refunds
  ORDERS_VIEW: 'orders.view',
  ORDERS_PROCESS: 'orders.process',
  ORDERS_UPDATE_STATUS: 'orders.update_status',
  SHIPMENTS_VIEW: 'shipments.view',
  SHIPMENTS_UPDATE: 'shipments.update',
  RETURNS_VIEW: 'returns.view',
  RETURNS_PROCESS: 'returns.process',
  REFUNDS_VIEW: 'refunds.view',
  REFUNDS_PROCESS: 'refunds.process',

  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_MANAGE: 'customers.manage',

  // Support Tickets
  SUPPORT_VIEW: 'support.view',
  SUPPORT_REPLY: 'support.reply',
  SUPPORT_UPDATE: 'support.update',
  SUPPORT_ASSIGN: 'support.assign',

  // Marketing & Reviews
  COUPONS_VIEW: 'coupons.view',
  COUPONS_CREATE: 'coupons.create',
  COUPONS_EDIT: 'coupons.edit',
  COUPONS_ACTIVATE: 'coupons.activate',
  REVIEWS_VIEW: 'reviews.view',
  REVIEWS_MODERATE: 'reviews.moderate',

  // Finance & Payments
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_PROCESS: 'payments.process',
  FINANCE_REPORTS: 'finance.reports',

  // Staff & RBAC
  STAFF_VIEW: 'staff.view',
  STAFF_CREATE: 'staff.create',
  STAFF_EDIT: 'staff.edit',
  STAFF_ASSIGN_ROLE: 'staff.assign_role',

  // Activity Logs
  ACTIVITY_LOGS_VIEW_ALL: 'activity_logs.view_all',
  ACTIVITY_LOGS_VIEW_SCOPED: 'activity_logs.view_scoped',
  ACTIVITY_LOGS_EXPORT: 'activity_logs.export'
};