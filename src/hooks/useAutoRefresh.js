import { useEffect, useRef } from 'react';
import { useAutoRefreshContext } from '../context/AutoRefreshContext.jsx';

/**
 * useAutoRefresh — keeps a page's data in sync without a manual refresh.
 *
 * Calls `refetch({ silent: true })` on an interval. The `silent` flag tells the page's
 * fetch function to skip its loading spinner, so a background refresh never flashes the
 * page. Pass the page's existing fetch function straight in — the manual Refresh button
 * keeps working exactly as before.
 *
 * Each successful refresh reports the time through AutoRefreshContext, which is what the
 * shared "Updated hh:mm" line in the layout footer reads.
 *
 * Two behaviours worth knowing:
 *  - The timer is SKIPPED while the tab is hidden, so a backgrounded admin tab does not
 *    hammer the API.
 *  - Returning to the tab triggers an immediate refresh rather than waiting out the
 *    remainder of the interval.
 *
 * Usage:
 *   const fetchOrders = async ({ silent = false } = {}) => {
 *     if (!silent) setLoading(true);
 *     ...
 *   };
 *   useAutoRefresh(fetchOrders, { intervalMs: 30000 });
 */
export const useAutoRefresh = (refetch, { intervalMs = 30000, enabled = true } = {}) => {
  const { markUpdated } = useAutoRefreshContext();
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!enabled || !intervalMs) return undefined;

    const run = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      try {
        await refetchRef.current({ silent: true });
        markUpdated();
      } catch {
        // Swallow — the page's own fetch already surfaces its error state.
      }
    };

    const timer = setInterval(run, intervalMs);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, intervalMs, markUpdated]);
};

export default useAutoRefresh;
