-- RD Bridge — seed MVP (PL). Uruchom w Supabase SQL Editor po migracjach.
-- Dla aplikacji bez Supabase: skopiuj dane przez `make seed-local` (plik data/demo-local-db.json).

BEGIN;

TRUNCATE TABLE public.applications CASCADE;
TRUNCATE TABLE public.researcher_projects CASCADE;
TRUNCATE TABLE public.researchers CASCADE;
TRUNCATE TABLE public.briefs CASCADE;
TRUNCATE TABLE public.companies CASCADE;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS industry TEXT;

-- ─── COMPANIES (3) ───────────────────────────────────────────────────────────

INSERT INTO public.companies (id, name, industry, email) VALUES
  ('a0000000-0000-4000-a000-000000000001', 'Transition Technologies PSC',  'IT i oprogramowanie',     'rd@ttpsc.pl'),
  ('a0000000-0000-4000-a000-000000000002', 'Polpharma Biologics',           'Farmaceutyka i biotech', 'innovation@polpharma.com'),
  ('a0000000-0000-4000-a000-000000000003', 'ML System',                     'IT i oprogramowanie',     'rd@mlsystem.pl');

-- ─── BRIEFS (4 opublikowane) — final_content MUSI zawierać suggested_researcher_profile (Zod / UI)

