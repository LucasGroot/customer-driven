/**
 * The words on the "Om analysen" page. The coverage limits come from the same
 * constants the dashboard colours with, so the page cannot drift from the numbers.
 */

import type { AboutTopic } from "../../domain/aboutTopics";
import {
  DEFAULT_WEIGHTS,
  GOOD_COVERAGE_FROM,
  PARTIAL_COVERAGE_FROM,
} from "../../domain/priority";
import type { AboutIconName } from "./AboutIcon";

const partialFrom = Math.round(PARTIAL_COVERAGE_FROM * 100);
const goodFrom = Math.round(GOOD_COVERAGE_FROM * 100);
// Keep in step with MIN_RELEVANCE in src/backend/snapshot/build_snapshot.py
const MANUAL_REVIEW_BELOW_PERCENT = 55;

export const ABOUT_INTRO =
  "Kunnskapsgap gir deg datadrevet innsikt i hvilke rutiner i Kvaliteket som kan ha behov for forbedring. " +
  "Ved å sammenligne henvendelser fra ServiceNow med eksisterende rutiner synliggjør den hvor informasjonen kan være mangelfull eller uklar. " +
  "Dette gir et bedre grunnlag for å prioritere forbedringer som kan redusere antall henvendelser, " +
  "ved at flere finner svarene de leter etter direkte i oppdaterte rutiner.";

interface Step {
  icon: AboutIconName;
  title: string;
  text: string;
}

export const STEPS: Step[] = [
  {
    icon: "database",
    title: "Data lastes opp",
    text: "Henvendelser og rutiner lastes opp av en administrator",
  },
  {
    icon: "compare",
    title: "Analysen kjøres",
    text: "Hver henvendelse sammenlignes med rutinene og knyttes til den som passer best",
  },
  {
    icon: "checklist",
    title: "Du ser resultatet",
    text: "Rutinene rangeres, og henvendelser uten god rutine samles til manuell gjennomgang",
  },
];

interface Question {
  /** What other pages link to, so a question can be opened from an info bubble. */
  topic: AboutTopic;
  question: string;
  /** One entry per paragraph. */
  answer: string[];
}

interface Section {
  title: string;
  description: string;
  icon: AboutIconName;
  questions: Question[];
}

