## RD Bridge — Setup

MVP web app (Next.js + Supabase **opcjonalnie** + model AI) łączący firmy potrzebujące wsparcia R&D z doktorantami i młodszymi badaczami.

### Prerequisites

- **Node.js** 20+ (zalecana LTS)
- **npm** (lub pnpm/yarn)
- Konto **Supabase** (opcjonalnie — jeśli używasz trybu Supabase)
- Model AI (patrz sekcja „LLM provider”) — generowanie briefów i dopasowanie

### Environment variables

Utwórz plik `.env.local` w katalogu głównym projektu.

#### Tryb Supabase (pełna wersja — dane w Postgres)

| Zmienna | Po co |
|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projektu Supabase (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Klucz publiczny `anon` — odczyt z przeglądarki / Server Components (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Klucz `service_role` — **tylko serwer** (API routes): publikacja briefów, rejestracja, aplikacje |
| `NEXT_PUBLIC_APP_ORIGIN` | (Opcjonalnie) np. `http://localhost:3000` — pełny URL w odpowiedzi po publikacji briefu |

#### Tryb lokalny JSON (bez Supabase — szybkie demo)

W tym repo domyślnie masz już w `.env`:
- `USE_LOCAL_JSON_DB=true`

Wtedy aplikacja czyta i zapisuje dane w pliku `data/local-db.json`.

Jeśli chcesz wrócić do Supabase, ustaw w `.env.local`:
- `USE_LOCAL_JSON_DB=false`

#### LLM provider (briefy + profile + dopasowanie)

Projekt obsługuje jeden z backendów (auto-wybór po kluczach):
- `GROQ_API_KEY` (Groq; OpenAI-compatible endpoint)
- `ANTHROPIC_API_KEY` (Claude)
- `OPENAI_BASE_URL` + `OPENAI_API_KEY` + `OPENAI_MODEL` (dowolne API OpenAI-compatible)

Możesz wymusić backend:
- `AI_PROVIDER=groq | anthropic | openai_compatible`

### Database setup

#### Tryb Supabase

1. W panelu Supabase wykonaj **migracje SQL** z katalogu `supabase/migrations/` w kolejności nazw plików.
2. (Opcjonalnie) Załaduj dane demonstracyjne:
   - wejdź w **Supabase → SQL Editor**
   - otwórz `supabase/seed.sql`
   - uruchom (seed robi `TRUNCATE`, więc czyści tabele aplikacji)

Szczegóły modelu: tabele `companies`, `briefs`, `researchers`, `researcher_projects`, `applications` oraz pola `company_access_token`, `cover_message`, `match_strengths`, `match_risks`, `match_dimensions` opisane są w migracjach.

#### Tryb lokalny JSON (demo bez Supabase)

Dane demo są generowane do `data/local-db.json`:
- `make seed-local` — buduje `data/demo-local-db.json` → `data/local-db.json`
- `make play-fresh` — reset + seed-local + start

### Running locally

Najprościej (demo na danych JSON):

```bash
make play-fresh
```

Aplikacja: [http://localhost:3000](http://localhost:3000).

Jeśli coś „stoi” na porcie albo chcesz czyścić dane:

```bash
make reset
```

Sprawdzenie integracji:

```bash
curl -s http://localhost:3000/api/health
```

Odpowiedź JSON zawiera m.in.:
- `supabase`: `ok | error | local`
- `llm`: `ok | error`

### Day 1 features

- Landing, nawigacja, lista **opublikowanych briefów** z filtrami (`/briefs`)
- Flow firmy: wieloetapowy formularz, generowanie briefu AI, publikacja (`/company/new-brief`)
- **Token** w `company_access_token` i panel aplikacji dla firmy (`/company/briefs/[id]/applications?token=...`)
- Rejestracja profilu badacza (`/researcher/register`) z **AI Profile Builderem** i publiczny profil (`/researcher/[id]`)
- Dashboard doktoranta (`/researcher/[id]/dashboard`) z klasyfikacją dorobku, rekomendowanymi briefami i aplikacjami
- Aplikacja na brief z **wymiarową oceną dopasowania** AI (`/researcher/apply/[briefId]`)
- API: `/api/briefs/generate`, `/api/briefs/publish`, `/api/researcher/profile-build`, `/api/researcher/register`, `/api/applications/submit`, `/api/applications/status`, `/api/health`

### What's NOT in v1

- Pełna **autentykacja** użytkowników (logowanie firmy/badacza przez OAuth/hasło)
- **Płatności** i rozliczenia
- **Powiadomienia e-mail** (link do briefu z tokenem trzeba przekazać firmie inną drogą)
- Zaawansowany audyt, załączniki, chat, wielojęzyczność UI poza polskim copy przygotowanym na Day 1

Roadmapę kolejnych etapów warto trzymać w osobnym dokumencie lub issue trackerze zespołu.

### Tests

```bash
npm test
```

### Scripts

| Komenda | Opis |
|--------|------|
| `npm run dev` | Serwer developerski Next.js |
| `npm run build` | Build produkcyjny |
| `npm run start` | Start po buildzie |
| `npm run lint` | ESLint |
| `npm test` | Testy Jest |

### Makefile (lokalny workflow)

- `make install` — `npm install`
- `make reset` — usuwa `data/local-db.json` oraz `.next`
- `make seed-local` — buduje `data/demo-local-db.json` → `data/local-db.json`
- `make play` — zwalnia port, kopiuje demo jeśli brakuje `data/local-db.json`, uruchamia `next dev`
- `make play-fresh` — `reset` + `seed-local` + `play`
