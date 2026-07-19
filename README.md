# Hostora

**Multi-property CRM for Airbnb & short-term rentals** — bookings, expenses, owner capital, reimbursements, and day-to-day ops notes in one place.

[![Live Demo](https://img.shields.io/badge/Live-Demo-0F766E?style=flat-square)](https://airbnb-crm-gamma.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

**Live app:** [airbnb-crm-gamma.vercel.app](https://airbnb-crm-gamma.vercel.app)

---

## About

Hostora helps hosts and co-investors run apartment businesses without spreadsheet chaos. Switch between units, track every booking and rupee, settle reimbursements from revenue or profit, and keep ops tasks & notes next to the money.

Built for real multi-owner setups (investments, deposits, commissions) — not just guest calendars.

## Features

| Module | What you get |
|--------|----------------|
| **Dashboard** | Revenue, expenses, profit, cash, occupancy, check-ins/outs, analytics charts |
| **Bookings** | CRUD, auto nights & net revenue, table + calendar, status workflow |
| **Expenses** | Categories, recurring & refundable flags, payer tracking |
| **Reimburse** | Outstanding by payer, fund sources from revenue / profit / investment |
| **Owners** | Multi-investor ledger — investment, withdrawal, profit distribution |
| **Assets** | Refundable vs non-refundable inventory valuation |
| **Property** | Multi-unit list/create, lease & landlord details, property switcher |
| **Notes & Tasks** | Quick-add taskbar, priorities & due dates, pinned notes; `@waqas` / `@naseeb` emails the note (free Resend or SMTP) |
| **Reports** | P&L-style exports (CSV / Excel-compatible / print) |
| **Settings** | Currency, default check-in/out times |
| **Auth** | Credentials login, protected routes, light/dark mode |

## Stack

- **Next.js 15** (App Router) · **TypeScript** · **Tailwind CSS**
- **Prisma** · **PostgreSQL** (Neon in production; local Docker optional)
- **Auth.js** (credentials) · **Zod** · **React Hook Form**
- **Recharts** · **TanStack Table** · **date-fns**
- Deployed on **Vercel**

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/waqas-rashid1/airbnb-crm.git
cd airbnb-crm
npm install
```

> If you hit `ENOSPC` on NTFS/FUSE volumes, put `node_modules` on an ext4 disk and symlink it (see [Troubleshooting](#troubleshooting)).

### 2. Environment variables

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Pooled Postgres URL (Neon / Supabase pooler) |
| `DIRECT_URL` | Direct Postgres URL for migrations |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `http://localhost:3000` locally; production URL on Vercel |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin (env only — never committed) |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional — for receipt/document storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional — Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional — server-only storage uploads |

### 3. Database & seed

```bash
npx prisma db push
npm run db:seed
```

Seed creates an admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, plus sample property / owners / booking data when configured.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Local Postgres (optional)

```bash
docker run -d --name hostora-db \
  -e POSTGRES_USER=hostora \
  -e POSTGRES_PASSWORD=hostora \
  -e POSTGRES_DB=hostora \
  -p 5433:5432 postgres:16-alpine
```

```env
DATABASE_URL="postgresql://hostora:hostora@localhost:5433/hostora"
DIRECT_URL="postgresql://hostora:hostora@localhost:5433/hostora"
AUTH_SECRET="your-secret"
AUTH_URL="http://localhost:3000"
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema |
| `npm run db:migrate` | Create migration |
| `npm run db:seed` | Seed admin + demo data |
| `npm run db:studio` | Prisma Studio |

## Deploy (Vercel)

1. Import this repo in [Vercel](https://vercel.com)
2. Set env vars (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, admin credentials)
3. Build: `prisma generate && next build` (or rely on `postinstall`)
4. Deploy

## Architecture

```
src/
  actions/       Server Actions (CRUD)
  app/           App Router pages
  components/    UI + feature modules
  lib/           db, auth, analytics, property context
  schemas/       Zod validators
prisma/          Schema + seed
```

## Keyboard shortcuts

- `⌘/Ctrl + K` — Command search / navigation

## Troubleshooting

**ENOSPC on NTFS volumes**

```bash
mkdir -p /path/on/ext4/node_modules
ln -s /path/on/ext4/node_modules ./node_modules
npm install
```

**Prisma P1001 / connection**

- Use `DIRECT_URL` for migrations / `db push`
- Use pooled `DATABASE_URL` for the app
- URL-encode special characters in passwords (`@` → `%40`)

**Auth redirect loop**

- Ensure `AUTH_SECRET` and `AUTH_URL` match the environment

## License

Private — all rights reserved.
