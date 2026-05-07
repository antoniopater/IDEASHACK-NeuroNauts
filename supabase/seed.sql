-- RD Bridge - MVP seed. Run in Supabase SQL Editor after migrations.
-- For apps without Supabase, use `make seed-local` (data/demo-local-db.json).

BEGIN;

TRUNCATE TABLE public.applications CASCADE;
TRUNCATE TABLE public.researcher_projects CASCADE;
TRUNCATE TABLE public.researchers CASCADE;
TRUNCATE TABLE public.briefs CASCADE;
TRUNCATE TABLE public.companies CASCADE;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS industry TEXT;

-- --- COMPANIES (3) ---------------------------------------------------------

INSERT INTO public.companies (id, name, industry, email) VALUES
  ('a0000000-0000-4000-a000-000000000001', 'Transition Technologies PSC',  'IT & Software',            'rd@ttpsc.pl'),
  ('a0000000-0000-4000-a000-000000000002', 'Polpharma Biologics',           'Pharmaceuticals & Biotech', 'innovation@polpharma.com'),
  ('a0000000-0000-4000-a000-000000000003', 'ML System',                     'IT & Software',            'rd@mlsystem.pl');

-- --- BRIEFS (4 published) - final_content MUST include suggested_researcher_profile (Zod / UI)