INSERT INTO public.briefs (id, company_id, status, published_at, raw_input, final_content, company_access_token) VALUES
(
  'b0000000-0000-4000-b000-000000000001',
  'a0000000-0000-4000-a000-000000000001',
  'published',
  now() - interval '6 days',
  $raw${"problem":"Mamy system zarządzania zleceniami serwisowymi dla 200+ techników w terenie. Czas przypisywania zleceń do techników zajmuje dyspozytorowi 2-3h dziennie i opiera się na intuicji.","industry":"IT i oprogramowanie","timeline":"1–3 miesiące","budget":"20 000–50 000 zł"}$raw$::jsonb,
  $fc${"cel_rd":"Opracowanie algorytmu automatycznego przypisywania zleceń serwisowych do techników w terenie z uwzględnieniem lokalizacji, kompetencji i obciążenia pracą.","wymagane_kompetencje":["Optymalizacja kombinatoryczna lub programowanie z ograniczeniami","Znajomość algorytmów routingu / vehicle routing problem","Python lub Java — implementacja prototypu"],"zakres_projektu":"Analiza obecnego procesu, przegląd literatury dot. field service optimization, implementacja i testy algorytmu przypisującego na danych syntetycznych.","oczekiwany_rezultat":"Działający prototyp algorytmu + raport z oceną jakości przypisań vs. obecna metoda ręczna.","pierwszy_milestone":"Po 2 tygodniach: sformalizowany model problemu + wybór podejścia algorytmicznego z uzasadnieniem.","suggested_researcher_profile":"Osoba z tłem w informatyce lub matematyce stosowanej, która rozumie VRP / schedulowanie w terenie, potrafi zaimplementować i zmierzyć algorytm na realistycznych danych oraz komunikuje wyniki w formie raportu dla działu operacji."}$fc$::jsonb,
  'ttpsc-seed-token-brief1-field-service-opt'
),
(
  'b0000000-0000-4000-b000-000000000002',
  'a0000000-0000-4000-a000-000000000002',
  'published',
  now() - interval '4 days',
  $raw${"problem":"Szukamy przeglądu aktualnej literatury dot. biodegradowalnych systemów dostarczania leków opartych na hydrożelach — interesuje nas szczególnie zastosowanie w leczeniu ran przewlekłych.","industry":"Farmaceutyka i biotech","timeline":"1–4 tygodnie","budget":"5 000–20 000 zł"}$raw$::jsonb,
  $fc${"cel_rd":"Systematyczny przegląd literatury (2019–2025) dotyczący biodegradowalnych hydrożeli jako systemów dostarczania leków w terapii ran przewlekłych.","wymagane_kompetencje":["Chemia polimerów lub inżynieria biomedyczna","Umiejętność przeglądu literatury naukowej (PubMed, Scopus)","Znajomość regulacji dot. wyrobów medycznych (mile widziana)"],"zakres_projektu":"Przegląd min. 60 publikacji, synteza wyników, ocena dojrzałości TRL wybranych rozwiązań, rekomendacja 3-5 kierunków badawczych.","oczekiwany_rezultat":"Raport 20–30 stron z tabelą porównawczą materiałów, mapą badaczy i rekomendacjami dla działu R&D.","pierwszy_milestone":"Po tygodniu: protokół przeglądu zatwierdzony przez firmę + lista 15 kluczowych publikacji.","suggested_researcher_profile":"Badacz z doświadczeniem w chemii polimerów lub biomateriałach, rutinowo pracujący z bazami bibliograficznymi, potrafiący zestawić mechaniczne i biologiczne właściwości hydrożeli z potencjałem klinicznym i wskazać luki dla dalszego R&D."}$fc$::jsonb,
  'polpharma-seed-token-brief2-hydrogel-lit'
),
(
  'b0000000-0000-4000-b000-000000000003',
  'a0000000-0000-4000-a000-000000000003',
  'published',
  now() - interval '10 days',
  $raw${"problem":"Nasz model detekcji wad w panelach fotowoltaicznych działa dobrze w laboratorium, ale na produkcji spada accuracy o 15-20pp przez zmienne warunki oświetleniowe.","industry":"IT i oprogramowanie","timeline":"3–6 miesięcy","budget":"20 000–50 000 zł"}$raw$::jsonb,
  $fc${"cel_rd":"Zbadanie i implementacja metod augmentacji danych oraz domain adaptation w celu poprawy robustności modelu detekcji wad PV w zmiennych warunkach oświetleniowych.","wymagane_kompetencje":["Computer vision i deep learning (PyTorch lub TensorFlow)","Domain adaptation / transfer learning","Doświadczenie z danymi z kamer przemysłowych (mile widziane)"],"zakres_projektu":"Analiza przyczyn degradacji accuracy, eksperymenty z augmentacją i domain adaptation na dostarczonych przez firmę danych, raport i rekomendacje.","oczekiwany_rezultat":"Raport z wynikami eksperymentów + najlepszy pipeline przetwarzania danych gotowy do integracji.","pierwszy_milestone":"Po 3 tygodniach: diagnoza problemu + wyniki baseline experiments z 3 podejściami augmentacji.","suggested_researcher_profile":"Inżynier computer vision z praktyką w modelach produkcyjnych i domain shift (oświetlenie, kamera przemysłowa), który zaprojektuje eksperymenty, zmierzy metryki porównawcze i przygotuje rekomendacje wdrożeniowe."}$fc$::jsonb,
  'mlsystem-seed-token-brief3-pv-detection'
),
(
  'b0000000-0000-4000-b000-000000000004',
  'a0000000-0000-4000-a000-000000000001',
  'published',
  now() - interval '2 days',
  $raw${"problem":"Chcemy ocenić, czy zastosowanie LLM do automatycznej kategoryzacji i priorytetyzacji zgłoszeń helpdesk (ok. 500/dzień) jest technicznie wykonalne i opłacalne.","industry":"IT i oprogramowanie","timeline":"1–4 tygodnie","budget":"5 000–20 000 zł"}$raw$::jsonb,
  $fc${"cel_rd":"Proof-of-concept automatycznej klasyfikacji i priorytetyzacji zgłoszeń helpdesk z użyciem modeli językowych — ocena wykonalności technicznej i ekonomicznej.","wymagane_kompetencje":["NLP i modele językowe (fine-tuning lub prompt engineering)","Ewaluacja modeli klasyfikacji tekstu","Szacowanie kosztów API / infrastruktury LLM"],"zakres_projektu":"Analiza próbki zgłoszeń (dostarczy firma), implementacja 2-3 podejść LLM, porównanie z baseline (keyword matching), raport cost-benefit.","oczekiwany_rezultat":"Działający POC + raport z rekomendacją: wdrażać / nie wdrażać, z szacunkiem ROI.","pierwszy_milestone":"Po tygodniu: przeanalizowana próbka 200 zgłoszeń + wybrany model do testów.","suggested_researcher_profile":"Specjalista NLP potrafiący dobrać baseline, zaprojektować ewaluację (metryki, próbka) oraz oszacować koszty utrzymania API LLM i ryzyka jakościowe dla helpdesku umów SLA."}$fc$::jsonb,
  'ttpsc-seed-token-brief4-llm-helpdesk-poc'
);

