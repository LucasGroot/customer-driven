/** The knobs on the settings screen: match threshold and priority weighting. */

import { useCallback, useState } from "react";
import {
  DEFAULT_THRESHOLD_PERCENT,
  DEFAULT_WEIGHTS,
  THRESHOLD_RANGE,
  WEIGHT_RANGE,
} from "../domain/priority";
import type { PriorityWeights } from "../domain/types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface AnalysisSettings {
  weights: PriorityWeights;
  thresholdPercent: number;
  setWeight: (factor: keyof PriorityWeights, value: number) => void;
  setThresholdPercent: (value: number) => void;
}

export function useAnalysisSettings(): AnalysisSettings {
  const [weights, setWeights] = useState<PriorityWeights>(DEFAULT_WEIGHTS);
  const [thresholdPercent, setThreshold] = useState(DEFAULT_THRESHOLD_PERCENT);

  const setWeight = useCallback((factor: keyof PriorityWeights, value: number) => {
    if (!Number.isFinite(value)) return;
    setWeights((current) => ({
      ...current,
      [factor]: clamp(value, WEIGHT_RANGE.min, WEIGHT_RANGE.max),
    }));
  }, []);

  const setThresholdPercent = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    setThreshold(clamp(value, THRESHOLD_RANGE.min, THRESHOLD_RANGE.max));
  }, []);

  return { weights, thresholdPercent, setWeight, setThresholdPercent };
}
