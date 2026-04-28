import { api } from './client.js'

/** POST /register — JSON body: name, email, password (legacy / scripts) */
export function registerUser({ name, email, password }) {
  return api.post('/register', { name, email, password })
}

/** POST /register — multipart FormData (role, names, city, optional degree file, etc.) */
export function registerWithFormData(formData) {
  // `api` defaults to `Content-Type: application/json`; that must not apply here or Express
  // will skip multipart and multer never runs (req.body stays empty → JSON branch saves only email/password + default role owner).
  // `false` removes the header so the browser sets `multipart/form-data` with a boundary.
  return api.post('/register', formData, {
    headers: { 'Content-Type': false },
  })
}

export function logoutSession() {
  return api.post('/logout')
}
