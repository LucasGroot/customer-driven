/**
 * Synthetic stand-in for one analysis run, used until the backend exposes an
 * API. Every question here is invented: no real ServiceNow ticket text, ticket
 * number or employee name is present, and none may be added to this file.
 */

import type {
  AnalysisSnapshot,
  GapDecision,
  KnowledgeGap,
  KnowledgeGapId,
} from "../domain/types";

const gaps: KnowledgeGap[] = [
  {
    id: "g1",
    topic: "Egenmelding ved barns sykdom over flere perioder",
    category: "Sykefravær",
    ticketCount: 38,
    trendPercent: 41,
    coverage: 0.24,
    summary:
      "Ansatte spør hvordan egenmeldingsdager telles når barnet er sykt flere ganger i samme måned, og hva som gjelder ved delt omsorg. Rutinen beskriver egenmelding for egen sykdom, men sier lite om barn.",
    nearestMatchLine: "Nærmeste treff: Rutine for egenmelding og sykefravær",
    questions: [
      {
        text: "«Jeg har brukt 3 dager på sykt barn i mars, og nå er hun syk igjen. Har jeg flere dager igjen, eller går det på det samme?»",
        reference: "INC0412884 · 2. sep",
      },
      {
        text: "«Vi har delt omsorg annenhver uke. Teller dagene bare når barnet bor hos meg?»",
        reference: "INC0412610 · 28. aug",
      },
      {
        text: "«Må jeg levere legeerklæring hvis barnet er sykt mer enn 3 dager?»",
        reference: "INC0411977 · 21. aug",
      },
    ],
    questionsNote: "38 henvendelser i klyngen. De tre over er de mest typiske.",
    routines: [
      {
        name: "Rutine for egenmelding og sykefravær",
        similarity: 0.24,
        reference: "KV-014 · revidert mars 2023",
      },
      {
        name: "Retningslinje for velferdspermisjon",
        similarity: 0.18,
        reference: "KV-031 · revidert januar 2024",
      },
      {
        name: "Veileder for nærværsoppfølging",
        similarity: 0.11,
        reference: "KV-052 · revidert juni 2022",
      },
    ],
    verdict:
      "Ingen av dokumentene svarer på hvordan dager telles ved gjentatt fravær eller delt omsorg. Anbefaling: legg til et avsnitt om sykt barn i KV-014.",
    documentOwner: "Lene Fjeld (HR drift)",
    dueDate: "30. september 2026",
    documentAge: 0.8,
    documentAgeLabel: "3,5 år siden revisjon",
  },
  {
    id: "g2",
    topic: "Overføring av ferie til neste år",
    category: "Ferie og fravær",
    ticketCount: 31,
    trendPercent: 12,
    coverage: 0.31,
    summary:
      "Spørsmål om hvor mange dager som kan overføres, hvem som godkjenner, og hva som skjer med dager utover grensen. Rutinen nevner overføring, men ikke fristen eller godkjenningsveien.",
    nearestMatchLine: "Nærmeste treff: Ferierutine for fast ansatte",
    questions: [
      {
        text: "«Jeg har 9 dager igjen. Kan jeg ta med alle til neste år, eller mister jeg noen?»",
        reference: "INC0412771 · 1. sep",
      },
      {
        text: "«Hvem godkjenner overføring – nærmeste leder eller HR?»",
        reference: "INC0412455 · 26. aug",
      },
      {
        text: "«Hva er siste frist for å søke om å overføre ferie?»",
        reference: "INC0412201 · 23. aug",
      },
    ],
    questionsNote: "31 henvendelser i klyngen, jevnt fordelt gjennom måneden.",
    routines: [
      {
        name: "Ferierutine for fast ansatte",
        similarity: 0.31,
        reference: "KV-007 · revidert august 2021",
      },
      {
        name: "Rutine for ferieavvikling i turnus",
        similarity: 0.19,
        reference: "KV-023 · revidert mai 2024",
      },
    ],
    verdict:
      "KV-007 sier at ferie «kan overføres etter avtale», men ikke hvor mange dager, hvem som godkjenner eller når det må søkes. Tre konkrete setninger dekker trolig hele klyngen.",
    documentOwner: "Marit Sandvik (HR forvaltning)",
    dueDate: "15. oktober 2026",
    documentAge: 0.95,
    documentAgeLabel: "5 år siden revisjon",
  },
  {
    id: "g3",
    topic: "Kompensasjon for vaktbytte i turnus",
    category: "Arbeidstid og turnus",
    ticketCount: 27,
    trendPercent: 33,
    coverage: 0.19,
    summary:
      "Ansatte bytter vakter seg imellom og er usikre på hvilke tillegg som følger vakten og hvilke som følger personen. Ingen rutine beskriver bytte som utløser ulikt tillegg.",
    nearestMatchLine: "Ingen rutine dekker dette godt",
    questions: [
      {
        text: "«Jeg byttet nattevakt mot dagvakt med en kollega. Hvem får nattillegget?»",
        reference: "INC0412690 · 30. aug",
      },
      {
        text: "«Må leder godkjenne bytte når det ikke koster noe ekstra?»",
        reference: "INC0412388 · 25. aug",
      },
      {
        text: "«Teller en byttet helgevakt mot helgekvoten min?»",
        reference: "INC0412104 · 22. aug",
      },
    ],
    questionsNote: "27 henvendelser, sterk økning fra 19 forrige måned.",
    routines: [
      {
        name: "Rutine for turnusplanlegging",
        similarity: 0.19,
        reference: "KV-019 · revidert februar 2025",
      },
      {
        name: "Retningslinje for tillegg og ubekvem arbeidstid",
        similarity: 0.16,
        reference: "KV-041 · revidert november 2023",
      },
    ],
    verdict:
      "Dette er et reelt hull: temaet finnes ikke i noe dokument. Anbefaling: nytt avsnitt i KV-019 med tre eksempler på bytte.",
    documentOwner: "Ikke tildelt",
    dueDate: "Ikke satt",
    documentAge: 0.3,
    documentAgeLabel: "1,5 år siden revisjon",
  },
  {
    id: "g4",
    topic: "Fedrekvote og fleksibelt uttak",
    category: "Permisjon og foreldrepenger",
    ticketCount: 24,
    trendPercent: 8,
    coverage: 0.36,
    summary:
      "Spørsmål om å ta ut fedrekvote i deler, kombinert med delvis jobb. Rutinen henviser til NAV, men beskriver ikke hva arbeidsgiver må godkjenne.",
    nearestMatchLine: "Nærmeste treff: Rutine for foreldrepermisjon",
    questions: [
      {
        text: "«Kan jeg ta fedrekvoten som fire uker nå og resten til våren?»",
        reference: "INC0412512 · 27. aug",
      },
      {
        text: "«Hvis jeg jobber 50 % i permisjonen, hva må avtales med leder?»",
        reference: "INC0412290 · 24. aug",
      },
      {
        text: "«Hvor lang varslingsfrist har jeg overfor arbeidsgiver?»",
        reference: "INC0411840 · 19. aug",
      },
    ],
    questionsNote: "24 henvendelser, stabilt nivå over tre måneder.",
    routines: [
      {
        name: "Rutine for foreldrepermisjon",
        similarity: 0.36,
        reference: "KV-011 · revidert september 2024",
      },
      {
        name: "Veileder for redusert stilling",
        similarity: 0.21,
        reference: "KV-036 · revidert april 2025",
      },
    ],
    verdict:
      "KV-011 dekker rettighetene, men ikke arbeidsgivers del: varslingsfrist, godkjenning og hvordan delvis uttak registreres.",
    documentOwner: "Marit Sandvik (HR forvaltning)",
    dueDate: "1. november 2026",
    documentAge: 0.35,
    documentAgeLabel: "2 år siden revisjon",
  },
  {
    id: "g5",
    topic: "Utbetaling av overtid kontra avspasering",
    category: "Lønn og godtgjørelse",
    ticketCount: 22,
    trendPercent: -6,
    coverage: 0.42,
    summary:
      "Ansatte vil vite når de kan velge utbetaling framfor avspasering, og hvordan tillegg beregnes ved avspasering. Rutinen dekker satser, men ikke valget.",
    nearestMatchLine: "Nærmeste treff: Rutine for overtid og merarbeid",
    questions: [
      {
        text: "«Kan jeg få overtiden utbetalt i stedet for å avspasere?»",
        reference: "INC0412430 · 26. aug",
      },
      {
        text: "«Får jeg med overtidstillegget hvis jeg avspaserer?»",
        reference: "INC0412008 · 20. aug",
      },
    ],
    questionsNote: "22 henvendelser, svakt fallende.",
    routines: [
      {
        name: "Rutine for overtid og merarbeid",
        similarity: 0.42,
        reference: "KV-005 · revidert juni 2025",
      },
      {
        name: "Lønnsrutine – tillegg og trekk",
        similarity: 0.28,
        reference: "KV-002 · revidert januar 2026",
      },
    ],
    verdict:
      "Delvis dekket. Ett avklarende avsnitt om valgretten er nok — dette er en rask gevinst.",
    documentOwner: "Tor Bergli (Lønn)",
    dueDate: "30. september 2026",
    documentAge: 0.15,
    documentAgeLabel: "1 år siden revisjon",
  },
  {
    id: "g6",
    topic: "Tilgang og utstyr før første arbeidsdag",
    category: "Rekruttering og onboarding",
    ticketCount: 19,
    trendPercent: 22,
    coverage: 0.27,
    summary:
      "Ledere spør hva som må bestilles når, og hvem som gjør hva før oppstart. Sjekklisten finnes, men er ikke koblet til frister eller ansvar.",
    nearestMatchLine: "Nærmeste treff: Sjekkliste for onboarding",
    questions: [
      {
        text: "«Ny ansatt starter om ti dager – rekker vi å få PC og tilganger klare?»",
        reference: "INC0412655 · 29. aug",
      },
      {
        text: "«Hvem bestiller adgangskort, leder eller HR?»",
        reference: "INC0412177 · 22. aug",
      },
    ],
    questionsNote: "19 henvendelser, hovedsakelig fra ledere.",
    routines: [
      {
        name: "Sjekkliste for onboarding",
        similarity: 0.27,
        reference: "KV-028 · revidert oktober 2022",
      },
      {
        name: "Rutine for ansettelsesprosessen",
        similarity: 0.22,
        reference: "KV-026 · revidert mars 2025",
      },
    ],
    verdict:
      "Sjekklisten mangler frister og ansvarlig per punkt. Legg til to kolonner, så forsvinner trolig mesteparten av henvendelsene.",
    documentOwner: "Ikke tildelt",
    dueDate: "Ikke satt",
    documentAge: 0.85,
    documentAgeLabel: "4 år siden revisjon",
  },
  {
    id: "g7",
    topic: "Ferie under sykmelding",
    category: "Ferie og fravær",
    ticketCount: 16,
    trendPercent: 3,
    coverage: 0.45,
    summary:
      "Spørsmål om å utsette eller kreve ny ferie når man blir syk i ferien. Rutinen nevner retten, men ikke dokumentasjonskravet.",
    nearestMatchLine: "Nærmeste treff: Ferierutine for fast ansatte",
    questions: [
      {
        text: "«Jeg ble syk i uke to av ferien. Får jeg dagene tilbake?»",
        reference: "INC0412340 · 25. aug",
      },
      {
        text: "«Holder egenmelding, eller må jeg ha sykmelding fra lege?»",
        reference: "INC0411905 · 20. aug",
      },
    ],
    questionsNote: "16 henvendelser, sesongtopp i juli og august.",
    routines: [
      {
        name: "Ferierutine for fast ansatte",
        similarity: 0.45,
        reference: "KV-007 · revidert august 2021",
      },
      {
        name: "Rutine for egenmelding og sykefravær",
        similarity: 0.3,
        reference: "KV-014 · revidert mars 2023",
      },
    ],
    verdict:
      "Rimelig godt dekket. Presiser at det kreves legeerklæring, så er hullet tettet.",
    documentOwner: "Lene Fjeld (HR drift)",
    dueDate: "1. desember 2026",
    documentAge: 0.95,
    documentAgeLabel: "5 år siden revisjon",
  },
  {
    id: "g8",
    topic: "Lønn ved intern overgang midt i måneden",
    category: "Lønn og godtgjørelse",
    ticketCount: 13,
    trendPercent: 0,
    coverage: 0.52,
    summary:
      "Ansatte som bytter stilling internt lurer på når ny lønn gjelder fra og hvordan tillegg håndteres i overgangsmåneden.",
    nearestMatchLine: "Nærmeste treff: Lønnsrutine – tillegg og trekk",
    questions: [
      {
        text: "«Jeg starter i ny stilling den 15. Får jeg ny lønn fra da eller fra måneden etter?»",
        reference: "INC0412221 · 23. aug",
      },
    ],
    questionsNote: "13 henvendelser, stabilt.",
    routines: [
      {
        name: "Lønnsrutine – tillegg og trekk",
        similarity: 0.52,
        reference: "KV-002 · revidert januar 2026",
      },
      {
        name: "Rutine for intern mobilitet",
        similarity: 0.38,
        reference: "KV-047 · revidert februar 2026",
      },
    ],
    verdict:
      "Godt dekket, men svaret ligger i to dokumenter. Kryssreferanse mellom KV-002 og KV-047 holder.",
    documentOwner: "Tor Bergli (Lønn)",
    dueDate: "Ikke satt",
    documentAge: 0.1,
    documentAgeLabel: "7 mnd siden revisjon",
  },
];

