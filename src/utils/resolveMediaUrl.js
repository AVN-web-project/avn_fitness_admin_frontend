/**
 * Resolve a stored media path to a loadable URL for the admin frontend.
 *
 * The backend stores image paths in a few shapes:
 *   - absolute URLs  (http/https/data)  -> used as-is
 *   - '/uploads/products/x.png'         -> prefixed with the backend host
 *   - legacy '/x.png'                   -> backend /uploads/products/x.png
 *   - '/placeholder...'                 -> served from the admin's own public/
 */
export const resolveMediaUrl = (img) => {
  const fallback = '/placeholder-product.png';
  if (!img) return fallback;

  const url = typeof img === 'string' ? img : (img.url || img.image || '');
  if (!url) return fallback;

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  const backendHost = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1')
    .replace(/\/api\/v1\/?$/, '');

  if (url.startsWith('/uploads/')) return `${backendHost}${url}`;
  if (url.startsWith('/placeholder')) return url;
  if (url.startsWith('/')) return `${backendHost}/uploads/products${url}`;

  return url;
};

export default resolveMediaUrl;