-- ─── RESEARCHERS (5) ─────────────────────────────────────────────────────────

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
  'Politechnika Warszawska, Wydział Elektroniki i Technik Informacyjnych',
  2024, 'doktorant',
  'Informatyka i AI',
  'uczenie maszynowe, systemy czasu rzeczywistego',
  'Badam metody optymalizacji rozkładu zadań w systemach wieloagentowych. Konkretnie: jak sprawić, żeby wiele autonomicznych agentów (np. roboty, drony, serwisanci) efektywnie dzieliło się pracą bez centralnego koordynatora.',
  ARRAY[
    'Optymalizacja kombinatoryczna (Python, OR-Tools)',
    'Algorytmy heurystyczne (SA, GA, tabu search)',
    'Symulacje multi-agent (Mesa, NetLogo)',
    'Analiza danych operacyjnych (pandas, numpy)',
    'Pisanie raportów technicznych po polsku i angielsku'
  ],
  20,
  ARRAY['consultation', 'proof_of_concept', 'small_rd_project'],
  'Chcę zobaczyć, jak problemy, które modeluję teoretycznie, wyglądają w rzeczywistości. Pracując z firmą mogę zweryfikować, czy moje algorytmy mają sens poza symulacją. Poza tym szczerze — chcę zarabiać na badaniach, a nie czekać na grant.',
  ARRAY[]::text[],
  88
),
(
  'c0000000-0000-4000-c000-000000000002',
  'm.kowalczyk@uj.edu.pl',
  'Marta', 'Kowalczyk',
  'Uniwersytet Jagielloński, Wydział Biochemii, Biofizyki i Biotechnologii',
  2022, 'doktorant',
  'Nauki przyrodnicze',
  'biomateriały, hydrożele, inżynieria tkankowa',
  'Syntetyzuję i charakteryzuję hydrożele na bazie celulozy bakteryjnej jako nośniki dla komórek macierzystych. Interesuję się tym, jak właściwości mechaniczne żelu wpływają na różnicowanie komórek.',
  ARRAY[
    'Synteza i charakteryzacja hydrożeli (reologia, SEM, FTIR)',
    'Hodowla komórkowa i testy cytotoksyczności',
    'Przegląd literatury naukowej (PubMed, Scopus, Web of Science)',
    'Pisanie raportów naukowych',
    'Znajomość regulacji dot. wyrobów medycznych klasy I'
  ],
  16,
  ARRAY['literature_review', 'consultation'],
  'Akademia daje mi głębię, ale brakuje mi kontaktu z realnym zastosowaniem. Chcę zobaczyć, jakie pytania zadają firmy — to też inspiruje moje badania. Interesuje mnie szczególnie medtech i farmaceutyka.',
  ARRAY['https://doi.org/10.1016/j.carbpol.2023.121456'],
  82
),
(
  'c0000000-0000-4000-c000-000000000003',
  'p.wisniewski@pwr.edu.pl',
  'Piotr', 'Wiśniewski',
  'Politechnika Wrocławska, Katedra Informatyki Stosowanej',
  2019, 'doktor',
  'Informatyka i AI',
  'computer vision, deep learning, przemysłowe systemy wizyjne',
  'Obroniłem doktorat z detekcji defektów w materiałach kompozytowych metodami głębokiego uczenia. Przez 4 lata pracowałem na danych z kamer termowizyjnych i RGB z linii produkcyjnych.',
  ARRAY[
    'Computer vision (PyTorch, OpenCV, YOLO, U-Net)',
    'Transfer learning i domain adaptation',
    'Praca z danymi z kamer przemysłowych (RGB, termowizja, X-ray)',
    'Ocena jakości modeli ML w warunkach produkcyjnych',
    'Integracja modeli z systemami SCADA/MES (proof-of-concept)'
  ],
  32,
  ARRAY['consultation', 'proof_of_concept', 'small_rd_project', 'literature_review'],
  'Po doktoracie chcę budować rzeczy, które działają w produkcji, nie tylko w papierach. Mam za sobą dwa projekty z firmami przy doktoracie i wiem, że ta praca ma sens. Szukam projektów, gdzie moja specjalizacja CV+przemysł ma realną wartość.',
  ARRAY[
    'https://doi.org/10.1109/TII.2022.3187234',
    'https://doi.org/10.1016/j.eswa.2023.119876'
  ],
  95
),
(
  'c0000000-0000-4000-c000-000000000004',
  'a.zielinska@amu.edu.pl',
  'Anna', 'Zielińska',
  'Uniwersytet im. Adama Mickiewicza, Wydział Matematyki i Informatyki',
  2017, 'postdoc',
  'Matematyka i statystyka',
  'statystyka bayesowska, modelowanie probabilistyczne, NLP',
  'Badam metody wnioskowania bayesowskiego w modelach językowych — szczególnie jak kwantyfikować niepewność predykcji LLM. Ostatnio pracuję nad metodami calibration dla klasyfikatorów tekstu.',
  ARRAY[
    'Statystyka bayesowska i modelowanie probabilistyczne (Stan, PyMC)',
    'NLP i klasyfikacja tekstu (HuggingFace, scikit-learn)',
    'Ewaluacja i kalibracja modeli ML',
    'Analiza danych (R, Python)',
    'Pisanie dokumentacji technicznej'
  ],
  12,
  ARRAY['consultation', 'literature_review'],
  'Współpraca z firmami pomaga mi zrozumieć, jakie pytania dotyczące niezawodności AI są ważne w praktyce. Jestem zainteresowana projektami, gdzie moja wiedza o niepewności modeli ma zastosowanie — fintech, medtech, systemy rekomendacyjne.',
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
  'AGH Akademia Górniczo-Hutnicza, Wydział Elektrotechniki, Automatyki, Informatyki i Inżynierii Biomedycznej',
  2018, 'doktor',
  'Inżynieria i technologia',
  'automatyka, systemy wbudowane, IoT przemysłowy',
  'Doktorat z diagnostyki predyktywnej maszyn przemysłowych metodami uczenia maszynowego. Podczas doktoratu przez 2 lata pracowałem w Eaton jako inżynier R&D i wiem jak wygląda wdrożenie od środka.',
  ARRAY[
    'Predictive maintenance i diagnostyka predyktywna (Python, scikit-learn, PyCaret)',
    'Systemy wbudowane i akwizycja danych (MQTT, OPC-UA, Raspberry Pi)',
    'Analiza szeregów czasowych (FFT, wavelet, LSTM)',
    'Praca z danymi z PLC i SCADA',
    'Pisanie specyfikacji technicznych i dokumentacji dla klientów przemysłowych'
  ],
  24,
  ARRAY['consultation', 'proof_of_concept', 'small_rd_project'],
  'Znam ból wdrożeń przemysłowych od środka — wiem, że dobry paper to za mało. Chcę pracować z firmami, które mają realny problem do rozwiązania, nie tylko potrzebę ''zrobienia R&D'' dla dotacji. Projekty IoT, predictive maintenance i automatyzacja przemysłowa to moje.',
  ARRAY['https://doi.org/10.1016/j.ress.2022.108534'],
  92
);

