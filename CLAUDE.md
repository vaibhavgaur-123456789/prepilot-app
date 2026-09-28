@AGENTS.md

# PrepPilot: guide for any AI/developer session

Read this first. The owner is not a programmer and usually writes in Hinglish (Hindi + English). Reply in simple Hinglish, explain what you changed in plain words, and never assume they can debug code themselves.

## Where it runs
- Live: https://prepilot-app.vercel.app (Vercel project `prepilot-app`, auto-deploys from `main`)
- Code: https://github.com/vaibhavgaur-123456789/prepilot-app
- Database: Supabase Postgres (Mumbai). Production env vars are in Vercel, with a local copy in the gitignored `.env.vercel`.
- Owner/admin email: set in the `ADMIN_EMAILS` env var.
- Scheduler: Supabase `pg_cron` + `pg_net` jobs `preppilot-alarms` (every 5 min → `/api/v1/cron/alarms`) and `preppilot-notifications` (hourly). Both send `Authorization: Bearer $CRON_SECRET`. If CRON_SECRET or the domain changes, re-create both jobs (`select cron.schedule(...)` replaces a job by name). View them in Supabase → Database → Cron Jobs.
- Server region: `bom1` (Mumbai, set in vercel.json), next to the Supabase database.

## What this is
PrepPilot is a competitive-exam preparation app (SSC, Railway, Banking and others) for Indian students. It is mobile-first and installable as a PWA.
Core idea: measure **PLAN vs ACTUAL vs RESULT** and adapt the next day's plan from the gap.
Product rules: `PRODUCT_SPEC.md`. Design: `ARCHITECTURE.md`. Data: `DATABASE_SCHEMA.md`. Going live: `DEPLOY.md`.

Honesty rules (never break these):
- Never show a "chance of selection". Readiness is a labelled *estimate* with a confidence level.
- Label numbers as measured / estimate / benchmark / projection.
- Supportive tone, never shaming.
- Unfinished tasks are never silently deleted.

## Stack
- Next.js 16 App Router + TypeScript + Tailwind v4. It is NOT the Next.js in your training data: `proxy.ts` replaces middleware, and `params`/`cookies()` are async. Check `node_modules/next/dist/docs/`.
- Prisma 6. **SQLite locally** (`prisma/schema.prisma`, file `prisma/dev.db`). **PostgreSQL in production** (Supabase): `scripts/prisma-postgres.mjs` generates `prisma/postgres/schema.prisma`, and `npm run build:prod` pushes the schema and builds. Enum-like columns are Strings validated by zod. JSON columns are Strings (use `parseJson`/`toJson`).
- Auth: bcrypt + JWT cookie (`pp_session`) backed by the `AuthSession` table. Google OAuth is optional.
- AI coach: `@anthropic-ai/sdk`, model `claude-opus-5` by default (`AI_MODEL`), with a rule-based fallback when there is no key or on any error.
- Push: `web-push` (VAPID). i18n: `src/i18n/dict.ts` (en + hi; add every new UI string to both).

## Where things live
- `src/lib/engine/*`: pure decision logic (priority, planner, triage, adaptation, revision/SRS, readiness, XP/anti-gaming, mock scoring, mistakes, weakness, recovery, pace, insights, streaks, benchmark, goals). No I/O, unit tested. All weights live in `src/config/scoring.ts`.
- `src/server/services/*`: database orchestration. Every service takes `userId` from the session, never from the request body.
- `src/app/api/v1/*`: REST routes wrapped in `api()` from `src/server/http.ts` (auth, zod, rate limit, origin check).
- `src/app/(app)/*`: student screens. `src/app/admin/*`: admin (role ADMIN). `src/components/*`: UI.
- `prisma/seed-data/*`: exam content (3 exams, 886 questions) and a demo-user simulation.
- Branding: the public name is **RozPadh** (renamed from PrepPilot in Sep 2026; the code, repo, cookies and DB still say "preppilot", which is fine). Name and tagline: `src/config/brand.ts`; logo: `src/components/Logo.tsx`, `public/icon.svg`, `src/app/icons/[size]/route.tsx`.

## Commands (Windows; Node is a portable install)
If `node`/`npm`/`git` aren't found, prepend to PATH:
`C:\Users\hp\AppData\Local\Programs\node-v24.21.0-win-x64` and `C:\Users\hp\AppData\Local\Programs\MinGit\cmd`.
- `npm run dev`: local app on http://localhost:3000 (demo login: demo@preppilot.app / demo-pass-2026, admin: admin@preppilot.app / admin-pass-2026)
- `npm run typecheck` · `npm run lint` · `npm test` (the full suite takes ~2 min, so run it in the background) · `npx next build`
- `npx prisma migrate dev --name <change>` after editing `prisma/schema.prisma` (local). Production picks up schema changes automatically on the next deploy (`prisma db push`).
- If `prisma generate` fails with EPERM on Windows, stop the dev server first.

## Workflow rules
- Before finishing any change: typecheck + lint + relevant tests must pass. Verify UI changes in a browser.
- Commit with a clear message. **Pushing to `main` on GitHub deploys to production automatically (Vercel)**, so push only working code, and tell the owner when you push.
- Never commit `.env*` files (except `.env.example`) or `*.db`. Secrets live in Vercel → Settings → Environment Variables.
- This project must stay separate from the owner's other website repository ("website-builder-site"). Never push PrepPilot there.

## Known gaps / ideas for later
- Onboarding screens and engine-generated explanations are still English-only.
- More exams: add them via Admin → "Add a new exam" (no code needed), or seed them in `prisma/seed-data/exams.ts`.
- Payments are not integrated (the `Subscription` table and `src/server/entitlements.ts` exist).
