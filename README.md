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

**Docker (VPS):** create `.env` next to `docker-compose.yml` with at least `JWT_SECRET`, `CLIENT_URL`, `WEB_APP_URL`, `VITE_API_URL`; optional `VITE_MAPBOX_TOKEN`, etc. Then `docker compose up --build -d` (app `:8080`, api `:3001`). For Google OAuth in Docker, add `GOOGLE_*` to the `api` service env.

**Split cloud:** Atlas + host `api/` (Railway, Render, …) + host static `galipet-app/` (Vercel, Netlify, …) with the same env rules.

Check **`GET /health`** on the API (`mongo: "connected"` when DB is up).

## License

Private — all rights reserved unless stated otherwise.
