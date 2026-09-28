import { useEffect, useState } from 'react';

import {
  fetchVeyronixEvents,
  fetchVeyronixEventById,
  predictVeyronixEvent,
  checkVeyronixHealth,
} from './services/veyronixApi';

import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { ApiConfigModal } from './components/ApiConfigModal';

import { LoginPage } from './components/pages/LoginPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { LiveMonitorPage } from './components/pages/LiveMonitorPage';
import { ThermalEventsPage } from './components/pages/ThermalEventsPage';
import { EventAnalysisPage } from './components/pages/EventAnalysisPage';
import { InvestigationPage } from './components/pages/InvestigationPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';

import { SystemArchitecturePage } from './components/pages/SystemArchitecturePage';

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
   DATA-DRIVEN REPRESENTATIVE EVENT SELECTION
   ========================================================= */

/**
 * Stable hash so the same event ordering does not depend on
 * Math.random() and does not change on every render.
 */
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

/**
 * Select a representative dashboard sample from the real API pool.
 *
 * IMPORTANT:
 * - No hard-coded 25/25/25/25 split.
 * - Source proportions come from the fetched data.
 * - Events are first deterministically mixed inside each source group.
 * - If a source is absent from the API pool, no fake event is created.
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

  /*
   * Largest-remainder allocation.
   */
  const allocations =
    groupEntries.map(
      (entry) => {
        const exact =
          (entry.count /
            total) *
          targetCount;

        return {
          ...entry,
          exact,
          take:
            Math.floor(
              exact,
            ),
          remainder:
            exact -
            Math.floor(
              exact,
            ),
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

    candidates[0].take +=
      1;

    allocated += 1;

    candidates[0].remainder =
      0;
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

  /*
   * Final deterministic mix.
   */
  return selected.sort(
    (a, b) =>
      stableEventHash(a.id) -
      stableEventHash(b.id),
  );
}

/* =========================================================
   LIVE ML RESPONSE
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

/**
 * The production LightGBM response is the source of truth.
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

  const priorityScore =
    Math.round(
      confidence * 100,
    );

  let investigationPriority:
    ThermalEvent['investigationPriority'];

  if (
    confidence >=
    0.85
  ) {
    investigationPriority =
      'CRITICAL';
  } else if (
    confidence >=
    0.70
  ) {
    investigationPriority =
      'HIGH';
  } else if (
    confidence >=
    0.50
  ) {
    investigationPriority =
      'MEDIUM';
  } else {
    investigationPriority =
      'LOW';
  }

  return {
    ...event,

    /*
     * =====================================================
     * LIVE ML RESULT = SOURCE OF TRUTH
     * =====================================================
     */

    likelySource:
      predictedSource,

    confidence,

    priorityScore,

    investigationPriority,

    insufficientEvidence:
      predictedSource ===
      'Uncertain',

    sourceProbabilities: {
      industrial,
      agricultural,
      vegetation,
      other,
    },

    message:
      predictedSource ===
      'Uncertain'
        ? 'Evidence insufficient for reliable attribution.'
        : `VEYRONIX LightGBM predicts ${predictedSource}.`,
  };
}

