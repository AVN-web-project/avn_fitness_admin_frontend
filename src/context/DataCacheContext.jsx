import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

/**
 * In-memory cache for the admin portal's domain data.
 *
 * The problem it solves: every page fetches on mount and gates its render behind a
 * spinner, so switching Orders -> Products pays a full round-trip and shows a loading
 * screen each time. This lets a page paint the last known response immediately and
 * revalidate in the background.
 *
 * Design rules that keep it safe:
 *  - It stores the RAW API response. The page still does its own shaping, so no page
 *    logic changes — a page adds a read at the top of its fetch and a write at the end.
 *  - The fetch ALWAYS still runs. The cache is a paint-ahead, never a source of truth,
 *    so a stale entry is corrected within the same request cycle.
 *  - Keys include the query params, so a filtered view never seeds from an unfiltered
 *    one.
 *  - It lives in memory inside the layout, so it dies on logout and no user can see
 *    another's data.
 */
const DataCacheContext = createContext(null);

/** Build a stable key from a domain plus its query params. */
export const cacheKey = (domain, params = {}) => {
  const clean = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all')
    .sort(([a], [b]) => a.localeCompare(b));
  return clean.length ? `${domain}?${JSON.stringify(clean)}` : domain;
};

export const DataCacheProvider = ({ children }) => {
  const store = useRef(new Map());

  const read = useCallback((key) => store.current.get(key)?.data ?? null, []);

  const write = useCallback((key, data) => {
    store.current.set(key, { data, at: Date.now() });
  }, []);

  const invalidate = useCallback((key) => {
    store.current.delete(key);
  }, []);

  /** Drop everything whose key starts with a domain — used after a mutation. */
  const invalidateDomain = useCallback((domain) => {
    for (const key of store.current.keys()) {
      if (key === domain || key.startsWith(`${domain}?`)) store.current.delete(key);
    }
  }, []);

  const clear = useCallback(() => {
    store.current.clear();
  }, []);

  const value = useMemo(
    () => ({ read, write, invalidate, invalidateDomain, clear }),
    [read, write, invalidate, invalidateDomain, clear]
  );

  return <DataCacheContext.Provider value={value}>{children}</DataCacheContext.Provider>;
};

export const useDataCache = () => {
  const ctx = useContext(DataCacheContext);
  if (!ctx) {
    throw new Error('useDataCache must be used inside a DataCacheProvider.');
  }
  return ctx;
};

export default DataCacheProvider;
