/** Backend origin without trailing slash (avoids `//api/...` when the env var ends with `/`). */
export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
}
