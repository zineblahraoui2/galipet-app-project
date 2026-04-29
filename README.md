# GaliPet

Monorepo: **Express API** (`api/`) + **React / Vite** (`galipet-app/`).

## Dev

```bash
cd api && cp .env.example .env && npm i && npm run dev
cd galipet-app && cp .env.example .env && npm i && npm run dev
```

`galipet-app`: set `VITE_API_URL` (e.g. `http://localhost:3001`). See `api/.env.example` for API vars (`MONGO_URL`, `JWT_SECRET`, `CLIENT_URL` in prod, optional Google OAuth).

## Prod (short)

You need **MongoDB**, **HTTPS API**, **HTTPS static app**. Cookies + CORS → set **`CLIENT_URL`** on the API to your real frontend origin (no trailing slash). Build the SPA with **`VITE_API_URL`** pointing at the public API, then `npm run build`.

## License

Private — all rights reserved unless stated otherwise.
