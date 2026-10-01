
import { lazy, Suspense, useEffect, useState } from 'react';
import {
  fetchVeyronixEvents,
  fetchVeyronixEventById,
  predictVeyronixEvent,
  checkVeyronixHealth,
} from './services/veyronixApi';

import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { ApiConfigModal } from './components/ApiConfigModal';

const LoginPage = lazy(() =>
  import('./components/pages/LoginPage').then(m => ({
    default: m.LoginPage,
  }))
);

const DashboardPage = lazy(() =>
  import('./components/pages/DashboardPage').then(m => ({
    default: m.DashboardPage,
  }))
);

const LiveMonitorPage = lazy(() =>
  import('./components/pages/LiveMonitorPage').then(m => ({
    default: m.LiveMonitorPage,
  }))
);

const ThermalEventsPage = lazy(() =>
  import('./components/pages/ThermalEventsPage').then(m => ({
    default: m.ThermalEventsPage,
  }))
);

const EventAnalysisPage = lazy(() =>
  import('./components/pages/EventAnalysisPage').then(m => ({
    default: m.EventAnalysisPage,
  }))
);

const InvestigationPage = lazy(() =>
  import('./components/pages/InvestigationPage').then(m => ({
    default: m.InvestigationPage,
  }))
);

const AnalyticsPage = lazy(() =>
  import('./components/pages/AnalyticsPage').then(m => ({
    default: m.AnalyticsPage,
  }))
);

const SystemArchitecturePage = lazy(() =>
  import('./components/pages/SystemArchitecturePage').then(m => ({
    default: m.SystemArchitecturePage,
  }))
);

import {
  INITIAL_INVESTIGATION_CASES,
} from './data/demoEvents';

import type {
  ThermalEvent,
  InvestigationCase,
  AppPage,
} from './types';

const API_FETCH_LIMIT = 500;
const DASHBOARD_EVENT_COUNT = 100;

/* =========================================================
   STABLE EVENT HASH
   ========================================================= */

function stableEventHash(
  eventId: string | number,
): number {
  const value = String(eventId);

  let hash = 2166136261;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^= value.charCodeAt(index);

    hash = Math.imul(
      hash,
      16777619,
    );
  }

  return hash >>> 0;
}

/* =========================================================
   BACKEND PRIORITY NORMALIZATION
   ========================================================= */

/**
 * IMPORTANT:
 *
 * Event severity must come from backend priority.
 *
 * ML confidence is SOURCE ATTRIBUTION confidence.
 * It must never be used as event severity.
 */

type NormalizedPriority =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

