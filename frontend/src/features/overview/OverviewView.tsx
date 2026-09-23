import { Button } from "../../components/Button";
import { FilterPill } from "../../components/FilterPill";
import { PageIntro } from "../../components/PageIntro";
import { StatCard } from "../../components/StatCard";
import { rankGaps, totalUnmatchedTickets } from "../../domain/priority";
import type { AnalysisSnapshot, KnowledgeGapId, PriorityWeights } from "../../domain/types";
import type { GapReview } from "../../hooks/useGapReview";
import { GAP_FILTERS, filterGaps, type GapFilter } from "./gapFilters";
import { GapTable } from "./GapTable";
import styles from "./OverviewView.module.css";

interface OverviewViewProps {
  snapshot: AnalysisSnapshot;
  weights: PriorityWeights;
  thresholdPercent: number;
  review: GapReview;
  filter: GapFilter;
  onFilterChange: (filter: GapFilter) => void;
  onOpenGap: (gapId: KnowledgeGapId) => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
}

export function OverviewView({
  snapshot,
  weights,
  thresholdPercent,
  review,
  filter,
  onFilterChange,
  onOpenGap,
  onOpenSettings,
  onOpenExport,
}: OverviewViewProps) {
  const scored = rankGaps(snapshot.gaps, weights);
  const visible = filterGaps(scored, filter, review.decisionOf);
  const highPriorityCount = scored.filter((entry) => entry.band === "high").length;
  const undecided = review.undecidedCount(snapshot.gaps.map((gap) => gap.id));
  const unmatched = totalUnmatchedTickets(snapshot, thresholdPercent);
  const unmatchedPercent = Math.round((unmatched / snapshot.totalTickets) * 100);

  return (
    <section className={styles.view}>
      <div className={styles.header}>
        <PageIntro
          title="Oversikt"
          lead="Tabellen nedenfor viser en prioritert liste over hvilke rutiner som bør oppdateres i Kvaliteket, basert på henvendelser sendt i ServiceNow. For å endre prioriteringsvekten, gå til Analyseinnstillinger og kjør analysen på nytt."
        />
        <Button variant="primary" onClick={onOpenSettings}>
          Kjør ny analyse
        </Button>
      </div>

      <div className={styles.stats}>
        <StatCard
          label="Temaer funnet"
          value={String(snapshot.gaps.length)}
          note={`basert på ${String(snapshot.totalTickets)} henvendelser`}
        />
        <StatCard
          label="Høy prioritet"
          value={String(highPriorityCount)}
          note="bør oppdateres snarlig"
        />
        <StatCard
          label="Uten treff"
          value={`${String(unmatchedPercent)} %`}
          note={`${String(unmatched)} av ${String(snapshot.totalTickets)} henvendelser fant ingen match i Kvaliteket`}
        />
        <StatCard label="Status mangler" value={String(undecided)} note="venter på HR" />
      </div>

      <div className={styles.filters}>
        <span className={styles.filtersLabel}>Vis:</span>
        {GAP_FILTERS.map((option) => (
          <FilterPill
            key={option.key}
            label={option.label}
            selected={filter === option.key}
            onSelect={() => {
              onFilterChange(option.key);
            }}
          />
        ))}
        <span className={styles.exportLink}>
          <Button variant="link" onClick={onOpenExport}>
            Eksporter listen
          </Button>
        </span>
      </div>

      <GapTable rows={visible} decisionOf={review.decisionOf} onOpenGap={onOpenGap} />

      <p className={styles.footnote}>
        Prioritet 0–100 bygger på fire ting: hvor mange som spør, hvor dårlig nærmeste rutine
        treffer, om temaet øker, og hvor lenge siden dokumentet ble revidert. Klikk på et tema for
        å se regnestykket i klartekst.
      </p>
    </section>
  );
}
