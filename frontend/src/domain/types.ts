/**
 * The shapes the dashboard works with. One analysis run produces one snapshot:
 * every ServiceNow question, the Kvaliteket routines, and which routine each
 * question matched best. Which routine a question belongs to once HR has
 * reviewed it, and how urgent a routine is, are worked out from these.
 */

export type RoutineCode = string;
export type QuestionId = string;
export type GroupId = string;

/** One Kvaliteket routine, as listed on the search page. */
export interface RoutineDocument {
  /** Unique id that questions point to through `documentCode`. Never shown. */
  code: RoutineCode;
  name: string;
  revisedLabel: string;
}

/** One ServiceNow question and the routine that matched it best. */
export interface AskedQuestion {
  id: QuestionId;
  text: string;
  /** Ticket number and date, e.g. "INC0412884 · 2. sep". */
  reference: string;
  /** The service the ticket was filed under, e.g. "Sykefravær". */
  category: string;
  /** The routine with the highest similarity. */
  documentCode: RoutineCode;
  /** Similarity to the best-matching routine, 0-1. */
  coverage: number;
  /** No routine matched well enough, so HR decides where the question belongs. */
  needsReview: boolean;
  /** The group of similar questions it belongs to. Left out for a question that stands alone. */
  groupId?: GroupId;
}

/**
 * Questions that need review and are about the same thing. Several people wondering about
 * the same thing, with no routine that answers it well enough, is what HR wants to find.
 */
export interface ReviewGroup {
  id: GroupId;
  /** The question closest to the middle of the group, which stands for it. */
  headingQuestionId: QuestionId;
}

export interface DataSource {
  name: string;
  count: number;
  /** What is being counted, e.g. "henvendelser" or "PDF-er". */
  unit: string;
  uploadedLabel: string;
}

/** Everything one analysis run produced. */
export interface AnalysisSnapshot {
  /** True when the data is invented sample data and not a real analysis run. */
  isExample: boolean;
  documentOwners: string[];
  lastRunLabel: string;
  questions: AskedQuestion[];
  reviewGroups: ReviewGroup[];
  documents: RoutineDocument[];
  sources: DataSource[];
}

/** How much each factor counts towards a routine's priority score. */
export interface PriorityWeights {
  volume: number;
  coverage: number;
}

/** Where a routine is in HR's work: untouched, being worked on, or dealt with. */
export type RoutineStatus = "new" | "updating" | "done";

/** What HR decided about a question the analysis could not place. */
export type ReviewDecision =
  | { kind: "discarded" }
  | { kind: "mapped"; routineCode: RoutineCode };
