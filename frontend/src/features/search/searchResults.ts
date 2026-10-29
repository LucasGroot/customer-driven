/**
 * Filtering and sorting for the search page. Kept as pure functions so the
 * rules for what counts as a match, and what is shown in the list, can be
 * tested without rendering anything.
 */

import { placementOf, type DecisionOf, type Placement, type RoutineStats } from "../../domain/routines";
import type { AskedQuestion, RoutineDocument } from "../../domain/types";

export type SearchTab = "questions" | "documents";
export type PlacementFilter = "all" | Placement["kind"];
export type SortOrder = "coverage-asc" | "coverage-desc" | "alphabetical";

export const PLACEMENT_FILTERS: { key: PlacementFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "routine", label: "Knyttet til rutine" },
  { key: "pending", label: "Til gjennomgang" },
  { key: "discarded", label: "Forkastet" },
];

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "coverage-asc", label: "Lavest dekning først" },
  { value: "coverage-desc", label: "Høyest dekning først" },
  { value: "alphabetical", label: "Alfabetisk" },
];

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
}

export function searchDocuments(
  documents: RoutineDocument[],
  routines: RoutineStats[],
  { query, sort }: DocumentSearch,
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
    .sort((a, b) =>
      sort === "alphabetical"
        ? a.document.name.localeCompare(b.document.name, "nb-NO")
        : compareCoverage(a.meanCoverage, b.meanCoverage, sort),
    );
}
