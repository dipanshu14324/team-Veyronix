
import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Database,
  Flame,
  Gauge,
  Layers,
  ShieldAlert,
  Target,
  TrendingUp,
} from "lucide-react";

type ThermalEvent = {
  id?: string | number;
  event_id?: string | number;

  name?: string;

  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;

  region?: string;
  state?: string;

  event_date?: string;
  eventDate?: string;
  startTime?: string;
  start_time?: string;

  confidence?: number | string;

  priority?: string;
  investigationPriority?: string;

  priority_score?: number | string;
  priorityScore?: number | string;

  predicted_source?: string;
  predictedSource?: string;
  likelySource?: string;

  probabilities?: Record<string, number | string>;
  source_probabilities?: Record<string, number | string>;
  sourceProbabilities?: Record<string, number | string>;

  is_anomaly?: boolean | number | string;
  isAnomaly?: boolean | number | string;

  anomaly_score?: number | string;
  anomalyScore?: number | string;
  abnormalityScore?: number | string;

  model_available?: boolean;
  modelAvailable?: boolean;

  peak_frp?: number | string;
  mean_frp?: number | string;
  total_frp?: number | string;
};

interface AnalyticsPageProps {
  events: ThermalEvent[];
}

/* ============================================================
   HELPERS
============================================================ */

function safeNumber(
  value: unknown,
  fallback = 0,
): number {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(
    Math.max(value, min),
    max,
  );
}

/* ============================================================
   SOURCE LABEL
============================================================ */

type SourceLabel =
  | "Agriculture / Biomass"
  | "Forest / Natural"
  | "Industrial"
  | "Waste / Other"
  | "Unknown";

/* ============================================================
   EVENT ID
============================================================ */

function getEventId(
  event: ThermalEvent,
): string {
  return String(
    event.id ??
      event.event_id ??
      "unknown",
  );
}

/* ============================================================
   EVENT DATE
============================================================ */

