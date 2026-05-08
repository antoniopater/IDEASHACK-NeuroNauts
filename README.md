# Nexdoc (RD Bridge)

Nexdoc is a Next.js 16 MVP that matches companies with PhD researchers for R&D briefs.
It supports:

- company flow: generate and publish briefs
- researcher flow: profile, recommendations, apply
- auth with session cookies
- AI-assisted matching (heuristics + optional embeddings)
- two data modes: local JSON demo or Supabase

---

## Tech Stack

- Next.js 16 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Zod validation
- Supabase (optional, for full DB mode)
- LLM backends: Groq / Anthropic / OpenAI-compatible
- Jest + ESLint

---

## Quick Start

### 1) Install

```bash
npm install
```

### 2) Configure env

```bash
cp .env.example .env.local
```

Minimum for local demo mode:

- `USE_LOCAL_JSON_DB=true` (default)
- `GROQ_API_KEY=...` (or another provider key)

### 3) Run

```bash
make play-fresh
```

App: [http://localhost:3000](http://localhost:3000)

---

## Data Modes

### Local JSON mode (default)

Use this for hackathon/demo setup without Supabase.

- Enabled by default via `USE_LOCAL_JSON_DB=true`
- Runtime DB file: `data/local-db.json`
- Demo seed source: `data/demo-local-db.json`

Useful commands:

- `make seed-local` — generate/copy demo dataset to `data/local-db.json`
- `make play` — start app (ensures local dataset exists)
- `make play-fresh` — clean + reseed + start

### Supabase mode

Set:

- `USE_LOCAL_JSON_DB=false`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Then apply SQL migrations from `supabase/migrations/` in order.
Optional demo data can be loaded from `supabase/seed.sql`.

---

## Environment Variables

See `.env.example` for full list.

### Core

- `USE_LOCAL_JSON_DB=true|false`
- `AUTH_SESSION_SECRET` (required in production; strongly recommended locally)

### LLM provider

Auto-picks available backend unless forced via `AI_PROVIDER`.

- Groq: `GROQ_API_KEY` (+ optional `GROQ_MODEL`)
- Anthropic: `ANTHROPIC_API_KEY` (+ optional `ANTHROPIC_MODEL`)
- OpenAI-compatible: `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`

Optional force:

- `AI_PROVIDER=groq|anthropic|openai_compatible`

### Embeddings / semantic matching (optional)

The project supports semantic scoring in addition to rules:

- `EMBEDDING_PROVIDER=auto|groq|openai|voyage`
- optional provider/model overrides from `.env.example`
- optional score blend weights:
  - `MATCH_RANK_HEURISTIC_WEIGHT`
  - `MATCH_RANK_SEMANTIC_WEIGHT`
  - `MATCH_APPLY_LLM_WEIGHT`
  - `MATCH_APPLY_EMBED_WEIGHT`

---

## Auth & Sessions

- Sign in: `/auth/sign-in`
- Sign up: `/auth/sign-up`
- Session cookie: `rdbridge_session`

Notes:

- Route handlers set cookies on the returned `NextResponse`
  (login/logout/register flows).
- In production, `AUTH_SESSION_SECRET` must be explicitly set.

---

## Main Product Flows

### Company

- create/generate brief: `/company/new-brief`
- published briefs + applications management:
  `/company/briefs/[id]/applications`

### Researcher

- registration/profile build: `/researcher/register`
- dashboard with recommendations + applications:
  `/researcher/[id]/dashboard`
- apply to brief: `/researcher/apply/[briefId]`
- favorites:
  - API: `POST /api/briefs/favorites`
  - shown in dashboard and briefs listing

### Briefs directory

- list: `/briefs`
- details: `/briefs/[id]`
- filters by industry, timeline, budget
- already-applied badge shown when applicable

---

## API Routes (app/api)

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET|POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/briefs/generate`
- `POST /api/briefs/publish`
- `POST /api/briefs/favorites`
- `POST /api/researcher/profile-build`
- `POST /api/researcher/register`
- `POST /api/researchers/quick-match`
- `POST /api/applications/submit`
- `POST /api/applications/status`
- `GET /api/health`

---

## Scoring Model (important)

There are two different scores in UI by design:

- **Predicted match** (recommendations): heuristic + optional semantic embeddings
- **AI score** (my applications): LLM-based evaluation at submit time
  (+ optional embedding blend)

These can differ for the same brief and that is expected.

---

## Scripts

### npm

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — run built app
- `npm run lint` — ESLint
- `npm test` — Jest
- `npm run seed:demo-json` — generate `data/demo-local-db.json`

### make

- `make install` — npm install
- `make reset` — remove `.next` and local runtime JSON DB
- `make kill-port` — free port (default 3000)
- `make seed-local` — refresh demo dataset into `data/local-db.json`
- `make play` — start dev app with local JSON mode
- `make play-fresh` — reset + play
- `make play-demo` — reset + seed-local + play
- `make verify-seed-json` — print demo dataset row counts

---

## Health Check

```bash
curl -s http://localhost:3000/api/health
```

Response includes status for app dependencies (local/supabase/llm).

---

## Project Status

This is an MVP/hackathon-style codebase with production-like flows,
but without full enterprise hardening
(e.g. advanced auditing, payments, notifications, attachments, etc.).
