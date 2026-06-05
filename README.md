# 🎟️ Lottery Platform

A small MVP for an online lottery platform. Users sign up, browse draws, buy
tickets (each with a unique number within the draw), and see results. Admins
create draws, move them through their lifecycle, and generate a random winning
number.

Built with **Next.js + NestJS + Supabase** in a **pnpm monorepo**.

---

## Architecture

```
┌─────────────┐   HTTP +     ┌─────────────┐   SQL      ┌──────────────────┐
│   Next.js   │  Bearer JWT  │   NestJS    │ (TypeORM)  │     Supabase     │
│  (Vercel)   │ ───────────▶ │  REST API   │ ─────────▶ │  Postgres + Auth │
│   web app   │              │  (Render)   │            │                  │
└─────────────┘              └─────────────┘            └──────────────────┘
       │                                                          ▲
       └────────────────  Supabase Auth (sign up / in)  ──────────┘
```

- The browser authenticates directly with **Supabase Auth** and receives a JWT.
- It calls the **NestJS API** with that JWT as a `Bearer` token.
- NestJS **verifies the JWT against Supabase's JWKS** (asymmetric ECC P-256 keys)
  and is the single authority for all data reads/writes via **TypeORM**.
- The JWT proves **identity**; **authorization** comes from the `role` column in
  the `profiles` table (the single source of truth), which the API reads on each
  authenticated request. Roles are visible and editable in the Supabase Table
  Editor.

## Monorepo layout

```
lottery/
├─ apps/
│  ├─ web/        @lottery/web    Next.js 16 (App Router) + Tailwind CSS 4
│  └─ api/        @lottery/api    NestJS 11 + TypeORM + Supabase
├─ packages/
│  └─ shared/     @lottery/shared Shared TypeScript types, enums & DTOs
├─ pnpm-workspace.yaml
└─ package.json   Root scripts (dev / build / test)
```

## Domain model

| Entity     | Notes                                                                       |
| ---------- | --------------------------------------------------------------------------- |
| `profiles` | Mirrors `auth.users` (id, email, **role**). Auto-created by a DB trigger; `role` is the source of truth for authz. |
| `draws`    | title, description, ticket_price, draw_date, status, max_tickets, …          |
| `tickets`  | draw_id, user_id, **unique** `ticket_number` per draw                        |

**Draw lifecycle:** `Draft → Open → Closed → Finished`

- **Draft** – created, not visible to users.
- **Open** – visible and purchasable.
- **Closed** – no more purchases; awaiting the draw.
- **Finished** – winning number generated.

### Winning-number logic

Each draw has a `max_tickets` pool; tickets are numbered sequentially `1…N` as
they sell (this is also the hard sales cap). When an admin draws the winner:

- **Guaranteed winner ON** – the number is picked uniformly from the *sold*
  numbers `[1, ticketsSold]`, so there is always exactly one winner.
- **Guaranteed winner OFF** – the number is picked from the whole pool
  `[1, max_tickets]`. If it lands on an unsold number, the draw finishes with no
  winner (like a real jackpot rollover). Odds of a winner = `ticketsSold / max_tickets`.
- With no tickets sold, the draw finishes with no winning number.

The winning number is generated with `crypto.randomInt` for fair randomness.

---

## Local development

### Prerequisites

- Node.js ≥ 20, **pnpm** ≥ 10
- A **Supabase** project (free tier is fine)

### 1. Configure Supabase

