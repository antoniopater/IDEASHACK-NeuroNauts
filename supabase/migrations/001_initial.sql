-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- R&D Briefs
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  raw_input JSONB NOT NULL,
  ai_output JSONB,
  final_content JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Researchers
CREATE TABLE researchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  institution TEXT NOT NULL,
  phd_start_year INT,
  stage TEXT NOT NULL CHECK (stage IN ('doktorant','ktor','postdoc')),
  research_domain TEXT,
  research_subdomain TEXT,
  research_description TEXT,
  practical_skills TEXT[],
  availability_hours_per_week INT,
  availability_modes TEXT[],
  motivation TEXT,
  publication_links TEXT[],
  profile_completeness INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Projects (researcher work experience)
CREATE TABLE researcher_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  researcher_id UUID REFERENCES researchers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('research','industry','internship','other')),
  year_from INT,
  year_to INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Applications (researcher applies to brief)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES briefs(id) ON DELETE CASCADE,
  researcher_id UUID REFERENCES researchers(id) ON DELETE CASCADE,
  match_score FLOAT,
  match_explanation TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','shortlisted','rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brief_id, researcher_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE researcher_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Permissive policies (v1) — will tighten in v2
CREATE POLICY "companies_all_access" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "briefs_all_access" ON briefs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "researchers_all_access" ON researchers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "researcher_projects_all_access" ON researcher_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "applications_all_access" ON applications FOR ALL USING (true) WITH CHECK (true);