INSERT INTO public.briefs (id, company_id, status, published_at, raw_input, final_content, company_access_token) VALUES
(
  'b0000000-0000-4000-b000-000000000001',
  'a0000000-0000-4000-a000-000000000001',
  'published',
  now() - interval '6 days',
  $raw${"problem":"We run a service request management system for 200+ field technicians. Assigning tickets to technicians takes the dispatcher 2-3 hours a day and is based largely on intuition.","industry":"IT & Software","timeline":"1-3 months","budget":"PLN 20,000-50,000"}$raw$::jsonb,
  $fc${"cel_rd":"Develop an algorithm for automatically assigning field service requests to technicians based on location, skills, and workload.","wymagane_kompetencje":["Combinatorial optimization or constraint programming","Knowledge of routing algorithms / vehicle routing problem","Python or Java - prototype implementation"],"zakres_projektu":"Analyze the current process, review field service optimization literature, and implement and test the assignment algorithm on synthetic data.","oczekiwany_rezultat":"Working algorithm prototype and report evaluating assignment quality versus the current manual method.","pierwszy_milestone":"After 2 weeks: formalized problem model and selected algorithmic approach with rationale.","suggested_researcher_profile":"Candidate with a computer science or applied mathematics background who understands VRP and field scheduling, can implement and evaluate algorithms on realistic data, and communicates results in an operations-focused report."}$fc$::jsonb,
  'ttpsc-seed-token-brief1-field-service-opt'
),
(
  'b0000000-0000-4000-b000-000000000002',
  'a0000000-0000-4000-a000-000000000002',
  'published',
  now() - interval '4 days',
  $raw${"problem":"We are looking for a current literature review on biodegradable hydrogel-based drug delivery systems, with a particular focus on applications in the treatment of chronic wounds.","industry":"Pharmaceuticals & Biotech","timeline":"1-4 weeks","budget":"PLN 5,000-20,000"}$raw$::jsonb,
  $fc${"cel_rd":"Systematic literature review (2019-2025) on biodegradable hydrogels as drug delivery systems for chronic wound therapy.","wymagane_kompetencje":["Polymer chemistry or biomedical engineering","Ability to conduct scientific literature reviews (PubMed, Scopus)","Knowledge of medical device regulations (preferred)"],"zakres_projektu":"Review at least 60 publications, synthesize findings, assess TRL maturity of selected solutions, and recommend 3-5 research directions.","oczekiwany_rezultat":"A 20-30 page report with comparative materials table, researcher landscape, and recommendations for the R&D team.","pierwszy_milestone":"After 1 week: review protocol approved by the company and a list of 15 key publications.","suggested_researcher_profile":"Researcher experienced in polymer chemistry or biomaterials, comfortable with bibliographic databases, and able to connect hydrogel mechanical and biological properties with clinical potential and identify R&D gaps."}$fc$::jsonb,
  'polpharma-seed-token-brief2-hydrogel-lit'
),
(
  'b0000000-0000-4000-b000-000000000003',
  'a0000000-0000-4000-a000-000000000003',
  'published',
  now() - interval '10 days',
  $raw${"problem":"Our defect detection model for photovoltaic panels works well in the lab, but accuracy drops by 15-20pp in production due to variable lighting conditions.","industry":"IT & Software","timeline":"3-6 months","budget":"PLN 20,000-50,000"}$raw$::jsonb,
  $fc${"cel_rd":"Investigate and implement data augmentation and domain adaptation methods to improve robustness of PV defect detection in varying lighting conditions.","wymagane_kompetencje":["Computer vision and deep learning (PyTorch or TensorFlow)","Domain adaptation / transfer learning","Experience with industrial camera data (preferred)"],"zakres_projektu":"Analyze causes of accuracy degradation, run augmentation and domain adaptation experiments on company-provided data, and deliver a report with recommendations.","oczekiwany_rezultat":"Report with experiment results plus the best data-processing pipeline ready for integration.","pierwszy_milestone":"After 3 weeks: problem diagnosis and baseline experiment results for 3 augmentation approaches.","suggested_researcher_profile":"Computer vision engineer with production model and domain shift experience (lighting, industrial cameras), capable of designing experiments, measuring comparative metrics, and preparing deployment recommendations."}$fc$::jsonb,
  'mlsystem-seed-token-brief3-pv-detection'
),
(
  'b0000000-0000-4000-b000-000000000004',
  'a0000000-0000-4000-a000-000000000001',
  'published',
  now() - interval '2 days',
  $raw${"problem":"We want to assess whether using an LLM to automatically categorize and prioritize helpdesk tickets (about 500/day) is technically feasible and cost-effective.","industry":"IT & Software","timeline":"1-4 weeks","budget":"PLN 5,000-20,000"}$raw$::jsonb,
  $fc${"cel_rd":"Proof of concept for automated helpdesk ticket classification and prioritization using language models, including technical and economic feasibility assessment.","wymagane_kompetencje":["NLP and language models (fine-tuning or prompt engineering)","Text classification model evaluation","API and LLM infrastructure cost estimation"],"zakres_projektu":"Analyze a sample of tickets (provided by the company), implement 2-3 LLM approaches, compare against a baseline (keyword matching), and deliver a cost-benefit report.","oczekiwany_rezultat":"Working POC plus report with deployment recommendation (proceed / do not proceed) and ROI estimate.","pierwszy_milestone":"After 1 week: analyzed sample of 200 tickets and selected model for testing.","suggested_researcher_profile":"NLP specialist able to define a baseline, design evaluation (metrics, sample), and estimate LLM API operating costs and quality risks for SLA-bound helpdesk workflows."}$fc$::jsonb,
  'ttpsc-seed-token-brief4-llm-helpdesk-poc'
);

-- --- RESEARCHERS (5) -------------------------------------------------------

