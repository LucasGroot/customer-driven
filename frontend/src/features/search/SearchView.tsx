import { useState } from "react";
import { FilterPill } from "../../components/FilterPill";
import { PageIntro } from "../../components/PageIntro";
import { SearchField } from "../../components/SearchField";
import { SelectField } from "../../components/SelectField";
import { listedGapIds } from "../../domain/priority";
import type { AnalysisSnapshot, KnowledgeGapId } from "../../domain/types";
import { DocumentTable } from "./DocumentTable";
import { QuestionTable } from "./QuestionTable";
import {
  SORT_OPTIONS,
  VISIBILITY_FILTERS,
  searchDocuments,
  searchQuestions,
  type ListVisibility,
  type SearchTab,
  type SortOrder,
} from "./searchResults";
import styles from "./SearchView.module.css";

interface SearchViewProps {
  snapshot: AnalysisSnapshot;
  hideAbovePercent: number;
  onOpenGap: (gapId: KnowledgeGapId) => void;
}

export function SearchView({ snapshot, hideAbovePercent, onOpenGap }: SearchViewProps) {
  const [tab, setTab] = useState<SearchTab>("questions");
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<ListVisibility>("all");
  const [sort, setSort] = useState<SortOrder>("coverage-asc");

  const { questions, documents } = snapshot;
  const questionResults = searchQuestions(questions, documents, {
    query,
    visibility,
    sort,
    listed: listedGapIds(snapshot.gaps, hideAbovePercent),
  });
  const documentResults = searchDocuments(documents, questions, { query, sort });

  const tabs: { key: SearchTab; label: string }[] = [
    { key: "questions", label: `Spørsmål · ${String(questions.length)}` },
    { key: "documents", label: `Dokumenter · ${String(documents.length)}` },
  ];

  return (
    <section className={styles.view}>
      <PageIntro
        title="Søk og treff"
        lead="Se alle spørsmål og alle rutiner med tilhørende treff, også de som er godt dekket og derfor ikke vises i den prioriterte listen. Bruk siden til å kontrollere hvorfor noe er med eller ikke."
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
                ? "Søk i spørsmål, temaer og dokumenter"
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
            ? VISIBILITY_FILTERS.map((option) => (
                <FilterPill
                  key={option.key}
                  label={option.label}
                  selected={visibility === option.key}
                  onSelect={() => {
                    setVisibility(option.key);
                  }}
                />
              ))
            : null}
        </div>
        <SelectField label="Sorter" value={sort} options={SORT_OPTIONS} onChange={setSort} />
      </div>

      <p className={styles.note} aria-live="polite">
        {tab === "questions"
          ? `Viser ${String(questionResults.length)} av ${String(questions.length)} eksempelspørsmål. I den ekte løsningen vises alle henvendelser fra ServiceNow.`
          : `Viser ${String(documentResults.length)} av ${String(documents.length)} eksempeldokumenter. I den ekte løsningen vises alle rutiner fra Kvaliteket.`}
      </p>

      {tab === "questions" ? (
        <QuestionTable
          results={questionResults}
          hideAbovePercent={hideAbovePercent}
          onOpenGap={onOpenGap}
        />
      ) : (
        <DocumentTable results={documentResults} />
      )}
    </section>
  );
}
