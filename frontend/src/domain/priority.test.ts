import { describe, expect, it } from "vitest";
import {
  coverageBand,
  isWellCovered,
  priorityBand,
  priorityScore,
  rankRoutines,
  scoreBreakdown,
} from "./priority";
import type { RoutineStats } from "./routines";
import type { PriorityWeights } from "./types";

function makeStats(questionCount: number, meanCoverage: number, code = "A"): RoutineStats {
  return {
    routine: { code, name: code, uploadedLabel: "" },
    questions: [],
    questionCount,
    meanCoverage,
  };
}

const WORST_ROUTINE = makeStats(10, 0);
const BEST_ROUTINE = makeStats(0, 1);

const ONLY_VOLUME: PriorityWeights = { volume: 50, coverage: 0 };
const ONLY_COVERAGE: PriorityWeights = { volume: 0, coverage: 50 };
const EVEN_WEIGHTS: PriorityWeights = { volume: 50, coverage: 50 };

describe("scoreBreakdown", () => {
  it("scales volume up to full marks at 10 questions", () => {
    expect(scoreBreakdown(makeStats(5, 0.5)).volume).toBeCloseTo(0.5);
    expect(scoreBreakdown(makeStats(10, 0.5)).volume).toBe(1);
    expect(scoreBreakdown(makeStats(30, 0.5)).volume).toBe(1);
  });

  it("scores coverage higher the worse the routine answers its questions", () => {
    expect(scoreBreakdown(makeStats(1, 0.25)).coverage).toBeCloseTo(0.75);
    expect(scoreBreakdown(makeStats(1, 1)).coverage).toBe(0);
  });
});

describe("priorityScore", () => {
  it("ranges from 0 for a routine that answers everything to 100 for the worst possible one", () => {
    expect(priorityScore(BEST_ROUTINE, EVEN_WEIGHTS)).toBe(0);
    expect(priorityScore(WORST_ROUTINE, EVEN_WEIGHTS)).toBe(100);
  });

  it("weights each factor by its share of the total weight", () => {
    const manyQuestionsGoodCoverage = makeStats(10, 1);
    expect(priorityScore(manyQuestionsGoodCoverage, ONLY_VOLUME)).toBe(100);
    expect(priorityScore(manyQuestionsGoodCoverage, ONLY_COVERAGE)).toBe(0);
    expect(priorityScore(manyQuestionsGoodCoverage, EVEN_WEIGHTS)).toBe(50);
  });

  it("depends only on the ratio between weights, not their sum", () => {
    const stats = makeStats(4, 0.3);
    expect(priorityScore(stats, { volume: 10, coverage: 30 })).toBe(
      priorityScore(stats, { volume: 20, coverage: 60 }),
    );
  });

  it("returns 0 instead of NaN when every weight is zero", () => {
    expect(priorityScore(WORST_ROUTINE, { volume: 0, coverage: 0 })).toBe(0);
  });
});

describe("priorityBand", () => {
  it("puts 70 and above in high, 50-69 in medium and the rest in low", () => {
    expect(priorityBand(70)).toBe("high");
    expect(priorityBand(69)).toBe("medium");
    expect(priorityBand(50)).toBe("medium");
    expect(priorityBand(49)).toBe("low");
  });
});

describe("coverageBand", () => {
  it("calls coverage under 0.52 weak, under 0.65 partial and the rest good", () => {
    expect(coverageBand(0.51)).toBe("weak");
    expect(coverageBand(0.52)).toBe("partial");
    expect(coverageBand(0.64)).toBe("partial");
    expect(coverageBand(0.65)).toBe("good");
  });
});

describe("rankRoutines", () => {
  const routines = [makeStats(2, 0.8, "low"), makeStats(10, 0.1, "high"), makeStats(5, 0.4, "mid")];

  it("puts the highest score first and attaches its band", () => {
    const ranked = rankRoutines(routines, EVEN_WEIGHTS);
    expect(ranked.map((entry) => entry.stats.routine.code)).toEqual(["high", "mid", "low"]);
    expect(ranked[0]?.band).toBe("high");
  });

  it("reorders the list when the weights change", () => {
    const busyButCovered = makeStats(10, 0.9, "busy");
    const quietButPoor = makeStats(1, 0.1, "quiet");
    const order = (weights: PriorityWeights) =>
      rankRoutines([busyButCovered, quietButPoor], weights).map((entry) => entry.stats.routine.code);

    expect(order(ONLY_VOLUME)).toEqual(["busy", "quiet"]);
    expect(order(ONLY_COVERAGE)).toEqual(["quiet", "busy"]);
  });

  it("leaves the input list in its original order", () => {
    rankRoutines(routines, EVEN_WEIGHTS);
    expect(routines.map((stats) => stats.routine.code)).toEqual(["low", "high", "mid"]);
  });
});

describe("coverage cut-off", () => {
  it("counts a routine as well covered only above the cut-off", () => {
    expect(isWellCovered(makeStats(1, 0.71), 70)).toBe(true);
    expect(isWellCovered(makeStats(1, 0.7), 70)).toBe(false);
  });
});
