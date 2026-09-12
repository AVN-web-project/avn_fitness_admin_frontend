# AVN Management Frontend

Separate React frontend for AVN's administration and operations team.

The management application shares the **same backend and MongoDB database** as the customer-facing AVN frontend, but provides a dedicated management interface with role-based access control (RBAC).

## Finalized Management Roles

1. **Super Admin**
2. **Product + Inventory Manager**
3. **Order Manager** — including logistics, returns & refunds
4. **Customer Support Executive**
5. **Marketing Manager** — including review moderation
6. **Finance Manager**

## Management Collections

Current management-side collections:

- `admin`
- `staff`
- `staff activity logs`
- `payments`
- `shipments`
- `coupons`
- `inventory`
- `support request`

These coexist with shared customer/business collections such as products, orders, users/customers, reviews, and carts.

## Architecture

```text
                    AVN Backend API
                           │
             ┌─────────────┴─────────────┐
             │                           │
      Customer Frontend          Management Frontend
             │                           │
             ▼                           ▼
       Customer APIs             Management APIs
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
                    MongoDB Database
```

The customer and management applications are separate frontends but use the common backend/database.

### Security Principle

Frontend RBAC controls **what the staff member sees and can attempt to do**.

Backend RBAC controls **what the staff member is actually allowed to do**.

Frontend permission checks are not a security boundary.

## Recommended Project Structure

```text
avn-management/
│
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── ...
│
├── src/
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── ...
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── Breadcrumbs.jsx
│   │   │   ├── PageHeader.jsx
│   │   │   └── MobileSidebar.jsx
│   │   │
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── SearchInput.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   └── DateRangePicker.jsx
│   │   │
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── support/
│   │   ├── marketing/
│   │   ├── finance/
│   │   └── staff/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── DashboardPage.jsx
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── support/
│   │   ├── marketing/
│   │   ├── finance/
│   │   └── staff/
│   │
│   ├── context/
│   │   ├── AdminAuthContext.jsx
│   │   ├── PermissionContext.jsx
│   │   └── ThemeContext.jsx
│   │
│   ├── hooks/
│   │   ├── useAdminAuth.js
│   │   ├── usePermission.js
│   │   ├── usePagination.js
│   │   ├── useDebounce.js
│   │   └── useTableFilters.js
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authApi.js
│   │   ├── dashboardApi.js
│   │   ├── productsApi.js
│   │   ├── inventoryApi.js
│   │   ├── ordersApi.js
│   │   ├── customersApi.js
│   │   ├── supportApi.js
│   │   ├── marketingApi.js
│   │   ├── financeApi.js
│   │   └── staffApi.js
│   │
│   ├── permissions/
│   │   ├── roles.js
│   │   ├── permissions.js
│   │   ├── rolePermissions.js
│   │   └── permissionUtils.js
│   │
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── PermissionRoute.jsx
│   │   └── routeConfig.js
│   │
│   ├── utils/
│   │   ├── formatCurrency.js
│   │   ├── formatDate.js
│   │   ├── formatStatus.js
│   │   ├── exportCsv.js
│   │   └── constants.js
│   │
│   ├── styles/
│   │   ├── index.css
│   │   └── admin.css
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## RBAC Model

Permissions should be action-oriented rather than based only on pages.

Example permissions:

```text
products.view
products.create
products.update
products.delete

inventory.view
inventory.update

orders.view
orders.update

shipments.view
shipments.update

returns.view
returns.process

refunds.view
refunds.process

customers.view

support.view
support.respond

coupons.view
coupons.create
coupons.update
coupons.delete

reviews.view
reviews.moderate

payments.view

finance.view
finance.reports

staff.view
staff.create
staff.update
staff.delete

activity_logs.view_all
activity_logs.view_domain
```

The application flow is:

```text
Staff Role
    ↓
Permissions
    ↓
Route Access
    ↓
Page Access
    ↓
UI Action Access
    ↓
