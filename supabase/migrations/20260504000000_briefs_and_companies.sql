-- Companies (upsert target for publish flow)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.companies
  add column if not exists updated_at timestamptz not null default now();

-- Published / draft R&D briefs
create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  raw_input jsonb not null,
  final_content jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists briefs_company_id_idx on public.briefs (company_id);
create index if not exists briefs_status_published_at_idx on public.briefs (status, published_at desc);

alter table public.companies enable row level security;
alter table public.briefs enable row level security;

-- Public read: published briefs only (anon / logged users)
create policy "briefs_select_published"
  on public.briefs
  for select
  using (status = 'published');

create policy "companies_select_linked"
  on public.companies
  for select
  using (
    exists (
      select 1
      from public.briefs b
      where b.company_id = companies.id
        and b.status = 'published'
    )
  );

-- Inserts/updates go through service role (bypasses RLS) in API routes
