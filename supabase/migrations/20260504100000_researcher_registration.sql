-- Researcher registration: broaden constraints to match the registration form.

-- Stage: original allowed only doktorant/ktor/postdoc. Accept 'doktor' too so the
-- typo'd value and the corrected one can coexist while data is migrated.
alter table public.researchers
  drop constraint if exists researchers_stage_check;

alter table public.researchers
  add constraint researchers_stage_check
  check (stage in ('doktorant', 'ktor', 'doktor', 'postdoc'));

-- Original limited researcher_projects.type to research/industry/internship/other.
-- The registration form distinguishes "Zlecenie/konsultacja" and "Koło naukowe".
alter table public.researcher_projects
  drop constraint if exists researcher_projects_type_check;

alter table public.researcher_projects
  add constraint researcher_projects_type_check
  check (type in (
    'research',
    'industry',
    'internship',
    'consultation',
    'student_circle',
    'other'
  ));

-- Helpful indexes for browsing researchers
create index if not exists researchers_research_domain_idx
  on public.researchers (research_domain);

create index if not exists researcher_projects_researcher_id_idx
  on public.researcher_projects (researcher_id);