-- ─── PROJEKTY (10) ───────────────────────────────────────────────────────────

INSERT INTO public.researcher_projects (researcher_id, title, description, type, year_from, year_to) VALUES
(
  'c0000000-0000-4000-c000-000000000001',
  'Optymalizacja tras dla floty 50 pojazdów',
  'Projekt zaliczeniowy: zamodelowałem VRP dla fikcyjnej firmy kurierskiej i porównałem OR-Tools vs algorytm genetyczny własnej roboty. OR-Tools wygrał 3:0.',
  'research', 2024, 2024
),
(
  'c0000000-0000-4000-c000-000000000001',
  'Koło Naukowe AI PW — projekt demonstracyjny',
  'Zbudowałem z zespołem aplikację webową pokazującą działanie algorytmów harmonogramowania na żywo dla 5 maszyn. Używana do demonstracji na dniach otwartych wydziału.',
  'other', 2023, 2024
),
(
  'c0000000-0000-4000-c000-000000000002',
  'Synteza hydrożeli BC/PVA dla inżynierii tkankowej',
  'Główny projekt doktorski — synteza i kompleksowa charakteryzacja 12 formulacji hydrożelu, testy z komórkami macierzystymi hMSC.',
  'research', 2022, 2024
),
(
  'c0000000-0000-4000-c000-000000000002',
  'Współpraca z firmą Tricomed',
  'Trzymiesięczna konsultacja przy projekcie opatrunków aktywnych — przygotowałam przegląd literatury dot. hydrogel wound dressings i uczestniczyłam w dyskusjach z działem R&D.',
  'industry', 2023, 2023
),
(
  'c0000000-0000-4000-c000-000000000003',
  'Detekcja delaminacji w CFRP metodami deep learning',
  'Doktorat: zbudowałem dataset 12k obrazów termowizyjnych, wytrenowałem i porównałem 6 architektur CNN. Wyniki: 94.3% F1 na zbiorze testowym.',
  'research', 2019, 2023
),
(
  'c0000000-0000-4000-c000-000000000003',
  'Projekt z Volkswagen Poznań — inspekcja wizualna lakieru',
  'Proof-of-concept systemu detekcji zarysowań na karoserii — od zebrania danych po integrację z systemem raportowania na linii produkcyjnej.',
  'industry', 2022, 2023
),
(
  'c0000000-0000-4000-c000-000000000004',
  'Kalibracja modeli klasyfikacji tekstu dla medycyny',
  'Post-doc project: badałam, dlaczego modele NLP w klasyfikacji dokumentów medycznych są przekalibrowane i jak to naprawić bez dostępu do danych treningowych.',
  'research', 2021, 2023
),
(
  'c0000000-0000-4000-c000-000000000004',
  'Konsultacja dla startupu — ocena modelu scoringowego',
  'Fintech startup poprosił o niezależną ocenę ich modelu scoringowego. Przygotowałam raport z analizą bias, kalibracji i rekomendacjami.',
  'consultation', 2023, 2023
),
(
  'c0000000-0000-4000-c000-000000000005',
  'Predictive maintenance silników elektrycznych dla Eaton',
  '2 lata jako inżynier R&D — zbudowałem od zera system PdM dla 3 typów silników. Dane z 40 czujników, deployment na edge device, integracja z systemem EAM.',
  'industry', 2021, 2022
),
(
  'c0000000-0000-4000-c000-000000000005',
  'Diagnostyka predyktywna pomp odśrodkowych',
  'Doktorat: benchmark 15 metod ML do detekcji anomalii w szeregach czasowych z pomp. Największy dataset: 18 miesięcy, 8 czujników, 6 klas uszkodzeń.',
  'research', 2022, 2024
);

