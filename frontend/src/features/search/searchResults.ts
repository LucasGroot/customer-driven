/**
 * Filtering and sorting for the search page. Kept as pure functions so the
 * rules for what counts as a match, and what is shown in the list, can be
 * tested without rendering anything.
 */

import { placementOf, type DecisionOf, type Placement, type RoutineStats } from "../../domain/routines";
import type { AskedQuestion, RoutineDocument } from "../../domain/types";
import type { SortState } from "../../components/sort";
import { coverageBand, type CoverageBand } from "../../domain/priority";

export type SearchTab = "questions" | "documents";
export type PlacementFilter = "all" | Placement["kind"];
export type CoverageBandFilter = "all" | CoverageBand | "no-questions";
export type SortOrder = "coverage-asc" | "coverage-desc" | "alphabetical";

export const PLACEMENT_FILTERS: { key: PlacementFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "routine", label: "Knyttet til rutine" },
  { key: "pending", label: "Til gjennomgang" },
  { key: "discarded", label: "Forkastet" },
];

export const COVERAGE_BAND_FILTERS: { key: CoverageBandFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "weak", label: "Svak" },
  { key: "partial", label: "Delvis" },
  { key: "good", label: "God" },
  { key: "no-questions", label: "Uten henvendelser" },
];

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "coverage-asc", label: "Lavest dekning først" },
  { value: "coverage-desc", label: "Høyest dekning først" },
  { value: "alphabetical", label: "Alfabetisk" },
];


const PLACEMENT_ORDER: Placement["kind"][] = ["routine", "pending", "discarded"];

type Compare<T> = (a: T, b: T, factor: 1 | -1) => number;


function normalize(text: string): string {
  return text.toLocaleLowerCase("nb-NO").trim();
}

/** Case-insensitive substring match on any of the fields. An empty query matches everything. */
export function matchesQuery(fields: string[], query: string): boolean {
  const needle = normalize(query);
  if (needle === "") return true;
  return fields.some((field) => normalize(field).includes(needle));
}

/** Coverage order that puts rows without any coverage last, whichever way it runs. */
function compareCoverage(a: number | null, b: number | null, sort: SortOrder): number {
  if (a === null || b === null) return (a === null ? 1 : 0) - (b === null ? 1 : 0);
  return sort === "coverage-desc" ? b - a : a - b;
}

export interface QuestionResult {
  question: AskedQuestion;
  /** The routine that matched the question best, which is not always where it ends up. */
  document: RoutineDocument | undefined;
  placement: Placement;
}

interface QuestionSearch {
  query: string;
  filter: PlacementFilter;
  sort: SortOrder;
  decisionOf: DecisionOf;
}

export function searchQuestions(
  questions: AskedQuestion[],
  documents: RoutineDocument[],
  { query, filter, sort, decisionOf }: QuestionSearch,
): QuestionResult[] {
  const documentByCode = new Map(documents.map((document) => [document.code, document]));
  return questions
    .map((question) => ({
      question,
      document: documentByCode.get(question.documentCode),
      placement: placementOf(question, decisionOf(question.id)),
    }))
    .filter((result) => {
      if (filter !== "all" && result.placement.kind !== filter) return false;
      return matchesQuery(
        [result.question.text, result.question.category, result.document?.name ?? ""],
        query,
      );
    })
    .sort((a, b) =>
      sort === "alphabetical"
        ? a.question.category.localeCompare(b.question.category, "nb-NO") ||
          a.question.text.localeCompare(b.question.text, "nb-NO")
        : compareCoverage(a.question.coverage, b.question.coverage, sort),
    );
}

export interface DocumentResult {
  document: RoutineDocument;
  questionCount: number;
  /** Mean coverage of the questions placed on this document, or null if there are none. */
  meanCoverage: number | null;
}

interface DocumentSearch {
  query: string;
  sort: SortOrder;
  filter: CoverageBandFilter;
}

export function searchDocuments(
  documents: RoutineDocument[],
  routines: RoutineStats[],
  { query, sort, filter }: DocumentSearch,
): DocumentResult[] {
  const statsByCode = new Map(routines.map((stats) => [stats.routine.code, stats]));
  return documents
    .filter((document) => matchesQuery([document.name], query))
    .map((document) => {
      const stats = statsByCode.get(document.code);
      return {
        document,
        questionCount: stats?.questionCount ?? 0,
        meanCoverage: stats?.meanCoverage ?? null,
      };
    })
    .filter((result) => {
      if (filter === "all") return true;
      if (filter === "no-questions") return result.meanCoverage === null;
      return result.meanCoverage !== null && coverageBand(result.meanCoverage) === filter;
    })
    .sort((a, b) =>
      sort === "alphabetical"
        ? a.document.name.localeCompare(b.document.name, "nb-NO")
        : compareCoverage(a.meanCoverage, b.meanCoverage, sort),
    );
}


function compareNullable(a: number | null, b: number | null, factor: 1 | -1): number {
  if (a === null || b === null) return (a === null ? 1 : 0) - (b === null ? 1 : 0);
  return factor * (a - b);
}

/** Tri stable sur une colonne ; sans tri actif, l'ordre reçu est conservé. */
function sortBy<T>(items: T[], sort: SortState | null, comparers: Record<string, Compare<T>>): T[] {
  const compare = sort === null ? undefined : comparers[sort.key];
  if (sort === null || compare === undefined) return items;
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => compare(a, b, factor));
}

export function sortQuestionResults(results: QuestionResult[], sort: SortState | null): QuestionResult[] {
  return sortBy(results, sort, {
    text: (a, b, f) => f * a.question.text.localeCompare(b.question.text, "nb-NO"),
    category: (a, b, f) => f * a.question.category.localeCompare(b.question.category, "nb-NO"),
    routine: (a, b, f) =>
      f * (a.document?.name ?? "").localeCompare(b.document?.name ?? "", "nb-NO"),
    coverage: (a, b, f) => compareNullable(a.question.coverage, b.question.coverage, f),
    status: (a, b, f) =>
      f * (PLACEMENT_ORDER.indexOf(a.placement.kind) - PLACEMENT_ORDER.indexOf(b.placement.kind)),
  });
}

export function sortDocumentResults(results: DocumentResult[], sort: SortState | null): DocumentResult[] {
  return sortBy(results, sort, {
    name: (a, b, f) => f * a.document.name.localeCompare(b.document.name, "nb-NO"),
    count: (a, b, f) => f * (a.questionCount - b.questionCount),
    coverage: (a, b, f) => compareNullable(a.meanCoverage, b.meanCoverage, f),
  });
}