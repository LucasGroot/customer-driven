import { useState } from "react";
import { Button } from "../../components/Button";
import { FilterPill } from "../../components/FilterPill";
import { PageIntro } from "../../components/PageIntro";
import { SearchField } from "../../components/SearchField";
import { SelectField } from "../../components/SelectField";
import { nextSort, type SortState } from "../../components/sort";
import type { RoutineStats } from "../../domain/routines";
import type { AnalysisSnapshot, RoutineCode } from "../../domain/types";
import type { RoutineReview } from "../../hooks/useRoutineReview";
import { DocumentTable } from "./DocumentTable";
import { QuestionTable } from "./QuestionTable";
import {
  PLACEMENT_FILTERS,
  SORT_OPTIONS,
  searchDocuments,
  searchQuestions,
  type PlacementFilter,
  type SearchTab,
  type SortOrder,
} from "./searchResults";
import styles from "./SearchView.module.css";

interface SearchViewProps {
  snapshot: AnalysisSnapshot;
  routines: RoutineStats[];
  review: RoutineReview;
  onOpenRoutine: (routineCode: RoutineCode) => void;
}

// PLACEMENT_FILTERS uses { key, label }, but SelectField expects { value, label }.
const FILTER_OPTIONS = PLACEMENT_FILTERS.map((option) => ({
  value: option.key,
  label: option.label,
}));

export function SearchView({ snapshot, routines, review, onOpenRoutine }: SearchViewProps) {
  // Which list is shown: routines by default, or the questions.
  const [tab, setTab] = useState<SearchTab>("documents");
  const [query, setQuery] = useState("");
  // Placement filter (Alle / Knyttet til rutine / ...), only used on the questions tab.
  const [filter, setFilter] = useState<PlacementFilter>("all");
  // The "Sorter" dropdown: the base order of the list.
  const [sort, setSort] = useState<SortOrder>("coverage-asc");
  // A click on a column header. Applied on top of the dropdown order; null = no column sort.
  const [columnSort, setColumnSort] = useState<SortState | null>(null);

  const { questions, documents } = snapshot;
  const questionResults = searchQuestions(questions, documents, {
    query,
    filter,
    sort,
    decisionOf: review.decisionOf,
  });
  const documentResults = searchDocuments(documents, routines, { query, sort });

  const tabs: { key: SearchTab; label: string }[] = [
    { key: "documents", label: `Rutiner · ${String(documents.length)}` },
    { key: "questions", label: `Henvendelser · ${String(questions.length)}` },
  ];

  const handleColumnSort = (sortKey: string) => {
    setColumnSort((current) => nextSort(current, sortKey));
  };

  return (
    <section className={styles.view}>
      <PageIntro
        title="Søk og treff"
        lead="Se alle henvendelser og alle rutiner med tilhørende treff, også rutinene som svarer godt og derfor er skjult i den prioriterte listen. Bruk siden til å kontrollere hvor en henvendelse har havnet."
      />

      {/* Row 1: the two tabs */}
      <div className={styles.pills}>
        {tabs.map((option) => (
          <FilterPill
            key={option.key}
            label={option.label}
            selected={tab === option.key}
            onSelect={() => {
              setTab(option.key);
              // The columns differ between the two tables, so the column sort starts over.
              setColumnSort(null);
            }}
          />
        ))}
      </div>

      {/* Row 2: the search field on the left, the filter and sort dropdowns on the right */}
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <SearchField
            label={tab === "questions" ? "Søk i henvendelser" : "Søk i rutiner"}
            placeholder={
              tab === "questions"
                ? "Søk i henvendelser, kategorier og rutiner"
                : "Søk på rutinenavn"
            }
            value={query}
            onChange={setQuery}
          />
        </div>
        <div className={styles.selects}>
          {tab === "questions" ? (
            <SelectField
              label="Filter"
              value={filter}
              options={FILTER_OPTIONS}
              onChange={setFilter}
            />
          ) : null}
          <SelectField
            label="Sorter"
            value={sort}
            options={SORT_OPTIONS}
            onChange={(value) => {
              setSort(value);
              // Picking an order in the dropdown cancels the column sort.
              setColumnSort(null);
            }}
          />
        </div>
      </div>

      <p className={styles.note} aria-live="polite">
        {tab === "questions"
          ? `Viser ${String(questionResults.length)} av ${String(questions.length)} ${snapshot.isExample ? "eksempelhenvendelser. I den ekte løsningen vises alle henvendelser fra ServiceNow." : "henvendelser."}`
          : `Viser ${String(documentResults.length)} av ${String(documents.length)} ${snapshot.isExample ? "eksempelrutiner. I den ekte løsningen vises alle rutiner fra Kvaliteket." : "rutiner."}`}
      </p>

      {columnSort !== null ? (
        <p className={styles.note}>
          Sortert etter kolonne.{" "}
          <Button
            variant="link"
            onClick={() => {
              setColumnSort(null);
            }}
          >
            Nullstill sortering
          </Button>
        </p>
      ) : null}

      {tab === "questions" ? (
        <QuestionTable
          results={questionResults}
          sort={columnSort}
          onSortChange={handleColumnSort}
          onOpenRoutine={onOpenRoutine}
          onRestore={review.undoDecision}
        />
      ) : (
        <DocumentTable
          results={documentResults}
          sort={columnSort}
          onSortChange={handleColumnSort}
          onOpenRoutine={onOpenRoutine}
          statusOf={review.statusOf}
          ownerOf={review.ownerOf}
        />
      )}
    </section>
  );
}