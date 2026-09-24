import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import PermissionRoute from './PermissionRoute.jsx';
import AdminLayout from '../components/layout/AdminLayout.jsx';

import LoginPage from '../pages/auth/LoginPage.jsx';
import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import ProductsPage from '../pages/products/ProductsPage.jsx';
import InventoryPage from '../pages/inventory/InventoryPage.jsx';
import OrdersPage from '../pages/orders/OrdersPage.jsx';
import CustomersPage from '../pages/customers/CustomersPage.jsx';
import SupportPage from '../pages/support/SupportPage.jsx';
import MarketingPage from '../pages/marketing/MarketingPage.jsx';
import FinancePage from '../pages/finance/FinancePage.jsx';
import StaffPage from '../pages/staff/StaffPage.jsx';
import ActivityLogsPage from '../pages/activity-logs/ActivityLogsPage.jsx';
import UnauthorizedPage from '../pages/UnauthorizedPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

import { PERMISSIONS } from '../permissions/permissions.js';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Management Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Products */}
        <Route
          path="products"
          element={
            <PermissionRoute permission={PERMISSIONS.PRODUCTS_VIEW}>
              <ProductsPage />
            </PermissionRoute>
          }
        />

        {/* Inventory */}
        <Route
          path="inventory"
          element={
            <PermissionRoute permission={PERMISSIONS.INVENTORY_VIEW}>
              <InventoryPage />
            </PermissionRoute>
          }
        />

        {/* Orders */}
        <Route
          path="orders"
          element={
            <PermissionRoute permission={PERMISSIONS.ORDERS_VIEW}>
              <OrdersPage />
            </PermissionRoute>
          }
        />

        {/* Customers */}
        <Route
          path="customers"
          element={
            <PermissionRoute permission={PERMISSIONS.CUSTOMERS_VIEW}>
              <CustomersPage />
            </PermissionRoute>
          }
        />

        {/* Support */}
        <Route
          path="support"
          element={
            <PermissionRoute permission={PERMISSIONS.SUPPORT_VIEW}>
              <SupportPage />
            </PermissionRoute>
          }
        />

        {/* Marketing */}
        <Route
          path="marketing"
          element={
            <PermissionRoute permission={PERMISSIONS.COUPONS_VIEW}>
              <MarketingPage />
            </PermissionRoute>
          }
        />

        {/* Finance */}
        <Route
          path="finance"
          element={
            <PermissionRoute
              permissions={[
                PERMISSIONS.PAYMENTS_VIEW,
                PERMISSIONS.FINANCE_REPORTS,
                'payments.view',
                'finance.reports',
                'refunds.process',
                'refunds.view',
                'returns.process',
              ]}
            >
              <FinancePage />
            </PermissionRoute>
          }
        />

        {/* Staff Management */}
        <Route
          path="staff"
          element={
            <PermissionRoute permission={PERMISSIONS.STAFF_VIEW}>
              <StaffPage />
            </PermissionRoute>
          }
        />

        {/* Activity Logs (Accessible to Super Admins & Departmental Scoped Staff) */}
        <Route
          path="activity-logs"
          element={
            <PermissionRoute
              permissions={[
                PERMISSIONS.ACTIVITY_LOGS_VIEW_ALL,
                PERMISSIONS.ACTIVITY_LOGS_VIEW_SCOPED,
                'activity_logs.view_all',
                'activity_logs.view_scoped',
              ]}
            >
              <ActivityLogsPage />
            </PermissionRoute>
          }
        />

        {/* Fallbacks within Layout */}
        <Route path="unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Global 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
