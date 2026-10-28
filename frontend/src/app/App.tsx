import { useEffect, useState } from "react";
import { RoutineDetailView } from "../features/detail/RoutineDetailView";
import type { RoutineFilter } from "../features/overview/routineFilters";
import type { CurrentUser } from "../auth/currentUser";
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

interface AppProps {
  user: CurrentUser;
  accessToken: string;
  onSignOut: () => void;
}

export function App({ user, accessToken, onSignOut }: AppProps) {
  const state = useSnapshot(accessToken);

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
  return <Dashboard snapshot={state.snapshot} user={user} onSignOut={onSignOut} />;
}

interface Location {
  view: ViewName;
  returnView: ViewName;
  routineCode: RoutineCode | null;
}

interface DashboardProps {
  snapshot: AnalysisSnapshot;
  user: CurrentUser;
  onSignOut: () => void;
}

function Dashboard({ snapshot, user, onSignOut }: DashboardProps) {
  const [view, setView] = useState<ViewName>("list");
  // The detail page can be opened from the list or from search; back returns there.
  const [returnView, setReturnView] = useState<ViewName>("list");
  const [selectedRoutineCode, setSelectedRoutineCode] = useState<RoutineCode | null>(null);
  const [filter, setFilter] = useState<RoutineFilter>("all");
  const [hideAbovePercent, setHideAbovePercent] = useState(DEFAULT_HIDE_ABOVE_PERCENT);
  const settings = useAnalysisSettings();
  const review = useRoutineReview();
  const run = useAnalysisRun();

  const applyLocation = (location: Location) => {
    setView(location.view);
    setReturnView(location.returnView);
    setSelectedRoutineCode(location.routineCode);
  };

  const go = (next: Partial<Location>) => {
    const target: Location = {
        view,
        returnView,
        routineCode: selectedRoutineCode,
        ...next,
      };
      window.history.pushState(target, "");
      applyLocation(target);
    };

  useEffect(() => {
    // L'entrée actuelle (la vue de départ) devient la première "page" de l'app
    window.history.replaceState({ view: "list", returnView: "list", routineCode: null }, "");
  
    const onPopState = (event: PopStateEvent) => {
      const location = event.state as Location | null;
      if (location?.view !== undefined) applyLocation(location);
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const routines = routinesWithQuestions(snapshot, review.decisionOf);
  const pendingCount = countPendingQuestions(snapshot, review.decisionOf);
  const selectedRoutine = routines.find((stats) => stats.routine.code === selectedRoutineCode);
  // A routine loses its place in the list when its last question is moved away
  const shownView = view === "detail" && selectedRoutine === undefined ? returnView : view;

  const openRoutine = (routineCode: RoutineCode) => {
    go({ view: "detail", returnView: view, routineCode });
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
        ticketCount={snapshot.totalTickets}
        user={user}
        onNavigate={(next) => { go({ view: next }); }}
        onSignOut={onSignOut}
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
            onOpenReview={() => { go({ view: "review" }); }}
            onOpenSettings={() => { go({ view: "run" }); }}
          />
        ) : null}

        {shownView === "detail" && selectedRoutine !== undefined ? (
          <RoutineDetailView
            stats={selectedRoutine}
            documentOwners={snapshot.documentOwners}
            weights={settings.weights}
            review={review}
            backLabel={returnView === "search" ? "Tilbake til søket" : "Tilbake til listen"}
            onBack={() => { window.history.back(); }}
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