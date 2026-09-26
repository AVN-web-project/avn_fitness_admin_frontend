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
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.PRODUCT_INVENTORY_MANAGER]: 'Product & Inventory Manager',
  [ROLES.ORDER_MANAGER]: 'Order & Logistics Manager',
  [ROLES.CUSTOMER_SUPPORT]: 'Customer Support Lead',
  [ROLES.MARKETING_MANAGER]: 'Marketing & Campaigns Lead',
  [ROLES.FINANCE_MANAGER]: 'Finance & Payouts Lead',
});

export const ROLE_DOMAINS = Object.freeze({
  [ROLES.SUPER_ADMIN]: ['orders', 'products', 'inventory', 'support', 'marketing', 'finance', 'staff', 'auth'],
  [ROLES.PRODUCT_INVENTORY_MANAGER]: ['products', 'inventory', 'categories'],
  [ROLES.ORDER_MANAGER]: ['orders', 'shipments', 'returns'],
  [ROLES.CUSTOMER_SUPPORT]: ['support', 'customers'],
  [ROLES.MARKETING_MANAGER]: ['coupons', 'reviews'],
  [ROLES.FINANCE_MANAGER]: ['payments', 'refunds', 'finance'],
});
