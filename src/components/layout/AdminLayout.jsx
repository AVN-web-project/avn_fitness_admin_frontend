import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import MobileSidebar from './MobileSidebar.jsx';
import ToastProvider from '../../context/ToastContext.jsx';
import AutoRefreshProvider, { AutoRefreshStatus } from '../../context/AutoRefreshContext.jsx';
import DataCacheProvider, { useDataCache, cacheKey } from '../../context/DataCacheContext.jsx';
import { ordersApi } from '../../services/ordersApi.js';
import { productsApi } from '../../services/productsApi.js';
import { customersApi } from '../../services/customersApi.js';

/**
 * Domains to warm once the admin loads, so the first visit to each paints instantly.
 *
 * Deliberately a short list of the heaviest sections. Prefetching everything would just
 * trade one slow screen for a slower login. The params must match what each page sends
 * on its first load, or the keys won't line up and the cache won't be hit.
 */
const PREFETCH = [
  ['orders', { page: 1, limit: 20 }, () => ordersApi.getOrders({ page: 1, limit: 20 })],
  ['products', {}, () => productsApi.getProducts({})],
  ['customers', { page: 1, limit: 20 }, () => customersApi.getCustomers({ page: 1, limit: 20 })],
];

const AdminShell = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cache = useDataCache();

  useEffect(() => {
    let cancelled = false;

    const warm = async () => {
      await Promise.allSettled(
        PREFETCH.map(async ([domain, params, run]) => {
          const key = cacheKey(domain, params);
          if (cache.read(key)) return;                 // already warm — don't refetch
          try {
            const data = await run();
            if (!cancelled) cache.write(key, data);
          } catch {
            // A failed prefetch is harmless — the page will fetch normally on visit.
          }
        })
      );
    };

    warm();
    return () => { cancelled = true; };
  }, [cache]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer — plain last-updated line, shared across every page */}
        <footer className="px-4 lg:px-8 pb-5 max-w-7xl w-full mx-auto">
          <AutoRefreshStatus />
        </footer>
      </div>
    </div>
  );
};

export const AdminLayout = () => (
  // Providers wrap the whole authenticated area:
  //  - ToastProvider   — one notification viewport for every page
  //  - AutoRefreshProvider — the shared "last updated" time for the footer
  //  - DataCacheProvider   — in-memory domain cache so navigation paints instantly
  <ToastProvider>
    <AutoRefreshProvider>
      <DataCacheProvider>
        <AdminShell />
      </DataCacheProvider>
    </AutoRefreshProvider>
  </ToastProvider>
);

export default AdminLayout;
