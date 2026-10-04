import { useState } from "react";
import { GapDetailView } from "../features/detail/GapDetailView";
import type { GapFilter } from "../features/overview/gapFilters";
import { OverviewView } from "../features/overview/OverviewView";
import { RunAnalysisView } from "../features/run/RunAnalysisView";
import { SearchView } from "../features/search/SearchView";
import { SummaryView } from "../features/summary/SummaryView";
import { useAnalysisRun } from "../hooks/useAnalysisRun";
import { useAnalysisSettings } from "../hooks/useAnalysisSettings";
import { useGapReview } from "../hooks/useGapReview";
import { DEFAULT_HIDE_ABOVE_PERCENT, listedGapIds } from "../domain/priority";
import type { KnowledgeGapId } from "../domain/types";
import { MOCK_SNAPSHOT, MOCK_STATUSES } from "../mocks/analysisSnapshot";
import { Sidebar } from "./Sidebar";
import type { ViewName } from "./views";
import styles from "./App.module.css";

// Until the backend serves an analysis, the dashboard runs on the mock
// snapshot; connecting it means replacing this one import with a fetch.
const snapshot = MOCK_SNAPSHOT;

export function App() {
  const [view, setView] = useState<ViewName>("list");
  // The detail page can be opened from the list or from search; back returns there.
  const [returnView, setReturnView] = useState<ViewName>("list");
  const [selectedGapId, setSelectedGapId] = useState<KnowledgeGapId | null>(null);
  const [filter, setFilter] = useState<GapFilter>("all");
  const [hideAbovePercent, setHideAbovePercent] = useState(DEFAULT_HIDE_ABOVE_PERCENT);
  const settings = useAnalysisSettings();
  const review = useGapReview(MOCK_STATUSES);
  const run = useAnalysisRun();

  const selectedGap = snapshot.gaps.find((gap) => gap.id === selectedGapId);

  const openGap = (gapId: KnowledgeGapId) => {
    setSelectedGapId(gapId);
    setReturnView(view);
    setView("detail");
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        currentView={view === "detail" ? returnView : view}
        gapCount={listedGapIds(snapshot.gaps, hideAbovePercent).size}
        lastRunLabel={run.hasFinished ? "I dag, nettopp" : snapshot.lastRunLabel}
        ticketCount={snapshot.totalTickets}
        routineCount={snapshot.totalRoutines}
        onNavigate={setView}
      />

      <main className={styles.main}>
        {view === "list" ? (
          <OverviewView
            snapshot={snapshot}
            weights={settings.weights}
            review={review}
            filter={filter}
            onFilterChange={setFilter}
            hideAbovePercent={hideAbovePercent}
            onHideAboveChange={setHideAbovePercent}
            onOpenGap={openGap}
            onOpenSettings={() => {
              setView("run");
            }}
          />
        ) : null}

        {view === "detail" && selectedGap !== undefined ? (
          <GapDetailView
            gap={selectedGap}
            snapshot={snapshot}
            weights={settings.weights}
            thresholdPercent={settings.thresholdPercent}
            review={review}
            backLabel={returnView === "search" ? "Tilbake til søket" : "Tilbake til listen"}
            onBack={() => {
              setView(returnView);
            }}
          />
        ) : null}

        {view === "summary" ? (
          <SummaryView snapshot={snapshot} review={review} hideAbovePercent={hideAbovePercent} />
        ) : null}

        {view === "search" ? (
          <SearchView snapshot={snapshot} hideAbovePercent={hideAbovePercent} onOpenGap={openGap} />
        ) : null}

        {view === "run" ? (
          <RunAnalysisView snapshot={snapshot} run={run} />
        ) : null}
      </main>
    </div>
  );
}
