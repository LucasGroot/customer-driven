import { describe, expect, it } from "vitest";
import { coverageBand, priorityBand, priorityScore, rankRoutines, scoreBreakdown } from "./priority";
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

const QUIET_BUT_WELL_COVERED = makeStats(1, 0.9, "quiet");
const MIDDLE = makeStats(5, 0.5, "middle");
const BUSY_BUT_POORLY_COVERED = makeStats(10, 0.1, "busy");
const THREE_ROUTINES = [QUIET_BUT_WELL_COVERED, MIDDLE, BUSY_BUT_POORLY_COVERED];

const ONLY_VOLUME: PriorityWeights = { volume: 50, coverage: 0 };
const ONLY_COVERAGE: PriorityWeights = { volume: 0, coverage: 50 };
const EVEN_WEIGHTS: PriorityWeights = { volume: 50, coverage: 50 };

describe("scoreBreakdown", () => {
  it("scores each factor by where the routine stands among all routines", () => {
    const volumes = THREE_ROUTINES.map((stats) => scoreBreakdown(stats, THREE_ROUTINES).volume);
    expect(volumes[0]).toBeCloseTo(1 / 6);
    expect(volumes[1]).toBeCloseTo(3 / 6);
    expect(volumes[2]).toBeCloseTo(5 / 6);
  });

  it("scores coverage higher the worse the routine answers its questions", () => {
    const coverages = THREE_ROUTINES.map((stats) => scoreBreakdown(stats, THREE_ROUTINES).coverage);
    expect(coverages[0]).toBeLessThan(coverages[1] ?? 0);
    expect(coverages[1]).toBeLessThan(coverages[2] ?? 0);
  });

  it("gives routines with the same number of questions the same volume score", () => {
    const sameCount = [makeStats(3, 0.2, "a"), makeStats(3, 0.8, "b")];
    expect(scoreBreakdown(sameCount[0] as RoutineStats, sameCount).volume).toBe(0.5);
    expect(scoreBreakdown(sameCount[1] as RoutineStats, sameCount).volume).toBe(0.5);
  });

  it("still tells a large routine from a very large one", () => {
    const routines = [makeStats(11, 0.5, "large"), makeStats(45, 0.5, "huge"), makeStats(1, 0.5, "small")];
    const [large, huge] = routines.map((stats) => scoreBreakdown(stats, routines).volume);
    expect(huge).toBeGreaterThan(large ?? 1);
  });
});

describe("priorityScore", () => {
  it("is highest for the routine that is worst on both factors", () => {
    const busy = priorityScore(BUSY_BUT_POORLY_COVERED, EVEN_WEIGHTS, THREE_ROUTINES);
    const quiet = priorityScore(QUIET_BUT_WELL_COVERED, EVEN_WEIGHTS, THREE_ROUTINES);
    expect(busy).toBeGreaterThan(quiet);
  });

  it("weights each factor by its share of the total weight", () => {
    expect(priorityScore(BUSY_BUT_POORLY_COVERED, ONLY_VOLUME, THREE_ROUTINES)).toBe(Math.round((5 / 6) * 100));
    expect(priorityScore(MIDDLE, ONLY_COVERAGE, THREE_ROUTINES)).toBe(50);
  });

  it("depends only on the ratio between weights, not their sum", () => {
    expect(priorityScore(MIDDLE, { volume: 10, coverage: 30 }, THREE_ROUTINES)).toBe(
      priorityScore(MIDDLE, { volume: 20, coverage: 60 }, THREE_ROUTINES),
    );
  });

  it("returns 0 instead of NaN when every weight is zero", () => {
    expect(priorityScore(MIDDLE, { volume: 0, coverage: 0 }, THREE_ROUTINES)).toBe(0);
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
  it("calls coverage under 59 % weak, under 63 % partial and the rest good", () => {
    expect(coverageBand(0.58)).toBe("weak");
    expect(coverageBand(0.59)).toBe("partial");
    expect(coverageBand(0.62)).toBe("partial");
    expect(coverageBand(0.63)).toBe("good");
  });

  it("gives every shown percentage one level, whatever lies behind the rounding", () => {
    expect(coverageBand(0.584)).toBe("weak");
    expect(coverageBand(0.586)).toBe("partial");
    expect(coverageBand(0.624)).toBe("partial");
    expect(coverageBand(0.626)).toBe("good");
  });
});

describe("rankRoutines", () => {
  const routines = [makeStats(2, 0.8, "low"), makeStats(10, 0.1, "high"), makeStats(5, 0.4, "mid")];

  it("puts the highest score first and attaches its band", () => {
    const ranked = rankRoutines(routines, EVEN_WEIGHTS);
    expect(ranked.map((entry) => entry.stats.routine.code)).toEqual(["high", "mid", "low"]);
    expect(ranked[0]?.band).toBe("high");
  });

  it("numbers the routines from 1, where 1 has the highest score", () => {
    const ranked = rankRoutines(routines, EVEN_WEIGHTS);
    expect(ranked.map((entry) => entry.rank)).toEqual([1, 2, 3]);
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