Backend Authorization
```

## Role Responsibilities

### Super Admin

Full management access across the platform.

Typical areas:

```text
Dashboard
Orders
Shipments
Returns & Refunds
Products
Categories
Inventory
Customers
Support
Coupons
Reviews
Payments
Finance
Staff
Activity Logs (All Domains)
Admin Settings
```

### Product + Inventory Manager

Responsible for catalog and stock operations.

```text
Dashboard
Products
Categories
Inventory
Stock History
Low Stock
Activity Logs (Product & Inventory Domain)
```

### Order Manager

Responsible for order operations, logistics, returns and refunds.

```text
Dashboard
Orders
Shipments
Returns & Refunds
Customers
Activity Logs (Orders, Shipments & Returns Domain)
```

### Customer Support Executive

Responsible for customer service and support operations.

```text
Dashboard
Customers
Support Requests
Order Lookup
Activity Logs (Support Domain)
```

### Marketing Manager

Responsible for marketing functions and review moderation.

```text
Dashboard
Coupons
Reviews
Marketing Analytics
Activity Logs (Marketing & Reviews Domain)
```

### Finance Manager

Responsible for financial operations.

```text
Dashboard
Payments
Refunds
Financial Reports
Order Financials
Activity Logs (Finance & Payments Domain)
```

## Recommended Routes

```text
/login

/dashboard

/products
/products/new
/products/:id
/products/:id/edit

/categories

/inventory
/inventory/history
/inventory/low-stock

/orders
/orders/:id

/shipments
/shipments/:id

/returns
/refunds

/customers
/customers/:id

/support
/support/:id

/marketing
/marketing/coupons
/marketing/coupons/new
/marketing/coupons/:id/edit
/marketing/reviews

/finance
/finance/payments
/finance/refunds
/finance/reports

/staff
/staff/new
/staff/:id
/staff/:id/edit

/activity-logs

/settings
```

Routes must be protected by authentication and appropriate permissions.

## Role-Aware Navigation

The sidebar should be permission-aware. Staff should only see navigation entries for areas they can access.

Conceptually:

```text
Navigation Item
    │
    ├── label
    ├── icon
    ├── path
    └── requiredPermission
             │
             ▼
       Permission Check
          /       \
       allowed    denied
          │         │
        show      hide
```

## Role-Aware Dashboards

Dashboards should surface information relevant to each staff member's responsibilities.

### Super Admin

```text
Total Sales
Orders
Customers
Low Stock

Revenue Overview
Orders Overview
Low Stock Alerts
Pending Support
Recent Activity
```

### Product + Inventory Manager

```text
Products
Active Products
Low Stock
Out of Stock
Inventory Value
Recent Stock Changes
```

### Order Manager

```text
New Orders
Processing
Packed
Shipped
Delivery Issues
Returns
Refund Pending
```

### Customer Support Executive

```text
Open Tickets
Assigned to Me
High Priority
Awaiting Customer
Resolved Today
```

### Marketing Manager

```text
Active Coupons
Coupon Usage
Reviews Pending
Reviews Moderated
Marketing Performance
```

### Finance Manager

```text
Today's Revenue
Payment Success
Payment Failed
Refund Pending
Refunded Amount
Net Revenue
```

## API Layer

The management frontend should use a dedicated service layer even though it shares the backend with the customer application.

```text
services/
├── api.js
├── authApi.js
├── dashboardApi.js
├── productsApi.js
├── inventoryApi.js
├── ordersApi.js
├── customersApi.js
├── supportApi.js
├── marketingApi.js
├── financeApi.js
└── staffApi.js
```

Pages and components should call service functions rather than scattering `fetch()` calls throughout the UI.

## Authentication

Management authentication state should provide:

```text
staff/admin identity
role
permissions
authentication status
loading state
logout
```

Core infrastructure:

```text
AdminAuthContext
ProtectedRoute
PermissionRoute
```

Unauthorized or expired sessions should redirect to the management login screen.

## Frontend vs Backend Authorization

Frontend:

```js
hasPermission('orders.update')
```

can determine whether an action should be rendered.

Backend authorization must independently verify:

```text
Authenticated user
        ↓
Staff/admin identity
        ↓
Role
        ↓
Permission
        ↓
