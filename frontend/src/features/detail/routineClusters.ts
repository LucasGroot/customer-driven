/** Splits the questions of one routine into its titled clusters and the ones in no cluster. */

import type { PlacedQuestion } from "../../domain/routines";
import type { RoutineCluster, RoutineCode } from "../../domain/types";

export interface RoutineClusterView {
  cluster: RoutineCluster;
  questions: PlacedQuestion[];
  /** Mean best-match similarity of the questions in the cluster, 0-1. */
  meanCoverage: number;
}

export interface GroupedRoutineQuestions {
  clusters: RoutineClusterView[];
  /** Questions in no cluster, and the ones HR mapped to the routine by hand. */
  other: PlacedQuestion[];
}

/**
 * Puts the questions of the routine under the clusters of the routine, the largest first.
 * A question HR mapped by hand never counts as part of a cluster, because the analysis
 * clustered it among the questions of the routine it matched best.
 */
export function groupRoutineQuestions(
  questions: PlacedQuestion[],
  clusters: RoutineCluster[],
  routineCode: RoutineCode,
): GroupedRoutineQuestions {
  const views = clusters
    .filter((cluster) => cluster.routineCode === routineCode)
    .flatMap((cluster) => {
      const members = questions.filter(
        ({ question, byHand }) => !byHand && question.routineClusterId === cluster.id,
      );
      if (members.length === 0) return [];
      const totalCoverage = members.reduce((sum, { question }) => sum + question.coverage, 0);
      return [{ cluster, questions: members, meanCoverage: totalCoverage / members.length }];
    });

  const clusteredIds = new Set(views.flatMap((view) => view.questions.map(({ question }) => question.id)));

  return {
    clusters: views.sort((a, b) => b.questions.length - a.questions.length),
    other: questions.filter(({ question }) => !clusteredIds.has(question.id)),
  };
}