INSERT INTO public.researchers (
  id, email, first_name, last_name, institution,
  phd_start_year, stage,
  research_domain, research_subdomain, research_description,
  practical_skills,
  availability_hours_per_week, availability_modes,
  motivation, publication_links, profile_completeness
) VALUES
(
  'c0000000-0000-4000-c000-000000000001',
  'k.nowak@doktorant.pw.edu.pl',
  'Kamil', 'Nowak',
  'Warsaw University of Technology, Faculty of Electronics and Information Technology',
  2024, 'doktorant',
  'Computer Science & AI',
  'machine learning, real-time systems',
  'I research methods for optimizing task allocation in multi-agent systems. Specifically: how to make multiple autonomous agents (e.g. robots, drones, field technicians) share work efficiently without a central coordinator.',
  ARRAY[
    'Combinatorial optimization (Python, OR-Tools)',
    'Heuristic algorithms (SA, GA, tabu search)',
    'Multi-agent simulations (Mesa, NetLogo)',
    'Operational data analysis (pandas, numpy)',
    'Writing technical reports in Polish and English'
  ],
  20,
  ARRAY['consultation', 'proof_of_concept', 'small_rd_project'],
  'I want to see how the problems I model theoretically look in reality. By working with a company I can verify whether my algorithms make sense outside of simulation. Honestly - I also want to earn money from research instead of waiting for a grant.',
  ARRAY[]::text[],
  88
),
(
  'c0000000-0000-4000-c000-000000000002',
  'm.kowalczyk@uj.edu.pl',
  'Marta', 'Kowalczyk',
  'Jagiellonian University, Faculty of Biochemistry, Biophysics and Biotechnology',
  2022, 'doktorant',
  'Natural Sciences',
  'biomaterials, hydrogels, tissue engineering',
  'I synthesize and characterize bacterial cellulose hydrogels as carriers for stem cells. I am interested in how the mechanical properties of the gel influence cell differentiation.',
  ARRAY[
    'Hydrogel synthesis and characterization (rheology, SEM, FTIR)',
    'Cell culture and cytotoxicity testing',
    'Scientific literature review (PubMed, Scopus, Web of Science)',
    'Writing scientific reports',
    'Knowledge of class I medical device regulations'
  ],
  16,
  ARRAY['literature_review', 'consultation'],
  'Academia gives me depth, but I lack contact with real-world applications. I want to see what questions companies are asking - it also inspires my research. I am especially interested in medtech and pharmaceuticals.',
  ARRAY['https://doi.org/10.1016/j.carbpol.2023.121456'],
  82
),
(
  'c0000000-0000-4000-c000-000000000003',
  'p.wisniewski@pwr.edu.pl',
  'Piotr', 'Wisniewski',
  'Wroclaw University of Science and Technology, Department of Applied Informatics',
  2019, 'doktor',
  'Computer Science & AI',
  'computer vision, deep learning, industrial vision systems',
  'I defended a PhD on deep learning methods for defect detection in composite materials. For 4 years I worked with thermal and RGB camera data from production lines.',
  ARRAY[
    'Computer vision (PyTorch, OpenCV, YOLO, U-Net)',
    'Transfer learning and domain adaptation',
    'Working with industrial camera data (RGB, thermal, X-ray)',
    'Evaluating ML model quality in production conditions',
    'Integrating models with SCADA/MES systems (proof-of-concept)'
  ],
  32,
  ARRAY['consultation', 'proof_of_concept', 'small_rd_project', 'literature_review'],
  'After my PhD I want to build things that work in production, not only in papers. I had two industry projects during my PhD and I know this work is meaningful. I am looking for projects where my CV+industry specialization brings real value.',
  ARRAY[
    'https://doi.org/10.1109/TII.2022.3187234',
    'https://doi.org/10.1016/j.eswa.2023.119876'
  ],
  95
),
(
  'c0000000-0000-4000-c000-000000000004',
  'a.zielinska@amu.edu.pl',
  'Anna', 'Zielinska',
  'Adam Mickiewicz University, Faculty of Mathematics and Computer Science',
  2017, 'postdoc',
  'Mathematics & Statistics',
  'Bayesian statistics, probabilistic modeling, NLP',
  'I research Bayesian inference methods for language models - in particular how to quantify the uncertainty of LLM predictions. Recently I have been working on calibration methods for text classifiers.',
  ARRAY[
    'Bayesian statistics and probabilistic modeling (Stan, PyMC)',
    'NLP and text classification (HuggingFace, scikit-learn)',
    'ML model evaluation and calibration',
    'Data analysis (R, Python)',
    'Technical documentation writing'
  ],
  12,
  ARRAY['consultation', 'literature_review'],
  'Working with companies helps me understand which questions about AI reliability are important in practice. I am interested in projects where my expertise on model uncertainty applies - fintech, medtech, recommender systems.',
  ARRAY[
    'https://doi.org/10.18653/v1/2023.acl-long.445',
    'https://doi.org/10.1609/aaai.v37i11.26556',
    'https://arxiv.org/abs/2309.12345'
  ],
  78
),
(
  'c0000000-0000-4000-c000-000000000005',
  't.grabowski@agh.edu.pl',
  'Tomasz', 'Grabowski',
  'AGH University of Science and Technology, Faculty of Electrical Engineering, Automatics, Computer Science and Biomedical Engineering',
  2018, 'doktor',
  'Engineering & Technology',
  'automation, embedded systems, industrial IoT',
  'PhD on predictive diagnostics of industrial machinery using machine learning methods. During my PhD I spent 2 years at Eaton as an R&D engineer, so I know what production deployment looks like from the inside.',
  ARRAY[
    'Predictive maintenance and diagnostics (Python, scikit-learn, PyCaret)',
    'Embedded systems and data acquisition (MQTT, OPC-UA, Raspberry Pi)',
    'Time series analysis (FFT, wavelet, LSTM)',
    'Working with PLC and SCADA data',
    'Writing technical specifications and documentation for industrial customers'
  ],
  24,
  ARRAY['consultation', 'proof_of_concept', 'small_rd_project'],
  'I know the pain of industrial deployment from the inside - I know that a good paper is not enough. I want to work with companies that have a real problem to solve, not just a need to ''do R&D'' for a grant. IoT, predictive maintenance, and industrial automation projects are my thing.',
  ARRAY['https://doi.org/10.1016/j.ress.2022.108534'],
  92
);

