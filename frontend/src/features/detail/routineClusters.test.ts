import { describe, expect, it } from "vitest";
import type { PlacedQuestion } from "../../domain/routines";
import type { AskedQuestion, RoutineCluster } from "../../domain/types";
import { groupRoutineQuestions } from "./routineClusters";

function placed(overrides: Partial<AskedQuestion>, byHand = false): PlacedQuestion {
  return {
    question: {
      id: "q",
      text: "Question",
      reference: "",
      category: "Category",
      documentCode: "A",
      coverage: 0.5,
      needsReview: false,
      ...overrides,
    },
    byHand,
  };
}

function cluster(id: string, routineCode = "A"): RoutineCluster {
  return { id, routineCode, title: `Tittel ${id}`, headingQuestionId: "q" };
}

const ids = (questions: PlacedQuestion[]) => questions.map(({ question }) => question.id);

describe("groupRoutineQuestions", () => {
  it("puts the questions of a cluster under it and the others in the rest", () => {
    const questions = [
      placed({ id: "a", routineClusterId: "c0" }),
      placed({ id: "b", routineClusterId: "c0" }),
      placed({ id: "loose" }),
    ];

    const { clusters, other } = groupRoutineQuestions(questions, [cluster("c0")], "A");

    expect(clusters.map((view) => [view.cluster.title, ids(view.questions)])).toEqual([["Tittel c0", ["a", "b"]]]);
    expect(ids(other)).toEqual(["loose"]);
  });

  it("puts the largest cluster first", () => {
    const questions = [
      placed({ id: "a", routineClusterId: "c0" }),
      placed({ id: "b", routineClusterId: "c1" }),
      placed({ id: "c", routineClusterId: "c1" }),
    ];

    const { clusters } = groupRoutineQuestions(questions, [cluster("c0"), cluster("c1")], "A");

    expect(clusters.map((view) => view.cluster.id)).toEqual(["c1", "c0"]);
  });

  it("gives every cluster the mean score of its questions", () => {
    const questions = [
      placed({ id: "a", routineClusterId: "c0", coverage: 0.2 }),
      placed({ id: "b", routineClusterId: "c0", coverage: 0.4 }),
    ];

    const { clusters } = groupRoutineQuestions(questions, [cluster("c0")], "A");

    expect(clusters[0]?.meanCoverage).toBeCloseTo(0.3);
  });

  it("keeps a question HR mapped by hand out of the clusters", () => {
    const questions = [
      placed({ id: "a", routineClusterId: "c0" }),
      placed({ id: "mapped", routineClusterId: "c0" }, true),
    ];

    const { clusters, other } = groupRoutineQuestions(questions, [cluster("c0")], "A");

    expect(ids(clusters[0]?.questions ?? [])).toEqual(["a"]);
    expect(ids(other)).toEqual(["mapped"]);
  });

  it("ignores the clusters of other routines and clusters with no questions left", () => {
    const questions = [placed({ id: "a", routineClusterId: "c1" })];

    const { clusters, other } = groupRoutineQuestions(questions, [cluster("c0"), cluster("c1", "B")], "A");

    expect(clusters).toEqual([]);
    expect(ids(other)).toEqual(["a"]);
  });
});
