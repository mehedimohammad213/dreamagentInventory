# Car Management — Express API

Express + PostgreSQL rewrite of the Laravel `Backend` API, using `pg` (node-postgres) and a custom Model / QueryBuilder layer (no ORM). Written in **TypeScript**; run with **`tsx`** in development (`npm run dev`) and compile with `tsc` for production (`npm run build` / `npm start`).

## Stack

- **TypeScript** + **tsx** — typed source; scripts and `dev` use `tsx`
- **Express 5** — REST API under `/api`
- **PostgreSQL** via **`pg`**
- **Custom query layer** — `src/lib/QueryBuilder.ts` + `src/lib/Model.ts`
- **Auth** — Laravel Sanctum–compatible bearer tokens (`id|plainToken`, SHA-256 hashed in DB)
- **Uploads** — multer; all images/files stored under `public/` (car_image, categories, attachments)
- **Excel** — `xlsx` import
- **Mail** — nodemailer stock-update notifications

## Setup

```bash
cd express
cp .env.example .env
# Edit DB_* and optional MAIL_*

# Create database (example)
createdb cms

npm install
npm run db:migrate
npm run db:seed
npm run dev
```

API base: `http://localhost:4004/api`  
Health: `GET /up`

### Demo users

| Role  | Username | Password  |
|-------|----------|-----------|
| admin | admin    | admin123  |
| user  | user     | user123   |

## MVC layout

```
src/
  routes/        # URL → controller
  controllers/   # HTTP only (req/res)
  services/      # all business logic
  models/        # DB / query layer (pg)
  middleware/    # auth, uploads
  lib/           # Model, QueryBuilder, errors, tokens
```

Controllers call services; services use models and throw `AppError` / `ValidationError`.

## API parity with Laravel `Backend`

Same paths and auth rules as `Backend/routes/api.php`:

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/user`, `GET /user` |
| Categories | CRUD + `parent/list` + `stats/overview` |
| Cars | CRUD (`POST /:car/update`), photos/details, Excel import/export, bulk status, attachments |
| Stocks | CRUD, bulk status, stats, available cars |
| Cart | CRUD, summary, clear |
| Orders | create from cart, user/admin lists, status, cancel, delete |
| Purchase history | CRUD + PDF download |
| Payment history | CRUD + nested installments |
| Users | admin-only CRUD |

## Custom model layer (quick use)

```ts
import Car from './models/Car.js';

const cars = await Car.query()
  .where('status', 'available')
  .whereLike('make', '%Toyota%')
  .orderBy('created_at', 'DESC')
  .paginate(1, 15);

const car = await Car.create({ make: 'Toyota', model: 'Aqua', year: 2018 });
```

Transactions:

```ts
import { withTransaction } from './db/pool.js';

await withTransaction(async (client) => {
  await Car.create({ ... }, client);
});
```

## Notes / intentional Laravel quirks preserved

- Excel **export** returns metadata only (no file) — same as Laravel
- Stock **quantity** is forced to `1` on create/update
- Purchase cars use **`car_purchase_history`** pivot (no `purchase_history.car_id`)
- Invoice PDF controller from Laravel is **not** ported (dead code: no routes/package/view)
- `po_items` table exists for schema parity but is unused

## Env vars

See `.env.example`. Required for DB: `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.
