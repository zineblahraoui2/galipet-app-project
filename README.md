# GaliPet

Monorepo for the GaliPet platform: **Express API** (`api/`) and **React (Vite) app** (`galipet-app/`).

## Quick start

- **API:** `cd api && npm install && npm run dev` (configure `api/.env` from `api/.env.example`).
- **App:** `cd galipet-app && npm install && npm run dev` (configure `galipet-app/.env` from `galipet-app/.env.example`).

## Production hosting

You need three pieces in production: **MongoDB**, **Node API (HTTPS)**, **static frontend (HTTPS)**. The browser calls the API with cookies (`withCredentials`), so the API must allow your frontend origin via **`CLIENT_URL`** (see `api/app.js`).

### 1. MongoDB

Use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier is fine). Create a cluster, database user, and get an SRV connection string. Set **`MONGO_URL`** on the API host.

### 2. API (Express)

- Set **`NODE_ENV=production`**, **`JWT_SECRET`** (long random string), **`MONGO_URL`**, **`PORT`** (often `3001` or the host’s assigned port).
- Set **`CLIENT_URL`** to the exact public origin of your React app, e.g. `https://galipet.vercel.app` (no trailing slash). Multiple origins: comma-separated.
- **HTTPS:** cookies use `secure: true` in production, so the API must be served over **HTTPS** (most PaaS do this automatically).
- **Trust proxy:** `trust proxy` is enabled in production so platforms like Railway/Render work behind a reverse proxy.

### 3. Frontend (Vite)

`VITE_API_URL` is read at **build** time. Set it to your public API URL (e.g. `https://api.yourdomain.com`) in the CI/hosting “build environment”, then run `npm run build`.

### Option A — Docker Compose (VPS / one server)

1. Copy **`.env.deploy.example`** to **`.env`** next to `docker-compose.yml` and fill **`JWT_SECRET`** (and optional Mapbox/Stripe/Cloudinary build args).
2. For a real domain, put TLS in front (Caddy, Traefik, or nginx + Let’s Encrypt) and point **`CLIENT_URL`** / **`VITE_API_URL`** at those URLs; rebuild `web` when `VITE_API_URL` changes.

```bash
docker compose up --build -d
```

- App: **http://localhost:8080**  
- API: **http://localhost:3001**  
- Mongo: **localhost:27017**

Use Atlas instead of the bundled `mongo` service by removing the `mongo` service from `docker-compose.yml` and setting **`MONGO_URL`** to your Atlas URI.

### Option B — Split cloud (common)

| Service        | Role |
|----------------|------|
| **MongoDB Atlas** | Database |
| **Railway**, **Render**, **Fly.io**, or **Google Cloud Run** | Host `api/` (Node) |
| **Vercel** or **Netlify** | Build & host `galipet-app/` (set `VITE_API_URL` in project env) |

After deploy, confirm **`GET https://your-api/health`** returns `mongo: "connected"` and log in from the deployed frontend.

## License

Private — all rights reserved unless stated otherwise.
