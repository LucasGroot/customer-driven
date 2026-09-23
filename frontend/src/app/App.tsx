import { useState } from "react";
import { GapDetailView } from "../features/detail/GapDetailView";
import { ExportView } from "../features/export/ExportView";
import type { GapFilter } from "../features/overview/gapFilters";
import { OverviewView } from "../features/overview/OverviewView";
import { AnalysisSettingsView } from "../features/settings/AnalysisSettingsView";
import { TrendsView } from "../features/trends/TrendsView";
import { useAnalysisRun } from "../hooks/useAnalysisRun";
import { useAnalysisSettings } from "../hooks/useAnalysisSettings";
import { useGapReview } from "../hooks/useGapReview";
import type { KnowledgeGapId } from "../domain/types";
import { MOCK_DECISIONS, MOCK_SNAPSHOT } from "../mocks/analysisSnapshot";
import { Sidebar } from "./Sidebar";
import type { ViewName } from "./views";
import styles from "./App.module.css";

// Until the backend serves an analysis, the dashboard runs on the mock
// snapshot; connecting it means replacing this one import with a fetch.
const snapshot = MOCK_SNAPSHOT;

export function App() {
  const [view, setView] = useState<ViewName>("list");
  const [selectedGapId, setSelectedGapId] = useState<KnowledgeGapId | null>(null);
  const [filter, setFilter] = useState<GapFilter>("all");
  const settings = useAnalysisSettings();
  const review = useGapReview(MOCK_DECISIONS);
  const run = useAnalysisRun();

  const selectedGap = snapshot.gaps.find((gap) => gap.id === selectedGapId);

  const openGap = (gapId: KnowledgeGapId) => {
    setSelectedGapId(gapId);
    setView("detail");
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        currentView={view}
        gapCount={snapshot.gaps.length}
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
            thresholdPercent={settings.thresholdPercent}
            review={review}
            filter={filter}
            onFilterChange={setFilter}
            onOpenGap={openGap}
            onOpenSettings={() => {
              setView("run");
            }}
            onOpenExport={() => {
              setView("export");
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
            onBack={() => {
              setView("list");
            }}
          />
        ) : null}

        {view === "trend" ? <TrendsView snapshot={snapshot} /> : null}

        {view === "run" ? (
          <AnalysisSettingsView snapshot={snapshot} settings={settings} run={run} />
        ) : null}

        {view === "export" ? (
          <ExportView snapshot={snapshot} weights={settings.weights} review={review} />
        ) : null}
      </main>
    </div>
  );
}
