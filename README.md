# StayCRM — Airbnb Property Management CRM

Production-ready single-property CRM for Airbnb / short-term rental management.

Built with **Next.js 15**, **TypeScript**, **Prisma**, **Supabase PostgreSQL**, **Auth.js**, **Tailwind CSS**, **Recharts**, and **TanStack Table**.

## Features

- **Dashboard** — Revenue, expenses, profit, cash balance, occupancy, check-ins/outs, and 5 analytics charts
- **Bookings** — Full CRUD, auto nights & net revenue, table + calendar views, status workflow
- **Expenses** — 17 categories, recurring flag, receipt uploads (Supabase Storage)
- **Owners** — Multi-investor tracking with investment / withdrawal / profit distribution & running balance
- **Assets** — Refundable vs non-refundable inventory valuation
- **Property** — Lease, landlord, deposits, document uploads
- **Reports** — P&L, cash flow style exports (CSV / Excel-compatible / print PDF)
- **Settings** — Currency, default check-in/out times
- **Auth** — Credentials login, protected routes, dark/light mode

## Quick Start

### 1. Clone & install

```bash
npm install
```

> **Note:** If you are on an NTFS/FUSE volume and hit `ENOSPC` during install, put `node_modules` on an ext4 disk and symlink it (see Troubleshooting).

### 2. Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooled connection (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct connection (port 5432) for migrations |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `http://localhost:3000` locally, your Vercel URL in prod |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |

### 3. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. **Settings → Database** → copy connection strings into `.env`
3. **Storage** → create public buckets: `receipts` and `documents`
4. (Optional) Storage policies allowing authenticated uploads

### 4. Database migrate & seed

```bash
npx prisma db push
npm run db:seed
```

Seed creates:

- Admin: created via seed using ADMIN_EMAIL + ADMIN_PASSWORD (env only, not in git)
- Property with rent **190,000**, deposit **190,000**, commission **30,000**, stamp **2,000**
- Owners: **Waqas** (2,000) and **Naseeb** (410,000)
- Booking: **18 Jul 2026** → **19 Jul 2026**, revenue **12,000**
- Sample expenses, assets, and additional bookings for charts

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Local Postgres (without Supabase)

```bash
docker run -d --name staycrm-db \
  -e POSTGRES_USER=staycrm \
  -e POSTGRES_PASSWORD=staycrm \
  -e POSTGRES_DB=staycrm \
  -p 5433:5432 postgres:16-alpine
```

`.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5433/staycrm"
DIRECT_URL="postgresql://USER:PASSWORD@localhost:5433/staycrm"
AUTH_SECRET="your-secret"
AUTH_URL="http://localhost:3000"
```

Receipt/document uploads require Supabase Storage; other features work fully with local Postgres.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema |
| `npm run db:migrate` | Create migration |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

## Vercel deployment

1. Push repo to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all env vars from `.env.example` (use production Supabase + `AUTH_URL=https://your-app.vercel.app`)
4. Build command: `prisma generate && next build`
5. Deploy

Add to `package.json` if needed:

```json
"postinstall": "prisma generate"
```

## Architecture

```
src/
  actions/       Server Actions (CRUD)
  app/           App Router pages
  components/    UI + feature modules
  hooks/         Client hooks
  lib/           db, auth, analytics, calculations
  schemas/       Zod validators
  types/         Shared types
prisma/          Schema + seed
```

## Keyboard shortcuts

- `⌘/Ctrl + K` — Command search / navigation

## Default login

- Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in env, then run `npm run db:seed`
- Credentials are hashed in the database and never committed

Change this immediately after first deploy.

## Troubleshooting

**ENOSPC on NTFS volumes**

```bash
mkdir -p /path/on/ext4/node_modules
ln -s /path/on/ext4/node_modules ./node_modules
npm install
```

**Prisma P1001 / connection**

- Use `DIRECT_URL` for migrations
- Use pooled `DATABASE_URL` with `?pgbouncer=true` for the app
- Confirm password URL-encoding (`@` → `%40`)

**Auth redirect loop**

- Ensure `AUTH_SECRET` and `AUTH_URL` match your environment

## License

Private — all rights reserved.
