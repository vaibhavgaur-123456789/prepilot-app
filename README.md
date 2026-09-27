# PrepPilot

An exam-preparation operating system for SSC, Railway, Banking and similar objective exams.
It measures **PLAN vs ACTION vs RESULT** and adapts the next plan from the gap.

Docs: [PRODUCT_SPEC](PRODUCT_SPEC.md) · [ARCHITECTURE](ARCHITECTURE.md) · [DATABASE_SCHEMA](DATABASE_SCHEMA.md) · [IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md)

## Run it locally

Requirements: Node.js 20+ (tested on 24).

```bash
npm install
cp .env.example .env        # then set AUTH_SECRET (see the comment in the file)
npm run setup               # creates the SQLite DB, loads exams/questions + demo accounts
npm run dev                 # http://localhost:3000
```

Demo accounts (development only, created by `prisma/seed-data/demo.ts`):

| Role | Email | Password |
|---|---|---|
| Student with 3 weeks of simulated history | `demo@preppilot.app` | `demo-pass-2026` |
| Admin | `admin@preppilot.app` | `admin-pass-2026` |

Or sign up with any email to go through onboarding from scratch.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | All tests (engines + DB integration on a throwaway SQLite file) |
| `npm run test:unit` | Engine unit tests only (fast, no DB) |
| `npm run typecheck` · `npm run lint` | Static checks |
| `npm run check` | typecheck + lint + test + build |
| `npm run db:seed` | Re-run the seed (idempotent: skips existing exams and demo users) |

## Optional configuration (`.env`)

- **AI coach**: set `ANTHROPIC_API_KEY` (model defaults to `claude-opus-5`, with server-side refusal fallbacks). Without a key, the coach still answers from your data using its built-in rule engine.
- **Google login**: set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` with redirect URI `{APP_URL}/api/v1/auth/google/callback`. The button is hidden when these are unset.
- **Scheduled jobs**: set `CRON_SECRET`, then call `POST /api/v1/cron/notifications` and `POST /api/v1/cron/benchmarks` with `Authorization: Bearer <CRON_SECRET>` from any scheduler.
- **Admins**: emails in `ADMIN_EMAILS` get the admin role on signup.
- **Premium gates**: `PREMIUM_GATING=on` enforces free/premium features (off by default). Basic study, safety and privacy features are never gated.

## Production

Switch Prisma to PostgreSQL (see DATABASE_SCHEMA.md → *Moving to PostgreSQL*), set `DATABASE_URL`, `AUTH_SECRET` and `APP_URL`, then run `npm run db:deploy && npm run build && npm start`.

## Known limitations

- Push notifications to a closed app need Web Push (VAPID) keys, which aren't implemented. Notifications are in-app and generated on visit or by the cron job.
- The Hindi interface isn't translated yet (the language preference is stored).
- Payments aren't integrated (the Subscription table and entitlement gates exist).
- Mentor features, study groups and a content marketplace are not built.
- Seeded benchmark values are **reference** values and are always labelled "illustrative". Real aggregates appear only once 20+ opted-in students exist per exam.
