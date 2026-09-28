import React, { useEffect, useMemo, useState } from 'react';

import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Plus,
  Send,
  User,
  MapPin,
  Flame,
  Check,
  LocateFixed,
  Satellite,
  Activity,
  BrainCircuit,
  ExternalLink,
  Clock3,
  Target,
  CircleDot,
  RefreshCw,
} from 'lucide-react';

import type {
  InvestigationCase,
  PriorityLevel,
  ThermalEvent,
  AnalysisResponse,
} from '../../types';

import { fetchVeyronixAnalysis } from '../../services/veyronixApi';

import { TypewriterHeading } from '../TypewriterHeading';

// ============================================================
// PROPS
// ============================================================

interface InvestigationPageProps {
  cases: InvestigationCase[];
  events: ThermalEvent[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onUpdateCaseStatus: (
    caseId: string,
    newStatus: InvestigationCase['status'],
  ) => void;
  onAddCaseNote: (caseId: string, noteText: string) => void;
}

// ============================================================
// API
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000';

// ============================================================
// FLEXIBLE TYPES
// ============================================================

type InvestigationNote = {
  id?: string | number;
  author?: string;
  timestamp?: string;
  text?: string;
};

type ExtendedInvestigationCase = InvestigationCase & {
  notes?: unknown;
};

type ExtendedThermalEvent = ThermalEvent & {
  probabilities?: unknown;
  sourceProbabilities?: unknown;
  evidence?: unknown;
  evidenceList?: unknown;
  event_id?: number | string;
  latitude?: number;
  longitude?: number;
  peak_frp?: number;
  mean_frp?: number;
  total_frp?: number;
  mean_brightness?: number;
  persistent?: boolean | number;
  anomaly_score?: number;
  is_anomaly?: boolean;
  likelySource?: string;
  confidence?: number;
  priorityScore?: number;
  investigationPriority?: PriorityLevel;
  abnormalityScore?: number;
  insufficientEvidence?: boolean;
  sensor?: string;
  brightnessTempK?: number;
  detectionTimeUtc?: string;
  spatialContext?: {
    landUseClassification?: string;
    bufferRadiusKm?: number;
    nearbyFacilitiesCount?: number;
    facilityName?: string;
  };
};

type DisplayCase = {
  caseId: string;
  eventId: string;
  eventName: string;
  priority: PriorityLevel;
  score: number;
  status: InvestigationCase['status'];
  location: string;
  notes: InvestigationNote[];
  origin: 'docket' | 'auto';
};

// ============================================================
// CONSTANTS
// ============================================================

const MAX_AUTO_CASES = 12;
const FALLBACK_CASES = 5;

const SOURCE_LABELS = [
  {
    key: 'Agriculture_Biomass',
    label: 'Agriculture / Biomass',
  },
  {
    key: 'Forest_Natural',
    label: 'Forest / Natural',
  },
  {
    key: 'Industrial',
    label: 'Industrial',
  },
  {
    key: 'Waste_Other',
    label: 'Waste / Other',
  },
] as const;

// ============================================================
// HELPERS
// ============================================================

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;

    for (const key of [
      'events',
      'cases',
      'data',
      'items',
      'results',
    ]) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }

  return [];
}

function priorityClasses(priority: PriorityLevel) {
  switch (priority) {
    case 'CRITICAL':
      return {
        badge:
          'bg-red-500/15 text-red-300 border-red-500/40',
        text: 'text-red-300',
        dot: 'bg-red-400',
      };

    case 'HIGH':
      return {
        badge:
          'bg-orange-500/15 text-orange-300 border-orange-500/40',
        text: 'text-orange-300',
        dot: 'bg-orange-400',
      };

    case 'MEDIUM':
      return {
        badge:
          'bg-amber-500/15 text-amber-300 border-amber-500/40',
        text: 'text-amber-300',
        dot: 'bg-amber-400',
      };

    case 'LOW':
      return {
        badge:
          'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
        text: 'text-emerald-300',
        dot: 'bg-emerald-400',
      };

    default:
      return {
        badge:
          'bg-slate-500/15 text-slate-300 border-slate-500/40',
        text: 'text-slate-300',
        dot: 'bg-slate-400',
      };
  }
}

function statusLabel(
  status: InvestigationCase['status'] | undefined,
) {
  return String(status ?? 'UNKNOWN').replace(/_/g, ' ');
}

function formatNumber(value: unknown, digits = 2) {
  const number = Number(value);

  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(number)
  ) {
    return '—';
  }

  return number.toFixed(digits);
}

function formatPercent(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '—';
  }

  const normalized = number > 1 ? number / 100 : number;

  return `${Math.round(
    Math.max(0, Math.min(1, normalized)) * 100,
  )}%`;
}

