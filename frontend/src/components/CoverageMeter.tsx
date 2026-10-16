import { formatCoverage } from "../domain/labels";
import { coverageBand } from "../domain/priority";
import { COVERAGE_BAND_COLOR } from "./bandColors";
import { MeterBar } from "./MeterBar";
import styles from "./CoverageMeter.module.css";

interface CoverageMeterProps {
  /** Similarity to the best document, 0-1. */
  coverage: number;
}

/** "Svak · 24 %" over a bar in the band's colour. */
export function CoverageMeter({ coverage }: CoverageMeterProps) {
  const band = coverageBand(coverage);
  const color = COVERAGE_BAND_COLOR[band];
  return (
    <div className={styles.meter}>
      <span className={styles.label} style={{ color }}>
        {formatCoverage(coverage, band)}
      </span>
      <MeterBar value={coverage} color={color} />
    </div>
  );
}