export const MOCK_SNAPSHOT: AnalysisSnapshot = {
  gaps,
  documentOwners: [
    "Ikke tildelt",
    "Lene Fjeld (HR drift)",
    "Marit Sandvik (HR forvaltning)",
    "Tor Bergli (Lønn)",
    "Ida Krogh (HR utvikling)",
  ],
  totalTickets: 412,
  totalRoutines: 96,
  ticketsOutsideClusters: 222,
  coverageOutsideClusters: 0.62,
  lastRunLabel: "3. september 2026",
  monthlyUnmatched: [
    { month: "feb", percent: 41 },
    { month: "mar", percent: 39 },
    { month: "apr", percent: 43 },
    { month: "mai", percent: 40 },
    { month: "jun", percent: 37 },
    { month: "jul", percent: 44 },
    { month: "aug", percent: 38 },
    { month: "sep", percent: 34 },
  ],
  risingTopics: [
    { topic: "Egenmelding ved barns sykdom", delta: "+41 %" },
    { topic: "Kompensasjon for vaktbytte", delta: "+33 %" },
    { topic: "Tilgang og utstyr før oppstart", delta: "+22 %" },
    { topic: "Overføring av ferie", delta: "+12 %" },
  ],
  resolvedTopics: [
    { topic: "Reiseregning og utleggsfrister", delta: "−58 %", note: "KV-033 oppdatert i juni" },
    {
      topic: "Bestilling av bedriftshelsetjeneste",
      delta: "−44 %",
      note: "KV-050 oppdatert i mai",
    },
    {
      topic: "Registrering av hjemmekontordager",
      delta: "−31 %",
      note: "KV-044 oppdatert i april",
    },
  ],
  sources: [
    {
      name: "ServiceNow – HR-henvendelser",
      detail: "Automatisk henting, siste måned. Fritekst anonymiseres før analyse.",
      count: 412,
    },
    {
      name: "Kvaliteket – rutiner og retningslinjer",
      detail: "Alle publiserte HR-dokumenter, inkludert revisjonsdato.",
      count: 96,
    },
  ],
};

/** Decisions HR has already recorded, so the work list is not blank on open. */
export const MOCK_DECISIONS: Record<KnowledgeGapId, GapDecision> = {
  g1: "update",
  g2: "update",
  g5: "covered",
  g7: "unchanged",
};