-- ─── APLIKACJE (3) ────────────────────────────────────────────────────────────

INSERT INTO public.applications (
  brief_id, researcher_id, cover_message, match_score, match_explanation, match_strengths, match_risks, match_dimensions, status
) VALUES
(
  'b0000000-0000-4000-b000-000000000001',
  'c0000000-0000-4000-c000-000000000001',
  'Dzień dobry, zajmuję się dokładnie problemem przypisywania w środowisku wieloagentowym i VRP — chętnie opracuję prototyp i porównanie z obecną metodą dyspozytora na waszych danych syntetycznych lub zanonimizowanych. Proponuję spotkanie w celu doprecyzowania ograniczeń biznesowych.',
  91,
  'Kamil bezpośrednio bada problem przypisywania zadań w systemach wieloagentowych — to dokładnie Vehicle Routing Problem opisany w briefie. Jego umiejętności z OR-Tools i algorytmami heurystycznymi są dokładnie tym, czego projekt wymaga.',
  '["Dopasowanie tematyczne do VRP i harmonogramowania w terenie","Praktyczne umiejętności implementacji w Pythonie i OR-Tools"]'::jsonb,
  '["Doktorant wcześniejszego roku — mniej projektów komercyjnych w skali 200+ techników"]'::jsonb,
  '{"domain_fit":{"score":96,"rationale":"Profil i brief dotyczą optymalizacji zadań w terenie."},"skills_fit":{"score":92,"rationale":"OR-Tools, heurystyki i Python pokrywają wymagania briefu."},"availability_fit":{"score":85,"rationale":"20h tygodniowo wystarczy na POC w horyzoncie 1-3 miesięcy."},"motivation_fit":{"score":90,"rationale":"Motywacja wskazuje chęć walidacji badań na realnych danych."}}'::jsonb,
  'pending'
),
(
  'b0000000-0000-4000-b000-000000000003',
  'c0000000-0000-4000-c000-000000000003',
  'W moim doktoracie zajmowałem się degradacją modeli CV przy zmianie warunków nagrzewania/oświetlenia na linii — chętnie przeniosę ten workflow na panele PV i przygotuję plan eksperymentów augmentacji oraz domain adaptation.',
  97,
  'Idealne dopasowanie — Piotr obronił doktorat z detekcji defektów w materiałach kompozytowych metodami CV i ma doświadczenie z domain adaptation. Problem ze zmiennym oświetleniem to jego specjalność.',
  '["Silny track record CV i domain adaptation","Doświadczenie z danymi przemysłowymi z linii"]'::jsonb,
  '[]'::jsonb,
  '{"domain_fit":{"score":100,"rationale":"Doktorat i brief dotyczą przemysłowej detekcji defektów."},"skills_fit":{"score":98,"rationale":"Computer vision, PyTorch i domain adaptation są centralne dla zadania."},"availability_fit":{"score":95,"rationale":"32h tygodniowo pozwala na intensywny POC."},"motivation_fit":{"score":94,"rationale":"Kandydat szuka projektów działających w produkcji."}}'::jsonb,
  'shortlisted'
),
(
  'b0000000-0000-4000-b000-000000000002',
  'c0000000-0000-4000-c000-000000000002',
  'Specjalizuję się w hydrożelach i systematycznych przeglądach literatury (PubMed/Scopus). Mogę przygotować protokół przeglądu, tabelę materiałów oraz rekomendacje TRL dopasowane do waszego pipeline R&D.',
  94,
  'Marta aktywnie pracuje z hydrożelami jako nośnikami biologicznymi i ma udokumentowane doświadczenie w przeglądach literatury farmaceutycznej. Jej profil pasuje niemal idealnie do zakresu briefu.',
  '["Bieżące badania nad hydrożelami","Doświadczenie w przeglądach pod kątem medtech/farma"]'::jsonb,
  '["Ograniczona dostępność tygodniowa względem pełnego etatu"]'::jsonb,
  '{"domain_fit":{"score":96,"rationale":"Badania nad hydrożelami pokrywają temat briefu."},"skills_fit":{"score":93,"rationale":"Przegląd literatury i biomateriały odpowiadają zakresowi."},"availability_fit":{"score":78,"rationale":"16h tygodniowo jest dobre dla raportu, ale wymaga kontroli zakresu."},"motivation_fit":{"score":88,"rationale":"Motywacja jest silnie związana z medtech i farmaceutyką."}}'::jsonb,
  'pending'
);

COMMIT;

-- Weryfikacja (SQL Editor):
-- SELECT 'companies' AS t, count(*) FROM companies
-- UNION ALL SELECT 'briefs', count(*) FROM briefs
-- UNION ALL SELECT 'researchers', count(*) FROM researchers
-- UNION ALL SELECT 'researcher_projects', count(*) FROM researcher_projects
-- UNION ALL SELECT 'applications', count(*) FROM applications;
-- Oczekiwane: 3, 4, 5, 10, 3
