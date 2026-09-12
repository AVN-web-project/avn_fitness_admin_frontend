/**
 * Management Roles Definition
 */

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  PRODUCT_INVENTORY_MANAGER: 'product_inventory_manager',
  ORDER_MANAGER: 'order_manager',
  CUSTOMER_SUPPORT: 'customer_support',
  MARKETING_MANAGER: 'marketing_manager',
  FINANCE_MANAGER: 'finance_manager',

  // Legacy backend roles compatibility
  ADMIN: 'admin',
  OPERATIONS: 'operations',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.PRODUCT_INVENTORY_MANAGER]: 'Product & Inventory Manager',
  [ROLES.ORDER_MANAGER]: 'Order Manager',
  [ROLES.CUSTOMER_SUPPORT]: 'Customer Support Executive',
  [ROLES.MARKETING_MANAGER]: 'Marketing Manager',
  [ROLES.FINANCE_MANAGER]: 'Finance Manager',
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.OPERATIONS]: 'Operations Executive',
});

export const ROLE_DOMAINS = Object.freeze({
  [ROLES.SUPER_ADMIN]: ['orders', 'products', 'inventory', 'support', 'marketing', 'finance', 'staff', 'auth'],
  [ROLES.ADMIN]: ['orders', 'products', 'inventory', 'support', 'marketing', 'finance', 'staff', 'auth'],
  [ROLES.PRODUCT_INVENTORY_MANAGER]: ['products', 'inventory', 'categories'],
  [ROLES.ORDER_MANAGER]: ['orders', 'shipments', 'returns', 'refunds'],
  [ROLES.CUSTOMER_SUPPORT]: ['support', 'customers'],
  [ROLES.MARKETING_MANAGER]: ['coupons', 'reviews'],
  [ROLES.FINANCE_MANAGER]: ['payments', 'refunds', 'finance'],
  [ROLES.OPERATIONS]: ['orders', 'shipments', 'returns', 'refunds', 'inventory', 'support', 'reviews'],
});
