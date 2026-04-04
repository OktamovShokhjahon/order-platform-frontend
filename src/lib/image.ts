import { getApiBaseUrl } from '@/lib/apiBaseUrl';

export const DEFAULT_FOOD_IMAGE = '/uploads/burger.png';

export const resolveAssetUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return `${getApiBaseUrl()}${path}`;
  return path;
};

export const resolveFoodImageUrl = (path?: string | null) => resolveAssetUrl(path || DEFAULT_FOOD_IMAGE);

export const isRemoteImageUrl = (path?: string | null) => {
  const resolved = resolveAssetUrl(path || '');
  return resolved.startsWith('http://') || resolved.startsWith('https://');
};