-- --- PROJECTS (10) ---------------------------------------------------------

INSERT INTO public.researcher_projects (researcher_id, title, description, type, year_from, year_to) VALUES
(
  'c0000000-0000-4000-c000-000000000001',
  'Route optimization for a fleet of 50 vehicles',
  'Course project: I modeled VRP for a fictional courier company and compared OR-Tools against a custom genetic algorithm. OR-Tools won 3:0.',
  'research', 2024, 2024
),
(
  'c0000000-0000-4000-c000-000000000001',
  'AI Student Circle WUT - demo project',
  'Together with a team I built a web app showing scheduling algorithms running live on 5 machines. Used for demos at faculty open days.',
  'other', 2023, 2024
),
(
  'c0000000-0000-4000-c000-000000000002',
  'Synthesis of BC/PVA hydrogels for tissue engineering',
  'Main PhD project - synthesis and full characterization of 12 hydrogel formulations, with hMSC stem cell tests.',
  'research', 2022, 2024
),
(
  'c0000000-0000-4000-c000-000000000002',
  'Collaboration with Tricomed',
  'Three-month consultation on an active wound dressing project - I prepared a literature review on hydrogel wound dressings and joined R&D discussions.',
  'industry', 2023, 2023
),
(
  'c0000000-0000-4000-c000-000000000003',
  'Delamination detection in CFRP using deep learning',
  'PhD: I built a 12k thermal image dataset, trained and compared 6 CNN architectures. Result: 94.3% F1 on the test set.',
  'research', 2019, 2023
),
(
  'c0000000-0000-4000-c000-000000000003',
  'Volkswagen Poznan project - paint visual inspection',
  'Proof-of-concept system for detecting body paint scratches - from data collection to integration with the production line reporting system.',
  'industry', 2022, 2023
),
(
  'c0000000-0000-4000-c000-000000000004',
  'Calibration of text classification models for medicine',
  'Post-doc project: I investigated why NLP models for medical document classification are miscalibrated and how to fix it without access to training data.',
  'research', 2021, 2023
),
(
  'c0000000-0000-4000-c000-000000000004',
  'Startup consultation - scoring model review',
  'A fintech startup asked for an independent review of their scoring model. I delivered a report with bias and calibration analysis plus recommendations.',
  'consultation', 2023, 2023
),
(
  'c0000000-0000-4000-c000-000000000005',
  'Predictive maintenance of electric motors for Eaton',
  '2 years as an R&D engineer - I built a PdM system from scratch for 3 motor types. Data from 40 sensors, edge device deployment, integration with the EAM system.',
  'industry', 2021, 2022
),
(
  'c0000000-0000-4000-c000-000000000005',
  'Predictive diagnostics of centrifugal pumps',
  'PhD: benchmark of 15 ML methods for anomaly detection in pump time series. Largest dataset: 18 months, 8 sensors, 6 fault classes.',
  'research', 2022, 2024
);

