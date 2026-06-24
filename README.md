# XenDesk

An internal customer support & ticketing system for XenFi. Customers raise
support tickets; agents triage, assign, reply to, and resolve them.

It's a single full-stack Next.js app: a typed REST API and service layer with
server-enforced RBAC, and a Tailwind UI built to a high-fidelity design across
both roles (11 screens).

---

## Tech stack & why

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16 (App Router) + TypeScript** | Required by the brief; one codebase for API (Route Handlers) and UI, first-class Vercel deploy. |
| Database | **PostgreSQL** (Neon in production) | Relational data with clear foreign keys; Neon gives serverless Postgres with a Vercel integration. |
| ORM | **Prisma 7** | Type-safe queries, first-class migrations, readable schema. Uses the `pg` driver adapter. |
| Auth | **Auth.js (NextAuth v5), Credentials** | Email/password so reviewers can sign in with seeded demo accounts (no external OAuth setup). JWT sessions carry the user's role. |
| Validation | **Zod** | One schema validates at the API boundary and infers the TypeScript types; enum schemas are derived from the Prisma enums so they can't drift. |
| Passwords | **bcryptjs** | Pure-JS bcrypt, no native build step — reliable on serverless. |
| UI | **Tailwind CSS v4 + lucide-react** | Design tokens map 1:1 to the handoff; small primitive set (Button, pills, chips, Avatar, fields). |
| Data fetching | **SWR** | Client cache + revalidation; polls the ticket thread and dashboard for near-real-time updates without WebSockets. |
| Tests | **Vitest** | Fast unit + integration tests against a real Postgres test database. |

### Architecture

It's a single full-stack Next.js app, but with a hard internal seam:

```
src/
  app/(app)/**           Authenticated screens (role-guarded server pages)
  app/login              Sign-in (split panel + demo quick-login)
  app/api/**/route.ts    HTTP layer — thin handlers: resolve identity, parse, delegate
  components/            Shell (sidebar/topbar), UI primitives, screen views
  lib/services/*         Business logic + RBAC enforcement (framework-agnostic, unit-tested)
  lib/auth/rbac.ts       Pure authorization predicates (no Auth.js import)
  lib/auth/session.ts    Auth.js-bound identity resolvers (requireActor/requireAgent)
  lib/validation/*       Zod schemas (shared client/server)
  lib/hooks.ts           SWR data hooks (with polling)
  lib/errors.ts          HttpError hierarchy (400/401/403/404/409)
  lib/prisma.ts          Pooled Prisma client singleton
prisma/                  schema, migrations, seed
tests/                   unit + integration
```

**Authorization is enforced server-side in the service layer, not in the UI.**
A customer hitting another customer's ticket via the API gets a `403`, not a
hidden button. The pure predicates in `rbac.ts` (e.g. `canAccessTicket`,
`assertAgent`) take an `Actor` and a resource, so they are unit-testable without
mocking Auth.js, and they are the single source of truth the routes rely on.

### Data model

- **User** — `email`, `name`, `passwordHash`, `role` (`CUSTOMER` | `AGENT`),
  `company` (customers).
- **Ticket** — `number` (human code `TK-####`), `title`, `description`, `status`
  (`OPEN` | `IN_PROGRESS` | `RESOLVED`), `priority` (`LOW` | `MEDIUM` | `HIGH`),
  `customerId` (owner), `agentId` (assignee, nullable).
- **Comment** — append-only message on a ticket (`body`, `authorId`), forming a
  chronological thread. A customer reply to a **resolved** ticket automatically
  reopens it (status → `OPEN`); an agent's reply does not. Any reply bumps the
  ticket's last-updated time.
- **Tag** — category (Billing, Network, Account, Hardware, API) with a `color`;
  many-to-many with Ticket.

**Indexing / query optimization.** Indexes are chosen from the actual query
shapes, not sprinkled on:

- **Composite `(filter, createdAt)`** on `Ticket` for `customerId`, `status`,
  and `agentId`. Every list/dashboard query filters then orders by `createdAt`,
  so one index serves both the filter and the sort; the leading column also
  covers filter-only counts (the bare single-column indexes are therefore
  redundant and dropped). `priority` and `createdAt` keep single-column indexes
  for the priority breakdown and the unfiltered list.
