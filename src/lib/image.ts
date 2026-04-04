const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const DEFAULT_FOOD_IMAGE = '/uploads/burger.png';

export const resolveAssetUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return `${API_URL}${path}`;
  return path;
};

export const resolveFoodImageUrl = (path?: string | null) => resolveAssetUrl(path || DEFAULT_FOOD_IMAGE);

export const isRemoteImageUrl = (path?: string | null) => {
  const resolved = resolveAssetUrl(path || '');
  return resolved.startsWith('http://') || resolved.startsWith('https://');
};
