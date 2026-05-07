## RD Bridge — Setup

MVP web app (Next.js + optional Supabase + AI model) connecting companies that need R&D support with PhD candidates and early-career researchers.

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** (or pnpm/yarn)
- **Supabase** account (optional — only for Supabase mode)
- AI model access (see "LLM provider") for brief generation and matching

### Environment variables

Copy the template and fill in values:

```bash
cp .env.example .env.local
```

Only `.env.example` (without secrets) should be committed to the public repository.  
Keep real API keys only in local `.env.local`.

#### Supabase mode (full version — data in Postgres)

| Variable | Purpose |
|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public `anon` key — browser / Server Components access (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — **server only** (API routes): brief publishing, registration, applications |
| `NEXT_PUBLIC_APP_ORIGIN` | (Optional) e.g. `http://localhost:3000` — full URL in response after brief publication |

#### Local JSON mode (without Supabase — quick demo)

This repository defaults to:
- `USE_LOCAL_JSON_DB=true`

In this mode the app reads and writes data in `data/local-db.json`.

To switch back to Supabase, set in `.env.local`:
- `USE_LOCAL_JSON_DB=false`

#### LLM provider (briefs + profiles + matching)

The project supports one backend (auto-selected based on available keys):
- `GROQ_API_KEY` (Groq; OpenAI-compatible endpoint)
- `ANTHROPIC_API_KEY` (Claude)
- `OPENAI_BASE_URL` + `OPENAI_API_KEY` + `OPENAI_MODEL` (any OpenAI-compatible API)

You can force a backend:
- `AI_PROVIDER=groq | anthropic | openai_compatible`

### Database setup

#### Supabase mode

1. In the Supabase dashboard, run SQL migrations from `supabase/migrations/` in filename order.
2. (Optional) Load demo data:
   - go to **Supabase → SQL Editor**
   - open `supabase/seed.sql`
   - run it (the seed uses `TRUNCATE`, so it clears app tables)

Data model details: tables `companies`, `briefs`, `researchers`, `researcher_projects`, `applications` and fields `company_access_token`, `cover_message`, `match_strengths`, `match_risks`, `match_dimensions` are defined in migrations.

#### Local JSON mode (demo without Supabase)

Demo data is generated to `data/local-db.json`:
- `make seed-local` — builds `data/demo-local-db.json` → `data/local-db.json`
- `make play-fresh` — reset + seed-local + start

### Running locally

Fastest option (JSON demo dataset):

```bash
make play-fresh
```

App URL: [http://localhost:3000](http://localhost:3000).

### Accounts and roles

- Registration: `/auth/sign-up`
- Sign in: `/auth/sign-in`
- Account roles:
  - `company` -> company panel (`/company/new-brief`, application management)
  - `researcher` -> profile registration and application flow (`/researcher/register`, `/researcher/apply/[briefId]`)
- Researcher accounts require an institutional email address to confirm affiliation.

If something is occupying the port or you want to clean local data:

```bash
make reset
```

Integration check:

```bash
curl -s http://localhost:3000/api/health
```

The JSON response includes:
- `supabase`: `ok | error | local`
- `llm`: `ok | error`

### Day 1 features

- Landing page, navigation, list of **published briefs** with filters (`/briefs`)
- Company flow: multi-step form, AI brief generation, publication (`/company/new-brief`)
- **Token** in `company_access_token` and company applications panel (`/company/briefs/[id]/applications?token=...`)
- Researcher profile registration (`/researcher/register`) with **AI Profile Builder** and public profile (`/researcher/[id]`)
- PhD dashboard (`/researcher/[id]/dashboard`) with profile classification, recommended briefs, and applications
- Brief application with **dimensional AI match scoring** (`/researcher/apply/[briefId]`)
- API: `/api/briefs/generate`, `/api/briefs/publish`, `/api/researcher/profile-build`, `/api/researcher/register`, `/api/applications/submit`, `/api/applications/status`, `/api/health`

### What's NOT in v1

- Full user **authentication** (company/researcher login via OAuth/password)
- **Payments** and billing
- **Email notifications** (brief link with token must be shared through another channel)
- Advanced audit, attachments, chat, full UI multilingual support beyond Day 1 copy

Keep later-phase roadmap items in a separate document or team issue tracker.

### Tests

```bash
npm test
```

### Scripts

| Command | Description |
|--------|------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start after build |
| `npm run lint` | ESLint |
| `npm test` | Jest tests |

### Makefile (local workflow)

- `make install` — `npm install`
- `make reset` — removes `data/local-db.json` and `.next`
- `make seed-local` — builds `data/demo-local-db.json` → `data/local-db.json`
- `make play` — frees port, copies demo data if `data/local-db.json` is missing, starts `next dev`
- `make play-fresh` — `reset` + `seed-local` + `play`