- **GIN trigram indexes** (`pg_trgm`) on `Ticket.title` and `description`, so the
  case-insensitive `contains` search is index-accelerated (`ILIKE '%term%'`
  can't use a btree). Verified via `EXPLAIN`: the planner does a Bitmap Index
  Scan on these rather than a sequential scan.
- **`Comment(ticketId, createdAt)`** serves the chronological thread fetch.
- Trade-off: each index adds write cost; on a write-light support tool the read
  wins dominate, and the set is kept minimal rather than exhaustive.

### Roles & permissions

| Action | Customer | Agent |
| --- | --- | --- |
| Register (self) | ✅ | — (seeded) |
| Create ticket | ✅ (becomes owner) | ✅ |
| View tickets | Own only (hard-scoped) | All + filter/search |
| View a ticket | Own only | Any |
| Comment on a ticket | Own only | Any |
| Change status / priority | ❌ | ✅ |
| Assign / unassign agent | ❌ | ✅ |
| Manage tags | ❌ | ✅ (create/delete) |
| Delete ticket | ❌ | ✅ |
| Dashboard metrics | ❌ | ✅ |
| Onboard a new agent | ❌ | ✅ (Settings → Team) |

Agents are not self-service: a customer self-registers, but agents are created
by an existing agent (Settings → Team), which issues a one-time temporary
password to share. The very first agent comes from the seed (no agents → no one
to onboard). A production system would add an admin/owner tier, an email invite
flow, and a change-password step — see Tradeoffs.

---

## API reference

All routes are under `/api`. Auth is required except where noted. Errors use a
consistent envelope: `{ "error": string, "details"?: unknown }`.

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | public | Customer self-registration |
| `POST` | `/auth/callback/credentials` | public | Sign in (Auth.js) |
| `GET` | `/tickets` | any | List tickets (customer: own; agent: all). Query: `status`, `priority`, `tagId`, `search`, `assignment` (`unassigned`/`mine`, agent-only), `page`, `pageSize` |
| `POST` | `/tickets` | any | Create a ticket |
| `GET` | `/tickets/:id` | owner/agent | Ticket detail + comment thread |
| `PATCH` | `/tickets/:id` | agent | Update status / priority / assignment / tags |
| `DELETE` | `/tickets/:id` | agent | Delete a ticket |
| `GET` | `/tickets/:id/comments` | owner/agent | List comments |
| `POST` | `/tickets/:id/comments` | owner/agent | Add a comment |
| `GET` | `/tags` | any | List tags |
| `POST` | `/tags` | agent | Create a tag |
| `DELETE` | `/tags/:id` | agent | Delete a tag |
| `GET` | `/agents` | agent | List agents (assignment picker) |
| `POST` | `/agents` | agent | Onboard a new agent; returns a one-time temp password |
| `GET` | `/dashboard/stats` | agent | Open/in-progress/resolved/unassigned counts + priority breakdown |
| `POST` | `/admin/seed` | agent | Reseed demo data (gated by `ENABLE_SEED_ENDPOINT`) |

---

## Screens

Built to a high-fidelity design (exact tokens for color, type, spacing). Role
comes from the session, not a toggle.

- **Sign in** — split brand panel + credentials form, with one-click demo login.
- **Agent:** Dashboard (metrics, priority bars, unassigned queue, ticket table),
  Tickets (searchable/filterable table), Ticket detail (live thread + composer,
  editable status/priority/assignee/tags, mark-as-resolved), Customers, Tags
  (create/delete), Settings (incl. agent onboarding). Agents can **claim** an
  unassigned ticket ("Assign to me") from the detail page, the dashboard queue,
  or any table row.
- **Customer:** My tickets (summary cards + list), New ticket (validated form),
  Ticket detail (read-only controls + reply), Help center (FAQ accordion).

---

## Local setup

### Prerequisites

- Node.js 20.9+ (Next.js 16 requirement)
- A PostgreSQL database. The quickest path is Docker:

```bash
docker run -d --name xendesk-postgres \
  -e POSTGRES_USER=xendesk -e POSTGRES_PASSWORD=xendesk_dev_pw -e POSTGRES_DB=xendesk \
  -p 5433:5432 postgres:16-alpine
```

### Steps

```bash
# 1. Install (also generates the Prisma client via postinstall)
npm install

# 2. Configure environment
cp .env.example .env
#   - set DATABASE_URL (the Docker default above is already in .env.example)
#   - set AUTH_SECRET:  npx auth secret

# 3. Apply migrations
npm run db:migrate

# 4. Seed demo data
npm run db:seed

# 5. Run
npm run dev          # http://localhost:3000
```

### Demo credentials

All seeded accounts share the password **`Password123!`**. On the sign-in
screen, **Enter as Agent** / **Enter as Customer** log in with the two accounts
below in one click.

| Role | Email |
| --- | --- |
| Agent | `joel.mukasa@xenfi.com` |
| Agent | `aisha.nankya@xenfi.com` · `david.okello@xenfi.com` · `patricia.atuhaire@xenfi.com` |
| Customer | `brenda.namuli@nileagro.co.ug` |
| Customer | `samuel.wasswa@pearlmicro.co.ug` · `grace.auma@victoriafoods.co.ug` · `ibrahim.ssali@equatorlogistics.co.ug` · others |

---

## Tests & quality

```bash
npm test           # Vitest (unit + integration) — 62 tests
npm run test:coverage  # same, with a V8 coverage report
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
```

Integration tests use a separate database, derived from `.env`'s `DATABASE_URL`
with the database name suffixed `_test` (override with `TEST_DATABASE_URL`).
Create and migrate it once:

```bash
docker exec xendesk-postgres psql -U xendesk -d xendesk -c "CREATE DATABASE xendesk_test;"
TEST_DATABASE_URL="postgresql://xendesk:xendesk_dev_pw@localhost:5433/xendesk_test?schema=public" npm run db:deploy
```

**62 tests** cover the brief's high-risk areas:

- **Unit** — password hashing, RBAC predicates, every Zod schema, and the API
  error-mapping wrapper (`ZodError → 400`, `HttpError → status`, `→ 500`).
- **Integration** (real Postgres) — ticket state-change + ownership flows
  (status changes, assignment validation, cross-customer 403, dashboard
  aggregation), the user/tag services, and the API route handlers driven as a
  given role (mocking only the session resolver).

`test:coverage` scopes the report to the API + service + validation + auth
logic (the UI and Auth.js glue are verified by running the app). Latest run:
**~83% lines, ~81% branches** (core ticket service ~90%).

**CI** (`.github/workflows/ci.yml`) provisions a Postgres service and runs
lint → typecheck → migrate → test → build on every push and pull request.

---

## Deployment (Vercel + Neon)

1. Create a Neon Postgres database; copy its pooled connection string.
2. Import the repo into Vercel.
3. Set environment variables in Vercel: `DATABASE_URL` (Neon), `AUTH_SECRET`,
   `AUTH_URL` (the deployed URL), and optionally `ENABLE_SEED_ENDPOINT=true` for
   the demo.
4. The build runs `prisma generate && next build`. Apply migrations against Neon
   with `npm run db:deploy` (e.g. from a local shell pointed at Neon, or a
   deploy step).

No secrets are committed; `.env` is gitignored and only `.env.example` ships.

---

## Tradeoffs & known limitations

- **Ticket editing.** Customers cannot edit a ticket's title/description after
  creation (only comment). Status/priority/assignment are agent-only state
  transitions. This keeps the support log trustworthy; a future revision could
  allow owners to edit while `OPEN`.
- **Comments are append-only** (no edit/delete) — appropriate for an auditable
  support thread.
- **Real-time** is polling-based (SWR revalidation of the ticket thread and
  dashboard) rather than WebSockets — reliable on Vercel serverless and a
  deliberate trade of latency for simplicity.
- **Settings toggles** and the sign-in **"Remember me"** are interactive but
  presentational — settings aren't persisted yet, and the JWT session uses a
  fixed lifetime regardless of the checkbox (matching the design's scope).
- **Agent onboarding** issues a one-time temp password (no email infra). Natural
  follow-ups: email invite links, a change-password / reset flow, and an
  admin/owner tier so not every agent can mint agents.
- **`pg` deprecation warning.** Prisma 7's query interpreter pipelines the
  statements of a nested write (e.g. creating a ticket with connected tags and
  comments) onto one connection, which the `pg` driver flags with a
  `client.query() while already executing` deprecation warning. It is benign —
  all writes succeed and data is correct (covered by tests) — and is an upstream
  interaction between Prisma and `@prisma/adapter-pg` that will resolve in a
  future release.
- **Seed endpoint is destructive** and therefore double-gated (agent role +
  `ENABLE_SEED_ENDPOINT=true`); keep it disabled outside demos.
