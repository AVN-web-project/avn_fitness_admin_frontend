import { PERMISSIONS } from '../permissions/permissions.js';

export const ROUTE_CONFIG = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    permission: null,
  },
  {
    path: '/products',
    name: 'Products',
    permission: PERMISSIONS.PRODUCTS_VIEW,
  },
  {
    path: '/inventory',
    name: 'Inventory',
    permission: PERMISSIONS.INVENTORY_VIEW,
  },
  {
    path: '/orders',
    name: 'Orders',
    permission: PERMISSIONS.ORDERS_VIEW,
  },
  {
    path: '/customers',
    name: 'Customers',
    permission: PERMISSIONS.CUSTOMERS_VIEW,
  },
  {
    path: '/support',
    name: 'Support',
    permission: PERMISSIONS.SUPPORT_VIEW,
  },
  {
    path: '/marketing',
    name: 'Marketing',
    permission: PERMISSIONS.COUPONS_VIEW,
  },
  {
    path: '/finance',
    name: 'Finance',
    permissions: [PERMISSIONS.PAYMENTS_VIEW, PERMISSIONS.FINANCE_REPORTS],
  },
  {
    path: '/staff',
    name: 'Staff Management',
    permission: PERMISSIONS.STAFF_VIEW,
  },
  {
    path: '/activity-logs',
    name: 'Activity Logs',
    permissions: [PERMISSIONS.ACTIVITY_LOGS_VIEW_ALL, PERMISSIONS.ACTIVITY_LOGS_VIEW_SCOPED],
  },
];

export default ROUTE_CONFIG;
