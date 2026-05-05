-- Company access link (MVP token gate for applications dashboard)
alter table public.briefs
  add column if not exists company_access_token text unique;

-- Application messaging + structured match output
alter table public.applications
  add column if not exists cover_message text;

alter table public.applications
  add column if not exists match_strengths jsonb not null default '[]'::jsonb;

alter table public.applications
  add column if not exists match_risks jsonb not null default '[]'::jsonb;

create index if not exists briefs_company_access_token_idx on public.briefs (company_access_token);
