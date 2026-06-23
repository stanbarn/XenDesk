# XenDesk

An internal customer support & ticketing system for XenFi. Customers raise
support tickets; agents triage, assign, reply to, and resolve them.

> **Status:** Backend (data model, auth, RBAC, REST API, tests, CI) is complete
> and verified. The frontend is being built against dedicated UI/UX designs and
> is tracked separately.

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
| Tests | **Vitest** | Fast unit + integration tests against a real Postgres test database. |

### Architecture

It's a single full-stack Next.js app, but with a hard internal seam:

```
src/
  app/api/**/route.ts   HTTP layer — thin handlers: resolve identity, parse, delegate
  lib/services/*        Business logic + RBAC enforcement (framework-agnostic, unit-tested)
  lib/auth/rbac.ts      Pure authorization predicates (no Auth.js import)
  lib/auth/session.ts   Auth.js-bound identity resolvers (requireActor/requireAgent)
  lib/validation/*      Zod schemas (shared client/server)
  lib/errors.ts         HttpError hierarchy (400/401/403/404/409)
  lib/prisma.ts         Pooled Prisma client singleton
prisma/                 schema, migrations, seed
tests/                  unit + integration
```

**Authorization is enforced server-side in the service layer, not in the UI.**
A customer hitting another customer's ticket via the API gets a `403`, not a
hidden button. The pure predicates in `rbac.ts` (e.g. `canAccessTicket`,
`assertAgent`) take an `Actor` and a resource, so they are unit-testable without
mocking Auth.js, and they are the single source of truth the routes rely on.

### Data model

- **User** — `email`, `name`, `passwordHash`, `role` (`CUSTOMER` | `AGENT`).
- **Ticket** — `title`, `description`, `status` (`OPEN` | `IN_PROGRESS` |
  `RESOLVED`), `priority` (`LOW` | `MEDIUM` | `HIGH`), `customerId` (owner),
  `agentId` (assignee, nullable).
- **Comment** — append-only message on a ticket (`body`, `authorId`), forming a
  chronological thread.
- **Tag** — category (e.g. Billing, Network, Account), many-to-many with Ticket.

Indexes cover the agent dashboard's hot paths: ticket `status`, `priority`,
`customerId`, `agentId`, `createdAt`, and `(ticketId, createdAt)` on comments.

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
| `GET` | `/dashboard/stats` | agent | Open/in-progress/resolved/unassigned counts + priority breakdown |
| `POST` | `/admin/seed` | agent | Reseed demo data (gated by `ENABLE_SEED_ENDPOINT`) |

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

All seeded accounts share the password **`Password123!`**.

| Role | Email |
| --- | --- |
| Agent | `agent@xendesk.test` |
| Agent | `bob.agent@xendesk.test` |
| Customer | `customer@xendesk.test` |
| Customer | `dave@xendesk.test` |
| Customer | `erin@xendesk.test` |

---

## Tests & quality

```bash
npm test          # Vitest (unit + integration)
npm run typecheck # tsc --noEmit
npm run lint      # ESLint
```

Integration tests run against a separate `xendesk_test` database. Create it once:

```bash
docker exec xendesk-postgres psql -U xendesk -d xendesk -c "CREATE DATABASE xendesk_test;"
TEST_DATABASE_URL="postgresql://xendesk:xendesk_dev_pw@localhost:5433/xendesk_test?schema=public" npm run db:deploy
```

Coverage focuses on the brief's high-risk areas: password hashing/verification,
the RBAC predicates, and ticket **state-change + ownership** flows (status
changes, assignment validation, cross-customer access denial, dashboard
aggregation).

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

- **Frontend pending.** The API is complete and verified; the UI is being built
  against dedicated designs and is not in this README's scope yet.
- **Ticket editing.** Customers cannot edit a ticket's title/description after
  creation (only comment). Status/priority/assignment are agent-only state
  transitions. This keeps the support log trustworthy; a future revision could
  allow owners to edit while `OPEN`.
- **Comments are append-only** (no edit/delete) — appropriate for an auditable
  support thread.
- **Real-time** is intended via polling / client revalidation (reliable on
  Vercel serverless) rather than WebSockets; it lands with the frontend.
- **`pg` deprecation warning.** Prisma 7's query interpreter pipelines the
  statements of a nested write (e.g. creating a ticket with connected tags and
  comments) onto one connection, which the `pg` driver flags with a
  `client.query() while already executing` deprecation warning. It is benign —
  all writes succeed and data is correct (covered by tests) — and is an upstream
  interaction between Prisma and `@prisma/adapter-pg` that will resolve in a
  future release.
- **Seed endpoint is destructive** and therefore double-gated (agent role +
  `ENABLE_SEED_ENDPOINT=true`); keep it disabled outside demos.
