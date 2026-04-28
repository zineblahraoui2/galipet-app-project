import axios from 'axios'

/**
 * Single axios instance for the Express API.
 *
 * `withCredentials: true` is required so the browser attaches cross-origin
 * cookies (e.g. httpOnly `token` from POST /login on localhost:3001) when
 * the app runs on another origin (Vite on 5173/5174). Prefer `api` over
 * `axios` or `axios.defaults` so base URL and credentials stay in one place.
 */
const rawBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const baseURL = String(rawBase || '').replace(/\/+$/, '')

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})