export const FAQ_SECTIONS: Section[] = [
  {
    title: "Forstå resultatene",
    description: "Hjelper brukeren å forstå det som vises i dashboardet.",
    icon: "chart",
    questions: [
      {
        topic: "coverage",
        question: "Hvordan beregnes dekning?",
        answer: [
          "Hver rutine deles inn i mindre tekstdeler som sammenlignes med henvendelsene. De mest relevante tekstdelene vurderes deretter av en språkmodell (KI), som måler hvor godt innholdet samsvarer med henvendelsen basert på betydning, ikke bare ordvalg.",
          "Dekningen oppgis i prosent og viser hvor godt de mest relevante delene av rutinen samsvarer med en henvendelse. Snittdekningen for en rutine er gjennomsnittlig dekning på tvers av alle henvendelsene som er knyttet til den.",
        ],
      },
      {
        topic: "bands",
        question: "Hva betyr Svak, Delvis og God dekning?",
        answer: [
          `Dekning under ${String(partialFrom)} % regnes som Svak, ${String(partialFrom)}–${String(goodFrom - 1)} % som Delvis og ${String(goodFrom)} % eller høyere som God. Grensene deler henvendelsene som er knyttet til en rutine i tre omtrent like store grupper, så nivåene sier hvor en henvendelse ligger i forhold til de andre, ikke om rutinen svarer fullt ut.`,
        ],
      },
    ],
  },
  {
    title: "Oppfølging og prioritering",
    description: "Forklarer hvordan analysen brukes i det videre forbedringsarbeidet.",
    icon: "flag",
    questions: [
      {
        topic: "ranking",
        question: "Hvordan rangeres rutinene?",
        answer: [
          `Rutinene rangeres etter både antall tilknyttede henvendelser og snittdekning, der begge faktorene vektlegges likt (${String(DEFAULT_WEIGHTS.volume)}/${String(DEFAULT_WEIGHTS.coverage)}). Rutiner med mange henvendelser og lav snittdekning får høyest prioritet, fordi de kan ha størst behov for forbedring.`,
          `Rangeringen starter på 1, der et høyere nummer betyr lavere prioritet. Hver faktor regnes om til hvor rutinen står i forhold til de andre rutinene, slik at antall henvendelser og snittdekning teller like mye ved lik vekt. Rutiner med like mange henvendelser får samme score på denne faktoren.`,
        ],
      },
      {
        topic: "status",
        question: "Hva betyr status og rutineeier?",
        answer: [
          "Status viser hvor langt arbeidet med en rutine har kommet: «Ubehandlet» eller «Under behandling». En rutine med status Ubehandlet har ingen eier. Velger du status Under behandling, må du velge en rutineeier, slik at det er tydelig hvem som behandler rutinen.",
        ],
      },
    ],
  },
  {
    title: "Matching og kunnskapshull",
    description: "Forklarer hvordan henvendelser kobles til rutiner og mulige kunnskapshull identifiseres.",
    icon: "search",
    questions: [
      {
        topic: "suggested-routine",
        question: "Hvordan velges foreslått rutine?",
        answer: [
          "Foreslått rutine er rutinen som passer best til henvendelsen. Det er systemets forslag og ikke en fasit. Hvis forslaget er feil, kan du flytte henvendelsen til en annen rutine.",
        ],
      },
      {
        topic: "manual-review",
        question: "Hvorfor må noen henvendelser gjennomgås manuelt?",
        answer: [
          `Hvis den beste rutinen passer dårligere enn ${String(MANUAL_REVIEW_BELOW_PERCENT)} %, regner ikke systemet henvendelsen som koblet til noen rutine. Den havner da under «Henvendelser til manuell gjennomgang». Grensen er valgt ved å teste ulike verdier mot et lite utvalg henvendelser der vi på forhånd visste om det fantes en rutine. Den fungerer som et filter som begrenser hvor mange henvendelser som må gjennomgås, men den fanger ikke alle kunnskapshull. Henvendelser som handler om det samme samles i grupper. En stor gruppe betyr at flere lurer på det samme uten at en rutine svarer godt nok. Der kan du knytte henvendelsene til en rutine eller forkaste dem.`,
        ],
      },
      {
        topic: "knowledge-gaps",
        question: "Hvordan identifiserer analysen kunnskapshull?",
        answer: [
          "Et kunnskapshull er noe mange spør om, men som ingen rutine svarer godt på. Resultatene brukes til å identifisere mulige forbedringsområder på to måter: Rutiner prioriteres ut fra både antall henvendelser og snittdekning, mens henvendelser uten en passende rutine grupperes og vises til manuell gjennomgang.",
        ],
      },
    ],
  },
  {
    title: "Datagrunnlag og begrensninger",
    description: "Gir innsikt i datakildene, oppdateringer og hva analysen ikke kan konkludere med.",
    icon: "database",
    questions: [
      {
        topic: "data",
        question: "Hvor kommer henvendelsene og datoene fra?",
        answer: [
          "Henvendelsene kommer fra ServiceNow, og rutinene fra Kvaliteket. Kategorien er tjenesten henvendelsen ble registrert under. Eksporten fra ServiceNow har ikke dato for når henvendelsen ble opprettet, så datoen som vises er dagen filen ble lastet opp.",
        ],
      },
      {
        topic: "rerun",
        question: "Hva skjer når analysen kjøres på nytt?",
        answer: [
          "Analysen bruker filene som sist ble lastet opp og erstatter forrige resultat. Den tar noen minutter, og du kan bruke resten av dashbordet imens.",
        ],
      },
      {
        topic: "interpretation",
        question: "Hvordan bør resultatene tolkes?",
        answer: [
          "Analysen måler hvor like tekstene er i betydning. Lav dekning kan bety at rutinen er mangelfull, uklar eller bruker andre ord enn henvendelsen. Høy dekning betyr ikke nødvendigvis at rutinen gir riktig svar.",
          "Gjentakende spørsmål kan skyldes mangelfulle rutiner, men også at vedkommende ikke finner, kjenner til eller forstår informasjonen som allerede finnes. Resultatene er derfor et hjelpemiddel for å identifisere hvilke rutiner som bør undersøkes nærmere, ikke en fasit.",
        ],
      },
    ],
  },
];