function getEventDate(
  event: ThermalEvent,
): Date | null {
  const raw =
    event.event_date ??
    event.eventDate ??
    event.startTime ??
    event.start_time;

  if (!raw) {
    return null;
  }

  const date = new Date(
    String(raw),
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

/* ============================================================
   CONFIDENCE
============================================================ */

function getConfidence(
  event: ThermalEvent,
): number {
  const value = safeNumber(
    event.confidence,
    0,
  );

  if (value > 1) {
    return clamp(
      value / 100,
      0,
      1,
    );
  }

  return clamp(
    value,
    0,
    1,
  );
}

/* ============================================================
   PRIORITY
============================================================ */

function getPriority(
  event: ThermalEvent,
): string {
  const backendPriority =
    event.investigationPriority ??
    event.priority;

  if (
    backendPriority &&
    String(
      backendPriority,
    ).trim()
  ) {
    return String(
      backendPriority,
    ).toUpperCase();
  }

  const confidence =
    getConfidence(event);

  if (confidence >= 0.85) {
    return "CRITICAL";
  }

  if (confidence >= 0.7) {
    return "HIGH";
  }

  if (confidence >= 0.5) {
    return "MEDIUM";
  }

  return "LOW";
}

/* ============================================================
   PRIORITY SCORE
============================================================ */

function getPriorityScore(
  event: ThermalEvent,
): number {
  const score =
    event.priorityScore ??
    event.priority_score;

  if (
    score !== undefined &&
    score !== null &&
    score !== ""
  ) {
    return clamp(
      safeNumber(score),
      0,
      100,
    );
  }

  return Math.round(
    getConfidence(event) * 100,
  );
}

/* ============================================================
   ANOMALY
============================================================ */

function isAnomalyEvent(
  event: ThermalEvent,
): boolean {
  const raw =
    event.is_anomaly ??
    event.isAnomaly;

  if (
    typeof raw ===
    "boolean"
  ) {
    return raw;
  }

  if (
    typeof raw ===
    "number"
  ) {
    return raw > 0;
  }

  if (
    typeof raw ===
    "string"
  ) {
    const value =
      raw
        .trim()
        .toLowerCase();

    if (
      value === "true" ||
      value === "yes" ||
      value === "1"
    ) {
      return true;
    }

    if (
      value === "false" ||
      value === "no" ||
      value === "0"
    ) {
      return false;
    }
  }

  const anomalyScore =
    event.anomaly_score ??
    event.anomalyScore ??
    event.abnormalityScore;

  const score =
    safeNumber(
      anomalyScore,
      0,
    );

  const normalizedScore =
    score > 1
      ? score / 100
      : score;

  return (
    normalizedScore >= 0.5
  );
}

/* ============================================================
   LIGHTGBM PROBABILITIES
============================================================ */

function getProbabilityMap(
  event: ThermalEvent,
): Record<string, number> {
  const raw =
    event.sourceProbabilities ??
    event.source_probabilities ??
    event.probabilities ??
    {};

  const getValue = (
    ...keys: string[]
  ) => {
    for (const key of keys) {
      if (
        raw[key] !==
        undefined
      ) {
        const value =
          safeNumber(
            raw[key],
            0,
          );

        if (value > 1) {
          return clamp(
            value / 100,
            0,
            1,
          );
        }

        return clamp(
          value,
          0,
          1,
        );
      }
    }

    return 0;
  };

  return {
    Agriculture_Biomass:
      getValue(
        "Agriculture_Biomass",
        "agriculture",
        "agricultural",
        "Agriculture / Biomass",
      ),

    Forest_Natural:
      getValue(
        "Forest_Natural",
        "forest",
        "natural",
        "vegetation",
        "Forest / Natural",
      ),

    Industrial:
      getValue(
        "Industrial",
        "industrial",
        "industry",
      ),

    Waste_Other:
      getValue(
        "Waste_Other",
        "waste",
        "other",
        "Waste / Other",
      ),
  };
}

/* ============================================================
   ACTUAL LIGHTGBM SOURCE
============================================================ */

function getDynamicSource(
  event: ThermalEvent,
): SourceLabel {
  const probabilities =
    getProbabilityMap(
      event,
    );

  const entries: Array<
    [SourceLabel, number]
  > = [
    [
      "Agriculture / Biomass",
      probabilities
        .Agriculture_Biomass,
    ],
    [
      "Forest / Natural",
      probabilities
        .Forest_Natural,
    ],
    [
      "Industrial",
      probabilities
        .Industrial,
    ],
    [
      "Waste / Other",
      probabilities
        .Waste_Other,
    ],
  ];

  const valid =
    entries.filter(
      ([, probability]) =>
        Number.isFinite(
          probability,
        ) &&
        probability > 0,
    );

  if (
    valid.length === 0
  ) {
    return "Unknown";
  }

  const highest =
    valid.reduce(
      (
        best,
        current,
      ) =>
        current[1] >
        best[1]
          ? current
          : best,
    );

  return highest[0];
}

/* ============================================================
   MODEL AVAILABILITY
============================================================ */

function isModelAvailable(
  event: ThermalEvent,
): boolean {
  if (
    event.model_available !==
    undefined
  ) {
    return (
      event.model_available ===
      true
    );
  }

  if (
    event.modelAvailable !==
    undefined
  ) {
    return (
      event.modelAvailable ===
      true
    );
  }

  const probabilities =
    getProbabilityMap(
      event,
    );

  return Object.values(
    probabilities,
  ).some(
    (value) =>
      value > 0,
  );
}

/* ============================================================
   DATE FORMAT
============================================================ */

function formatDate(
  date: Date | null,
): string {
  if (!date) {
    return "Unknown";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

/* ============================================================
   CONFIDENCE FORMAT
============================================================ */

function formatConfidence(
  value: number,
): string {
  return `${Math.round(
    value * 100,
  )}%`;
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export function AnalyticsPage({
  events,
}: AnalyticsPageProps) {
  const [
    selectedSource,
    setSelectedSource,
  ] = useState<
    string | null
  >(null);

  /* ==========================================================
     NORMALIZE EVENTS
  ========================================================== */

  const normalizedEvents =
    useMemo(() => {
      return events.map(
        (event) => {
          const probabilities =
            getProbabilityMap(
              event,
            );

          const dynamicSource =
            getDynamicSource(
              event,
            );

          return {
            ...event,

            eventId:
              getEventId(event),

            confidence:
              getConfidence(event),

            priority:
              getPriority(event),

            priorityScore:
              getPriorityScore(
                event,
              ),

            dynamicSource,

            probabilities,

            anomaly:
              isAnomalyEvent(
                event,
              ),

            date:
              getEventDate(
                event,
              ),

            mlAvailable:
              isModelAvailable(
                event,
              ),
          };
        },
      );
    }, [events]);

  /* ==========================================================
     BASIC METRICS
  ========================================================== */

  const metrics =
    useMemo(() => {
      const total =
        normalizedEvents.length;

      const analyzed =
        normalizedEvents.filter(
          (event) =>
            event.mlAvailable,
        ).length;

      const confidenceTotal =
        normalizedEvents.reduce(
          (sum, event) =>
            sum +
            event.confidence,
          0,
        );

      const averageConfidence =
        total > 0
          ? confidenceTotal /
            total
          : 0;

      const actionable =
        normalizedEvents.filter(
          (event) =>
            event.priority ===
              "HIGH" ||
            event.priority ===
              "CRITICAL",
        ).length;

      const critical =
        normalizedEvents.filter(
          (event) =>
            event.priority ===
            "CRITICAL",
        ).length;

      const anomalies =
        normalizedEvents.filter(
          (event) =>
            event.anomaly,
        ).length;

      return {
        total,
        analyzed,
        averageConfidence,
        actionable,
        critical,
        anomalies,
      };
    }, [normalizedEvents]);

  /* ==========================================================
     DYNAMIC SOURCE EVENT COUNTS

     Each event is assigned to the source having the
     highest actual LightGBM probability.
  ========================================================== */

  const sourceEventCounts =
    useMemo(() => {
      const counts: Record<
        SourceLabel,
        number
      > = {
        "Forest / Natural": 0,
        Industrial: 0,
        "Agriculture / Biomass": 0,
        "Waste / Other": 0,
        Unknown: 0,
      };

      normalizedEvents.forEach(
        (event) => {
          counts[
            event.dynamicSource
          ]++;
        },
      );

      return counts;
    }, [normalizedEvents]);

  /* ==========================================================
     SOURCE DISTRIBUTION

     IMPORTANT:
     Percentages are calculated from classified event counts.

     Therefore:
       Forest %
       + Industrial %
       + Agriculture %
       + Waste %
       = 100%

     Unknown events are excluded from the denominator.
  ========================================================== */

  const sourceAttribution =
    useMemo(() => {
      const classifiedTotal =
        normalizedEvents.filter(
          (event) =>
            event.dynamicSource !==
            "Unknown",
        ).length;

      if (
        classifiedTotal === 0
      ) {
        return {
          "Forest / Natural": 0,
          Industrial: 0,
          "Agriculture / Biomass": 0,
          "Waste / Other": 0,
        };
      }

      const raw = {
        "Forest / Natural":
          (sourceEventCounts[
            "Forest / Natural"
          ] /
            classifiedTotal) *
          100,

        Industrial:
          (sourceEventCounts
            .Industrial /
            classifiedTotal) *
          100,

        "Agriculture / Biomass":
          (sourceEventCounts[
            "Agriculture / Biomass"
          ] /
            classifiedTotal) *
          100,

        "Waste / Other":
          (sourceEventCounts[
            "Waste / Other"
          ] /
            classifiedTotal) *
          100,
      };

      /*
       * Final normalization prevents any floating-point
       * rounding drift and guarantees a 100% total.
       */
      const totalPercentage =
        raw["Forest / Natural"] +
        raw.Industrial +
        raw["Agriculture / Biomass"] +
        raw["Waste / Other"];

      if (
        totalPercentage <= 0
      ) {
        return {
          "Forest / Natural": 0,
          Industrial: 0,
          "Agriculture / Biomass": 0,
          "Waste / Other": 0,
        };
      }

      return {
        "Forest / Natural":
          (raw["Forest / Natural"] /
            totalPercentage) *
          100,

        Industrial:
          (raw.Industrial /
            totalPercentage) *
          100,

        "Agriculture / Biomass":
          (raw[
            "Agriculture / Biomass"
          ] /
            totalPercentage) *
          100,

        "Waste / Other":
          (raw["Waste / Other"] /
            totalPercentage) *
          100,
      };
    }, [
      normalizedEvents,
      sourceEventCounts,
    ]);

  /* ==========================================================
     PRIORITY COUNTS
  ========================================================== */

  const priorityCounts =
    useMemo(() => {
      return {
        CRITICAL:
          normalizedEvents.filter(
            (event) =>
              event.priority ===
              "CRITICAL",
          ).length,

        HIGH:
          normalizedEvents.filter(
            (event) =>
              event.priority ===
              "HIGH",
          ).length,

        MEDIUM:
          normalizedEvents.filter(
            (event) =>
              event.priority ===
              "MEDIUM",
          ).length,

        LOW:
          normalizedEvents.filter(
            (event) =>
              event.priority ===
              "LOW",
          ).length,
      };
    }, [normalizedEvents]);

  /* ==========================================================
     RECENT EVENTS
  ========================================================== */

  const recentEvents =
    useMemo(() => {
      return [
        ...normalizedEvents,
      ]
        .sort(
          (a, b) =>
            (b.date?.getTime() ??
              0) -
            (a.date?.getTime() ??
              0),
        )
        .slice(0, 8);
    }, [normalizedEvents]);

  /* ==========================================================
     SOURCE FILTER
  ========================================================== */

  const filteredEvents =
    useMemo(() => {
      if (
        !selectedSource
      ) {
        return normalizedEvents;
      }

      return normalizedEvents.filter(
        (event) =>
          event.dynamicSource ===
          selectedSource,
      );
    }, [
      normalizedEvents,
      selectedSource,
    ]);

  /* ==========================================================
     MODEL STATUS
  ========================================================== */

  const modelAvailable =
    normalizedEvents.some(
      (event) =>
        event.mlAvailable,
    );

  /* ==========================================================
     SOURCE DISPLAY ORDER
  ========================================================== */

  const sourceDisplay: SourceLabel[] =
    [
      "Forest / Natural",
      "Industrial",
      "Agriculture / Biomass",
      "Waste / Other",
    ];

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-full w-full bg-[#030712] text-white p-4 sm:p-5 lg:p-6">

      {/* HEADER */}

      <div className="mb-6">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="mb-1 flex items-center gap-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10">

                <BrainCircuit className="h-4 w-4 text-cyan-400" />

              </div>

              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-400">
                VEYRONIX AI
              </span>

            </div>

            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              SYSTEM ANALYTICS
            </h1>

            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              LightGBM intelligence, source distribution,
              investigation priority and anomaly monitoring.
            </p>

          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">

            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              {modelAvailable
                ? "ML ENGINE ONLINE"
                : "ML OUTPUT PENDING"}
            </span>

          </div>

        </div>

      </div>

      {/* KPI CARDS */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <MetricCard
          icon={
            <Flame className="h-5 w-5" />
          }
          label="THERMAL EVENTS"
          value={metrics.total.toLocaleString()}
          detail="Events loaded from telemetry"
          tone="orange"
        />

        <MetricCard
          icon={
            <BrainCircuit className="h-5 w-5" />
          }
          label="ML COVERAGE"
          value={
            metrics.total > 0
              ? `${Math.round(
                  (metrics.analyzed /
                    metrics.total) *
                    100,
                )}%`
              : "0%"
          }
          detail={`${metrics.analyzed} events with model output`}
          tone="cyan"
        />

        <MetricCard
          icon={
            <Gauge className="h-5 w-5" />
          }
          label="AVG. CONFIDENCE"
          value={formatConfidence(
            metrics.averageConfidence,
          )}
          detail="LightGBM attribution confidence"
          tone="violet"
        />

        <MetricCard
          icon={
            <ShieldAlert className="h-5 w-5" />
          }
          label="ACTIONABLE EVENTS"
          value={metrics.actionable.toLocaleString()}
          detail={`${metrics.critical} critical events`}
          tone="red"
        />

      </div>

      {/* MAIN ROW */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* SOURCE DISTRIBUTION */}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07101d] xl:col-span-2">

          <div className="border-b border-slate-800 px-5 py-4">

            <div className="flex items-center gap-2">

              <Layers className="h-4 w-4 text-cyan-400" />

              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                THERMAL SOURCE DISTRIBUTION
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-500">
              Predicted source distribution across loaded thermal events.
            </p>

          </div>

          <div className="p-5 space-y-4">

            {sourceDisplay.map(
              (source) => {

                const percentage =
                  sourceAttribution[
                    source as keyof typeof sourceAttribution
                  ] ?? 0;

                const eventCount =
                  sourceEventCounts[
                    source
                  ] ?? 0;

                const active =
                  selectedSource ===
                  source;

                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() =>
                      setSelectedSource(
                        active
                          ? null
                          : source,
                      )
                    }
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-slate-800 bg-slate-950/30 hover:border-slate-700"
                    }`}
                  >

                    <div className="mb-2 flex items-center justify-between gap-4">

                      <div className="flex items-center gap-2">

                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            source ===
                            "Forest / Natural"
                              ? "bg-emerald-400"
                              : source ===
                                  "Industrial"
                                ? "bg-orange-400"
                                : source ===
                                    "Agriculture / Biomass"
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                          }`}
                        />

                        <span className="text-xs font-bold text-slate-200">
                          {source}
                        </span>

                      </div>

                      <div className="text-right">

                        <span className="text-sm font-black text-white">
                          {percentage.toFixed(
                            1,
                          )}
                          %
                        </span>

                        <span className="ml-2 text-[10px] text-slate-500">
                          {eventCount} predicted
                        </span>

                      </div>

                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-900">

                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              percentage,
                            ),
                          )}%`,
                        }}
                      />

                    </div>

                  </button>
                );
              },
            )}

          </div>

        </section>

        {/* PRIORITY */}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07101d]">

          <div className="border-b border-slate-800 px-5 py-4">

            <div className="flex items-center gap-2">

              <Target className="h-4 w-4 text-red-400" />

              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                INVESTIGATION PRIORITY
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-500">
              Backend-generated event escalation levels.
            </p>

          </div>

          <div className="grid grid-cols-2 gap-3 p-5">

            <PriorityCard
              label="CRITICAL"
              count={
                priorityCounts.CRITICAL
              }
              tone="critical"
            />

            <PriorityCard
              label="HIGH"
              count={
                priorityCounts.HIGH
              }
              tone="high"
            />

            <PriorityCard
              label="MEDIUM"
              count={
                priorityCounts.MEDIUM
              }
              tone="medium"
            />

            <PriorityCard
              label="LOW"
              count={
                priorityCounts.LOW
              }
              tone="low"
            />

          </div>

        </section>

      </div>

      {/* SECOND ROW */}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* ANOMALY */}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07101d]">

          <div className="border-b border-slate-800 px-5 py-4">

            <div className="flex items-center gap-2">

              <AlertTriangle className="h-4 w-4 text-amber-400" />

              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                ANOMALY INTELLIGENCE
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-500">
              Backend anomaly flags from thermal behaviour.
            </p>

          </div>

          <div className="p-5">

            <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">

              <div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  FLAGGED EVENTS
                </div>

                <div className="mt-1 text-3xl font-black text-white">
                  {metrics.anomalies}
                </div>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">

                <AlertTriangle className="h-6 w-6 text-amber-400" />

              </div>

            </div>

            <div className="mt-4">

              <div className="mb-2 flex justify-between text-[10px] uppercase tracking-wider">

                <span className="text-slate-500">
                  Anomaly ratio
                </span>

                <span className="font-bold text-amber-300">

                  {metrics.total > 0
                    ? (
                        (metrics.anomalies /
                          metrics.total) *
                        100
                      ).toFixed(
                        1,
                      )
                    : "0.0"}
                  %

                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-900">

                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{
                    width: `${
                      metrics.total >
                      0
                        ? Math.min(
                            100,
                            (metrics.anomalies /
                              metrics.total) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                />

              </div>

            </div>

          </div>

        </section>

        {/* HEALTH */}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07101d]">

          <div className="border-b border-slate-800 px-5 py-4">

            <div className="flex items-center gap-2">

              <Database className="h-4 w-4 text-cyan-400" />

              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                MODEL & DATA HEALTH
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-500">
              Current telemetry and model state.
            </p>

          </div>

          <div className="space-y-3 p-5">

            <HealthItem
              icon={
                <BrainCircuit className="h-4 w-4" />
              }
              label="LightGBM classifier"
              value={
                modelAvailable
                  ? "AVAILABLE"
                  : "UNAVAILABLE"
              }
              ok={modelAvailable}
            />

            <HealthItem
              icon={
                <Activity className="h-4 w-4" />
              }
              label="Telemetry events"
              value={
                metrics.total >
                0
                  ? "CONNECTED"
                  : "NO DATA"
              }
              ok={
                metrics.total >
                0
              }
            />

            <HealthItem
              icon={
                <CheckCircle2 className="h-4 w-4" />
              }
              label="ML analysis"
              value={
                metrics.analyzed ===
                metrics.total
                  ? "COMPLETE"
                  : `${metrics.analyzed}/${metrics.total}`
              }
              ok={
                metrics.total >
                  0 &&
                metrics.analyzed ===
                  metrics.total
              }
            />

            <HealthItem
              icon={
                <TrendingUp className="h-4 w-4" />
              }
              label="Average confidence"
              value={formatConfidence(
                metrics.averageConfidence,
              )}
              ok={
                metrics.averageConfidence >=
                0.7
              }
            />

          </div>

        </section>

        {/* DATA SCOPE */}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07101d]">

          <div className="border-b border-slate-800 px-5 py-4">

            <div className="flex items-center gap-2">

              <Layers className="h-4 w-4 text-violet-400" />

              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                DATA SCOPE
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-500">
              Current analytics dataset.
            </p>

          </div>

          <div className="p-5">

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                EVENTS IN SCOPE
              </div>

              <div className="mt-2 text-4xl font-black text-white">
                {filteredEvents.length.toLocaleString()}
              </div>

              <div className="mt-2 text-xs text-slate-500">

                {selectedSource
                  ? `Filtered by ${selectedSource}`
                  : "All loaded thermal events"}

              </div>

              {selectedSource && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedSource(
                      null,
                    )
                  }
                  className="mt-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-violet-300 hover:bg-violet-500/20"
                >
                  Show all events
                </button>
              )}

            </div>

          </div>

        </section>

      </div>

      {/* RECENT EVENTS */}

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-[#07101d]">

        <div className="border-b border-slate-800 px-5 py-4">

          <div className="flex items-center gap-2">

            <Activity className="h-4 w-4 text-cyan-400" />

            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              RECENT EVENT ACTIVITY
            </h2>

          </div>

          <p className="mt-1 text-xs text-slate-500">
            Latest thermal events received by the analytics layer.
          </p>

        </div>

        <div className="divide-y divide-slate-800">

          {recentEvents.length ===
          0 ? (

            <div className="p-8 text-center">

              <Database className="mx-auto h-8 w-8 text-slate-700" />

              <p className="mt-3 text-xs text-slate-500">
                No thermal events available.
              </p>

            </div>

          ) : (
            recentEvents.map(
              (event) => (
                <div
                  key={
                    event.eventId
                  }
                  className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
                >

                  <div className="min-w-0">

                    <div className="flex items-center gap-2">

                      <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />

                      <span className="truncate text-xs font-bold text-slate-200">
                        {event.name ??
                          event.eventId}
                      </span>

                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">

                      <span>
                        {formatDate(
                          event.date,
                        )}
                      </span>

                      <span>
                        {event.dynamicSource ===
                        "Unknown"
                          ? "Awaiting ML"
                          : event.dynamicSource}
                      </span>

                    </div>

                  </div>

                  <div
                    className={`inline-flex w-fit rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                      event.priority ===
                      "CRITICAL"
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : event.priority ===
                            "HIGH"
                          ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                          : event.priority ===
                              "MEDIUM"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    {event.priority}
                  </div>

                  <div className="text-left sm:text-right">

                    <div className="text-[9px] uppercase tracking-wider text-slate-600">
                      Confidence
                    </div>

                    <div className="text-xs font-black text-cyan-300">
                      {formatConfidence(
                        event.confidence,
                      )}
                    </div>

                  </div>

                  <div className="text-left sm:text-right">

                    <div className="text-[9px] uppercase tracking-wider text-slate-600">
                      Score
                    </div>

                    <div className="text-xs font-black text-white">
                      {event.priorityScore}

                      <span className="ml-0.5 text-slate-600">
                        /100
                      </span>

                    </div>

                  </div>

                </div>
              ),
            )
          )}

        </div>

      </section>

      {/* FOOTER */}

      <div className="mt-5 flex flex-col gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-2">

          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
            ANALYTICS PIPELINE ACTIVE
          </span>

        </div>

        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-600">
          VEYRONIX AI • LIGHTGBM INTELLIGENCE
        </div>

      </div>

    </div>
  );
}

/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone:
    | "orange"
    | "cyan"
    | "violet"
    | "red";
}) {
  const toneClasses = {
    orange:
      "border-orange-500/20 bg-orange-500/5 text-orange-400",

    cyan:
      "border-cyan-500/20 bg-cyan-500/5 text-cyan-400",

    violet:
      "border-violet-500/20 bg-violet-500/5 text-violet-400",

    red:
      "border-red-500/20 bg-red-500/5 text-red-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#07101d] p-4">

      <div className="flex items-start justify-between">

        <div>

          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
            {label}
          </div>

          <div className="mt-2 text-2xl font-black tracking-tight text-white">
            {value}
          </div>

          <div className="mt-1 text-[10px] text-slate-600">
            {detail}
          </div>

        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${toneClasses[tone]}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

/* ============================================================
   PRIORITY CARD
============================================================ */

function PriorityCard({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone:
    | "critical"
    | "high"
    | "medium"
    | "low";
}) {
  const classes = {
    critical:
      "border-red-500/20 bg-red-500/5 text-red-300",

    high:
      "border-orange-500/20 bg-orange-500/5 text-orange-300",

    medium:
      "border-amber-500/20 bg-amber-500/5 text-amber-300",

    low:
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${classes[tone]}`}
    >

      <div className="text-[9px] font-black uppercase tracking-wider opacity-70">
        {label}
      </div>

      <div className="mt-2 text-2xl font-black text-white">
        {count}
      </div>

    </div>
  );
}

/* ============================================================
   HEALTH ITEM
============================================================ */

function HealthItem({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-3">

      <div className="flex min-w-0 items-center gap-3">

        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            ok
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {icon}
        </div>

        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>

      </div>

      <span
        className={`ml-3 shrink-0 text-[9px] font-black uppercase tracking-wider ${
          ok
            ? "text-emerald-400"
            : "text-red-400"
        }`}
      >
        {value}
      </span>

    </div>
  );
}
