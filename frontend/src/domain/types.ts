/**
 * The shapes the dashboard works with. One analysis run produces one snapshot:
 * the clusters of ServiceNow questions that matched the Kvaliteket routines
 * poorly, plus the context needed to act on them.
 */

export type KnowledgeGapId = string;

/** A single anonymised ServiceNow question, quoted to show how people ask. */
export interface TicketQuestion {
  text: string;
  /** Ticket number and date, e.g. "INC0412884 · 2. sep". */
  reference: string;
}

/** How well one Kvaliteket document covers a gap's questions. */
export interface RoutineMatch {
  name: string;
  /** Mean cosine similarity to the cluster, 0-1. */
  similarity: number;
  /** Document number and revision date, e.g. "KV-014 · revidert mars 2023". */
  reference: string;
}

/** A cluster of related questions that the routines answer poorly. */
export interface KnowledgeGap {
  id: KnowledgeGapId;
  topic: string;
  category: string;
  ticketCount: number;
  /** Change in ticket volume since last month, in percent. Can be negative. */
  trendPercent: number;
  /** Mean similarity to the best-matching document, 0-1. */
  coverage: number;
  summary: string;
  nearestMatchLine: string;
  questions: TicketQuestion[];
  questionsNote: string;
  routines: RoutineMatch[];
  verdict: string;
  documentOwner: string;
  dueDate: string;
  /** Staleness of the nearest document, 0-1, where 1 is most overdue for review. */
  documentAge: number;
  documentAgeLabel: string;
}

export interface MonthlyUnmatched {
  month: string;
  percent: number;
}

export interface TopicDelta {
  topic: string;
  delta: string;
  note?: string;
}

export interface DataSource {
  name: string;
  detail: string;
  count: number;
}

/** Everything one analysis run produced. */
export interface AnalysisSnapshot {
  gaps: KnowledgeGap[];
  documentOwners: string[];
  totalTickets: number;
  totalRoutines: number;
  /** Tickets that fell outside every cluster, still counted in the totals. */
  ticketsOutsideClusters: number;
  coverageOutsideClusters: number;
  lastRunLabel: string;
  monthlyUnmatched: MonthlyUnmatched[];
  risingTopics: TopicDelta[];
  resolvedTopics: TopicDelta[];
  sources: DataSource[];
}

/** How much each factor counts towards a gap's priority score. */
export interface PriorityWeights {
  volume: number;
  coverage: number;
  trend: number;
  age: number;
}

/** What HR decided to do about a gap. */
export type GapDecision = "update" | "covered" | "unchanged";
