/** The knob on the settings screen: how much each factor counts towards the priority. */

import { useCallback, useState } from "react";
import { DEFAULT_WEIGHTS, WEIGHT_RANGE } from "../domain/priority";
import type { PriorityWeights } from "../domain/types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface AnalysisSettings {
  weights: PriorityWeights;
  setWeight: (factor: keyof PriorityWeights, value: number) => void;
}

export function useAnalysisSettings(): AnalysisSettings {
  const [weights, setWeights] = useState<PriorityWeights>(DEFAULT_WEIGHTS);

  const setWeight = useCallback((factor: keyof PriorityWeights, value: number) => {
    if (!Number.isFinite(value)) return;
    setWeights((current) => ({
      ...current,
      [factor]: clamp(value, WEIGHT_RANGE.min, WEIGHT_RANGE.max),
    }));
  }, []);

  return { weights, setWeight };
}