function getBackendPriority(
  event: ThermalEvent,
): NormalizedPriority {
  const rawPriority =
    String(
      (event as any).priority ??
        (event as any).investigationPriority ??
        '',
    )
      .trim()
      .toUpperCase();

  if (
    rawPriority === 'CRITICAL'
  ) {
    return 'CRITICAL';
  }

  if (
    rawPriority === 'HIGH' ||
    rawPriority === 'HIGH PRIORITY'
  ) {
    return 'HIGH';
  }

  if (
    rawPriority === 'MEDIUM'
  ) {
    return 'MEDIUM';
  }

  if (
    rawPriority === 'LOW' ||
    rawPriority === 'CONTROLLED' ||
    rawPriority === 'LOW / CONTROLLED'
  ) {
    return 'LOW';
  }

  /*
   * Fallback to backend priority score.
   *
   * This is still backend-derived severity,
   * NOT ML confidence.
   */

  const score = Number(
    (event as any).priorityScore ??
      (event as any).priority_score,
  );

  if (Number.isFinite(score)) {
    if (score >= 85) {
      return 'CRITICAL';
    }

    if (score >= 70) {
      return 'HIGH';
    }

    if (score >= 50) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  return 'LOW';
}

/* =========================================================
   REPRESENTATIVE EVENT SELECTION
   ========================================================= */

/**
 * Select representative events from the API response.
 *
 * This function ONLY chooses which events are displayed.
 *
 * It NEVER changes:
 * - priority
 * - priorityScore
 * - investigationPriority
 * - confidence
 * - source probabilities
 */

function selectRepresentativeEvents(
  sourceEvents: ThermalEvent[],
  targetCount = DASHBOARD_EVENT_COUNT,
): ThermalEvent[] {
  if (
    sourceEvents.length <=
    targetCount
  ) {
    return [
      ...sourceEvents,
    ].sort(
      (a, b) =>
        stableEventHash(a.id) -
        stableEventHash(b.id),
    );
  }

  const groups =
    new Map<
      string,
      ThermalEvent[]
    >();

  for (
    const event of sourceEvents
  ) {
    const source =
      String(
        event.likelySource ??
          'Uncertain',
      ).trim() ||
      'Uncertain';

    const group =
      groups.get(source) ??
      [];

    group.push(event);

    groups.set(
      source,
      group,
    );
  }

  const groupEntries =
    Array.from(
      groups.entries(),
    ).map(
      ([source, group]) => ({
        source,

        events: [
          ...group,
        ].sort(
          (a, b) =>
            stableEventHash(
              a.id,
            ) -
            stableEventHash(
              b.id,
            ),
        ),

        count:
          group.length,
      }),
    );

  const total =
    sourceEvents.length;

  const allocations =
    groupEntries.map(
      (entry) => {
        const exact =
          (entry.count /
            total) *
          targetCount;

        const take =
          Math.floor(
            exact,
          );

        return {
          ...entry,
          exact,
          take,
          remainder:
            exact - take,
        };
      },
    );

  let allocated =
    allocations.reduce(
      (
        sum,
        entry,
      ) =>
        sum +
        entry.take,
      0,
    );

  while (
    allocated <
    targetCount
  ) {
    const candidates =
      allocations
        .filter(
          (entry) =>
            entry.take <
            entry.count,
        )
        .sort(
          (a, b) =>
            b.remainder -
              a.remainder ||
            b.count -
              a.count ||
            a.source.localeCompare(
              b.source,
            ),
        );

    if (
      candidates.length ===
      0
    ) {
      break;
    }

    candidates[0].take += 1;

    allocated += 1;

    candidates[0].remainder = 0;
  }

  const selected: ThermalEvent[] =
    [];

  for (
    const allocation of
      allocations
  ) {
    selected.push(
      ...allocation.events.slice(
        0,
        allocation.take,
      ),
    );
  }

  return selected.sort(
    (a, b) =>
      stableEventHash(a.id) -
      stableEventHash(b.id),
  );
}

/* =========================================================
   ML RESPONSE
   ========================================================= */

interface MLPredictionResponse {
  status?: string;

  event_id?:
    | number
    | string;

  predicted_source?: string;

  confidence?: number;

  probabilities?: {
    Agriculture_Biomass?: number;
    Forest_Natural?: number;
    Industrial?: number;
    Waste_Other?: number;

    agricultural?: number;
    vegetation?: number;
    industrial?: number;
    other?: number;
  };

  model_available?: boolean;
}

/* =========================================================
   SAFE NUMBER
   ========================================================= */

function safeNumber(
  value: unknown,
  fallback = 0,
): number {
  const number =
    Number(value);

  return Number.isFinite(
    number,
  )
    ? number
    : fallback;
}

/* =========================================================
   APPLY ML PREDICTION
   ========================================================= */

/**
 * IMPORTANT ARCHITECTURE
 *
 * Backend:
 *   priority / priorityScore
 *       =
 *   EVENT SEVERITY
 *
 * LightGBM:
 *   predicted_source
 *   confidence
 *   probabilities
 *       =
 *   SOURCE ATTRIBUTION
 *
 * Therefore ML prediction NEVER changes event severity.
 */

function applyMLPrediction(
  event: ThermalEvent,
  prediction: MLPredictionResponse,
): ThermalEvent {
  const predictedSource =
    typeof prediction.predicted_source ===
      'string' &&
    prediction.predicted_source.trim()
      ? prediction.predicted_source.trim()
      : 'Uncertain';

  const confidence =
    Math.max(
      0,
      Math.min(
        1,
        safeNumber(
          prediction.confidence,
          0,
        ),
      ),
    );

  const probabilities =
    prediction.probabilities ??
    {};

  const industrial =
    safeNumber(
      probabilities.Industrial ??
        probabilities.industrial,
      0,
    );

  const agricultural =
    safeNumber(
      probabilities.Agriculture_Biomass ??
        probabilities.agricultural,
      0,
    );

  const vegetation =
    safeNumber(
      probabilities.Forest_Natural ??
        probabilities.vegetation,
      0,
    );

  const other =
    safeNumber(
      probabilities.Waste_Other ??
        probabilities.other,
      0,
    );

  /*
   * DO NOT calculate severity here.
   */

  const backendPriority =
    getBackendPriority(event);

  return {
    ...event,

    /*
     * =====================================================
     * LIVE LIGHTGBM ATTRIBUTION
     * =====================================================
     */

    likelySource:
      predictedSource,

    confidence,

    sourceProbabilities: {
      industrial,
      agricultural,
      vegetation,
      other,
    },

    insufficientEvidence:
      predictedSource ===
      'Uncertain',

    message:
      predictedSource ===
      'Uncertain'
        ? 'Evidence insufficient for reliable attribution.'
        : `VEYRONIX LightGBM predicts ${predictedSource}.`,

    /*
     * =====================================================
     * BACKEND SEVERITY — PRESERVED
     * =====================================================
     *
     * Explicitly preserve the original backend values.
     */

    priorityScore:
      event.priorityScore,

    investigationPriority:
      event.investigationPriority,

    /*
     * If the event did not contain a readable
     * investigation priority, use the normalized
     * backend priority only as fallback.
     */

    ...(event.investigationPriority
      ? {}
      : {
          investigationPriority:
            backendPriority,
        }),
  };
}

/* =========================================================
   RUN LIVE ML
   ========================================================= */

async function enrichEventWithML(
  event: ThermalEvent,
): Promise<ThermalEvent> {
  const prediction =
    (await predictVeyronixEvent(
      event.id,
    )) as MLPredictionResponse;

  return applyMLPrediction(
    event,
    prediction,
  );
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [
    currentPage,
    setCurrentPage,
  ] =
    useState<AppPage>(
      'dashboard',
    );

  /*
   * =======================================================
   * ALL EVENTS
   * =======================================================
   *
   * IMPORTANT:
   *
   * This is the backend event collection.
   *
   * It is NOT modified when an existing hotspot
   * is clicked for ML analysis.
   */

  const [
    events,
    setEvents,
  ] =
    useState<ThermalEvent[]>(
      [],
    );

  /*
   * =======================================================
   * SELECTED EVENT
   * =======================================================
   *
   * Completely separate from `events`.
   *
   * Live ML updates ONLY this object.
   */

  const [
    selectedEvent,
    setSelectedEvent,
  ] =
    useState<ThermalEvent | null>(
      null,
    );

  const [
    cases,
    setCases,
  ] =
    useState<InvestigationCase[]>(
      INITIAL_INVESTIGATION_CASES ??
        [],
    );

  const [
    selectedCaseId,
    setSelectedCaseId,
  ] =
    useState<string | null>(
      INITIAL_INVESTIGATION_CASES?.[0]
        ?.caseId ??
        null,
    );

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState('');

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] =
    useState(false);

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] =
    useState(false);

  const [
    apiModalOpen,
    setApiModalOpen,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    eventRequiredModalOpen,
    setEventRequiredModalOpen,
  ] =
    useState(false);

  const [
    requestedProtectedPage,
    setRequestedProtectedPage,
  ] =
    useState<
      'live-monitor' | 'analysis' | null
    >(null);

  const [
    backendOnline,
    setBackendOnline,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  /* =======================================================
     INITIAL DATA LOAD
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadInitialEvents =
      async () => {
        try {
          setLoading(true);

          setError(null);

          const fetchedEvents =
            await fetchVeyronixEvents(
              API_FETCH_LIMIT,
            );

          if (cancelled) {
            return;
          }

          /*
           * Select representative events.
           *
           * IMPORTANT:
           * No priority changes happen here.
           */

          const representativeEvents =
            selectRepresentativeEvents(
              fetchedEvents,
              DASHBOARD_EVENT_COUNT,
            );

          /*
           * Store backend events exactly as received.
           */

          setEvents(
            representativeEvents,
          );

          setBackendOnline(
            true,
          );

          /*
           * No hotspot selected initially.
           */

          setSelectedEvent(
            null,
          );

          /*
           * Health check is informational.
           */

          try {
            const health =
              await checkVeyronixHealth();

            if (
              !cancelled &&
              health
            ) {
              setBackendOnline(
                true,
              );
            }
          } catch {
            /*
             * Events endpoint already worked.
             */
          }
        } catch (err) {
          if (cancelled) {
            return;
          }

          console.error(
            'Failed to load VEYRONIX data:',
            err,
          );

          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load VEYRONIX data.',
          );

          setBackendOnline(
            false,
          );
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadInitialEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const handleNavigate =
    (page: AppPage) => {
      /*
       * Live Monitor and Analysis require
       * a selected event.
       */

      if (
        (
          page ===
            'live-monitor' ||
          page ===
            'analysis'
        ) &&
        !selectedEvent
      ) {
        setRequestedProtectedPage(
          page,
        );

        setEventRequiredModalOpen(
          true,
        );

        setMobileSidebarOpen(
          false,
        );

        return;
      }

      setCurrentPage(
        page,
      );

      setMobileSidebarOpen(
        false,
      );

      /*
       * Dashboard clears selection only.
       *
       * It does NOT modify event data.
       */

      if (
        page ===
        'dashboard'
      ) {
        setSelectedEvent(
          null,
        );
      }

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    };

  /* =======================================================
     CLOSE EVENT MODAL
     ======================================================= */

  const handleCloseEventRequiredModal =
    () => {
      setEventRequiredModalOpen(
        false,
      );

      setRequestedProtectedPage(
        null,
      );
    };

  /* =======================================================
     RETURN TO DASHBOARD
     ======================================================= */

  const handleReturnToDashboard =
    () => {
      setEventRequiredModalOpen(
        false,
      );

      setRequestedProtectedPage(
        null,
      );

      setSelectedEvent(
        null,
      );

      setCurrentPage(
        'dashboard',
      );

      setMobileSidebarOpen(
        false,
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    };

  /* =======================================================
     LOGIN
     ======================================================= */

  const handleLogin = () => {
    setCurrentPage(
      'dashboard',
    );

    setMobileSidebarOpen(
      false,
    );
  };

  /* =======================================================
     LOGOUT
     ======================================================= */

  const handleLogout = () => {
    setCurrentPage(
      'login',
    );

    setMobileSidebarOpen(
      false,
    );

    /*
     * Selection is cleared on logout.
     */

    setSelectedEvent(
      null,
    );
  };

  /* =======================================================
     SELECT EVENT
     ======================================================= */

  const handleSelectEvent =
    async (
      event: ThermalEvent,
    ) => {
      /*
       * ===================================================
       * STEP 1
       * ===================================================
       *
       * Immediately show clicked hotspot.
       *
       * The original event object is not changed.
       */

      setSelectedEvent(
        event,
      );

      setError(null);

      try {
        /*
         * =================================================
         * STEP 2
         * =================================================
         *
         * Run LightGBM ONLY for clicked event.
         */

        const updatedEvent =
          await enrichEventWithML(
            event,
          );

        /*
         * =================================================
         * STEP 3
         * =================================================
         *
         * Update ONLY selectedEvent.
         *
         * NEVER update `events` for an existing event.
         */

        setSelectedEvent(
          updatedEvent,
        );
      } catch (err) {
        console.error(
          'VEYRONIX ML prediction failed:',
          err,
        );

        /*
         * Keep clicked event visible.
         */

        setSelectedEvent(
          event,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'VEYRONIX ML prediction failed.',
        );
      }
    };

  /* =======================================================
     FETCH EVENT BY ID
     ======================================================= */

  const handleFetchEventById =
    async (
      eventId: string,
    ): Promise<ThermalEvent> => {
      const cleanEventId =
        String(
          eventId,
        ).trim();

      if (!cleanEventId) {
        throw new Error(
          'Event ID is required.',
        );
      }

      setError(null);

      /*
       * ===================================================
       * EVENT ALREADY IN CURRENT COLLECTION
       * ===================================================
       */

      const existingEvent =
        events.find(
          event =>
            String(
              event.id,
            ) ===
            cleanEventId,
        );

      if (existingEvent) {
        /*
         * Run ML only for selected event.
         */

        const updatedEvent =
          await enrichEventWithML(
            existingEvent,
          );

        /*
         * IMPORTANT:
         *
         * DO NOT modify events.
         *
         * Backend severity remains untouched.
         */

        setSelectedEvent(
          updatedEvent,
        );

        return updatedEvent;
      }

      /*
       * ===================================================
       * EVENT OUTSIDE CURRENT COLLECTION
       * ===================================================
       */

      const fetchedEvent =
        await fetchVeyronixEventById(
          cleanEventId,
        );

      /*
       * Run LightGBM.
       */

      const updatedEvent =
        await enrichEventWithML(
          fetchedEvent,
        );

      /*
       * This event genuinely did not exist
       * in current collection.
       *
       * Therefore adding it is valid.
       */

      setEvents(
        previousEvents => {
          const alreadyExists =
            previousEvents.some(
              previousEvent =>
                String(
                  previousEvent.id,
                ) ===
                String(
                  updatedEvent.id,
                ),
            );

          if (
            alreadyExists
          ) {
            return previousEvents;
          }

          return [
            updatedEvent,
            ...previousEvents,
          ];
        },
      );

      setSelectedEvent(
        updatedEvent,
      );

      return updatedEvent;
    };

  /* =======================================================
     VIEW EVENT DETAILS
     ======================================================= */

  const handleViewEventDetails =
    async (
      event: ThermalEvent,
    ) => {
      await handleSelectEvent(
        event,
      );

      setCurrentPage(
        'analysis',
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    };

  /* =======================================================
     INVESTIGATION
     ======================================================= */

  const handleCreateInvestigation =
    (
      event: ThermalEvent,
    ) => {
      const existingCase =
        cases.find(
          currentCase =>
            String(
              currentCase.eventId,
            ) ===
            String(
              event.id,
            ),
        );

      if (existingCase) {
        setSelectedCaseId(
          existingCase.caseId,
        );
      } else {
        const cleanId =
          String(
            event.id,
          ).replace(
            /^EVT-/i,
            '',
          );

        const newCaseId =
          `INV-2026-${cleanId}`;

        const newCase:
          InvestigationCase = {
          caseId:
            newCaseId,

          eventId:
            event.id,

          eventName:
            event.name,

          location:
            `${event.region}, ${event.state}`,

          state:
            event.state,

          priority:
            event.investigationPriority,

          score:
            event.priorityScore,

          status:
            'QUEUED',

          assignedOfficer:
            'Officer / Zonal Triage Command',

          createdAt:
            '15 Sep 2026, Just Now',

          evidence:
            event.evidence,

          notes: [
            {
              id: `note-${Date.now()}`,

              author:
                'AI Triage Engine',

              timestamp:
                'Just now',

              text:
                `Automated case docket opened for ${event.id} with ${event.investigationPriority} priority triage (score ${event.priorityScore}/100).`,
            },
          ],
        };

        setCases(
          previousCases => [
            newCase,
            ...previousCases,
          ],
        );

        setSelectedCaseId(
          newCaseId,
        );
      }

      setCurrentPage(
        'investigation',
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    };

  /* =======================================================
     UPDATE INVESTIGATION STATUS
     ======================================================= */

  const handleUpdateCaseStatus =
    (
      caseId: string,
      newStatus: InvestigationCase['status'],
    ) => {
      setCases(
        previousCases =>
          previousCases.map(
            currentCase =>
              currentCase.caseId ===
              caseId
                ? {
                    ...currentCase,
                    status:
                      newStatus,
                  }
                : currentCase,
          ),
      );
    };

  /* =======================================================
     ADD INVESTIGATION NOTE
     ======================================================= */

  const handleAddCaseNote =
    (
      caseId: string,
      noteText: string,
    ) => {
      setCases(
        previousCases =>
          previousCases.map(
            currentCase => {
              if (
                currentCase.caseId !==
                caseId
              ) {
                return currentCase;
              }

              return {
                ...currentCase,

                notes: [
                  ...currentCase.notes,

                  {
                    id: `note-${Date.now()}`,

                    author:
                      'Officer Sen (Hazmat Command)',

                    timestamp:
                      'Just now',

                    text:
                      noteText,
                  },
                ],
              };
            },
          ),
      );
    };

  /* =======================================================
     GLOBAL SEARCH
     ======================================================= */

  const filteredEvents =
    searchQuery.trim()
      ? events.filter(
          event => {
            const query =
              searchQuery
                .toLowerCase()
                .trim();

            return (
              String(
                event.id,
              )
                .toLowerCase()
                .includes(
                  query,
                ) ||
              String(
                event.name,
              )
                .toLowerCase()
                .includes(
                  query,
                ) ||
              String(
                event.state,
              )
                .toLowerCase()
                .includes(
                  query,
                ) ||
              String(
                event.region,
              )
                .toLowerCase()
                .includes(
                  query,
                )
            );
          },
        )
      : events;

  /* =======================================================
     LOGIN
     ======================================================= */

 if (currentPage === 'login') {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              VEYRONIX AI
            </div>

            <div className="text-sm text-slate-400">
              Loading login...
            </div>
          </div>
        </div>
      }
    >
      <LoginPage onLogin={handleLogin} />
    </Suspense>
  );
}
  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">

          <div className="text-2xl font-bold text-white mb-2">
            VEYRONIX AI
          </div>

          <div className="text-sm text-slate-400">
            Loading thermal events...
          </div>

        </div>
      </div>
    );
  }

  /* =======================================================
     INITIAL API FAILURE
     ======================================================= */

  if (
    error &&
    events.length === 0
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">

        <div className="max-w-lg w-full rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">

          <h1 className="text-xl font-bold text-white mb-3">
            VEYRONIX API unavailable
          </h1>

          <p className="text-sm text-red-300 mb-5">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="
              px-5
              py-2.5
              rounded-xl
              bg-cyan-500
              text-slate-950
              font-bold
            "
          >
            Retry
          </button>

        </div>

      </div>
    );
  }

  /* =======================================================
     MAIN APPLICATION
     ======================================================= */

  return (
    <div className="min-h-screen bg-[#060814] text-[#e2e8f0] flex font-sans-clean antialiased selection:bg-cyan-500/30 selection:text-cyan-200">

      {/* ===================================================
          DESKTOP SIDEBAR
      =================================================== */}

      <div className="hidden md:flex h-screen sticky top-0 transition-all duration-300">

        <Sidebar
          currentPage={
            currentPage
          }

          onNavigate={
            handleNavigate
          }

          onLogout={
            handleLogout
          }

          openCasesCount={
            cases.filter(
              currentCase =>
                currentCase.status !==
                'RESOLVED',
            ).length
          }

          isCollapsed={
            sidebarCollapsed
          }

          onToggleCollapse={() =>
            setSidebarCollapsed(
              previous =>
                !previous,
            )
          }

          onOpenApiModal={() =>
            setApiModalOpen(
              true,
            )
          }
        />

      </div>

      {/* ===================================================
          MOBILE SIDEBAR
      =================================================== */}

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">

          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() =>
              setMobileSidebarOpen(
                false,
              )
            }
          />

          <div className="relative z-50 h-full bg-[#070b20]">

            <Sidebar
              currentPage={
                currentPage
              }

              onNavigate={
                handleNavigate
              }

              onLogout={
                handleLogout
              }

              openCasesCount={
                cases.filter(
                  currentCase =>
                    currentCase.status !==
                    'RESOLVED',
                ).length
              }

              isCollapsed={
                false
              }

              onToggleCollapse={() =>
                setMobileSidebarOpen(
                  false,
                )
              }

              onOpenApiModal={() => {
                setMobileSidebarOpen(
                  false,
                );

                setApiModalOpen(
                  true,
                );
              }}
            />

          </div>

        </div>
      )}

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div className="flex-1 flex flex-col min-w-0">

        <TopNavbar
          currentPage={
            currentPage
          }

          searchQuery={
            searchQuery
          }

          onSearchChange={
            setSearchQuery
          }

          onNavigate={
            handleNavigate
          }

          onLogout={
            handleLogout
          }

          onToggleMobileSidebar={() =>
            setMobileSidebarOpen(
              true,
            )
          }

          onOpenApiModal={() =>
            setApiModalOpen(
              true,
            )
          }
        />

        <ApiConfigModal
          isOpen={
            apiModalOpen
          }

          onClose={() =>
            setApiModalOpen(
              false,
            )
          }
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">

  <Suspense
    fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-2">
            VEYRONIX AI
          </div>

          <div className="text-sm text-slate-400">
            Loading module...
          </div>
        </div>
      </div>
    }
  >

    {/* =================================================
        DASHBOARD
    ================================================= */}
    {currentPage === 'dashboard' && (
      <DashboardPage
        events={filteredEvents}
        selectedEvent={selectedEvent}
        onSelectEvent={handleSelectEvent}
        onNavigate={handleNavigate}
        onViewEventDetails={handleViewEventDetails}
      />
    )}

    {/* =================================================
        LIVE MONITOR
    ================================================= */}
    {currentPage === 'live-monitor' && (
      <LiveMonitorPage
        events={filteredEvents}
        selectedEvent={selectedEvent}
        onSelectEvent={handleSelectEvent}
        onAnalyzeEvent={handleViewEventDetails}
      />
    )}

    {/* =================================================
        THERMAL EVENTS
    ================================================= */}
    {currentPage === 'events' && (
      <ThermalEventsPage
        events={filteredEvents}
        onViewEvent={handleViewEventDetails}
      />
    )}

    {/* =================================================
        EVENT ANALYSIS
    ================================================= */}
    {currentPage === 'analysis' && selectedEvent && (
      <EventAnalysisPage
        event={selectedEvent}
        events={events}
        onSelectEvent={handleSelectEvent}
        onCreateInvestigation={handleCreateInvestigation}
      />
    )}

    {/* =================================================
        INVESTIGATION
    ================================================= */}
    {currentPage === 'investigation' && (
      <InvestigationPage
        cases={cases}
        selectedCaseId={selectedCaseId}
        onSelectCase={setSelectedCaseId}
        onUpdateCaseStatus={handleUpdateCaseStatus}
        onAddCaseNote={handleAddCaseNote}
      />
    )}

    {/* =================================================
        ANALYTICS
    ================================================= */}
    {currentPage === 'analytics' && (
      <AnalyticsPage
        events={events}
      />
    )}

    {/* =================================================
        SYSTEM
    ================================================= */}
    {currentPage === 'system' && (
      <SystemArchitecturePage />
    )}

  </Suspense>

