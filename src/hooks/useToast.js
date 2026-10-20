/**
 * useToast — shared notification hook for the admin portal.
 *
 * Usage:
 *   const toast = useToast();
 *   await ordersApi.updateStatus(id, next);      // only after this resolves
 *   toast.success(`Order ${orderNumber} moved to ${next}.`);
 *
 * Available: toast.success(msg), toast.error(msg), toast.info(msg), toast.dismiss(id).
 * Every method returns the toast id, so a caller can dismiss it early if needed.
 */
export { useToastContext as useToast } from '../context/ToastContext.jsx';
export { useToastContext as default } from '../context/ToastContext.jsx';