Create a project at [supabase.com](https://supabase.com). From the dashboard
collect: project URL, the publishable & secret API keys, and the database
connection strings (Settings → Database → use the **poolers**).

### 2. Environment files

Copy the templates and fill them in:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

> **Note:** URL-encode special characters in your DB password (e.g. `?` → `%3F`).

### 3. Install, migrate, seed, run

```bash
pnpm install
pnpm --filter @lottery/shared build      # build shared types once
pnpm --filter @lottery/api migration:run # create the schema in Supabase
pnpm --filter @lottery/api seed          # create demo admin + buyer (idempotent)
pnpm dev                                  # runs web (:3000) and api (:3001)
```

- Web: http://localhost:3000
- API: http://localhost:3001

### Demo accounts

`seed` creates one admin and one buyer (email pre-confirmed) from **env vars** —
no credentials are hardcoded in the repo. Set them in `apps/api/.env` first:

```bash
SEED_ADMIN_EMAIL=...   SEED_ADMIN_PASSWORD=...
SEED_USER_EMAIL=...    SEED_USER_PASSWORD=...
```

> Demo login for the deployed app is provided with the submission (not committed).
> Locally, use whatever you set above, or sign up and self-promote (below).

### Creating other admins

Set the `role` for any user — the change takes effect on their next request, no
re-login needed. Either run:

```bash
pnpm --filter @lottery/api promote-admin you@example.com
```

…or just edit the `role` cell for your row in the Supabase **Table Editor → profiles**.

> If signups require email confirmation, either confirm via the email or disable
> "Confirm email" under Supabase → Authentication → Providers → Email.

---

## API reference

| Method | Route                          | Auth   | Description                          |
| ------ | ------------------------------ | ------ | ------------------------------------ |
| GET    | `/draws`                       | –      | List non-draft draws                 |
| GET    | `/draws/:id`                   | –      | Get a draw                           |
| POST   | `/draws/:drawId/tickets`       | user   | Buy a ticket                         |
| GET    | `/me/tickets`                  | user   | List my tickets (with win status)    |
| GET    | `/me`                          | user   | Current user (id, email, role)       |
| GET    | `/admin/draws`                 | admin  | List all draws (incl. drafts)        |
| POST   | `/admin/draws`                 | admin  | Create a draw                        |
| POST   | `/admin/draws/:id/publish`     | admin  | Draft → Open                         |
| POST   | `/admin/draws/:id/close`       | admin  | Open → Closed                        |
| POST   | `/admin/draws/:id/draw`        | admin  | Closed → Finished (+ winning number) |
| DELETE | `/admin/draws/:id`             | admin  | Delete a draw (only if 0 tickets)    |
| POST   | `/internal/draws/:id/finalize` | secret | Auto-finalize (pg_cron callback)     |

Notes:

- **Concurrency-safe purchasing:** each purchase runs in a transaction that takes
  a `pessimistic_write` lock on the draw row, allocating the next sequential
  number. A `UNIQUE(draw_id, ticket_number)` constraint is the final safety net.
- **Purchases close at the draw date** even if the admin hasn't closed the draw.
- Draws are **immutable** once created (no update endpoint); only the lifecycle
  transitions above change them.

### Automatic draw finalization (pg_cron + pg_net)

When a draw is published, the API schedules a **one-off `pg_cron` job at the
draw's exact date** (UTC). At that moment the DB calls
`POST /internal/draws/:id/finalize` via `pg_net` (authenticated with
`INTERNAL_FINALIZE_SECRET`), which closes the draw and generates the winning
number — so a winner is produced even if no admin acted. The same
`generateWinningNumber` logic backs both the manual draw and this callback.

Requires the **`pg_cron`** and **`pg_net`** Supabase extensions (Dashboard →
Database → Extensions) and `PUBLIC_API_URL` pointing at the deployed API (the DB
can't reach `localhost`, so the cron hop only fires against a deployed API).

## Testing

```bash
pnpm --filter @lottery/api test   # unit tests: winning-number ranges, purchase rules
```

---

## Deployment

- **Database/Auth:** Supabase (already hosted).
- **API → Render:** Web Service. Root dir `apps/api`. Build:
  `corepack enable && pnpm install && pnpm --filter @lottery/shared build && pnpm --filter @lottery/api build`.
  Start: `node dist/main`. Set all `apps/api/.env` vars (point `WEB_ORIGIN` at the
  Vercel URL). Run `migration:run` once.
- **Web → Vercel:** Root dir `apps/web`. Set the `NEXT_PUBLIC_*` vars (point
  `NEXT_PUBLIC_API_URL` at the Render URL).

## AI-driven development

This project was built in an AI-driven workflow using **Claude Code**:

- **Design & requirements** were explored conversationally — clarifying the
  winning-number model (guaranteed-winner toggle + pool size), choosing the
  stack (TypeORM over Prisma/Sequelize), and the monorepo approach.
- **Scaffolding & implementation** of the NestJS API, TypeORM entities/migration,
  Supabase JWKS auth, and the Next.js + Tailwind UI were AI-generated, then
  reviewed and adjusted.
- **Version-specific correctness:** Next.js 16 introduced breaking changes
  (async `cookies()`/`params`, `middleware` → `proxy`); these were verified
  against the locally bundled Next docs rather than assumed.
- **Verification:** unit tests plus an end-to-end smoke test (real Supabase JWT
  → JWKS verification → full draw lifecycle) were generated and run to prove the
  stack works before deployment.

## Possible future extensions

- **Pick-your-numbers** lottery (e.g. choose 3 numbers; match tiers) — a richer
  model than the sequential-number scheme used here.
- Real payments (Stripe) instead of the current mock purchase.
- Admin user management UI; email notifications for winners.
```
