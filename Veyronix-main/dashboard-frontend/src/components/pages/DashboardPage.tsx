
import React, { useMemo, useState } from 'react';

import {
  Flame,
  CheckCircle2,
  ArrowRight,
  Filter,
  Eye,
  Clock,
  Layers,
  Shield,
  Satellite,
  Zap,
  RadioTower,
  BarChart3,
} from 'lucide-react';

import type {
  ThermalEvent,
  AppPage,
} from '../../types';

import IndiaMapVisualization from '../IndiaMapVisualization';
import { TypewriterHeading } from '../TypewriterHeading';

interface DashboardPageProps {
  events: ThermalEvent[];
  selectedEvent: ThermalEvent | null;
  onSelectEvent: (event: ThermalEvent) => void;
  onNavigate: (page: AppPage) => void;
  onViewEventDetails: (event: ThermalEvent) => void;
}

/* ============================================================
   PRIORITY NORMALIZATION
   ============================================================ */

type NormalizedPriority =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

/**
 * Backend priority is the source of truth.
 *
 * ML confidence is NOT used here.
 */
function getEventPriority(
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

  if (rawPriority === 'CRITICAL') {
    return 'CRITICAL';
  }

  if (
    rawPriority === 'HIGH' ||
    rawPriority === 'HIGH PRIORITY'
  ) {
    return 'HIGH';
  }

  if (rawPriority === 'MEDIUM') {
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
   * IMPORTANT:
   * This is NOT ML confidence.
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

/* ============================================================
   PRIORITY COLORS
   ============================================================ */

function getPriorityColor(
  priority: NormalizedPriority,
): string {
  switch (priority) {
    case 'CRITICAL':
      return '#ef4444';

    case 'HIGH':
      return '#f97316';

    case 'MEDIUM':
      return '#f59e0b';

    default:
      return '#10b981';
  }
}

/* ============================================================
   DASHBOARD
   ============================================================ */

export const DashboardPage: React.FC<
  DashboardPageProps
> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onNavigate,
  onViewEventDetails,
}) => {
  const [
    filterSeverity,
    setFilterSeverity,
  ] = useState<string>('ALL');

  const [
    filterDistrict,
    setFilterDistrict,
  ] = useState<string>('ALL');

  /* ==========================================================
     STABLE EVENT SEVERITY COUNTS
     ========================================================== */

  const severityCounts = useMemo(() => {
    const counts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    for (const event of events) {
      const priority =
        getEventPriority(event);

      counts[priority] += 1;
    }

    return counts;
  }, [events]);

  const totalSeverityEvents =
    events.length;

  const maxSeverityCount =
    Math.max(
      severityCounts.CRITICAL,
      severityCounts.HIGH,
      severityCounts.MEDIUM,
      severityCounts.LOW,
      1,
    );

  /* ==========================================================
     FILTERED EVENTS
     ========================================================== */

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventPriority =
        getEventPriority(event);

      if (
        filterSeverity !== 'ALL' &&
        eventPriority !==
          filterSeverity
      ) {
        return false;
      }

      if (
        filterDistrict !== 'ALL' &&
        !String(event.region ?? '')
          .toLowerCase()
          .includes(
            filterDistrict.toLowerCase(),
          ) &&
        !String(event.name ?? '')
          .toLowerCase()
          .includes(
            filterDistrict.toLowerCase(),
          )
      ) {
        return false;
      }

      return true;
    });
  }, [
    events,
    filterSeverity,
    filterDistrict,
  ]);

  /* ==========================================================
     DISTRICTS
     ========================================================== */

  const districts = [
    'Sonbhadra',
    'Mathura',
    'Kanpur',
    'Prayagraj',
    'Aligarh',
    'Gorakhpur',
    'Lakhimpur',
  ];

  /* ==========================================================
     SATELLITE PASS TIMELINE
     ========================================================== */

  const timelineSteps = [
    {
      time: '08:00 IST',
      label: 'MODIS Aqua',
      detail:
        'Singrauli & Sonbhadra basin thermal anomaly logged',
    },
    {
      time: '08:10 IST',
      label:
        'VIIRS Suomi-NPP high-gain pass',
      detail:
        'Thermal hotspot detected and added to event stream',
    },
    {
      time: '08:14 IST',
      label:
        'Context enrichment completed',
      detail:
        'Industrial infrastructure and spatial context fused',
    },
    {
      time: '08:16 IST',
      label: 'Attribution generated',
      detail:
        'Thermal event source attribution calculated',
    },
    {
      time: '08:20 IST',
      label:
        'Investigation workflow active',
      detail:
        'Event prioritized for analyst review',
    },
  ];

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="space-y-8 select-text">

      {/* =======================================================
          HERO HEADER
      ======================================================= */}

      <div className="text-center py-6 sm:py-8 px-4 flex flex-col items-center justify-center relative select-text">

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-2xl h-32 bg-cyan-500/15 blur-3xl pointer-events-none rounded-full" />

        <div className="mb-3">

          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-heading font-semibold uppercase tracking-widest border border-cyan-400/60 bg-cyan-950/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]">

            <Satellite className="w-3.5 h-3.5 text-cyan-400" />

            <span>
              NASA FIRMS • INDIA SATELLITE SURVEILLANCE
            </span>

          </span>

        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-wide text-white font-sans-clean">
          VEYRONIX
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-3xl mx-auto mt-3 font-sans-clean leading-relaxed">
          From Hotspot to Context — Evidence-Based Thermal Event Investigation,
          Source Attribution, and Priority Intelligence.
        </p>

        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">

          <button
            type="button"
            onClick={() =>
              onNavigate('events')
            }
            className="px-6 py-2.5 rounded-xl border-2 border-cyan-400/80 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] cursor-pointer flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-cyan-400" />

            <span>
              EXPLORE THERMAL EVENTS
            </span>

          </button>

          <button
            type="button"
            onClick={() =>
              onNavigate('investigation')
            }
            className="px-6 py-2.5 rounded-xl border-2 border-purple-500/80 bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] cursor-pointer flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-purple-400" />

            <span>
              INVESTIGATION DOCKET
            </span>

          </button>

        </div>
      </div>

      {/* =======================================================
          STAT CARDS
      ======================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">

        {/* FIRMS HOTSPOTS */}

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b102b]/90 border border-[#1d2958] shadow-[0_4px_25px_rgba(0,0,0,0.5)] card-hover-glow group cursor-pointer">

          <div className="flex items-center justify-between text-slate-400">

            <span className="text-[11px] font-heading font-semibold uppercase tracking-wider">
              FIRMS HOTSPOTS
            </span>

            <RadioTower className="w-4 h-4 text-cyan-400 group-hover:scale-125 transition-transform duration-300" />

          </div>

          <div className="mt-3 flex items-baseline gap-2">

            <span className="text-3xl sm:text-4xl font-bold font-heading text-white neon-glow-cyan">
              {events.length}
            </span>

            <span className="text-xs font-semibold text-emerald-400 font-mono">
              LOADED
            </span>

          </div>

          <p className="text-[11px] text-slate-400 mt-1 font-sans-clean">
            Initial dashboard event set
          </p>

        </div>

        {/* TRIAGE */}

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b102b]/90 border border-[#1d2958] shadow-[0_4px_25px_rgba(0,0,0,0.5)] card-hover-glow group cursor-pointer">

          <div className="flex items-center justify-between text-slate-400">

            <span className="text-[11px] font-heading font-semibold uppercase tracking-wider">
              TRIAGE
            </span>

            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-125 transition-transform duration-300" />

          </div>

          <div className="mt-3 flex items-baseline gap-2">

            <span className="text-3xl sm:text-4xl font-bold font-heading text-white neon-glow-cyan">
              AI
            </span>

            <span className="text-xs font-semibold text-emerald-300 font-mono">
              ENABLED
            </span>

          </div>

          <p className="text-[11px] text-slate-400 mt-1 font-sans-clean">
            Event-level source attribution
          </p>

        </div>

        {/* DATA SOURCES */}

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b102b]/90 border border-[#1d2958] shadow-[0_4px_25px_rgba(0,0,0,0.5)] card-hover-glow group cursor-pointer">

          <div className="flex items-center justify-between text-slate-400">

            <span className="text-[11px] font-heading font-semibold uppercase tracking-wider">
              DATA SOURCES
            </span>

            <Clock className="w-4 h-4 text-purple-400 group-hover:scale-125 transition-transform duration-300" />

          </div>

          <div className="mt-3 flex items-baseline gap-2">

            <span className="text-3xl sm:text-4xl font-bold font-heading text-white neon-glow-purple">
              3+
            </span>

            <span className="text-xs font-semibold text-purple-300 font-mono">
              SOURCES
            </span>

          </div>

          <p className="text-[11px] text-slate-400 mt-1 font-sans-clean">
            FIRMS • OSM • Sentinel context
          </p>

        </div>

        {/* ML ENGINE */}

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b102b]/90 border border-[#1d2958] shadow-[0_4px_25px_rgba(0,0,0,0.5)] card-hover-glow group cursor-pointer">

          <div className="flex items-center justify-between text-slate-400">

            <span className="text-[11px] font-heading font-semibold uppercase tracking-wider">
              ML ENGINE
            </span>

            <Zap className="w-4 h-4 text-red-400 group-hover:scale-125 transition-transform duration-300" />

          </div>

          <div className="mt-3 flex items-baseline gap-2">

            <span className="text-3xl sm:text-4xl font-bold font-heading text-white neon-glow-cyan">
              LGBM
            </span>

            <span className="text-xs font-semibold text-red-400 font-mono">
              ACTIVE
            </span>

          </div>

          <p className="text-[11px] text-slate-400 mt-1 font-sans-clean">
            Real VEYRONIX source classifier
          </p>

        </div>

      </div>

      {/* =======================================================
          MAP SECTION
      ======================================================= */}

      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1b2554]">

          <div>

            <TypewriterHeading
              as="h2"
              text="Thermal Event Map & Spatial Matrix"
              className="text-lg sm:text-xl font-bold text-white font-mono"
              glow={true}
              glowColor="cyan"
              subtext="Click a thermal event to inspect its location, evidence, and ML attribution."
            />

          </div>

          {/* FILTERS */}

          <div className="flex items-center gap-2 flex-wrap">

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#070b1e] border border-[#1e2c69] text-xs">

              <Filter className="w-3.5 h-3.5 text-cyan-400" />

              <select
                value={filterSeverity}
                onChange={(event) =>
                  setFilterSeverity(
                    event.target.value,
                  )
                }
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
              >

                <option
                  value="ALL"
                  className="bg-[#070b1e]"
                >
                  All Severities
                </option>

                <option
                  value="CRITICAL"
                  className="bg-[#070b1e]"
                >
                  Critical
                </option>

                <option
                  value="HIGH"
                  className="bg-[#070b1e]"
                >
                  High
                </option>

                <option
                  value="MEDIUM"
                  className="bg-[#070b1e]"
                >
                  Medium
                </option>

                <option
                  value="LOW"
                  className="bg-[#070b1e]"
                >
                  Low
                </option>

              </select>

            </div>

            <div className="px-3 py-1.5 rounded-xl bg-[#070b1e] border border-[#1e2c69] text-xs">

              <select
                value={filterDistrict}
                onChange={(event) =>
                  setFilterDistrict(
                    event.target.value,
                  )
                }
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
              >

                <option
                  value="ALL"
                  className="bg-[#070b1e]"
                >
                  All Regions
                </option>

                {districts.map(
                  (district) => (
                    <option
                      key={district}
                      value={district}
                      className="bg-[#070b1e]"
                    >
                      {district}
                    </option>
                  ),
                )}

              </select>

            </div>

          </div>

        </div>

        {/* =====================================================
            MAP + RIGHT PANEL
        ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* MAP */}

          <div className="lg:col-span-8 min-h-[460px]">

            <IndiaMapVisualization
              events={filteredEvents}
              selectedEvent={selectedEvent}
              onSelectEvent={
                onSelectEvent
              }
            />

          </div>

          {/* RIGHT PANEL */}

          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">

            {/* EVENT SEVERITY */}

            <div className="p-4 rounded-2xl bg-[#080d24] border border-[#1c275a] shadow-lg">

              <TypewriterHeading
                as="h3"
                text="EVENT SEVERITY"
                className="text-xs font-bold uppercase text-cyan-300 mb-3 pb-2 border-b border-[#1b2554]"
                glow={true}
                glowColor="cyan"
                speed={25}
              />

              <div className="space-y-2.5 text-xs">

                {(
                  [
                    [
                      'Critical',
                      'CRITICAL',
                      'text-red-400',
                    ],
                    [
                      'High Priority',
                      'HIGH',
                      'text-orange-400',
                    ],
                    [
                      'Medium',
                      'MEDIUM',
                      'text-amber-400',
                    ],
                    [
                      'Low / Controlled',
                      'LOW',
                      'text-emerald-400',
                    ],
                  ] as const
                ).map(
                  ([
                    label,
                    priority,
                    textColor,
                  ]) => (
                    <div
                      key={priority}
                      className="flex items-center justify-between"
                    >

                      <span className="font-semibold text-slate-200">
                        {label}
                      </span>

                      <span
                        className={`${textColor} font-mono font-bold`}
                      >
                        {
                          severityCounts[
                            priority
                          ]
                        }
                      </span>

                    </div>
                  ),
                )}

              </div>

              <div className="mt-3 pt-3 border-t border-[#1b2554] flex items-center justify-between">

                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  Total Events
                </span>

                <span className="text-xs font-mono font-bold text-cyan-300">
                  {totalSeverityEvents}
                </span>

              </div>

            </div>

            {/* SELECTED EVENT */}

            {selectedEvent && (
              <div className="p-4 rounded-2xl bg-[#080d24] border border-[#1c275a] shadow-lg flex-1 flex flex-col justify-between card-hover-glow">

                <div>

                  <div className="flex items-center justify-between text-xs mb-2">

                    <span className="text-[10px] uppercase font-bold font-heading text-slate-400">
                      Selected On Map
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-heading ${
                        getEventPriority(
                          selectedEvent,
                        ) ===
                        'CRITICAL'
                          ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                          : getEventPriority(
                                selectedEvent,
                              ) === 'HIGH'
                          ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
                          : getEventPriority(
                                selectedEvent,
                              ) === 'MEDIUM'
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                          : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                      }`}
                    >
                      {
                        getEventPriority(
                          selectedEvent,
                        )
                      }{' '}
                      PRIORITY
                    </span>

                  </div>

                  <h4 className="text-base sm:text-lg font-bold font-heading text-white">
                    {selectedEvent.name}
                  </h4>

                  <div className="text-xs text-slate-400 mt-0.5 font-mono">
                    ID: {selectedEvent.id} •{' '}
                    {selectedEvent.region}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300 p-2.5 rounded-xl bg-[#050816] border border-[#1b2554]">

                    <div>
                      FRP:{' '}
                      <strong className="text-red-400 font-mono">
                        {
                          selectedEvent.frpMw
                        }{' '}
                        MW
                      </strong>
                    </div>

                    <div>
                      Temp:{' '}
                      <strong className="text-cyan-300 font-mono">
                        {
                          selectedEvent.brightnessTempK
                        }{' '}
                        K
                      </strong>
                    </div>

                    <div>
                      Buffer:{' '}
                      <span className="font-medium text-slate-200">
                        {
                          selectedEvent
                            .spatialContext
                            ?.distanceKm ??
                          '—'
                        }{' '}
                        km
                      </span>
                    </div>

                    <div>
                      Confidence:{' '}
                      <strong className="text-emerald-400 font-mono">
                        {Math.round(
                          (
                            selectedEvent.confidence ??
                            0
                          ) * 100,
                        )}
                        %
                      </strong>
                    </div>

                  </div>

                  <div className="mt-2 text-[10px] text-slate-500">
                    Severity is from backend priority •
                    Confidence is ML source attribution
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    onViewEventDetails(
                      selectedEvent,
                    )
                  }
                  id="btn-inspect-selected"
                  className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold font-heading uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer box-interactive-glow"
                >
                  <span>
                    OPEN EVENT ANALYSIS
                  </span>

                  <ArrowRight className="w-4 h-4 text-slate-950" />

                </button>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* =========================================================
          RESTORED GRAPH
      ========================================================= */}

      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-6 shadow-xl card-hover-glow">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#1b2554]">

          <div className="flex items-center gap-2">

            <BarChart3 className="w-4 h-4 text-cyan-400" />

            <div>

              <TypewriterHeading
                as="h3"
                text="THERMAL EVENT SEVERITY GRAPH"
                className="text-xs sm:text-sm font-bold uppercase text-cyan-300"
                glow={true}
                glowColor="cyan"
                speed={20}
              />

              <p className="text-[10px] text-slate-500 mt-1">
                Backend priority distribution across loaded thermal events
              </p>

            </div>

          </div>

          <div className="text-[10px] font-mono text-slate-500">
            {events.length} EVENTS
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* CRITICAL */}

          {(
            [
              {
                label: 'CRITICAL',
                count:
                  severityCounts.CRITICAL,
                description:
                  'Immediate review',
              },
              {
                label: 'HIGH',
                count:
                  severityCounts.HIGH,
                description:
                  'Priority review',
              },
              {
                label: 'MEDIUM',
                count:
                  severityCounts.MEDIUM,
                description:
                  'Analyst review',
              },
              {
                label: 'LOW',
                count:
                  severityCounts.LOW,
                description:
                  'Controlled',
              },
            ] as const
          ).map(
            (item) => {
              const percentage =
                totalSeverityEvents >
                0
                  ? (
                      (item.count /
                        totalSeverityEvents) *
                      100
                    )
                  : 0;

              const barWidth =
                maxSeverityCount >
                0
                  ? (
                      (item.count /
                        maxSeverityCount) *
                      100
                    )
                  : 0;

              const color =
                getPriorityColor(
                  item.label,
                );

              return (
                <div
                  key={
                    item.label
                  }
                  className="rounded-2xl bg-[#070b20] border border-[#1b2554] p-4"
                >

                  <div className="flex items-center justify-between mb-3">

                    <span
                      className="text-[11px] font-bold font-heading tracking-wider"
                      style={{
                        color,
                      }}
                    >
                      {item.label}
                    </span>

                    <span className="text-xl font-bold font-mono text-white">
                      {item.count}
                    </span>

                  </div>

                  <div className="h-3 rounded-full bg-[#101936] overflow-hidden">

                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor:
                          color,
                        boxShadow: `0 0 12px ${color}80`,
                      }}
                    />

                  </div>

                  <div className="flex items-center justify-between mt-2">

                    <span className="text-[10px] text-slate-500">
                      {item.description}
                    </span>

                    <span className="text-[10px] font-mono text-slate-300">
                      {percentage.toFixed(
                        1,
                      )}
                      %
                    </span>

                  </div>

                </div>
              );
            },
          )}

        </div>

        {/* VISUAL GRAPH */}

        <div className="mt-6 h-48 sm:h-56 flex items-end justify-around gap-4 px-4 sm:px-10 border-b border-[#1b2554]">

          {(
            [
              {
                label: 'CRITICAL',
                count:
                  severityCounts.CRITICAL,
                color:
                  getPriorityColor(
                    'CRITICAL',
                  ),
              },
              {
                label: 'HIGH',
                count:
                  severityCounts.HIGH,
                color:
                  getPriorityColor(
                    'HIGH',
                  ),
              },
              {
                label: 'MEDIUM',
                count:
                  severityCounts.MEDIUM,
                color:
                  getPriorityColor(
                    'MEDIUM',
                  ),
              },
              {
                label: 'LOW',
                count:
                  severityCounts.LOW,
                color:
                  getPriorityColor(
                    'LOW',
                  ),
              },
            ] as const
          ).map(
            (item) => {
              const height =
                maxSeverityCount >
                0
                  ? Math.max(
                      item.count ===
                        0
                        ? 0
                        : 8,
                      (
                        item.count /
                        maxSeverityCount
                      ) * 100,
                    )
                  : 0;

              return (
                <div
                  key={
                    item.label
                  }
                  className="h-full flex-1 max-w-[100px] flex flex-col items-center justify-end"
                >

                  <div className="mb-2 text-xs font-mono font-bold text-white">
                    {item.count}
                  </div>

                  <div
                    className="w-full max-w-[64px] rounded-t-xl transition-all duration-700"
                    style={{
                      height: `${height}%`,
                      minHeight:
                        item.count >
                        0
                          ? '8px'
                          : '0px',
                      backgroundColor:
                        item.color,
                      boxShadow: `0 0 18px ${item.color}55`,
                    }}
                  />

                  <div
                    className="mt-3 mb-2 text-[9px] sm:text-[10px] font-bold font-heading"
                    style={{
                      color:
                        item.color,
                    }}
                  >
                    {item.label}
                  </div>

                </div>
              );
            },
          )}

        </div>

        <div className="mt-3 text-[10px] text-slate-500 font-mono text-center">
          Severity counts are calculated from backend event priority.
          Selecting a hotspot does not modify this graph.
        </div>

      </div>

      {/* =========================================================
          BOTTOM SECTION
      ========================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">

        {/* =======================================================
            SATELLITE PASS TIMELINE
        ======================================================= */}

        <div className="lg:col-span-5 bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-5 shadow-xl card-hover-glow">

          <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-[#1b2554]">

            <Clock className="w-4 h-4 text-cyan-400" />

            <TypewriterHeading
              as="h3"
              text="SATELLITE PASS TIMELINE"
              className="text-xs font-bold uppercase text-cyan-300"
              glow={true}
              glowColor="cyan"
              speed={20}
            />

          </div>

          <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1e2a60]">

            {timelineSteps.map(
              (step, index) => (
                <div
                  key={`${step.time}-${index}`}
                  className="relative group"
                >

                  <span className="absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full bg-[#070b1e] border-2 border-cyan-400 shadow-[0_0_8px_#06b6d4]" />

                  <div className="text-[11px] font-bold font-mono text-cyan-400">
                    {step.time}
                  </div>

                  <div className="text-xs font-bold font-heading text-white mt-0.5">
                    {step.label}
                  </div>

                  <div className="text-[11px] text-slate-400 mt-0.5 font-sans-clean">
                    {step.detail}
                  </div>

                </div>
              ),
            )}

          </div>

        </div>

        {/* =======================================================
            RECENT EVENTS
        ======================================================= */}

        <div className="lg:col-span-7 bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between card-hover-glow">

          <div>

            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#1b2554]">

              <div className="flex items-center gap-2">

                <Flame className="w-4 h-4 text-red-400" />

                <TypewriterHeading
                  as="h3"
                  text="SATELLITE OBSERVATIONS"
                  className="text-xs font-bold uppercase text-white"
                  glow={true}
                  glowColor="white"
                  speed={20}
                />

              </div>

              <button
                type="button"
                onClick={() =>
                  onNavigate('events')
                }
                className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline font-semibold cursor-pointer"
              >
                View All Events ({events.length}) →
              </button>

            </div>

            <div className="divide-y divide-[#18224d]">

              {events
                .slice(0, 4)
                .map((event) => {
                  const priority =
                    getEventPriority(
                      event,
                    );

                  return (
                    <div
                      key={event.id}
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#0e163d]/60 px-2 rounded-xl transition-colors"
                    >

                      <div className="flex items-center gap-3">

                        <span className="text-xs font-bold font-mono text-cyan-300">
                          {event.id}
                        </span>

                        <div>

                          <div className="text-xs font-semibold text-white font-heading">
                            {event.name}
                          </div>

                          <div className="text-[11px] text-slate-400 font-mono">

                            {event.region} • FRP:{' '}

                            <strong className="text-red-400">
                              {event.frpMw} MW
                            </strong>{' '}

                            • Conf:{' '}

                            {Math.round(
                              (
                                event.confidence ??
                                0
                              ) * 100,
                            )}
                            %

                          </div>

                        </div>

                      </div>

                      <div className="flex items-center gap-2.5">

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-heading ${
                            priority ===
                            'CRITICAL'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                              : priority ===
                                'HIGH'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                              : priority ===
                                'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          }`}
                        >
                          {priority}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            onViewEventDetails(
                              event,
                            )
                          }
                          id={`btn-view-${event.id}`}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/50 text-xs font-semibold text-cyan-300 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)] flex items-center gap-1"
                        >

                          <Eye className="w-3 h-3" />

                          <span>
                            VIEW
                          </span>

                        </button>

                      </div>

                    </div>
                  );
                })}

            </div>

          </div>

          <div className="pt-3 border-t border-[#1b2554] flex items-center justify-between text-[11px] text-slate-400">

            <span>
              VEYRONIX satellite thermal-event stream
            </span>

            <button
              type="button"
              onClick={() =>
                onNavigate('live-monitor')
              }
              className="text-cyan-400 hover:underline font-semibold"
            >
              Open Live Monitor →
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

