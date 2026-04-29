/** Absolute API origin (no trailing slash) — same default as `api/client.js`. */
export function getApiOrigin() {
  return String(import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '')
}