-- --- APPLICATIONS (3) ------------------------------------------------------

INSERT INTO public.applications (
  brief_id, researcher_id, cover_message, match_score, match_explanation, match_strengths, match_risks, match_dimensions, status
) VALUES
(
  'b0000000-0000-4000-b000-000000000001',
  'c0000000-0000-4000-c000-000000000001',
  'Hello, I work directly on the assignment problem in multi-agent environments and on VRP - I would happily build a prototype and compare it with the dispatcher''s current method on synthetic or anonymized data. I propose a meeting to clarify business constraints.',
  91,
  'Kamil directly studies the task assignment problem in multi-agent systems - that is exactly the Vehicle Routing Problem described in the brief. His OR-Tools and heuristic algorithm skills are precisely what the project requires.',
  '["Topic match with VRP and field scheduling","Practical implementation skills in Python and OR-Tools"]'::jsonb,
  '["Early-stage PhD candidate - fewer commercial projects at the 200+ technician scale"]'::jsonb,
  '{"domain_fit":{"score":96,"rationale":"The profile and brief both focus on field task optimization."},"skills_fit":{"score":92,"rationale":"OR-Tools, heuristics, and Python match the brief requirements."},"availability_fit":{"score":85,"rationale":"20 hours per week is sufficient for a 1-3 month POC horizon."},"motivation_fit":{"score":90,"rationale":"Motivation indicates willingness to validate research on real data."}}'::jsonb,
  'pending'
),
(
  'b0000000-0000-4000-b000-000000000003',
  'c0000000-0000-4000-c000-000000000003',
  'During my PhD I studied CV model degradation when heating/lighting conditions changed on the production line - I would gladly transfer that workflow to PV panels and prepare an experiment plan for augmentation and domain adaptation.',
  97,
  'A perfect fit - Piotr defended a PhD on defect detection in composite materials using CV and has experience with domain adaptation. The variable lighting problem is his specialty.',
  '["Strong CV and domain adaptation track record","Experience with industrial production-line data"]'::jsonb,
  '[]'::jsonb,
  '{"domain_fit":{"score":100,"rationale":"Both the PhD work and brief are about industrial defect detection."},"skills_fit":{"score":98,"rationale":"Computer vision, PyTorch, and domain adaptation are central to the task."},"availability_fit":{"score":95,"rationale":"32 hours per week supports an intensive POC."},"motivation_fit":{"score":94,"rationale":"The candidate is actively looking for production-grade projects."}}'::jsonb,
  'shortlisted'
),
(
  'b0000000-0000-4000-b000-000000000002',
  'c0000000-0000-4000-c000-000000000002',
  'I specialize in hydrogels and systematic literature reviews (PubMed/Scopus). I can prepare a review protocol, a materials comparison table, and TRL recommendations aligned with your R&D pipeline.',
  94,
  'Marta actively works with hydrogels as biological carriers and has documented experience with pharmaceutical literature reviews. Her profile fits the brief scope almost perfectly.',
  '["Active research on hydrogels","Experience with reviews focused on medtech/pharma"]'::jsonb,
  '["Limited weekly availability versus a full-time engagement"]'::jsonb,
  '{"domain_fit":{"score":96,"rationale":"Hydrogel research is directly aligned with the brief topic."},"skills_fit":{"score":93,"rationale":"Literature review and biomaterials expertise match the scope."},"availability_fit":{"score":78,"rationale":"16 hours per week is suitable for a report-focused project but needs scope control."},"motivation_fit":{"score":88,"rationale":"Motivation is strongly aligned with medtech and pharmaceuticals."}}'::jsonb,
  'pending'
);

COMMIT;

-- Verification (SQL Editor):
-- SELECT 'companies' AS t, count(*) FROM companies
-- UNION ALL SELECT 'briefs', count(*) FROM briefs
-- UNION ALL SELECT 'researchers', count(*) FROM researchers
-- UNION ALL SELECT 'researcher_projects', count(*) FROM researcher_projects
-- UNION ALL SELECT 'applications', count(*) FROM applications;
-- Expected: 3, 4, 5, 10, 3
