/**
 * Maps status keys to human friendly labels and semantic color schemes.
 */
export function getStatusConfig(status) {
  if (!status) {
    return { label: 'Unknown', variant: 'default' };
  }

  const s = String(status).toLowerCase();

  switch (s) {
    // Success / Completed / Active
    case 'paid_confirmed':
    case 'delivered':
    case 'active':
    case 'published':
    case 'captured':
    case 'resolved':
      return {
        label: formatStatusLabel(s),
        variant: 'success',
      };

    // Warning / Pending / In Progress
    case 'pending_payment':
    case 'pending':
    case 'processing':
    case 'in_progress':
    case 'label_created':
    case 'in_transit':
    case 'out_for_delivery':
    case 'return_requested':
      return {
        label: formatStatusLabel(s),
        variant: 'warning',
      };

    // Error / Danger / Failed
    case 'cancelled':
    case 'payment_failed':
    case 'failed':
    case 'discontinued':
    case 'hidden':
      return {
        label: formatStatusLabel(s),
        variant: 'danger',
      };

    // Info / Neutral
    case 'refunded':
    case 'returned':
    case 'closed':
    case 'unavailable':
      return {
        label: formatStatusLabel(s),
        variant: 'info',
      };

    default:
      return {
        label: formatStatusLabel(s),
        variant: 'default',
      };
  }
}

export function formatStatusLabel(status) {
  if (!status) return '';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
