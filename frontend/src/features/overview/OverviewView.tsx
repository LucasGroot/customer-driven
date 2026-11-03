import { Button } from "../../components/Button";
import { FilterPill } from "../../components/FilterPill";
import { NumberField } from "../../components/NumberField";
import { PageIntro } from "../../components/PageIntro";
import type { SortState } from "../../components/sort";
import { rankRoutines } from "../../domain/priority";
import type { RoutineStats } from "../../domain/routines";
import type { PriorityWeights, RoutineCode } from "../../domain/types";
import type { RoutineReview } from "../../hooks/useRoutineReview";
import { ROUTINE_FILTERS, filterRoutines, hideWellCovered, type RoutineFilter } from "./routineFilters";
import { RoutineTable } from "./RoutineTable";
import styles from "./OverviewView.module.css";

interface OverviewViewProps {
  routines: RoutineStats[];
  pendingCount: number;
  weights: PriorityWeights;
  review: RoutineReview;
  filter: RoutineFilter;
  onFilterChange: (filter: RoutineFilter) => void;
  hideAbovePercent: number;
  onHideAboveChange: (percent: number) => void;
  sort: SortState | null;
  onSortChange: (sortKey: string) => void;
  onResetSort: () => void;
  onOpenRoutine: (routineCode: RoutineCode) => void;
  onOpenReview: () => void;
  onOpenSettings: () => void;
}

export function OverviewView({
  routines,
  pendingCount,
  weights,
  review,
  filter,
  onFilterChange,
  hideAbovePercent,
  onHideAboveChange,
  sort,
  onSortChange,
  onResetSort,
  onOpenRoutine,
  onOpenReview,
  onOpenSettings,
}: OverviewViewProps) {
  const ranked = rankRoutines(routines, weights);
  const shown = hideWellCovered(ranked, hideAbovePercent);
  const hiddenCount = ranked.length - shown.length;
  const visible = filterRoutines(shown, filter, review.statusOf);

  return (
    <section className={styles.view}>
      <div className={styles.header}>
        <PageIntro
          title="Rutiner som bør oppdateres først"
          lead="Hver rutine er satt opp mot henvendelsene fra ServiceNow som passer best til den. Øverst ligger rutinene som får flest henvendelser, men svarer dårligst på dem."
        />
        <Button variant="primary" onClick={onOpenSettings}>
          Kjør ny analyse
        </Button>
      </div>

      <div className={styles.filters}>
        {ROUTINE_FILTERS.map((option) => (
          <FilterPill
            key={option.key}
            label={`${option.label} · ${String(filterRoutines(shown, option.key, review.statusOf).length)}`}
            selected={filter === option.key}
            onSelect={() => {
              onFilterChange(option.key);
            }}
          />
        ))}
        <div className={styles.hideAbove}>
          <NumberField
            label="Skjul rutiner med snittscore over"
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
          {hiddenCount} {hiddenCount === 1 ? "rutine er" : "rutiner er"} skjult fordi de svarer
          godt på henvendelsene sine, med snittscore over {hideAbovePercent} %.
        </p>
      ) : null}

      {pendingCount > 0 ? (
        <p className={styles.hiddenNote}>
          {pendingCount} {pendingCount === 1 ? "henvendelse passer" : "henvendelser passer"} ikke
          til noen rutine og venter på gjennomgang.{" "}
          <Button variant="link" onClick={onOpenReview}>
            Gå til gjennomgang
          </Button>
        </p>
      ) : null}

      {sort !== null ? (
        <p className={styles.hiddenNote}>
          Tabellen er sortert på en egen kolonne.{" "}
          <Button variant="link" onClick={onResetSort}>
            Nullstill sortering
          </Button>
        </p>
      ) : null}

      <RoutineTable
        rows={visible}
        statusOf={review.statusOf}
        sort={sort}
        onSortChange={onSortChange}
        onOpenRoutine={onOpenRoutine}
      />

      <p className={styles.footnote}>
        Prioritet 0–100 bygger på to ting: hvor mange henvendelser som er knyttet til rutinen, og hvor
        dårlig rutinen treffer dem. Klikk på en rutine for å se henvendelsene og regnestykket i
        klartekst.
      </p>
    </section>
  );
}
