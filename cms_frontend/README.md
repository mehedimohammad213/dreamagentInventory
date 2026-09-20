# CMS Frontend — Next.js

Next.js 14 App Router CMS for car / stock management.

## Structure

```
cms_frontend/
├── public/
├── src/
│   ├── app/                      # routes only
│   │   ├── (app)/                # authenticated routes
│   │   ├── (auth)/               # login
│   │   ├── (public)/             # public gallery
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/               # AppLayout, Header, Sidebar
│   │   ├── providers/            # app providers
│   │   ├── auth/                 # Login, guards, redirects
│   │   ├── common/               # shared UI (modals, errors, pagination)
│   │   ├── profile/
│   │   ├── dashboard/
│   │   ├── car/                  # CarCatalog, CreateCar, UpdateCar, ViewCar
│   │   ├── cart/
│   │   ├── category/
│   │   ├── order/
│   │   ├── payment-history/
│   │   ├── purchase-history/
│   │   ├── stock/
│   │   ├── user/
│   │   └── icons/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── config/
├── next.config.mjs
├── package.json
└── tsconfig.json
```

**Naming**
- Folders: kebab-case (`payment-history`, `purchase-history`)
- Components: PascalCase (`CarCatalog.tsx`, `PurchaseHistoryEditor.tsx`)
- Routes live only under `app/`; feature screens live under `components/`

## Setup

```bash
cd cms_frontend
npm install
cp .env.example .env.local
npm run dev
```

App runs at [http://localhost:5005](http://localhost:5005).

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

## Routes

- `/login`
- `/` — role-based redirect
- `/stock-gallery/[id]` — public gallery
- `/admin`, `/admin/cars`, `/admin/categories`, `/admin/stock`, `/admin/orders`, `/admin/users`
- `/admin/purchase-history` (+ create / edit / view)
- `/admin/payment-history` (+ view)
- `/admin/profile`
- `/create-car`, `/update-car/[id]`, `/car-view/[id]`, `/cars`
- `/dashboard`, `/user-dashboard`, `/cart`, `/orders`, `/profile`
