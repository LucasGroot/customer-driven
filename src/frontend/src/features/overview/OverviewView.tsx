import { useEffect } from "react";
import { Button } from "../../components/Button";
import { classNames } from "../../components/classNames";
import { FilterPill } from "../../components/FilterPill";
import { PageIntro } from "../../components/PageIntro";
import { MultiSelectField } from "../../components/MultiSelectField";
import type { SortState } from "../../components/sort";
import { rankRoutines, type CoverageBand } from "../../domain/priority";
import type { RoutineStats } from "../../domain/routines";
import type { PriorityWeights, RoutineCode } from "../../domain/types";
import type { RoutineReview } from "../../hooks/useRoutineReview";
import {
  COVERAGE_FILTER_OPTIONS,
  ROUTINE_FILTERS,
  filterByCoverage,
  filterRoutines,
  type RoutineFilter,
} from "./routineFilters";
import { RoutineTable } from "./RoutineTable";
import styles from "./OverviewView.module.css";

interface OverviewViewProps {
  routines: RoutineStats[];
  pendingCount: number;
  weights: PriorityWeights;
  review: RoutineReview;
  filter: RoutineFilter;
  onFilterChange: (filter: RoutineFilter) => void;
  /** Pulses the selected status pill, to show where a click on the summary page landed. */
  highlightStatusFilter: boolean;
  onHighlightShown: () => void;
  coverageFilter: CoverageBand[];
  onCoverageFilterChange: (bands: CoverageBand[]) => void;
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
  highlightStatusFilter,
  onHighlightShown,
  coverageFilter,
  onCoverageFilterChange,
  sort,
  onSortChange,
  onResetSort,
  onOpenRoutine,
  onOpenReview,
  onOpenSettings,
}: OverviewViewProps) {
  useEffect(() => {
    if (!highlightStatusFilter) return;
    // Matches the length of the pulse animation (three 1 s rounds)
    const timer = setTimeout(onHighlightShown, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [highlightStatusFilter, onHighlightShown]);

  // Filtered after ranking so a routine keeps its overall rank number
  const inCoverageBand = filterByCoverage(rankRoutines(routines, weights), coverageFilter);
  const visible = filterRoutines(inCoverageBand, filter, review.statusOf);

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
        <div
          className={classNames(styles.filterPills, highlightStatusFilter && styles.highlight)}
          role="group"
          aria-label="Filtrer rutinene"
        >
          {ROUTINE_FILTERS.map((option) => (
            <FilterPill
              key={option.key}
              label={`${option.label} · ${String(filterRoutines(inCoverageBand, option.key, review.statusOf).length)}`}
              selected={filter === option.key}
              onSelect={() => {
                onFilterChange(option.key);
              }}
            />
          ))}
        </div>
        <div className={styles.coverageFilter}>
          <MultiSelectField
            label="Filter"
            selected={coverageFilter}
            options={COVERAGE_FILTER_OPTIONS}
            noneSelectedLabel="Alle"
            onChange={onCoverageFilterChange}
          />
        </div>
      </div>

      {pendingCount > 0 ? (
        <p className={styles.hiddenNote}>
          {pendingCount} {pendingCount === 1 ? "henvendelse passer" : "henvendelser passer"} ikke til noen rutine og
          venter på gjennomgang.{" "}
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
        ownerOf={review.ownerOf}
        sort={sort}
        onSortChange={onSortChange}
        onOpenRoutine={onOpenRoutine}
      />

      <p className={styles.footnote}>
        Rangeringen bygger på to ting: hvor mange henvendelser som er knyttet til rutinen, og hvor dårlig rutinen
        treffer dem. Begge sammenlignes med de andre rutinene og teller like mye. Klikk på en rutine for å se
        henvendelsene og regnestykket i klartekst.
      </p>
    </section>
  );
}
