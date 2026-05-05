/**
 * Generuje data/demo-local-db.json (ten sam zestaw co supabase/seed.sql) dla USE_LOCAL_JSON_DB.
 * Uruchom: node scripts/build-demo-local-db.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "data", "demo-local-db.json");

const fc1 = {
  cel_rd:
    "Opracowanie algorytmu automatycznego przypisywania zleceń serwisowych do techników w terenie z uwzględnieniem lokalizacji, kompetencji i obciążenia pracą.",
  wymagane_kompetencje: [
    "Optymalizacja kombinatoryczna lub programowanie z ograniczeniami",
    "Znajomość algorytmów routingu / vehicle routing problem",
    "Python lub Java — implementacja prototypu",
  ],
  zakres_projektu:
    "Analiza obecnego procesu, przegląd literatury dot. field service optimization, implementacja i testy algorytmu przypisującego na danych syntetycznych.",
  oczekiwany_rezultat:
    "Działający prototyp algorytmu + raport z oceną jakości przypisań vs. obecna metoda ręczna.",
  pierwszy_milestone:
    "Po 2 tygodniach: sformalizowany model problemu + wybór podejścia algorytmicznego z uzasadnieniem.",
  suggested_researcher_profile:
    "Osoba z tłem w informatyce lub matematyce stosowanej, która rozumie VRP / schedulowanie w terenie, potrafi zaimplementować i zmierzyć algorytm na realistycznych danych oraz komunikuje wyniki w formie raportu dla działu operacji.",
};

const fc2 = {
  cel_rd:
    "Systematyczny przegląd literatury (2019–2025) dotyczący biodegradowalnych hydrożeli jako systemów dostarczania leków w terapii ran przewlekłych.",
  wymagane_kompetencje: [
    "Chemia polimerów lub inżynieria biomedyczna",
    "Umiejętność przeglądu literatury naukowej (PubMed, Scopus)",
    "Znajomość regulacji dot. wyrobów medycznych (mile widziana)",
  ],
  zakres_projektu:
    "Przegląd min. 60 publikacji, synteza wyników, ocena dojrzałości TRL wybranych rozwiązań, rekomendacja 3-5 kierunków badawczych.",
  oczekiwany_rezultat:
    "Raport 20–30 stron z tabelą porównawczą materiałów, mapą badaczy i rekomendacjami dla działu R&D.",
  pierwszy_milestone:
    "Po tygodniu: protokół przeglądu zatwierdzony przez firmę + lista 15 kluczowych publikacji.",
  suggested_researcher_profile:
    "Badacz z doświadczeniem w chemii polimerów lub biomateriałach, rutinowo pracujący z bazami bibliograficznymi, potrafiący zestawić mechaniczne i biologiczne właściwości hydrożeli z potencjałem klinicznym i wskazać luki dla dalszego R&D.",
};

const fc3 = {
  cel_rd:
    "Zbadanie i implementacja metod augmentacji danych oraz domain adaptation w celu poprawy robustności modelu detekcji wad PV w zmiennych warunkach oświetleniowych.",
  wymagane_kompetencje: [
    "Computer vision i deep learning (PyTorch lub TensorFlow)",
    "Domain adaptation / transfer learning",
    "Doświadczenie z danymi z kamer przemysłowych (mile widziane)",
  ],
  zakres_projektu:
    "Analiza przyczyn degradacji accuracy, eksperymenty z augmentacją i domain adaptation na dostarczonych przez firmę danych, raport i rekomendacje.",
  oczekiwany_rezultat:
    "Raport z wynikami eksperymentów + najlepszy pipeline przetwarzania danych gotowy do integracji.",
  pierwszy_milestone:
    "Po 3 tygodniach: diagnoza problemu + wyniki baseline experiments z 3 podejściami augmentacji.",
  suggested_researcher_profile:
    "Inżynier computer vision z praktyką w modelach produkcyjnych i domain shift (oświetlenie, kamera przemysłowa), który zaprojektuje eksperymenty, zmierzy metryki porównawcze i przygotuje rekomendacje wdrożeniowe.",
};

const fc4 = {
  cel_rd:
    "Proof-of-concept automatycznej klasyfikacji i priorytetyzacji zgłoszeń helpdesk z użyciem modeli językowych — ocena wykonalności technicznej i ekonomicznej.",
  wymagane_kompetencje: [
    "NLP i modele językowe (fine-tuning lub prompt engineering)",
    "Ewaluacja modeli klasyfikacji tekstu",
    "Szacowanie kosztów API / infrastruktury LLM",
  ],
  zakres_projektu:
    "Analiza próbki zgłoszeń (dostarczy firma), implementacja 2-3 podejść LLM, porównanie z baseline (keyword matching), raport cost-benefit.",
  oczekiwany_rezultat:
    "Działający POC + raport z rekomendacją: wdrażać / nie wdrażać, z szacunkiem ROI.",
  pierwszy_milestone:
    "Po tygodniu: przeanalizowana próbka 200 zgłoszeń + wybrany model do testów.",
  suggested_researcher_profile:
    "Specjalista NLP potrafiący dobrać baseline, zaprojektować ewaluację (metryki, próbka) oraz oszacować koszty utrzymania API LLM i ryzyka jakościowe dla helpdesku umów SLA.",
};

const store = {
  companies: [
    {
      id: "a0000000-0000-4000-a000-000000000001",
      name: "Transition Technologies PSC",
      email: "rd@ttpsc.pl",
      updated_at: "2026-05-04T12:00:00.000Z",
      industry: "IT i oprogramowanie",
    },
    {
      id: "a0000000-0000-4000-a000-000000000002",
      name: "Polpharma Biologics",
      email: "innovation@polpharma.com",
      updated_at: "2026-05-04T12:00:00.000Z",
      industry: "Farmaceutyka i biotech",
    },
    {
      id: "a0000000-0000-4000-a000-000000000003",
      name: "ML System",
      email: "rd@mlsystem.pl",
      updated_at: "2026-05-04T12:00:00.000Z",
      industry: "IT i oprogramowanie",
    },
  ],
  briefs: [
    {
      id: "b0000000-0000-4000-b000-000000000001",
      company_id: "a0000000-0000-4000-a000-000000000001",
      status: "published",
      published_at: "2026-04-28T12:00:00.000Z",
      raw_input: {
        problem:
          "Mamy system zarządzania zleceniami serwisowymi dla 200+ techników w terenie. Czas przypisywania zleceń do techników zajmuje dyspozytorowi 2-3h dziennie i opiera się na intuicji.",
        industry: "IT i oprogramowanie",
        timeline: "1–3 miesiące",
        budget: "20 000–50 000 zł",
      },
      final_content: fc1,
      company_access_token: "ttpsc-seed-token-brief1-field-service-opt",
    },
    {
      id: "b0000000-0000-4000-b000-000000000002",
      company_id: "a0000000-0000-4000-a000-000000000002",
      status: "published",
      published_at: "2026-04-30T12:00:00.000Z",
      raw_input: {
        problem:
          "Szukamy przeglądu aktualnej literatury dot. biodegradowalnych systemów dostarczania leków opartych na hydrożelach — interesuje nas szczególnie zastosowanie w leczeniu ran przewlekłych.",
        industry: "Farmaceutyka i biotech",
        timeline: "1–4 tygodnie",
        budget: "5 000–20 000 zł",
      },
      final_content: fc2,
      company_access_token: "polpharma-seed-token-brief2-hydrogel-lit",
    },
    {
      id: "b0000000-0000-4000-b000-000000000003",
      company_id: "a0000000-0000-4000-a000-000000000003",
      status: "published",
      published_at: "2026-04-24T12:00:00.000Z",
      raw_input: {
        problem:
          "Nasz model detekcji wad w panelach fotowoltaicznych działa dobrze w laboratorium, ale na produkcji spada accuracy o 15-20pp przez zmienne warunki oświetleniowe.",
        industry: "IT i oprogramowanie",
        timeline: "3–6 miesięcy",
        budget: "20 000–50 000 zł",
      },
      final_content: fc3,
      company_access_token: "mlsystem-seed-token-brief3-pv-detection",
    },
    {
      id: "b0000000-0000-4000-b000-000000000004",
      company_id: "a0000000-0000-4000-a000-000000000001",
      status: "published",
      published_at: "2026-05-02T12:00:00.000Z",
      raw_input: {
        problem:
          "Chcemy ocenić, czy zastosowanie LLM do automatycznej kategoryzacji i priorytetyzacji zgłoszeń helpdesk (ok. 500/dzień) jest technicznie wykonalne i opłacalne.",
        industry: "IT i oprogramowanie",
        timeline: "1–4 tygodnie",
        budget: "5 000–20 000 zł",
      },
      final_content: fc4,
      company_access_token: "ttpsc-seed-token-brief4-llm-helpdesk-poc",
    },
  ],
  researchers: [
    {
      id: "c0000000-0000-4000-c000-000000000001",
      email: "k.nowak@doktorant.pw.edu.pl",
      first_name: "Kamil",
      last_name: "Nowak",
      institution: "Politechnika Warszawska, Wydział Elektroniki i Technik Informacyjnych",
      phd_start_year: 2024,
      stage: "doktorant",
      research_domain: "Informatyka i AI",
      research_subdomain: "uczenie maszynowe, systemy czasu rzeczywistego",
      research_description:
        "Badam metody optymalizacji rozkładu zadań w systemach wieloagentowych. Konkretnie: jak sprawić, żeby wiele autonomicznych agentów (np. roboty, drony, serwisanci) efektywnie dzieliło się pracą bez centralnego koordynatora.",
      practical_skills: [
        "Optymalizacja kombinatoryczna (Python, OR-Tools)",
        "Algorytmy heurystyczne (SA, GA, tabu search)",
        "Symulacje multi-agent (Mesa, NetLogo)",
        "Analiza danych operacyjnych (pandas, numpy)",
        "Pisanie raportów technicznych po polsku i angielsku",
      ],
      availability_hours_per_week: 20,
      availability_modes: ["consultation", "proof_of_concept", "small_rd_project"],
      motivation:
        "Chcę zobaczyć, jak problemy, które modeluję teoretycznie, wyglądają w rzeczywistości. Pracując z firmą mogę zweryfikować, czy moje algorytmy mają sens poza symulacją. Poza tym szczerze — chcę zarabiać na badaniach, a nie czekać na grant.",
      publication_links: [],
      profile_completeness: 88,
    },
    {
      id: "c0000000-0000-4000-c000-000000000002",
      email: "m.kowalczyk@uj.edu.pl",
      first_name: "Marta",
      last_name: "Kowalczyk",
      institution: "Uniwersytet Jagielloński, Wydział Biochemii, Biofizyki i Biotechnologii",
      phd_start_year: 2022,
      stage: "doktorant",
      research_domain: "Nauki przyrodnicze",
      research_subdomain: "biomateriały, hydrożele, inżynieria tkankowa",
      research_description:
        "Syntetyzuję i charakteryzuję hydrożele na bazie celulozy bakteryjnej jako nośniki dla komórek macierzystych. Interesuję się tym, jak właściwości mechaniczne żelu wpływają na różnicowanie komórek.",
      practical_skills: [
        "Synteza i charakteryzacja hydrożeli (reologia, SEM, FTIR)",
        "Hodowla komórkowa i testy cytotoksyczności",
        "Przegląd literatury naukowej (PubMed, Scopus, Web of Science)",
        "Pisanie raportów naukowych",
        "Znajomość regulacji dot. wyrobów medycznych klasy I",
      ],
      availability_hours_per_week: 16,
      availability_modes: ["literature_review", "consultation"],
      motivation:
        "Akademia daje mi głębię, ale brakuje mi kontaktu z realnym zastosowaniem. Chcę zobaczyć, jakie pytania zadają firmy — to też inspiruje moje badania. Interesuje mnie szczególnie medtech i farmaceutyka.",
      publication_links: ["https://doi.org/10.1016/j.carbpol.2023.121456"],
      profile_completeness: 82,
    },
    {
      id: "c0000000-0000-4000-c000-000000000003",
      email: "p.wisniewski@pwr.edu.pl",
      first_name: "Piotr",
      last_name: "Wiśniewski",
      institution: "Politechnika Wrocławska, Katedra Informatyki Stosowanej",
      phd_start_year: 2019,
      stage: "doktor",
      research_domain: "Informatyka i AI",
      research_subdomain: "computer vision, deep learning, przemysłowe systemy wizyjne",
      research_description:
        "Obroniłem doktorat z detekcji defektów w materiałach kompozytowych metodami głębokiego uczenia. Przez 4 lata pracowałem na danych z kamer termowizyjnych i RGB z linii produkcyjnych.",
      practical_skills: [
        "Computer vision (PyTorch, OpenCV, YOLO, U-Net)",
        "Transfer learning i domain adaptation",
        "Praca z danymi z kamer przemysłowych (RGB, termowizja, X-ray)",
        "Ocena jakości modeli ML w warunkach produkcyjnych",
        "Integracja modeli z systemami SCADA/MES (proof-of-concept)",
      ],
      availability_hours_per_week: 32,
      availability_modes: ["consultation", "proof_of_concept", "small_rd_project", "literature_review"],
      motivation:
        "Po doktoracie chcę budować rzeczy, które działają w produkcji, nie tylko w papierach. Mam za sobą dwa projekty z firmami przy doktoracie i wiem, że ta praca ma sens. Szukam projektów, gdzie moja specjalizacja CV+przemysł ma realną wartość.",
      publication_links: [
        "https://doi.org/10.1109/TII.2022.3187234",
        "https://doi.org/10.1016/j.eswa.2023.119876",
      ],
      profile_completeness: 95,
    },
    {
      id: "c0000000-0000-4000-c000-000000000004",
      email: "a.zielinska@amu.edu.pl",
      first_name: "Anna",
      last_name: "Zielińska",
      institution: "Uniwersytet im. Adama Mickiewicza, Wydział Matematyki i Informatyki",
      phd_start_year: 2017,
      stage: "postdoc",
      research_domain: "Matematyka i statystyka",
      research_subdomain: "statystyka bayesowska, modelowanie probabilistyczne, NLP",
      research_description:
        "Badam metody wnioskowania bayesowskiego w modelach językowych — szczególnie jak kwantyfikować niepewność predykcji LLM. Ostatnio pracuję nad metodami calibration dla klasyfikatorów tekstu.",
      practical_skills: [
        "Statystyka bayesowska i modelowanie probabilistyczne (Stan, PyMC)",
        "NLP i klasyfikacja tekstu (HuggingFace, scikit-learn)",
        "Ewaluacja i kalibracja modeli ML",
        "Analiza danych (R, Python)",
        "Pisanie dokumentacji technicznej",
      ],
      availability_hours_per_week: 12,
      availability_modes: ["consultation", "literature_review"],
      motivation:
        "Współpraca z firmami pomaga mi zrozumieć, jakie pytania dotyczące niezawodności AI są ważne w praktyce. Jestem zainteresowana projektami, gdzie moja wiedza o niepewności modeli ma zastosowanie — fintech, medtech, systemy rekomendacyjne.",
      publication_links: [
        "https://doi.org/10.18653/v1/2023.acl-long.445",
        "https://doi.org/10.1609/aaai.v37i11.26556",
        "https://arxiv.org/abs/2309.12345",
      ],
      profile_completeness: 78,
    },
    {
      id: "c0000000-0000-4000-c000-000000000005",
      email: "t.grabowski@agh.edu.pl",
      first_name: "Tomasz",
      last_name: "Grabowski",
      institution:
        "AGH Akademia Górniczo-Hutnicza, Wydział Elektrotechniki, Automatyki, Informatyki i Inżynierii Biomedycznej",
      phd_start_year: 2018,
      stage: "doktor",
      research_domain: "Inżynieria i technologia",
      research_subdomain: "automatyka, systemy wbudowane, IoT przemysłowy",
      research_description:
        "Doktorat z diagnostyki predyktywnej maszyn przemysłowych metodami uczenia maszynowego. Podczas doktoratu przez 2 lata pracowałem w Eaton jako inżynier R&D i wiem jak wygląda wdrożenie od środka.",
      practical_skills: [
        "Predictive maintenance i diagnostyka predyktywna (Python, scikit-learn, PyCaret)",
        "Systemy wbudowane i akwizycja danych (MQTT, OPC-UA, Raspberry Pi)",
        "Analiza szeregów czasowych (FFT, wavelet, LSTM)",
        "Praca z danymi z PLC i SCADA",
        "Pisanie specyfikacji technicznych i dokumentacji dla klientów przemysłowych",
      ],
      availability_hours_per_week: 24,
      availability_modes: ["consultation", "proof_of_concept", "small_rd_project"],
      motivation:
        'Znam ból wdrożeń przemysłowych od środka — wiem, że dobry paper to za mało. Chcę pracować z firmami, które mają realny problem do rozwiązania, nie tylko potrzebę "zrobienia R&D" dla dotacji. Projekty IoT, predictive maintenance i automatyzacja przemysłowa to moje.',
      publication_links: ["https://doi.org/10.1016/j.ress.2022.108534"],
      profile_completeness: 92,
    },
  ],
  researcher_projects: [
    {
      id: "e0000000-0000-4000-e000-000000000001",
      researcher_id: "c0000000-0000-4000-c000-000000000001",
      title: "Optymalizacja tras dla floty 50 pojazdów",
      description:
        "Projekt zaliczeniowy: zamodelowałem VRP dla fikcyjnej firmy kurierskiej i porównałem OR-Tools vs algorytm genetyczny własnej roboty. OR-Tools wygrał 3:0.",
      type: "research",
      year_from: 2024,
      year_to: 2024,
    },
    {
      id: "e0000000-0000-4000-e000-000000000002",
      researcher_id: "c0000000-0000-4000-c000-000000000001",
      title: "Koło Naukowe AI PW — projekt demonstracyjny",
      description:
        "Zbudowałem z zespołem aplikację webową pokazującą działanie algorytmów harmonogramowania na żywo dla 5 maszyn. Używana do demonstracji na dniach otwartych wydziału.",
      type: "other",
      year_from: 2023,
      year_to: 2024,
    },
    {
      id: "e0000000-0000-4000-e000-000000000003",
      researcher_id: "c0000000-0000-4000-c000-000000000002",
      title: "Synteza hydrożeli BC/PVA dla inżynierii tkankowej",
      description:
        "Główny projekt doktorski — synteza i kompleksowa charakteryzacja 12 formulacji hydrożelu, testy z komórkami macierzystymi hMSC.",
      type: "research",
      year_from: 2022,
      year_to: 2024,
    },
    {
      id: "e0000000-0000-4000-e000-000000000004",
      researcher_id: "c0000000-0000-4000-c000-000000000002",
      title: "Współpraca z firmą Tricomed",
      description:
        "Trzymiesięczna konsultacja przy projekcie opatrunków aktywnych — przygotowałam przegląd literatury dot. hydrogel wound dressings i uczestniczyłam w dyskusjach z działem R&D.",
      type: "industry",
      year_from: 2023,
      year_to: 2023,
    },
    {
      id: "e0000000-0000-4000-e000-000000000005",
      researcher_id: "c0000000-0000-4000-c000-000000000003",
      title: "Detekcja delaminacji w CFRP metodami deep learning",
      description:
        "Doktorat: zbudowałem dataset 12k obrazów termowizyjnych, wytrenowałem i porównałem 6 architektur CNN. Wyniki: 94.3% F1 na zbiorze testowym.",
      type: "research",
      year_from: 2019,
      year_to: 2023,
    },
    {
      id: "e0000000-0000-4000-e000-000000000006",
      researcher_id: "c0000000-0000-4000-c000-000000000003",
      title: "Projekt z Volkswagen Poznań — inspekcja wizualna lakieru",
      description:
        "Proof-of-concept systemu detekcji zarysowań na karoserii — od zebrania danych po integrację z systemem raportowania na linii produkcyjnej.",
      type: "industry",
      year_from: 2022,
      year_to: 2023,
    },
    {
      id: "e0000000-0000-4000-e000-000000000007",
      researcher_id: "c0000000-0000-4000-c000-000000000004",
      title: "Kalibracja modeli klasyfikacji tekstu dla medycyny",
      description:
        "Post-doc project: badałam, dlaczego modele NLP w klasyfikacji dokumentów medycznych są przekalibrowane i jak to naprawić bez dostępu do danych treningowych.",
      type: "research",
      year_from: 2021,
      year_to: 2023,
    },
    {
      id: "e0000000-0000-4000-e000-000000000008",
      researcher_id: "c0000000-0000-4000-c000-000000000004",
      title: "Konsultacja dla startupu — ocena modelu scoringowego",
      description:
        "Fintech startup poprosił o niezależną ocenę ich modelu scoringowego. Przygotowałam raport z analizą bias, kalibracji i rekomendacjami.",
      type: "consultation",
      year_from: 2023,
      year_to: 2023,
    },
    {
      id: "e0000000-0000-4000-e000-000000000009",
      researcher_id: "c0000000-0000-4000-c000-000000000005",
      title: "Predictive maintenance silników elektrycznych dla Eaton",
      description:
        "2 lata jako inżynier R&D — zbudowałem od zera system PdM dla 3 typów silników. Dane z 40 czujników, deployment na edge device, integracja z systemem EAM.",
      type: "industry",
      year_from: 2021,
      year_to: 2022,
    },
    {
      id: "e0000000-0000-4000-e000-000000000010",
      researcher_id: "c0000000-0000-4000-c000-000000000005",
      title: "Diagnostyka predyktywna pomp odśrodkowych",
      description:
        "Doktorat: benchmark 15 metod ML do detekcji anomalii w szeregach czasowych z pomp. Największy dataset: 18 miesięcy, 8 czujników, 6 klas uszkodzeń.",
      type: "research",
      year_from: 2022,
      year_to: 2024,
    },
  ],
  applications: [
    {
      id: "f0000000-0000-4000-f000-000000000001",
      brief_id: "b0000000-0000-4000-b000-000000000001",
      researcher_id: "c0000000-0000-4000-c000-000000000001",
      cover_message:
        "Dzień dobry, zajmuję się dokładnie problemem przypisywania w środowisku wieloagentowym i VRP — chętnie opracuję prototyp i porównanie z obecną metodą dyspozytora na waszych danych syntetycznych lub zanonimizowanych. Proponuję spotkanie w celu doprecyzowania ograniczeń biznesowych.",
      match_score: 91,
      match_explanation:
        "Kamil bezpośrednio bada problem przypisywania zadań w systemach wieloagentowych — to dokładnie Vehicle Routing Problem opisany w briefie. Jego umiejętności z OR-Tools i algorytmami heurystycznymi są dokładnie tym, czego projekt wymaga.",
      match_strengths: [
        "Dopasowanie tematyczne do VRP i harmonogramowania w terenie",
        "Praktyczne umiejętności implementacji w Pythonie i OR-Tools",
      ],
      match_risks: ["Doktorant wcześniejszego roku — mniej projektów komercyjnych w skali 200+ techników"],
      status: "pending",
    },
    {
      id: "f0000000-0000-4000-f000-000000000002",
      brief_id: "b0000000-0000-4000-b000-000000000003",
      researcher_id: "c0000000-0000-4000-c000-000000000003",
      cover_message:
        "W moim doktoracie zajmowałem się degradacją modeli CV przy zmianie warunków nagrzewania/oświetlenia na linii — chętnie przeniosę ten workflow na panele PV i przygotuję plan eksperymentów augmentacji oraz domain adaptation.",
      match_score: 97,
      match_explanation:
        "Idealne dopasowanie — Piotr obronił doktorat z detekcji defektów w materiałach kompozytowych metodami CV i ma doświadczenie z domain adaptation. Problem ze zmiennym oświetleniem to jego specjalność.",
      match_strengths: ["Silny track record CV i domain adaptation", "Doświadczenie z danymi przemysłowymi z linii"],
      match_risks: [],
      status: "shortlisted",
    },
    {
      id: "f0000000-0000-4000-f000-000000000003",
      brief_id: "b0000000-0000-4000-b000-000000000002",
      researcher_id: "c0000000-0000-4000-c000-000000000002",
      cover_message:
        "Specjalizuję się w hydrożelach i systematycznych przeglądach literatury (PubMed/Scopus). Mogę przygotować protokół przeglądu, tabelę materiałów oraz rekomendacje TRL dopasowane do waszego pipeline R&D.",
      match_score: 94,
      match_explanation:
        "Marta aktywnie pracuje z hydrożelami jako nośnikami biologicznymi i ma udokumentowane doświadczenie w przeglądach literatury farmaceutycznej. Jej profil pasuje niemal idealnie do zakresu briefu.",
      match_strengths: [
        "Bieżące badania nad hydrożelami",
        "Doświadczenie w przeglądach pod kątem medtech/farma",
      ],
      match_risks: ["Ograniczona dostępność tygodniowa względem pełnego etatu"],
      status: "pending",
    },
  ],
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(store, null, 2) + "\n", "utf8");

const counts = {
  companies: store.companies.length,
  briefs: store.briefs.length,
  researchers: store.researchers.length,
  researcher_projects: store.researcher_projects.length,
  applications: store.applications.length,
};
console.log("Wrote", out);
console.log("Counts:", counts);
if (Object.values(counts).every((n) => n > 0)) {
  console.log("Seed complete — MVP ready for demo (local JSON).");
}
