import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * Tracks when the admin portal's data was last refreshed, so a single shared line in
 * the layout footer can report it instead of a badge on every page.
 *
 * Pages call markUpdated() once a fetch has actually resolved — so the time reflects a
 * completed read, not a click. Because it lives in the layout, the footer shows the
 * current page's freshness without each page rendering anything itself.
 */
const AutoRefreshContext = createContext(null);

export const AutoRefreshProvider = ({ children }) => {
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const markUpdated = useCallback(() => {
    setLastUpdatedAt(new Date());
  }, []);

  const value = useMemo(() => ({ lastUpdatedAt, markUpdated }), [lastUpdatedAt, markUpdated]);

  return <AutoRefreshContext.Provider value={value}>{children}</AutoRefreshContext.Provider>;
};

export const useAutoRefreshContext = () => {
  const ctx = useContext(AutoRefreshContext);
  if (!ctx) {
    throw new Error('useAutoRefreshContext must be used inside an AutoRefreshProvider.');
  }
  return ctx;
};

/**
 * The footer line. Deliberately plain — no pill, no colour, no icon.
 */
export const AutoRefreshStatus = () => {
  const { lastUpdatedAt } = useAutoRefreshContext();

  if (!lastUpdatedAt) return null;

  const time = lastUpdatedAt.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',   // e.g. "07:45 pm IST"
  });

  return (
    <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
      <Clock className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
        Updated {time}
      </p>
    </div>
  );
};

export default AutoRefreshProvider;
