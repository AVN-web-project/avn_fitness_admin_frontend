import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * Shared toast system for the admin portal.
 *
 * The rule that matters: a toast is pushed ONLY after the API call that changes the
 * database has resolved successfully. Never push one optimistically before the write —
 * the whole point is that the message reflects what the server actually stored, so a
 * failed request shows an error instead of a false success.
 *
 * Styling is deliberately high-contrast (solid fills, white text, large icon badge,
 * heavy shadow) so a confirmation cannot be missed, with a slide-in on entry and a
 * progress bar showing how long it will stay.
 */
const ToastContext = createContext(null);

const TONES = {
  success: {
    Icon: CheckCircle2,
    card: 'bg-emerald-600 border-emerald-400/50 shadow-emerald-950/40',
    badge: 'bg-white/20',
    bar: 'bg-white/70',
  },
  error: {
    Icon: AlertCircle,
    card: 'bg-rose-600 border-rose-400/50 shadow-rose-950/40',
    badge: 'bg-white/20',
    bar: 'bg-white/70',
  },
  info: {
    Icon: Info,
    card: 'bg-slate-800 border-slate-500/50 shadow-black/50',
    badge: 'bg-white/15',
    bar: 'bg-white/60',
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = 'success', duration = 4000) => {
      if (!message) return null;
      const id = (idRef.current += 1);
      setToasts((current) => [...current, { id, message, tone, duration }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message, duration) => push(message, 'success', duration),
      error: (message, duration) => push(message, 'error', duration ?? 6000),
      info: (message, duration) => push(message, 'info', duration),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Viewport — above modals/drawers (z-100) so a confirmation is never hidden */}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed top-4 right-4 z-[200] flex flex-col gap-2.5 w-[min(92vw,24rem)] pointer-events-none"
      >
        {toasts.map(({ id, message, tone, duration }) => {
          const { Icon, card, badge, bar } = TONES[tone] || TONES.info;
          return (
            <div
              key={id}
              role="status"
              aria-live="polite"
              className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 pl-3.5 pr-3 py-3.5 rounded-2xl border-2 shadow-2xl ring-1 ring-black/10 animate-toast-in ${card}`}
            >
              <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${badge}`}>
                <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
              </span>

              <p className="flex-1 text-sm font-bold leading-snug text-white pt-1.5">
                {message}
              </p>

              <button
                type="button"
                onClick={() => dismiss(id)}
                aria-label="Dismiss notification"
                className="shrink-0 mt-1.5 p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>

              {/* Time remaining before auto-dismiss */}
              {duration > 0 && (
                <span
                  className={`absolute bottom-0 left-0 h-1 rounded-full animate-toast-bar ${bar}`}
                  style={{ animationDuration: `${duration}ms` }}
                />
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside a ToastProvider.');
  }
  return ctx;
};

export default ToastProvider;
