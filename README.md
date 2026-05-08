## Nexdoc / RD Bridge

Nexdoc is a Next.js MVP for connecting companies that need R&D support with PhD candidates, researchers and early-career experts. Companies publish structured R&D briefs, researchers build profiles and apply, and the app uses AI plus optional semantic embeddings to explain fit.

### Tech Stack

- Next.js App Router, React 18 and TypeScript
- Tailwind CSS for UI
- Local JSON database for quick demos
- Optional Supabase/Postgres backend
- LLM integration via Groq, Anthropic or any OpenAI-compatible API
- Optional semantic matching via Groq/OpenAI-compatible/Voyage embeddings
- Jest tests for brief generation and embedding routing

### Main Features

- Landing page and navigation for companies and researchers.
- Role-based account flow: company or researcher.
- Company dashboard with published briefs, applications and top applicant scores.
- Multi-step company brief creator with AI brief generation and researcher preview.
- Published brief listing and detail pages with filters, favorites and application state.
- Researcher registration with AI profile builder, public profiles and profile completeness.
- Researcher dashboard with classification, recommended briefs, favorite briefs and application history.
- Application flow with cover message, match score, strengths, risks and match dimensions.
- Company application management with status updates.
- Local JSON mode for hackathon/demo usage and Supabase mode for Postgres-backed usage.

### Requirements

- Node.js 20+
- npm
- Optional: Supabase project if `USE_LOCAL_JSON_DB=false`
- Optional but recommended: at least one LLM provider key for AI brief/profile/match features

### Quick Start

Install dependencies:

```bash
npm install
```

Copy environment variables:

```bash
cp .env.example .env.local
```

Run the fastest local demo:

```bash
make play
```

The app runs at [http://localhost:3000](http://localhost:3000).

`make play` frees the configured port, copies `data/demo-local-db.json` to `data/local-db.json` if the local database is missing, and starts `next dev` with `USE_LOCAL_JSON_DB=true`.

Demo accounts use the password `demo1234`:

- company: `rd@ttpsc.pl`
- company: `innovation@polpharma.com`
- researcher: `k.nowak@doktorant.pw.edu.pl`
- researcher: `a.zielinska@amu.edu.pl`

### Environment

Local JSON mode is the default in `.env.example`:

```bash
USE_LOCAL_JSON_DB=true
```

In this mode the app reads and writes data in `data/local-db.json`. To reset local data and Next.js cache:

```bash
make reset
```

To rebuild demo data and copy it to the local database:

```bash
make seed-local
```

To use Supabase instead, set:

```bash
USE_LOCAL_JSON_DB=false
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
```

Never commit real secrets. Keep API keys only in `.env.local`.

### LLM and Embeddings

The app auto-selects the first available LLM backend in this order:

- `GROQ_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_BASE_URL` + `OPENAI_API_KEY` + `OPENAI_MODEL`

You can force a provider with:

```bash
AI_PROVIDER=groq
AI_PROVIDER=anthropic
AI_PROVIDER=openai_compatible
```

Embeddings are used for semantic recommendations and richer match scoring when configured. The default routing follows the LLM provider where possible. Anthropic does not provide native embeddings, so Anthropic setups should use `VOYAGE_API_KEY` or OpenAI-compatible embedding variables. See `.env.example` for `EMBEDDING_PROVIDER`, `GROQ_EMBEDDING_MODEL`, `VOYAGE_EMBEDDING_MODEL`, `OPENAI_EMBEDDINGS_*` and match-weight variables.

### Supabase Setup

Run SQL migrations from `supabase/migrations/` in filename order. They define companies, briefs, researchers, researcher projects, applications, app users, favorite briefs, access tokens and application match fields.

Optional demo data is available in `supabase/seed.sql`. Run it from the Supabase SQL editor only when you are comfortable clearing demo tables, because the seed uses `TRUNCATE`.

### Important Routes

- `/` - landing page
- `/auth/sign-up` - create company or researcher account
- `/auth/sign-in` - sign in
- `/briefs` - published R&D briefs
- `/briefs/[id]` - brief detail
- `/researchers` - researcher directory
- `/researcher/register` - researcher profile registration
- `/researcher/[id]` - public researcher profile
- `/researcher/[id]/dashboard` - researcher dashboard
- `/researcher/apply/[briefId]` - application form
- `/company/new-brief` - company brief creator
- `/company/dashboard` - company dashboard
- `/company/briefs/[id]/applications` - company application management

### API Routes

- `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- `/api/briefs/generate`, `/api/briefs/publish`, `/api/briefs/favorites`
- `/api/researcher/profile-build`, `/api/researcher/register`
- `/api/researchers/quick-match`
- `/api/applications/submit`, `/api/applications/status`
- `/api/health`

Health check:

```bash
curl -s http://localhost:3000/api/health
```

The response includes `supabase: ok | error | local` and `llm: ok | error`.

### Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
npm run seed:demo-json
```

Makefile helpers:

- `make install` - run `npm install`
- `make reset` - remove `data/local-db.json` and `.next`
- `make kill-port` - free `PORT`, default `3000`
- `make play` - prepare local JSON data and run the dev server
- `make play-fresh` - reset, then run `make play`
- `make seed-local` - rebuild `data/demo-local-db.json` and copy it to `data/local-db.json`
- `make play-demo` - reset, seed local data and run the dev server
- `make verify-seed-json` - print demo dataset row counts

### Tests

Run the Jest suite:

```bash
npm test
```

Run ESLint:

```bash
npm run lint
```

### Current Limitations

- No payments or billing.
- No email notifications.
- No file attachments or in-app chat.
- Session auth is intentionally lightweight for the MVP; production deployments should provide a stable `AUTH_SESSION_SECRET`.
- Some UI copy is English-first and not fully localized.
