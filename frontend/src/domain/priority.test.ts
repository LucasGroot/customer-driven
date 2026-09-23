import { describe, expect, it } from "vitest";
import {
  DEFAULT_WEIGHTS,
  THRESHOLD_RANGE,
  coverageBand,
  priorityBand,
  priorityScore,
  rankGaps,
  scoreBreakdown,
  totalUnmatchedTickets,
  unmatchedTicketCount,
} from "./priority";
import type { AnalysisSnapshot, KnowledgeGap, PriorityWeights } from "./types";

function makeGap(overrides: Partial<KnowledgeGap> = {}): KnowledgeGap {
  return {
    id: "gap",
    topic: "Topic",
    category: "Category",
    ticketCount: 20,
    trendPercent: 15,
    coverage: 0.4,
    summary: "",
    nearestMatchLine: "",
    questions: [],
    questionsNote: "",
    routines: [],
    verdict: "",
    documentOwner: "",
    dueDate: "",
    documentAge: 0.5,
    documentAgeLabel: "",
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<AnalysisSnapshot> = {}): AnalysisSnapshot {
  return {
    gaps: [],
    documentOwners: [],
    totalTickets: 0,
    totalRoutines: 0,
    ticketsOutsideClusters: 0,
    coverageOutsideClusters: 1,
    lastRunLabel: "",
    monthlyUnmatched: [],
    risingTopics: [],
    resolvedTopics: [],
    sources: [],
    ...overrides,
  };
}

const WORST_GAP = makeGap({ ticketCount: 40, coverage: 0, trendPercent: 40, documentAge: 1 });
const BEST_GAP = makeGap({ ticketCount: 0, coverage: 1, trendPercent: -10, documentAge: 0 });

const ONLY_VOLUME: PriorityWeights = { volume: 50, coverage: 0, trend: 0, age: 0 };
const ONLY_COVERAGE: PriorityWeights = { volume: 0, coverage: 50, trend: 0, age: 0 };

describe("scoreBreakdown", () => {
  it("scales volume up to full marks at 40 tickets", () => {
    expect(scoreBreakdown(makeGap({ ticketCount: 20 })).volume).toBe(0.5);
    expect(scoreBreakdown(makeGap({ ticketCount: 40 })).volume).toBe(1);
    expect(scoreBreakdown(makeGap({ ticketCount: 400 })).volume).toBe(1);
  });

  it("scores coverage higher the worse the routines match", () => {
    expect(scoreBreakdown(makeGap({ coverage: 0.3 })).coverage).toBeCloseTo(0.7);
    expect(scoreBreakdown(makeGap({ coverage: 1 })).coverage).toBe(0);
  });

  it("maps trend from -10%..+40% onto 0..1 and clamps outside it", () => {
    expect(scoreBreakdown(makeGap({ trendPercent: -10 })).trend).toBe(0);
    expect(scoreBreakdown(makeGap({ trendPercent: 15 })).trend).toBe(0.5);
    expect(scoreBreakdown(makeGap({ trendPercent: 40 })).trend).toBe(1);
    expect(scoreBreakdown(makeGap({ trendPercent: -50 })).trend).toBe(0);
    expect(scoreBreakdown(makeGap({ trendPercent: 120 })).trend).toBe(1);
  });

  it("passes document age through unchanged", () => {
    expect(scoreBreakdown(makeGap({ documentAge: 0.8 })).age).toBe(0.8);
  });
});

describe("priorityScore", () => {
  it("ranges from 0 for a fully covered gap to 100 for the worst possible gap", () => {
    expect(priorityScore(BEST_GAP, DEFAULT_WEIGHTS)).toBe(0);
    expect(priorityScore(WORST_GAP, DEFAULT_WEIGHTS)).toBe(100);
  });

  it("weights each factor by its share of the total weight", () => {
    const highVolumeFullyCovered = makeGap({ ticketCount: 40, coverage: 1 });
    const halfVolumeHalfCoverage: PriorityWeights = { volume: 30, coverage: 30, trend: 0, age: 0 };

    expect(priorityScore(highVolumeFullyCovered, halfVolumeHalfCoverage)).toBe(50);
  });

  it("depends only on the ratio between weights, not their sum", () => {
    const gap = makeGap();
    const doubled: PriorityWeights = {
      volume: DEFAULT_WEIGHTS.volume * 2,
      coverage: DEFAULT_WEIGHTS.coverage * 2,
      trend: DEFAULT_WEIGHTS.trend * 2,
      age: DEFAULT_WEIGHTS.age * 2,
    };

    expect(priorityScore(gap, doubled)).toBe(priorityScore(gap, DEFAULT_WEIGHTS));
  });

  it("returns 0 instead of NaN when every weight is zero", () => {
    const noWeights: PriorityWeights = { volume: 0, coverage: 0, trend: 0, age: 0 };

    expect(priorityScore(WORST_GAP, noWeights)).toBe(0);
  });
});

describe("priorityBand", () => {
  it("puts 70 and above in high, 50-69 in medium and the rest in low", () => {
    expect(priorityBand(100)).toBe("high");
    expect(priorityBand(70)).toBe("high");
    expect(priorityBand(69)).toBe("medium");
    expect(priorityBand(50)).toBe("medium");
    expect(priorityBand(49)).toBe("low");
    expect(priorityBand(0)).toBe("low");
  });
});

describe("coverageBand", () => {
  it("calls coverage under 0.3 weak, under 0.45 partial and the rest good", () => {
    expect(coverageBand(0.29)).toBe("weak");
    expect(coverageBand(0.3)).toBe("partial");
    expect(coverageBand(0.44)).toBe("partial");
    expect(coverageBand(0.45)).toBe("good");
  });
});

describe("unmatchedTicketCount", () => {
  it("counts half the tickets as unmatched when coverage sits exactly on the threshold", () => {
    expect(unmatchedTicketCount(makeGap({ ticketCount: 20, coverage: 0.4 }), 40)).toBe(10);
  });

  it("counts every ticket when coverage is far below the threshold", () => {
    expect(unmatchedTicketCount(makeGap({ ticketCount: 20, coverage: 0.1 }), 40)).toBe(20);
  });

  it("counts no tickets when coverage is far above the threshold", () => {
    expect(unmatchedTicketCount(makeGap({ ticketCount: 20, coverage: 0.7 }), 40)).toBe(0);
  });

  it("never drops when the threshold is raised", () => {
    const gap = makeGap({ ticketCount: 30, coverage: 0.42 });
    const stepCount = (THRESHOLD_RANGE.max - THRESHOLD_RANGE.min) / THRESHOLD_RANGE.step;
    const thresholds = Array.from(
      { length: stepCount + 1 },
      (_, index) => THRESHOLD_RANGE.min + index * THRESHOLD_RANGE.step,
    );
    const counts = thresholds.map((threshold) => unmatchedTicketCount(gap, threshold));

    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(counts[0]).toBeLessThan(counts[counts.length - 1] ?? 0);
  });
});

describe("totalUnmatchedTickets", () => {
  it("adds tickets outside every cluster to the unmatched tickets inside them", () => {
    const snapshot = makeSnapshot({
      gaps: [
        makeGap({ ticketCount: 20, coverage: 0.4 }),
        makeGap({ ticketCount: 10, coverage: 0.1 }),
      ],
      ticketsOutsideClusters: 30,
      coverageOutsideClusters: 0.4,
    });

    expect(totalUnmatchedTickets(snapshot, 40)).toBe(10 + 10 + 15);
  });
});

describe("rankGaps", () => {
  const busyButCovered = makeGap({
    id: "busy-but-covered",
    ticketCount: 40,
    coverage: 1,
    trendPercent: -10,
    documentAge: 0,
  });
  const quietButUncovered = makeGap({
    id: "quiet-but-uncovered",
    ticketCount: 0,
    coverage: 0,
    trendPercent: -10,
    documentAge: 0,
  });

  it("puts the highest score first and attaches its band", () => {
    const ranked = rankGaps([BEST_GAP, WORST_GAP], DEFAULT_WEIGHTS);

    expect(ranked.map((entry) => entry.score)).toEqual([100, 0]);
    expect(ranked.map((entry) => entry.band)).toEqual(["high", "low"]);
  });

  it("reorders the work list when the weights change", () => {
    const gaps = [busyButCovered, quietButUncovered];

    expect(rankGaps(gaps, ONLY_VOLUME)[0]?.gap.id).toBe("busy-but-covered");
    expect(rankGaps(gaps, ONLY_COVERAGE)[0]?.gap.id).toBe("quiet-but-uncovered");
  });

  it("leaves the input list in its original order", () => {
    const gaps = [BEST_GAP, WORST_GAP];
    rankGaps(gaps, DEFAULT_WEIGHTS);

    expect(gaps).toEqual([BEST_GAP, WORST_GAP]);
  });
});