function formatDateTime(value?: string) {
  if (!value) {
    return 'Time unavailable';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

function getSourceProbability(
  probabilities: unknown,
  source:
    | 'Agriculture_Biomass'
    | 'Forest_Natural'
    | 'Industrial'
    | 'Waste_Other',
) {
  if (
    !probabilities ||
    typeof probabilities !== 'object'
  ) {
    return 0;
  }

  const value = (
    probabilities as Record<string, unknown>
  )[source];

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return number > 1
    ? Math.max(0, Math.min(1, number / 100))
    : Math.max(0, Math.min(1, number));
}

function isEscalated(event: ExtendedThermalEvent) {
  return (
    event.investigationPriority === 'CRITICAL' ||
    event.investigationPriority === 'HIGH' ||
    Boolean(event.insufficientEvidence)
  );
}

function byPriorityScoreDesc(
  a: ExtendedThermalEvent,
  b: ExtendedThermalEvent,
) {
  return (
    (Number(b.priorityScore) || 0) -
    (Number(a.priorityScore) || 0)
  );
}

// ============================================================
// NORMALIZE BACKEND EVENT
// ============================================================

function normalizeBackendEvent(
  raw: Record<string, any>,
): ExtendedThermalEvent {
  const eventId =
    raw.id ??
    raw.event_id ??
    raw.eventId;

  const latitude =
    raw.lat ??
    raw.latitude;

  const longitude =
    raw.lng ??
    raw.longitude;

  const peakFrp =
    raw.frpMw ??
    raw.peak_frp ??
    raw.peakFrp ??
    raw.mean_frp ??
    0;

  const meanFrp =
    raw.meanFrp ??
    raw.mean_frp ??
    peakFrp;

  const totalFrp =
    raw.totalFrp ??
    raw.total_frp ??
    peakFrp;

  const brightness =
    raw.brightnessTempK ??
    raw.mean_brightness;

  const detectionTime =
    raw.detectionTimeUtc ??
    raw.start_time ??
    raw.startTime ??
    raw.event_date;

  return {
    ...(raw as ThermalEvent),

    id: eventId,
    event_id: eventId,

    lat: Number(latitude),
    lng: Number(longitude),

    latitude: Number(latitude),
    longitude: Number(longitude),

    frpMw: Number(peakFrp),
    peak_frp: Number(peakFrp),

    meanFrp: Number(meanFrp),
    mean_frp: Number(meanFrp),

    totalFrp: Number(totalFrp),
    total_frp: Number(totalFrp),

    brightnessTempK:
      brightness !== undefined &&
      brightness !== null
        ? Number(brightness)
        : undefined,

    mean_brightness:
      brightness !== undefined &&
      brightness !== null
        ? Number(brightness)
        : undefined,

    detectionTimeUtc: detectionTime,

    sensor: raw.sensor ?? 'FIRMS',

    name:
      raw.name ??
      `Thermal Event ${eventId}`,

    state: raw.state,
    region: raw.region,

    persistent:
      raw.persistent ??
      false,

    anomalyScore:
      raw.anomalyScore ??
      raw.anomaly_score ??
      0,

    is_anomaly:
      raw.is_anomaly ??
      false,

    spatialContext:
      raw.spatialContext,
  } as ExtendedThermalEvent;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export const InvestigationPage: React.FC<
  InvestigationPageProps
> = ({
  cases,
  events,
  selectedCaseId,
  onSelectCase,
  onUpdateCaseStatus,
  onAddCaseNote,
}) => {
  const [newNote, setNewNote] = useState('');
  const [actionFeedback, setActionFeedback] =
    useState<string | null>(null);

  const [localSelectedId, setLocalSelectedId] =
    useState<string | null>(null);

  const [localStatus, setLocalStatus] = useState<
    Record<string, InvestigationCase['status']>
  >({});

  const [localNotes, setLocalNotes] = useState<
    Record<string, InvestigationNote[]>
  >({});

  const [backendEvents, setBackendEvents] = useState<
    ExtendedThermalEvent[]
  >([]);

  const [eventsLoading, setEventsLoading] =
    useState(false);

  const [eventsError, setEventsError] =
    useState<string | null>(null);

  const [analysis, setAnalysis] =
    useState<AnalysisResponse | null>(null);

  const [analysisLoading, setAnalysisLoading] =
    useState(false);

  const [analysisError, setAnalysisError] =
    useState<string | null>(null);

  const loadBackendEvents = async () => {
    setEventsLoading(true);
    setEventsError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/events?limit=100`,
      );

      if (!response.ok) {
        throw new Error(
          `Events API failed: HTTP ${response.status}`,
        );
      }

      const json = await response.json();

      const rawEvents =
        toArray<Record<string, any>>(json);

      const normalized = rawEvents
        .map(normalizeBackendEvent)
        .filter(
          (event) =>
            event.id !== undefined &&
            Number.isFinite(Number(event.lat)) &&
            Number.isFinite(Number(event.lng)),
        );

      setBackendEvents(normalized);
    } catch (error) {
      console.error(
        'VEYRONIX events loading error:',
        error,
      );

      setEventsError(
        error instanceof Error
          ? error.message
          : 'Unable to load thermal events.',
      );
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    void loadBackendEvents();
  }, []);

  const safeCases = useMemo(
    () => toArray<InvestigationCase>(cases),
    [cases],
  );

  const safePropEvents = useMemo(
    () =>
      toArray<ThermalEvent>(events).map(
        (event) =>
          event as ExtendedThermalEvent,
      ),
    [events],
  );

  const safeEvents = useMemo(() => {
    const map = new Map<
      string,
      ExtendedThermalEvent
    >();

    safePropEvents.forEach((event) => {
      if (event?.id !== undefined) {
        map.set(String(event.id), event);
      }
    });

    backendEvents.forEach((event) => {
      if (event?.id !== undefined) {
        map.set(String(event.id), event);
      }
    });

    return Array.from(map.values());
  }, [safePropEvents, backendEvents]);

  const eventById = useMemo(() => {
    const map = new Map<
      string,
      ExtendedThermalEvent
    >();

    safeEvents.forEach((event) => {
      if (event?.id !== undefined) {
        map.set(String(event.id), event);
      }
    });

    return map;
  }, [safeEvents]);

  const displayCases = useMemo<DisplayCase[]>(() => {
    const result: DisplayCase[] = [];
    const usedEventIds = new Set<string>();

    safeCases.forEach((currentCase) => {
      const event = eventById.get(
        String(currentCase.eventId),
      );

      if (!event) {
        return;
      }

      usedEventIds.add(String(event.id));

      result.push({
        caseId: String(currentCase.caseId),
        eventId: String(currentCase.eventId),

        eventName:
          event.name ??
          currentCase.eventName,

        priority:
          event.investigationPriority ??
          currentCase.priority ??
          'MEDIUM',

        score:
          Number(
            event.priorityScore ??
              currentCase.score ??
              0,
          ) || 0,

        status: currentCase.status,

        location:
          currentCase.location ??
          `${formatNumber(event.lat, 4)}, ${formatNumber(
            event.lng,
            4,
          )}`,

        notes: toArray<InvestigationNote>(
          (
            currentCase as ExtendedInvestigationCase
          ).notes,
        ),

        origin: 'docket',
      });
    });

    const ranked = Array.from(
      eventById.values(),
    )
      .filter(
        (event) =>
          !usedEventIds.has(String(event.id)),
      )
      .sort(byPriorityScoreDesc);

    let candidates =
      ranked.filter(isEscalated);

    if (candidates.length === 0) {
      candidates = ranked.slice(
        0,
        FALLBACK_CASES,
      );
    }

    candidates
      .slice(0, MAX_AUTO_CASES)
      .forEach((event) => {
        const eventId = String(event.id);

        const caseId =
          `INV-${eventId.replace(/^EVT-/, '')}`;

        const priority: PriorityLevel =
          event.investigationPriority ??
          'MEDIUM';

        const triageText =
          `VEYRONIX thermal event detected at ` +
          `${formatNumber(event.lat, 4)}, ` +
          `${formatNumber(event.lng, 4)}. ` +
          `Detailed LightGBM analysis is loaded when this case is opened. ` +
          `Current event priority: ${priority}.`;

        const triageNote: InvestigationNote = {
          id: `${caseId}-triage`,
          author: 'VEYRONIX Auto-Triage',
          timestamp: formatDateTime(
            event.detectionTimeUtc,
          ),
          text: triageText,
        };

        result.push({
          caseId,
          eventId,
          eventName:
            event.name ??
            `Thermal Event ${eventId}`,

          priority,

          score:
            Number(
              event.priorityScore ?? 0,
            ) || 0,

          status:
            (localStatus[caseId] ??
              'QUEUED') as InvestigationCase['status'],

          location:
            `${formatNumber(event.lat, 4)}, ` +
            `${formatNumber(event.lng, 4)}` +
            `${
              event.state
                ? `, ${event.state}`
                : ''
            }`,

          notes: [
            triageNote,
            ...(localNotes[caseId] ?? []),
          ],

          origin: 'auto',
        });
      });

    return result;
  }, [
    safeCases,
    eventById,
    localStatus,
    localNotes,
  ]);

  const openCaseCount = useMemo(
    () =>
      displayCases.filter(
        (currentCase) =>
          String(currentCase.status) !==
          'RESOLVED',
      ).length,
    [displayCases],
  );

  useEffect(() => {
    if (
      selectedCaseId &&
      displayCases.some(
        (currentCase) =>
          currentCase.caseId ===
          String(selectedCaseId),
      )
    ) {
      setLocalSelectedId(
        String(selectedCaseId),
      );
    }
  }, [selectedCaseId, displayCases]);

  const handleSelectCase = (
    caseId: string,
  ) => {
    setLocalSelectedId(caseId);
    onSelectCase(caseId);
  };

  const activeCase = useMemo<DisplayCase | undefined>(
    () =>
      displayCases.find(
        (c) =>
          c.caseId === localSelectedId,
      ) ??
      displayCases.find(
        (c) =>
          c.caseId ===
          String(selectedCaseId),
      ) ??
      displayCases[0],
    [
      displayCases,
      localSelectedId,
      selectedCaseId,
    ],
  );

  const activeEvent = useMemo<
    ExtendedThermalEvent | undefined
  >(() => {
    if (!activeCase) {
      return undefined;
    }

    return eventById.get(
      activeCase.eventId,
    );
  }, [eventById, activeCase]);

  useEffect(() => {
    let cancelled = false;

    const loadAnalysis = async () => {
      if (!activeEvent?.id) {
        setAnalysis(null);
        setAnalysisError(null);
        setAnalysisLoading(false);
        return;
      }

      setAnalysis(null);
      setAnalysisError(null);
      setAnalysisLoading(true);

      try {
        const result =
          await fetchVeyronixAnalysis(
            activeEvent.id,
          );

        if (!cancelled) {
          setAnalysis(result);
        }
      } catch (error) {
        console.error(
          'VEYRONIX ML analysis error:',
          error,
        );

        if (!cancelled) {
          setAnalysis(null);

          setAnalysisError(
            error instanceof Error
              ? error.message
              : 'Unable to load ML analysis.',
          );
        }
      } finally {
        if (!cancelled) {
          setAnalysisLoading(false);
        }
      }
    };

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [activeEvent?.id]);

  const caseNotes =
    activeCase?.notes ?? [];

  const probabilities = useMemo(() => {
    if (!analysis) {
      return {};
    }

    return (
      analysis.source_probabilities ??
      {}
    );
  }, [analysis]);

  const evidenceList = useMemo<string[]>(
    () => {
      if (
        !analysis ||
        !Array.isArray(
          analysis.evidence,
        )
      ) {
        return [];
      }

      return analysis.evidence.map(
        (item) => String(item),
      );
    },
    [analysis],
  );

  const liveSource =
    analysis?.source ??
    analysis?.predicted_source ??
    null;

  const liveConfidence =
    analysis?.confidence ?? null;

  const livePriority =
    analysis?.priority ?? null;

  const livePriorityScore =
    analysis?.priority_score ?? null;

  const liveAbnormalityScore =
    analysis?.abnormality_score ?? null;

  const insufficientEvidence =
    analysis?.insufficient_evidence ??
    false;

  useEffect(() => {
    if (!actionFeedback) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setActionFeedback(null);
      }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [actionFeedback]);

  const handleAction = (
    status: InvestigationCase['status'],
    label: string,
  ) => {
    if (!activeCase) {
      return;
    }

    if (
      activeCase.origin === 'docket'
    ) {
      onUpdateCaseStatus(
        activeCase.caseId,
        status,
      );
    } else {
      setLocalStatus(
        (previous) => ({
          ...previous,
          [activeCase.caseId]:
            status,
        }),
      );
    }

    setActionFeedback(label);
  };

  const handleAddNoteSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const trimmedNote =
      newNote.trim();

    if (
      !trimmedNote ||
      !activeCase
    ) {
      return;
    }

    if (
      activeCase.origin === 'docket'
    ) {
      onAddCaseNote(
        activeCase.caseId,
        trimmedNote,
      );
    } else {
      const note: InvestigationNote = {
        id: `${activeCase.caseId}-note-${Date.now()}`,
        author: 'Investigator',
        timestamp:
          formatDateTime(
            new Date().toISOString(),
          ),
        text: trimmedNote,
      };

      setLocalNotes(
        (previous) => ({
          ...previous,
          [activeCase.caseId]: [
            ...(previous[
              activeCase.caseId
            ] ?? []),
            note,
          ],
        }),
      );
    }

    setNewNote('');

    setActionFeedback(
      'Investigator note added to the case record.',
    );
  };

  const openMap = () => {
    if (!activeEvent) {
      return;
    }

    const lat = Number(
      activeEvent.lat,
    );

    const lng = Number(
      activeEvent.lng,
    );

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return;
    }

    const url =
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const refreshEvents = () => {
    void loadBackendEvents();
  };

  return (
    <div className="space-y-6 select-text">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="bg-[#080d25]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-5 shadow-2xl">

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

          <div>

            <div className="flex items-center gap-2.5">

              <ShieldAlert className="w-6 h-6 text-cyan-400" />

              <TypewriterHeading
                as="h1"
                text="THERMAL EVENT INVESTIGATION"
                className="text-xl sm:text-2xl font-bold text-white"
                glow={true}
                glowColor="cyan"
                speed={20}
              />

            </div>

            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans-clean">
              Human verification workspace linked directly to VEYRONIX thermal-event telemetry and real LightGBM ML attribution.
            </p>

          </div>

          {/* REFRESH BUTTON REMOVED */}

          <div className="flex flex-wrap items-center gap-2">

            <span className="px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-heading font-bold">
              {openCaseCount} OPEN CASE
              {openCaseCount === 1
                ? ''
                : 'S'}
            </span>

            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-heading font-bold flex items-center gap-1.5">
              <CircleDot className="w-3.5 h-3.5" />
              LIVE EVENT LINK
            </span>

          </div>

        </div>

        {actionFeedback && (
          <div className="mt-4 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {actionFeedback}
          </div>
        )}

        {eventsError && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Backend event loading failed:{' '}
              {eventsError}
            </span>
          </div>
        )}

      </div>

      {/* ====================================================== */}
      {/* NO CASE */}
      {/* ====================================================== */}

      {!activeCase ? (

        <div className="rounded-2xl border border-dashed border-[#26366e] bg-[#070b1e]/80 p-8 text-center">

          {eventsLoading ? (

            <>
              <RefreshCw className="w-10 h-10 mx-auto text-cyan-400/70 mb-3 animate-spin" />

              <h2 className="text-lg font-bold text-white font-heading">
                LOADING THERMAL EVENTS
              </h2>

              <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
                Loading live thermal events from the VEYRONIX FastAPI backend.
              </p>
            </>

          ) : (

            <>
              <Satellite className="w-10 h-10 mx-auto text-cyan-400/70 mb-3" />

              <h2 className="text-lg font-bold text-white font-heading">
                NO INVESTIGATION CASES
              </h2>

              <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
                No thermal events are currently available from the backend.
                Verify that FastAPI is running on
                <span className="text-cyan-300 font-mono">
                  {' '}127.0.0.1:8000
                </span>.
              </p>

              <button
                type="button"
                onClick={refreshEvents}
                className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500 hover:text-slate-950"
              >
                LOAD EVENTS
              </button>
            </>

          )}

        </div>

      ) : (

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ================================================== */}
          {/* CASE LIST */}
          {/* ================================================== */}

          <div className="lg:col-span-4 space-y-3 min-w-0">

            <TypewriterHeading
              as="h2"
              text="INVESTIGATION DOCKET"
              className="text-xs font-bold uppercase text-cyan-300 pb-2 border-b border-[#1b2554]"
              glow={true}
              glowColor="cyan"
              speed={25}
            />

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory lg:block lg:overflow-visible lg:pb-0 lg:mx-0 lg:px-0 lg:snap-none">

              {displayCases.map(
                (currentCase) => {

                  const isSelected =
                    activeCase.caseId ===
                    currentCase.caseId;

                  const linkedEvent =
                    eventById.get(
                      currentCase.eventId,
                    );

                  const priority: PriorityLevel =
                    linkedEvent?.investigationPriority ??
                    currentCase.priority ??
                    'MEDIUM';

                  const classes =
                    priorityClasses(
                      priority,
                    );

                  return (
                    <button
                      type="button"
                      key={
                        currentCase.caseId
                      }
                      onClick={() =>
                        handleSelectCase(
                          currentCase.caseId,
                        )
                      }
                      className={`w-[300px] shrink-0 snap-start lg:w-full lg:shrink lg:snap-none text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-[#0e163d] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/40'
                          : 'bg-[#070b1e] border-[#1b2554] hover:bg-[#0c1232] hover:border-cyan-500/40'
                      }`}
                    >

                      <div className="flex items-center justify-between gap-2">

                        <span className="text-xs font-bold font-mono text-cyan-300">
                          {currentCase.caseId}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold ${classes.badge}`}
                        >
                          {priority}
                        </span>

                      </div>

                      <h3 className="text-sm font-bold font-heading text-white mt-2 leading-snug">
                        {linkedEvent?.name ??
                          currentCase.eventName}
                      </h3>

                      <div className="mt-1 text-[11px] text-slate-400 font-mono">
                        Event:{' '}
                        <span className="text-slate-200">
                          {currentCase.eventId}
                        </span>
                      </div>

                      {linkedEvent && (
                        <div className="mt-2 grid grid-cols-2 gap-2">

                          <MiniMetric
                            label="Sensor"
                            value={
                              linkedEvent.sensor ??
                              'FIRMS'
                            }
                          />

                          <MiniMetric
                            label="FRP"
                            value={`${formatNumber(
                              linkedEvent.frpMw,
                              1,
                            )} MW`}
                          />

                        </div>
                      )}

                      <div className="mt-3 pt-2 border-t border-[#1b2554] flex items-center justify-between">

                        <span className="text-[11px] font-mono font-bold text-cyan-400">
                          Priority{' '}
                          {Math.round(
                            Number(
                              linkedEvent?.priorityScore ??
                                currentCase.score ??
                                0,
                            ) || 0,
                          )}
                          /100
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-[#0f1638] text-[10px] font-bold text-slate-300 uppercase">
                          {statusLabel(
                            currentCase.status,
                          )}
                        </span>

                      </div>

                      <div className="mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-heading font-bold">
                        <FolderOpen className="w-3.5 h-3.5" />
                        OPEN CASE
                      </div>

                    </button>
                  );
                },
              )}

            </div>

          </div>

          {/* ================================================== */}
          {/* ACTIVE CASE */}
          {/* ================================================== */}

          <div className="lg:col-span-8 min-w-0 w-full bg-[#080d25]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-5">

            <div className="pb-4 border-b border-[#1b2554]">

              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2 mb-2">

                    <span className="text-sm font-bold font-mono text-cyan-400 break-all">
                      {activeCase.caseId}
                    </span>

                    <span className="text-xs text-slate-500">
                      •
                    </span>

                    <span className="text-xs text-slate-400 font-mono">
                      Event{' '}
                      {activeCase.eventId}
                    </span>

                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-white leading-tight break-words">
                    {activeEvent?.name ??
                      activeCase.eventName}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-400">

                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />

                      {activeEvent
                        ? `${formatNumber(
                            activeEvent.lat,
                            4,
                          )}, ${formatNumber(
                            activeEvent.lng,
                            4,
                          )}`
                        : activeCase.location}
                    </span>

                    {activeEvent?.state && (
                      <span>
                        {activeEvent.state}
                      </span>
                    )}

                    {activeEvent?.region && (
                      <span>
                        • {activeEvent.region}
                      </span>
                    )}

                  </div>

                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">

                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      livePriority
                        ? priorityClasses(
                            livePriority as PriorityLevel,
                          ).badge
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                    }`}
                  >
                    {analysisLoading
                      ? 'ANALYZING...'
                      : livePriority
                        ? `${livePriority} PRIORITY`
                        : 'ML PENDING'}
                  </span>

                  <span className="px-3 py-1.5 rounded-xl bg-[#0f1638] text-xs font-bold font-heading text-slate-200 border border-[#1e2a60]">
                    {statusLabel(
                      activeCase.status,
                    )}
                  </span>

                </div>

              </div>

            </div>

            {/* ================================================== */}
            {/* ML STATUS */}
            {/* ================================================== */}

            {analysisLoading && (
              <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/30 p-3 flex items-center gap-2 text-xs text-cyan-300">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />

                <span>
                  Running VEYRONIX LightGBM event analysis...
                </span>

              </div>
            )}

            {analysisError && (
              <div className="rounded-xl bg-red-500/5 border border-red-500/30 p-3 flex items-start gap-2 text-xs text-red-300">

                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />

                <div className="min-w-0">

                  <div className="font-bold">
                    ML ANALYSIS UNAVAILABLE
                  </div>

                  <div className="mt-1 text-red-300/80 break-words">
                    {analysisError}
                  </div>

                </div>

              </div>
            )}

            {analysis && (
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center gap-2 text-xs text-emerald-300">

                <CheckCircle2 className="w-4 h-4 shrink-0" />

                <span>
                  LIVE LightGBM prediction loaded from VEYRONIX API.
                </span>

              </div>
            )}

            {/* ================================================== */}
            {/* LIVE EVENT TELEMETRY */}
            {/* ================================================== */}

            {activeEvent ? (
              <>

                <section>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">

                    <TypewriterHeading
                      as="h3"
                      text="LIVE EVENT TELEMETRY"
                      className="text-xs font-bold uppercase text-cyan-300"
                      glow={true}
                      glowColor="cyan"
                      speed={25}
                    />

                    <button
                      type="button"
                      onClick={openMap}
                      className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1.5 hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                    >

                      <ExternalLink className="w-3 h-3" />

                      OPEN COORDINATE

                    </button>

                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">

                    <MetricCard
                      icon={
                        <Flame className="w-4 h-4" />
                      }
                      label="Peak FRP"
                      value={`${formatNumber(
                        activeEvent.frpMw,
                        2,
                      )} MW`}
                      tone="red"
                    />

                    <MetricCard
                      icon={
                        <Activity className="w-4 h-4" />
                      }
                      label="Abnormality"
                      value={
                        liveAbnormalityScore !==
                        null
                          ? `${formatNumber(
                              liveAbnormalityScore,
                              0,
                            )}/100`
                          : 'ML —'
                      }
                      tone="amber"
                    />

                    <MetricCard
                      icon={
                        <BrainCircuit className="w-4 h-4" />
                      }
                      label="ML confidence"
                      value={
                        liveConfidence !==
                        null
                          ? formatPercent(
                              liveConfidence,
                            )
                          : 'ML —'
                      }
                      tone="cyan"
                    />

                    <MetricCard
                      icon={
                        <Target className="w-4 h-4" />
                      }
                      label="Priority score"
                      value={
                        livePriorityScore !==
                        null
                          ? `${Math.round(
                              Number(
                                livePriorityScore,
                              ) || 0,
                            )}/100`
                          : 'ML —'
                      }
                      tone="purple"
                    />

                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-2.5">

                    <InfoMetric
                      label="Predicted source"
                      value={
                        liveSource ??
                        'Awaiting ML'
                      }
                    />

                    <InfoMetric
                      label="Sensor"
                      value={
                        activeEvent.sensor ??
                        'FIRMS'
                      }
                    />

                    <InfoMetric
                      label="Brightness"
                      value={`${formatNumber(
                        activeEvent.brightnessTempK,
                        1,
                      )} K`}
                    />

                    <InfoMetric
                      label="Detected"
                      value={formatDateTime(
                        activeEvent.detectionTimeUtc,
                      )}
                    />

                  </div>

                </section>

                {/* ================================================== */}
                {/* SOURCE PROBABILITIES */}
                {/* ================================================== */}

                <section>

                  <div className="flex items-center gap-2 mb-2.5">

                    <BrainCircuit className="w-4 h-4 text-purple-400 shrink-0" />

                    <h3 className="text-xs font-bold uppercase text-purple-300 font-heading">
                      ML SOURCE ATTRIBUTION
                    </h3>

                    <span className="text-[10px] text-slate-500 font-mono">
                      LightGBM
                    </span>

                  </div>

                  <div className="rounded-xl bg-[#070b1e] border border-[#1b2554] p-4 space-y-3">

                    {SOURCE_LABELS.map(
                      (source) => {

                        const probability =
                          getSourceProbability(
                            probabilities,
                            source.key,
                          );

                        const width =
                          probability * 100;

                        const isPredicted =
                          source.key ===
                          liveSource;

                        return (
                          <div
                            key={
                              source.key
                            }
                          >

                            <div className="flex items-center justify-between gap-3 text-[11px] mb-1">

                              <span
                                className={`min-w-0 ${
                                  isPredicted
                                    ? 'text-white font-bold'
                                    : 'text-slate-400'
                                }`}
                              >
                                {source.label}
                              </span>

                              <span className="font-mono text-slate-300 shrink-0">
                                {analysis
                                  ? `${Math.round(
                                      width,
                                    )}%`
                                  : '—'}
                              </span>

                            </div>

                            <div className="h-2 rounded-full bg-[#151d40] overflow-hidden">

                              <div
                                className={`h-full rounded-full transition-all ${
                                  isPredicted
                                    ? 'bg-cyan-400'
                                    : 'bg-slate-600'
                                }`}
                                style={{
                                  width: analysis
                                    ? `${width}%`
                                    : '0%',
                                }}
                              />

                            </div>

                          </div>
                        );
                      },
                    )}

                    <div className="pt-2 border-t border-[#1b2554] flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">

                      <span>
                        Actual model output from VEYRONIX LightGBM.
                      </span>

                      {insufficientEvidence && (
                        <span className="text-amber-300 font-semibold">
                          Review required
                        </span>
                      )}

                    </div>

                  </div>

                </section>

                {/* ================================================== */}
                {/* LOCATION */}
                {/* ================================================== */}

                <section>

                  <div className="flex items-center gap-2 mb-2.5">

                    <LocateFixed className="w-4 h-4 text-emerald-400 shrink-0" />

                    <h3 className="text-xs font-bold uppercase text-emerald-300 font-heading">
                      HOTSPOT LOCATION CONTEXT
                    </h3>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                    <div className="rounded-xl bg-[#070b1e] border border-[#1b2554] p-4">

                      <div className="text-[10px] uppercase text-slate-500 font-heading font-bold">
                        FIRMS event coordinate
                      </div>

                      <div className="mt-2 text-lg font-mono font-bold text-white break-all">

                        {formatNumber(
                          activeEvent.lat,
                          5,
                        )}

                        <span className="text-slate-500 mx-1">
                          ,
                        </span>

                        {formatNumber(
                          activeEvent.lng,
                          5,
                        )}

                      </div>

                      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                        Satellite hotspot coordinate; not a building-level exact fire boundary.
                      </p>

                    </div>

                    <div className="rounded-xl bg-[#070b1e] border border-[#1b2554] p-4">

                      <div className="text-[10px] uppercase text-slate-500 font-heading font-bold">
                        Spatial context
                      </div>

                      <div className="mt-2 text-sm font-bold text-white break-words">
                        {activeEvent.spatialContext
                          ?.landUseClassification ??
                          'Context unavailable'}
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-400">

                        <span>
                          Buffer:{' '}

                          <strong className="text-slate-200">
                            {formatNumber(
                              activeEvent
                                .spatialContext
                                ?.bufferRadiusKm,
                              1,
                            )}{' '}
                            km
                          </strong>
                        </span>

                        <span>
                          Nearby facilities:{' '}

                          <strong className="text-slate-200">
                            {activeEvent
                              .spatialContext
                              ?.nearbyFacilitiesCount ??
                              '—'}
                          </strong>
                        </span>

                      </div>

                      {activeEvent
                        .spatialContext
                        ?.facilityName && (
                        <div className="mt-2 text-[10px] text-cyan-300 break-words">
                          Nearby context:{' '}
                          {
                            activeEvent
                              .spatialContext
                              .facilityName
                          }
                        </div>
                      )}

                    </div>

                  </div>

                </section>

                {/* ================================================== */}
                {/* EVIDENCE */}
                {/* ================================================== */}

                <section>

                  <div className="flex items-center justify-between gap-3 mb-2.5">

                    <TypewriterHeading
                      as="h3"
                      text="AVAILABLE EVIDENCE"
                      className="text-xs font-bold uppercase text-cyan-300"
                      glow={true}
                      glowColor="cyan"
                      speed={25}
                    />

                    <span className="text-[10px] text-slate-500 shrink-0">
                      {evidenceList.length}{' '}
                      recorded items
                    </span>

                  </div>

                  <div className="rounded-xl bg-[#070b1e] border border-[#1b2554] p-4 space-y-2">

                    {evidenceList.length ? (
                      evidenceList.map(
                        (
                          evidence,
                          index,
                        ) => (
                          <div
                            key={`${activeEvent.id}-evidence-${index}`}
                            className="flex items-start gap-2 text-xs text-slate-200"
                          >

                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />

                            <span className="break-words">
                              {String(
                                evidence,
                              )}
                            </span>

                          </div>
                        ),
                      )
                    ) : analysisLoading ? (

                      <div className="text-xs text-slate-500">
                        Waiting for ML evidence...
                      </div>

                    ) : analysisError ? (

                      <div className="text-xs text-red-300">
                        ML evidence unavailable.
                      </div>

                    ) : (

                      <div className="text-xs text-slate-500">
                        No additional evidence record is attached to this event.
                      </div>

                    )}

                    {insufficientEvidence && (
                      <div className="pt-2 mt-2 border-t border-[#1b2554] flex items-start gap-2 text-xs text-amber-300">

                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />

                        <span>
                          Model evidence is insufficient for a confident attribution. Human verification is required.
                        </span>

                      </div>
                    )}

                  </div>

                </section>

                {/* ================================================== */}
                {/* ACTIONS */}
                {/* ================================================== */}

                <section>

                  <h3 className="text-xs font-bold uppercase text-white font-heading mb-2.5">
                    INVESTIGATOR ACTIONS
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5">

                    {/* ADD NOTE */}

                    <ActionButton
                      icon={
                        <Plus className="w-3.5 h-3.5" />
                      }
                      label="Add note"
                      onClick={() =>
                        document
                          .getElementById(
                            'case-note-input',
                          )
                          ?.focus()
                      }
                    />

                    {/* RESOLVE */}

                    <ActionButton
                      icon={
                        <Check className="w-3.5 h-3.5" />
                      }
                      label="Resolve"
                      tone="green"
                      onClick={() =>
                        handleAction(
                          'RESOLVED',
                          'Case marked resolved.',
                        )
                      }
                    />

                  </div>

                </section>

              </>

            ) : (

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">

                <div className="flex items-start gap-3">

                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />

                  <div>

                    <h3 className="text-sm font-bold text-amber-300 font-heading">
                      LIVE EVENT TELEMETRY NOT LOADED
                    </h3>

                    <p className="text-xs text-slate-400 mt-1">
                      The selected investigation case does not currently have a matching thermal event.
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* ================================================== */}
            {/* INVESTIGATION LOG */}
            {/* ================================================== */}

            <section className="pt-1">

              <TypewriterHeading
                as="h3"
                text="INVESTIGATION LOG"
                className="text-xs font-bold uppercase text-cyan-300 mb-2.5"
                glow={true}
                glowColor="cyan"
                speed={25}
              />

              <div className="space-y-2 mb-3">

                {caseNotes.length ? (
                  caseNotes.map(
                    (note, index) => (
                      <div
                        key={
                          note.id ??
                          `note-${index}`
                        }
                        className="p-3 rounded-xl bg-[#070b1e] border border-[#1b2554]"
                      >

                        <div className="flex flex-wrap items-center justify-between gap-2">

                          <span className="font-bold font-heading text-white text-xs flex items-center gap-1.5">

                            <User className="w-3.5 h-3.5 text-cyan-400" />

                            {note.author ??
                              'Investigator'}

                          </span>

                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">

                            <Clock3 className="w-3 h-3" />

                            {note.timestamp ??
                              'Time unavailable'}

                          </span>

                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mt-1.5 break-words">
                          {note.text ?? ''}
                        </p>

                      </div>
                    ),
                  )
                ) : (
                  <div className="text-xs text-slate-500">
                    No investigator notes yet.
                  </div>
                )}

              </div>

              <form
                onSubmit={
                  handleAddNoteSubmit
                }
                className="flex flex-col sm:flex-row gap-2"
              >

                <input
                  id="case-note-input"
                  type="text"
                  value={newNote}
                  onChange={(event) =>
                    setNewNote(
                      event.target.value,
                    )
                  }
                  placeholder="Add an observation or field-verification note..."
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-[#070b1e] border border-[#1e2c69] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                />

                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold font-heading uppercase flex items-center justify-center gap-1.5"
                >

                  <Send className="w-3.5 h-3.5" />

                  POST NOTE

                </button>

              </form>

            </section>

          </div>

        </div>
      )}

    </div>
  );
};

// ============================================================
// SMALL UI COMPONENTS
// ============================================================

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[#0a1030] border border-[#1b2554] px-2.5 py-2">

      <div className="text-[9px] uppercase text-slate-500 font-heading font-bold">
        {label}
      </div>

      <div className="text-[10px] text-slate-200 font-mono font-semibold mt-0.5 truncate">
        {value}
      </div>

    </div>
  );
}

// ============================================================

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone:
    | 'red'
    | 'amber'
    | 'cyan'
    | 'purple';
}) {
  const toneClasses = {
    red: 'text-red-300',
    amber: 'text-amber-300',
    cyan: 'text-cyan-300',
    purple: 'text-purple-300',
  };

  return (
    <div className="rounded-xl bg-[#070b1e] border border-[#1b2554] p-3 min-w-0">

      <div
        className={`flex items-center gap-1.5 text-[10px] uppercase font-heading font-bold ${toneClasses[tone]}`}
      >
        {icon}

        <span className="truncate">
          {label}
        </span>

      </div>

      <div className="text-base sm:text-lg font-bold font-mono text-white mt-1.5 break-words">
        {value}
      </div>

    </div>
  );
}

// ============================================================

function InfoMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#070b1e] border border-[#1b2554] px-3 py-2.5 min-w-0">

      <div className="text-[9px] uppercase text-slate-500 font-heading font-bold">
        {label}
      </div>

      <div className="text-[11px] text-slate-200 font-mono font-semibold mt-1 break-words">
        {value}
      </div>

    </div>
  );
}

// ============================================================

function ActionButton({
  icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'green';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2.5 rounded-xl border text-xs font-bold font-heading transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
        tone === 'green'
          ? 'bg-emerald-500/10 hover:bg-emerald-500/80 border-emerald-500/40 text-emerald-300 hover:text-slate-950'
          : 'bg-[#070b1e] hover:bg-[#0e163d] border-[#1e2c69] text-slate-200 hover:border-cyan-400/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}