/**
 * Run the real production prediction for the selected event.
 */
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

  const [
    events,
    setEvents,
  ] =
    useState<ThermalEvent[]>(
      [],
    );

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

  /*
   * =========================================================
   * EVENT REQUIRED MODAL
   * =========================================================
   *
   * This modal is shown when the user tries to open
   * Live Monitor or Event Analysis without selecting
   * a thermal event first.
   */

  const [
    eventRequiredModalOpen,
    setEventRequiredModalOpen,
  ] =
    useState(false);

  /*
   * Keeps track of which page the user tried to open.
   * This is only used for the message inside the modal.
   */

  const [
    requestedProtectedPage,
    setRequestedProtectedPage,
  ] =
    useState<
      'live-monitor' | 'analysis' | null
    >(null);

  /*
   * IMPORTANT:
   * This means the API successfully returned real events.
   */
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

          /*
           * Load real event stream.
           */
          const fetchedEvents =
            await fetchVeyronixEvents(
              API_FETCH_LIMIT,
            );

          if (cancelled) {
            return;
          }

          /*
           * Select representative dashboard sample.
           */
          const representativeEvents =
            selectRepresentativeEvents(
              fetchedEvents,
              DASHBOARD_EVENT_COUNT,
            );

          setEvents(
            representativeEvents,
          );

          /*
           * Backend is working.
           */
          setBackendOnline(
            true,
          );

          /*
           * No event selected initially.
           */
          setSelectedEvent(
            null,
          );

          /*
           * Health is informational.
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
             * Event API already succeeded,
             * so keep API online.
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
       * =====================================================
       * EVENT REQUIRED PROTECTION
       * =====================================================
       *
       * Live Monitor and Event Analysis require a selected
       * thermal event.
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

      /*
       * Normal navigation.
       */

      setCurrentPage(
        page,
      );

      setMobileSidebarOpen(
        false,
      );

      /*
       * When returning to Dashboard,
       * clear the selected event so the user can
       * intentionally choose a fresh event.
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
     CLOSE EVENT REQUIRED MODAL
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
      /*
       * Close popup.
       */

      setEventRequiredModalOpen(
        false,
      );

      setRequestedProtectedPage(
        null,
      );

      /*
       * Clear current event.
       */

      setSelectedEvent(
        null,
      );

      /*
       * Go to Dashboard.
       */

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

  const handleLogin = () => {
    setCurrentPage(
      'dashboard',
    );

    setMobileSidebarOpen(
      false,
    );
  };

  const handleLogout = () => {
    setCurrentPage(
      'login',
    );

    setMobileSidebarOpen(
      false,
    );
  };

  /* =======================================================
     SELECT EVENT + LIVE ML
     ======================================================= */

  const handleSelectEvent =
    async (
      event: ThermalEvent,
    ) => {
      /*
       * Show immediately while prediction runs.
       */

      setSelectedEvent(
        event,
      );

      setError(null);

      try {
        const updatedEvent =
          await enrichEventWithML(
            event,
          );

        setSelectedEvent(
          updatedEvent,
        );

        setEvents(
          previousEvents =>
            previousEvents.map(
              previousEvent =>
                String(
                  previousEvent.id,
                ) ===
                String(event.id)
                  ? updatedEvent
                  : previousEvent,
            ),
        );
      } catch (err) {
        console.error(
          'VEYRONIX ML prediction failed:',
          err,
        );

        /*
         * Keep real event visible if prediction fails.
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
     FETCH ANY EVENT FROM FULL CORPUS
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
       * First check events already loaded.
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
        const updatedEvent =
          await enrichEventWithML(
            existingEvent,
          );

        setEvents(
          previousEvents =>
            previousEvents.map(
              previousEvent =>
                String(
                  previousEvent.id,
                ) ===
                cleanEventId
                  ? updatedEvent
                  : previousEvent,
            ),
        );

        setSelectedEvent(
          updatedEvent,
        );

        return updatedEvent;
      }

      /*
       * Event is outside initial 100.
       */

      const fetchedEvent =
        await fetchVeyronixEventById(
          cleanEventId,
        );

      /*
       * Production LightGBM prediction.
       */

      const updatedEvent =
        await enrichEventWithML(
          fetchedEvent,
        );

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
            return previousEvents.map(
              previousEvent =>
                String(
                  previousEvent.id,
                ) ===
                String(
                  updatedEvent.id,
                )
                  ? updatedEvent
                  : previousEvent,
            );
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

  if (
    currentPage ===
    'login'
  ) {
    return (
      <LoginPage
        onLogin={
          handleLogin
        }
      />
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
     COMPLETE INITIAL FAILURE
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
     MAIN APPLICATION LAYOUT
     ======================================================= */

  return (
    <div className="min-h-screen bg-[#060814] text-[#e2e8f0] flex font-sans-clean antialiased selection:bg-cyan-500/30 selection:text-cyan-200">

      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

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

      {/* =====================================================
          MOBILE SIDEBAR
      ===================================================== */}

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

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

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

          {/* =================================================
              DASHBOARD
          ================================================= */}

          {currentPage ===
            'dashboard' && (
            <DashboardPage
              events={
                filteredEvents
              }

              selectedEvent={
                selectedEvent
              }

              onSelectEvent={
                handleSelectEvent
              }

              onNavigate={
                handleNavigate
              }

              onViewEventDetails={
                handleViewEventDetails
              }
            />
          )}

          {/* =================================================
              LIVE MONITOR
          ================================================= */}

          {currentPage ===
            'live-monitor' && (
            <LiveMonitorPage
              events={
                filteredEvents
              }

              selectedEvent={
                selectedEvent
              }

              onSelectEvent={
                handleSelectEvent
              }

              onAnalyzeEvent={
                handleViewEventDetails
              }
            />
          )}

          {/* =================================================
              THERMAL EVENTS
          ================================================= */}

          {currentPage ===
            'events' && (
            <ThermalEventsPage
              events={
                filteredEvents
              }

              onViewEvent={
                handleViewEventDetails
              }
            />
          )}

          {/* =================================================
              EVENT ANALYSIS
          ================================================= */}

          {currentPage ===
            'analysis' &&
            selectedEvent && (
              <EventAnalysisPage
                event={
                  selectedEvent
                }

                events={
                  events
                }

                onSelectEvent={
                  handleSelectEvent
                }

                onCreateInvestigation={
                  handleCreateInvestigation
                }
              />
            )}

          {/* =================================================
              INVESTIGATION
          ================================================= */}

          {currentPage ===
            'investigation' && (
            <InvestigationPage
              cases={
                cases
              }

              selectedCaseId={
                selectedCaseId
              }

              onSelectCase={
                setSelectedCaseId
              }

              onUpdateCaseStatus={
                handleUpdateCaseStatus
              }

              onAddCaseNote={
                handleAddCaseNote
              }
            />
          )}

          {/* =================================================
              ANALYTICS
          ================================================= */}

          {currentPage ===
            'analytics' && (
            <AnalyticsPage
              events={
                events
              }
            />
          )}

          {/* =================================================
              SYSTEM
          ================================================= */}

          {currentPage ===
            'system' && (
            <SystemArchitecturePage />
          )}

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

            {/* ============================================
                HEADER
            ============================================ */}

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

            {/* ============================================
                MESSAGE
            ============================================ */}

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

            {/* ============================================
                ACTIONS
            ============================================ */}

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