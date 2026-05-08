create table if not exists public.favorite_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  brief_id uuid not null references public.briefs (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, brief_id)
);

create index if not exists favorite_briefs_user_id_idx on public.favorite_briefs (user_id);
create index if not exists favorite_briefs_brief_id_idx on public.favorite_briefs (brief_id);

alter table public.favorite_briefs enable row level security;

drop policy if exists favorite_briefs_deny_anon on public.favorite_briefs;
create policy favorite_briefs_deny_anon
  on public.favorite_briefs
  for all
  using (false)
  with check (false);
