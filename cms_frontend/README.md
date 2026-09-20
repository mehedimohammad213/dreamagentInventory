# Car Management — Next.js

Next.js 14 (App Router) port of the Vite React management frontend (`../frontend`).

## Setup

```bash
cd nextjs
npm install
cp .env.example .env.local   # optional — defaults to production API
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |

## Environment

| Variable | Default |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://backend.dreamagentcarvision.com/api` |

## Routes (same as Vite frontend)

- `/login`
- `/` — role-based redirect
- `/stock-gallery/:id` — public gallery
- `/admin`, `/admin/cars`, `/admin/categories`, `/admin/stock`, `/admin/orders`, `/admin/users`
- `/admin/purchase-history` (+ create / edit / view)
- `/admin/payment-history` (+ view)
- `/admin/profile`
- `/create-car`, `/update-car/:id`, `/car-view/:id`, `/cars`
- `/dashboard`, `/user-dashboard`, `/cart`, `/orders`, `/profile`

Feature modules live under `src/views/` (renamed from `pages` so they are not treated as the Next.js Pages Router). App Router entrypoints are in `src/app/`.