Requested operation
```

Hiding a button is not sufficient security.

## Auditability & Activity Logs

Management actions must be designed with staff activity logging in mind to ensure accountability and traceability.

### Domain-Scoped Log Access Policy

1. **Super Admin Access (`activity_logs.view_all`)**: Super Admin can view global activity logs across all system domains and filter across any domain.
2. **Staff Domain Access (`activity_logs.view_domain`)**: Staff members can **only view activity logs corresponding to their assigned operational domain** (e.g., Order Managers only see order/shipping logs, Product Managers only see catalog/inventory changes, Support only sees ticket activities).
3. **Server-Side Enforcement**: Backend queries to `/api/v1/activity-logs` must strictly enforce domain filtering based on the authenticated staff member's assigned role and ignore any unauthorized client domain overrides.

### Activity Log Structure

Each activity log entry in the `staff activity logs` collection should contain:

```text
- staffId / staffName
- staffRole
- domain ('orders' | 'products' | 'inventory' | 'support' | 'marketing' | 'finance' | 'staff' | 'auth')
- action ('products.create', 'orders.status_update', etc.)
- resourceId
- details / diff (e.g., before and after state)
- ipAddress / userAgent
- timestamp
```

### Auditable Actions (Examples)

```text
Staff login/logout
Product creation/update/deletion
Inventory adjustment
Order status change
Shipment update
Return processing
Refund processing
Coupon creation/update/deactivation
Review moderation
Staff creation/update/deactivation
Permission/role changes
```

Authorized staff access domain logs through their specific module views or scoped activity log tabs, while Super Admins have access to the dedicated global `/activity-logs` management interface.

## UI Principles

The management interface should prioritize operational efficiency:

- Dense but readable data tables
- Search and filtering
- Pagination
- Clear status badges
- Confirmation dialogs for destructive actions
- Role-aware actions
- Loading states
- Empty states
- Error states
- Responsive layout
- Clear success/error feedback
- Consistent date and currency formatting
- Bulk actions where operationally appropriate
- Export functionality where required

The management UI should optimize for **speed, clarity and accuracy** rather than consumer-style browsing.

## Development Phases

### Phase 1 — Foundation

```text
Vite + React
Tailwind
React Router
Theme
API client
Admin authentication
Protected routes
RBAC
Permission system
Management layout
Sidebar
Topbar
```

### Phase 2 — Dashboard

```text
Dashboard
Role-aware widgets
Notifications
Activity feed
```

### Phase 3 — Product & Inventory

```text
Products
Product creation/editing
Categories
Variants
Inventory
Stock adjustments
Stock history
```

### Phase 4 — Orders & Operations

```text
Orders
Order details
Shipment management
Returns
Refund workflow
```

### Phase 5 — Customers & Support

```text
Customer lookup
Customer details
Support requests
Support conversations
```

### Phase 6 — Marketing

```text
Coupons
Coupon analytics
Review moderation
```

### Phase 7 — Finance

```text
Payments
Refunds
Financial reports
```

### Phase 8 — Staff Management

```text
Staff
Roles
Permissions
Activity logs
Admin controls
```

## Environment Variables

Create `.env` locally:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Do not place secrets, database credentials, private API keys, or privileged backend credentials in the frontend environment.

## Local Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Initial Implementation Priority

The first implementation target is the management foundation:

```text
AdminAuthContext
        ↓
RBAC / Permissions
        ↓
ProtectedRoute
        ↓
PermissionRoute
        ↓
AdminLayout
        ↓
Sidebar
        ↓
Topbar
        ↓
Route Configuration
        ↓
Dashboard
```

Once this foundation is stable, the individual management modules can be implemented without redesigning the application architecture.

## Important Rules

1. Management frontend is separate from the customer frontend.
2. Management and customer applications share the same backend/database.
3. MongoDB must never be accessed directly from the frontend.
4. Frontend RBAC is for UI/UX; backend RBAC is the security boundary.
5. Permissions should be action-oriented.
6. Navigation should be generated from permissions.
7. Destructive operations should require confirmation.
8. Important management actions should be auditable; activity logs must be strictly domain-scoped for staff and only globally accessible by Super Admins.
9. Financial values and other authoritative business data must come from the backend.
10. Never trust client-supplied permissions, prices, totals, roles, or other security-sensitive values.

## Project Status

**Current stage:** Management frontend planning / foundation.

**Finalized roles:**

- Super Admin
- Product + Inventory Manager
- Order Manager
- Customer Support Executive
- Marketing Manager
- Finance Manager

**Finalized management collections:**

- admin
- staff
- staff activity logs
- payments
- shipments
- coupons
- inventory
- support request

**Next implementation target:**

> Build the management authentication + RBAC + layout foundation before implementing individual management modules.
