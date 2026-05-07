create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('company', 'researcher')),
  institution_name text,
  institution_verified boolean not null default false,
  company_id uuid references public.companies (id) on delete set null,
  researcher_id uuid references public.researchers (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists app_users_role_idx on public.app_users (role);
create index if not exists app_users_company_id_idx on public.app_users (company_id);
create index if not exists app_users_researcher_id_idx on public.app_users (researcher_id);

alter table public.app_users enable row level security;

drop policy if exists app_users_deny_anon on public.app_users;
create policy app_users_deny_anon
  on public.app_users
  for all
  using (false)
  with check (false);
