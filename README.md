# EngineeringExpert

India-focused, outcome-driven learning platform for engineering — a production-grade
Next.js full-stack app inspired by PW. This iteration ships a **PW-style marketing
landing page** and the **student Dashboard**, built UI-first on a typed mock data
layer with the real Postgres/Redis seams already wired.

## Stack

| Layer      | Choice                                              |
| ---------- | --------------------------------------------------- |
| Framework  | Next.js 15 (App Router) + React 19 + TypeScript     |
| Styling    | Tailwind CSS + custom design system                 |
| Animation  | Framer Motion                                       |
| Icons      | lucide-react                                        |
| Database   | PostgreSQL via Prisma (schema + seed ready)         |
| Cache/Sess | Redis via ioredis (cache-aside helper)              |
| Auth/Pay   | Stubbed with clean seams (NextAuth + Razorpay next) |

## Getting started

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:3000
```

- `/` — PW-style landing page
- `/dashboard` — student dashboard

The app runs entirely on mock data while `USE_MOCK_DATA=true` (default), so no
database is required to develop the UI.

## Wiring real data (when ready)

```bash
npm run infra:up     # Postgres + Redis via Docker
npm run db:push      # apply Prisma schema
npm run db:seed      # load fixtures into Postgres
# set USE_MOCK_DATA=false in .env, then reimplement bodies in src/lib/data.ts
```

## Project layout

```
src/
  app/                 # routes (landing + /dashboard route group)
  components/
    brand/  landing/  dashboard/  course/  ui/
  config/nav.ts        # sidebar navigation
  lib/                 # data, auth (stub), db (prisma), redis, utils, mock-data
  types/               # shared domain types
prisma/                # schema + seed
docker-compose.yml     # local Postgres + Redis
```

## Architecture notes

- **Single seam for data**: every screen reads through `src/lib/data.ts`. Flip
  `USE_MOCK_DATA` and reimplement each function against Prisma + Redis — no
  component changes.
- **Single seam for auth**: `getCurrentUser()` in `src/lib/auth.ts`. Replace with
  a real NextAuth/Auth.js session lookup (sessions in Redis).
- **Design system**: brand tokens, shadows and animations live in
  `tailwind.config.ts`; primitives in `src/components/ui`.
npm run dev          # → http://localhost:3000  (landing) and /dashboard
No database needed — it runs on typed mock data. When you're ready for real data: npm run infra:up && npm run db:push && npm run db:seed. See the README for the full wiring guide.

Suggested next step: build out the remaining mockup screens (Browse Courses, Course Details, My Courses, Live Classes, My Orders, Profile Settings) — the layout, nav, and data layer are already wired for them. Want me to tackle those next, or wire up real auth/Postgres first?