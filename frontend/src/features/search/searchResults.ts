/**
 * Filtering and sorting for the search page. Kept as pure functions so the
 * rules for what counts as a match, and what is shown in the list, can be
 * tested without rendering anything.
 */

import type { AskedQuestion, KnowledgeGapId, RoutineDocument } from "../../domain/types";

export type SearchTab = "questions" | "documents";
export type ListVisibility = "all" | "listed" | "hidden";
export type SortOrder = "coverage-asc" | "coverage-desc" | "alphabetical";

export const VISIBILITY_FILTERS: { key: ListVisibility; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "listed", label: "Vises i listen" },
  { key: "hidden", label: "Skjult (dekket)" },
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
  document: RoutineDocument | undefined;
  listed: boolean;
}

interface QuestionSearch {
  query: string;
  visibility: ListVisibility;
  sort: SortOrder;
  listed: Set<KnowledgeGapId>;
}

export function searchQuestions(
  questions: AskedQuestion[],
  documents: RoutineDocument[],
  { query, visibility, sort, listed }: QuestionSearch,
): QuestionResult[] {
  const documentByCode = new Map(documents.map((document) => [document.code, document]));
  return questions
    .map((question) => ({
      question,
      document: documentByCode.get(question.documentCode),
      listed: question.gapId !== undefined && listed.has(question.gapId),
    }))
    .filter((result) => {
      if (visibility === "listed" && !result.listed) return false;
      if (visibility === "hidden" && result.listed) return false;
      return matchesQuery(
        [
          result.question.text,
          result.question.topic,
          result.question.documentCode,
          result.document?.name ?? "",
        ],
        query,
      );
    })
    .sort((a, b) =>
      sort === "alphabetical"
        ? a.question.topic.localeCompare(b.question.topic, "nb-NO") ||
          a.question.text.localeCompare(b.question.text, "nb-NO")
        : compareCoverage(a.question.coverage, b.question.coverage, sort),
    );
}

export interface DocumentResult {
  document: RoutineDocument;
  questionCount: number;
  /** Mean coverage of the questions this document matched best, or null if none did. */
  meanCoverage: number | null;
}

interface DocumentSearch {
  query: string;
  sort: SortOrder;
}

export function searchDocuments(
  documents: RoutineDocument[],
  questions: AskedQuestion[],
  { query, sort }: DocumentSearch,
): DocumentResult[] {
  return documents
    .filter((document) => matchesQuery([document.name, document.code], query))
    .map((document) => {
      const matched = questions.filter((question) => question.documentCode === document.code);
      const total = matched.reduce((sum, question) => sum + question.coverage, 0);
      return {
        document,
        questionCount: matched.length,
        meanCoverage: matched.length === 0 ? null : total / matched.length,
      };
    })
    .sort((a, b) =>
      sort === "alphabetical"
        ? a.document.name.localeCompare(b.document.name, "nb-NO")
        : compareCoverage(a.meanCoverage, b.meanCoverage, sort),
    );
}
