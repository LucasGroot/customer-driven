import { Button } from "../../components/Button";
import { FilterPill } from "../../components/FilterPill";
import { NumberField } from "../../components/NumberField";
import { PageIntro } from "../../components/PageIntro";
import { StatCard } from "../../components/StatCard";
import { StatGrid } from "../../components/StatGrid";
import { rankGaps } from "../../domain/priority";
import type { AnalysisSnapshot, KnowledgeGapId, PriorityWeights } from "../../domain/types";
import type { GapReview } from "../../hooks/useGapReview";
import { GAP_FILTERS, filterGaps, hideWellCovered, type GapFilter } from "./gapFilters";
import { GapTable } from "./GapTable";
import styles from "./OverviewView.module.css";

interface OverviewViewProps {
  snapshot: AnalysisSnapshot;
  weights: PriorityWeights;
  review: GapReview;
  filter: GapFilter;
  onFilterChange: (filter: GapFilter) => void;
  hideAbovePercent: number;
  onHideAboveChange: (percent: number) => void;
  onOpenGap: (gapId: KnowledgeGapId) => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
}

export function OverviewView({
  snapshot,
  weights,
  review,
  filter,
  onFilterChange,
  hideAbovePercent,
  onHideAboveChange,
  onOpenGap,
  onOpenSettings,
  onOpenExport,
}: OverviewViewProps) {
  const ranked = rankGaps(snapshot.gaps, weights);
  const shown = hideWellCovered(ranked, hideAbovePercent);
  const hiddenCount = ranked.length - shown.length;
  const visible = filterGaps(shown, filter, review.statusOf);
  const highPriorityCount = shown.filter((entry) => entry.band === "high").length;
  const newCount = filterGaps(shown, "new", review.statusOf).length;

  return (
    <section className={styles.view}>
      <div className={styles.header}>
        <PageIntro
          title="Rutiner som bør oppdateres først"
          lead="Hvert punkt under er et spørsmål stilt direkte i ServiceNow, satt opp mot rutiner i Kvaliteket. Øverst ligger temaene flest spør om, men der dokumentasjonen gir dårligst eller ingen svar."
        />
        <Button variant="primary" onClick={onOpenSettings}>
          Kjør ny analyse
        </Button>
      </div>

      <StatGrid>
        <StatCard
          label="Temaer vist"
          value={String(shown.length)}
          note={`fra ${String(snapshot.totalTickets)} henvendelser`}
        />
        <StatCard
          label="Høy prioritet"
          value={String(highPriorityCount)}
          note="bør tas denne måneden"
        />
        <StatCard label="Nye" value={String(newCount)} note="ikke behandlet ennå" />
      </StatGrid>

      <div className={styles.filters}>
        {GAP_FILTERS.map((option) => (
          <FilterPill
            key={option.key}
            label={`${option.label} · ${String(filterGaps(shown, option.key, review.statusOf).length)}`}
            selected={filter === option.key}
            onSelect={() => {
              onFilterChange(option.key);
            }}
          />
        ))}
        <div className={styles.hideAbove}>
          <NumberField
            label="Skjul temaer med dekning over"
            value={hideAbovePercent}
            min={0}
            max={100}
            step={5}
            suffix="%"
            onChange={onHideAboveChange}
          />
        </div>
      </div>

      {hiddenCount > 0 ? (
        <p className={styles.hiddenNote}>
          {hiddenCount} {hiddenCount === 1 ? "tema er" : "temaer er"} skjult fordi rutinene
          allerede dekker dem over {hideAbovePercent} %.
        </p>
      ) : null}

      <GapTable rows={visible} statusOf={review.statusOf} onOpenGap={onOpenGap} />

      <p className={styles.footnote}>
        Prioritet 0–100 bygger på fire ting: hvor mange som spør, hvor dårlig nærmeste rutine
        treffer, om temaet øker, og hvor lenge siden dokumentet ble revidert. Klikk på et tema for
        å se regnestykket i klartekst.
      </p>
      <div>
        <Button variant="link" onClick={onOpenExport}>
          Eksporter listen
        </Button>
      </div>
    </section>
  );
}