</main>
      </div>

      {/* =====================================================
          EVENT REQUIRED MODAL
      ===================================================== */}

      {eventRequiredModalOpen && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/70
            backdrop-blur-sm
            px-4
          "
          onClick={
            handleCloseEventRequiredModal
          }
        >

          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              border
              border-cyan-500/40
              bg-[#080d24]
              p-6
              shadow-[0_0_40px_rgba(6,182,212,0.25)]
            "
            onClick={event =>
              event.stopPropagation()
            }
          >

            <div className="flex items-start justify-between gap-4">

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-cyan-400/40
                    bg-cyan-500/15
                  "
                >
                  <span className="text-xl">
                    ⚠
                  </span>
                </div>

                <div>

                  <h2
                    className="
                      text-lg
                      font-bold
                      text-white
                    "
                  >
                    Event Selection Required
                  </h2>

                  <p
                    className="
                      mt-0.5
                      text-[10px]
                      font-heading
                      uppercase
                      tracking-widest
                      text-cyan-400/70
                    "
                  >
                    VEYRONIX AI
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseEventRequiredModal
                }
                className="
                  rounded-lg
                  p-1.5
                  text-slate-500
                  transition-all
                  hover:bg-white/5
                  hover:text-white
                "
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <div className="mt-5">

              <p
                className="
                  text-sm
                  leading-6
                  text-slate-300
                "
              >
                Please select a thermal event first
                before opening{' '}

                <span className="font-semibold text-cyan-300">
                  {requestedProtectedPage ===
                  'live-monitor'
                    ? 'Live Monitor'
                    : 'Event Analysis'}
                </span>
                .
              </p>

              <p
                className="
                  mt-3
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                Dashboard par jaakar pehle ek thermal
                event select karo. Uske baad tum
                Live Monitor ya Event Analysis open
                kar sakte ho.
              </p>

            </div>

            <div className="mt-6 flex items-center justify-end gap-3">

              <button
                type="button"
                onClick={
                  handleCloseEventRequiredModal
                }
                className="
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-900/50
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-300
                  transition-all
                  hover:border-slate-500
                  hover:text-white
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleReturnToDashboard
                }
                className="
                  rounded-xl
                  border
                  border-cyan-400/60
                  bg-cyan-500/15
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-cyan-300
                  transition-all
                  hover:bg-cyan-500/25
                  hover:border-cyan-300
                  hover:text-white
                  shadow-[0_0_15px_rgba(6,182,212,0.15)]
                "
              >
                Return to Dashboard
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          API STATUS
      ===================================================== */}

      {backendOnline && (
        <div
          className="
            fixed
            bottom-4
            right-4
            z-50
            rounded-xl
            border
            border-emerald-500/30
            bg-emerald-950/80
            px-4
            py-2
            text-xs
            text-emerald-300
            backdrop-blur
          "
        >

          <span
            className="
              inline-block
              w-2
              h-2
              rounded-full
              bg-emerald-400
              mr-2
            "
          />

          VEYRONIX API • CONNECTED

        </div>
      )}

    </div>
  );
}

export default App;