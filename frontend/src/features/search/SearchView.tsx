import { useState } from "react";
import { FilterPill } from "../../components/FilterPill";
import { PageIntro } from "../../components/PageIntro";
import { SearchField } from "../../components/SearchField";
import { SelectField } from "../../components/SelectField";
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

export function SearchView({ snapshot, routines, review, onOpenRoutine }: SearchViewProps) {
  const [tab, setTab] = useState<SearchTab>("questions");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PlacementFilter>("all");
  const [sort, setSort] = useState<SortOrder>("coverage-asc");

  const { questions, documents } = snapshot;
  const questionResults = searchQuestions(questions, documents, {
    query,
    filter,
    sort,
    decisionOf: review.decisionOf,
  });
  const documentResults = searchDocuments(documents, routines, { query, sort });

  const tabs: { key: SearchTab; label: string }[] = [
    { key: "questions", label: `Spørsmål · ${String(questions.length)}` },
    { key: "documents", label: `Dokumenter · ${String(documents.length)}` },
  ];

  return (
    <section className={styles.view}>
      <PageIntro
        title="Søk og treff"
        lead="Se alle spørsmål og alle rutiner med tilhørende treff, også rutinene som svarer godt og derfor er skjult i den prioriterte listen. Bruk siden til å kontrollere hvor et spørsmål har havnet."
      />

      <div className={styles.toolbar}>
        <div className={styles.pills}>
          {tabs.map((option) => (
            <FilterPill
              key={option.key}
              label={option.label}
              selected={tab === option.key}
              onSelect={() => {
                setTab(option.key);
              }}
            />
          ))}
        </div>
        <div className={styles.search}>
          <SearchField
            label={tab === "questions" ? "Søk i spørsmål" : "Søk i dokumenter"}
            placeholder={
              tab === "questions"
                ? "Søk i spørsmål, kategorier og dokumenter"
                : "Søk på dokumentnavn eller nummer"
            }
            value={query}
            onChange={setQuery}
          />
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.pills}>
          {tab === "questions"
            ? PLACEMENT_FILTERS.map((option) => (
                <FilterPill
                  key={option.key}
                  label={option.label}
                  selected={filter === option.key}
                  onSelect={() => {
                    setFilter(option.key);
                  }}
                />
              ))
            : null}
        </div>
        <SelectField label="Sorter" value={sort} options={SORT_OPTIONS} onChange={setSort} />
      </div>

      <p className={styles.note} aria-live="polite">
        {tab === "questions"
          ? `Viser ${String(questionResults.length)} av ${String(questions.length)} ${snapshot.isExample ? "eksempelspørsmål. I den ekte løsningen vises alle henvendelser fra ServiceNow." : "spørsmål."}`
          : `Viser ${String(documentResults.length)} av ${String(documents.length)} ${snapshot.isExample ? "eksempeldokumenter. I den ekte løsningen vises alle rutiner fra Kvaliteket." : "dokumenter."}`}
      </p>

      {tab === "questions" ? (
        <QuestionTable results={questionResults} onOpenRoutine={onOpenRoutine} />
      ) : (
        <DocumentTable results={documentResults} />
      )}
    </section>
  );
}
