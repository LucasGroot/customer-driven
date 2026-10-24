import { useState } from "react";
import { RoutineDetailView } from "../features/detail/RoutineDetailView";
import type { RoutineFilter } from "../features/overview/routineFilters";
import { OverviewView } from "../features/overview/OverviewView";
import { ReviewView } from "../features/review/ReviewView";
import { RunAnalysisView } from "../features/run/RunAnalysisView";
import { SearchView } from "../features/search/SearchView";
import { SummaryView } from "../features/summary/SummaryView";
import { useAnalysisRun } from "../hooks/useAnalysisRun";
import { useAnalysisSettings } from "../hooks/useAnalysisSettings";
import { useRoutineReview } from "../hooks/useRoutineReview";
import { useSnapshot } from "../hooks/useSnapshot";
import { DEFAULT_HIDE_ABOVE_PERCENT, isWellCovered } from "../domain/priority";
import { countPendingQuestions, routinesWithQuestions } from "../domain/routines";
import type { AnalysisSnapshot, RoutineCode } from "../domain/types";
import { Sidebar } from "./Sidebar";
import type { ViewName } from "./views";
import styles from "./App.module.css";

export function App() {
  const state = useSnapshot();

  if (state.status === "loading") {
    return <p className={styles.status}>Henter analysen …</p>;
  }
  if (state.status === "error") {
    return (
      <p className={styles.status} role="alert">
        Kunne ikke hente analysen. Last siden på nytt, eller prøv igjen senere.
      </p>
    );
  }
  return <Dashboard snapshot={state.snapshot} />;
}

interface DashboardProps {
  snapshot: AnalysisSnapshot;
}

function Dashboard({ snapshot }: DashboardProps) {
  const [view, setView] = useState<ViewName>("list");
  // The detail page can be opened from the list or from search; back returns there.
  const [returnView, setReturnView] = useState<ViewName>("list");
  const [selectedRoutineCode, setSelectedRoutineCode] = useState<RoutineCode | null>(null);
  const [filter, setFilter] = useState<RoutineFilter>("all");
  const [hideAbovePercent, setHideAbovePercent] = useState(DEFAULT_HIDE_ABOVE_PERCENT);
  const settings = useAnalysisSettings();
  const review = useRoutineReview();
  const run = useAnalysisRun();

  const routines = routinesWithQuestions(snapshot, review.decisionOf);
  const pendingCount = countPendingQuestions(snapshot, review.decisionOf);
  const selectedRoutine = routines.find((stats) => stats.routine.code === selectedRoutineCode);
  // A routine loses its place in the list when its last question is moved away
  const shownView = view === "detail" && selectedRoutine === undefined ? returnView : view;

  const openRoutine = (routineCode: RoutineCode) => {
    setSelectedRoutineCode(routineCode);
    setReturnView(view);
    setView("detail");
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        currentView={shownView === "detail" ? returnView : shownView}
        routineCount={routines.filter((stats) => !isWellCovered(stats, hideAbovePercent)).length}
        reviewCount={pendingCount}
        lastRunLabel={run.hasFinished ? "I dag, nettopp" : snapshot.lastRunLabel}
        isExample={snapshot.isExample}
        questionCount={snapshot.questions.length}
        documentCount={snapshot.documents.length}
        onNavigate={setView}
      />

      <main className={styles.main}>
        {shownView === "list" ? (
          <OverviewView
            routines={routines}
            pendingCount={pendingCount}
            weights={settings.weights}
            review={review}
            filter={filter}
            onFilterChange={setFilter}
            hideAbovePercent={hideAbovePercent}
            onHideAboveChange={setHideAbovePercent}
            onOpenRoutine={openRoutine}
            onOpenReview={() => {
              setView("review");
            }}
            onOpenSettings={() => {
              setView("run");
            }}
          />
        ) : null}

        {shownView === "detail" && selectedRoutine !== undefined ? (
          <RoutineDetailView
            stats={selectedRoutine}
            documentOwners={snapshot.documentOwners}
            weights={settings.weights}
            review={review}
            backLabel={returnView === "search" ? "Tilbake til søket" : "Tilbake til listen"}
            onBack={() => {
              setView(returnView);
            }}
          />
        ) : null}

        {shownView === "review" ? <ReviewView snapshot={snapshot} review={review} /> : null}

        {shownView === "summary" ? (
          <SummaryView
            snapshot={snapshot}
            routines={routines}
            pendingCount={pendingCount}
            review={review}
            hideAbovePercent={hideAbovePercent}
          />
        ) : null}

        {shownView === "search" ? (
          <SearchView
            snapshot={snapshot}
            routines={routines}
            review={review}
            onOpenRoutine={openRoutine}
          />
        ) : null}

        {shownView === "run" ? <RunAnalysisView snapshot={snapshot} run={run} /> : null}
      </main>
    </div>
  );
}
