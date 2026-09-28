import React, { useState } from 'react';

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
} from 'lucide-react';

import type {
  ThermalEvent,
  AppPage,
} from '../../types';

import IndiaMapVisualization from "../IndiaMapVisualization";
import { TypewriterHeading } from '../TypewriterHeading';

interface DashboardPageProps {
  events: ThermalEvent[];
  selectedEvent: ThermalEvent | null;
  onSelectEvent: (event: ThermalEvent) => void;
  onNavigate: (page: AppPage) => void;
  onViewEventDetails: (event: ThermalEvent) => void;
}

export const DashboardPage: React.FC<
  DashboardPageProps
> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onNavigate,
  onViewEventDetails,
}) => {
  const [filterSeverity, setFilterSeverity] =
    useState<string>('ALL');

  const [filterDistrict, setFilterDistrict] =
    useState<string>('ALL');

  /*
   * Filter currently loaded events.
   *
   * IMPORTANT:
   * The frontend initially receives only 100 events.
   * Full-corpus search is handled separately by
   * EventAnalysisPage -> /events/{event_id}.
   */
  const filteredEvents = events.filter((event) => {
    if (
      filterSeverity !== 'ALL' &&
      event.investigationPriority !== filterSeverity
    ) {
      return false;
    }

    if (
      filterDistrict !== 'ALL' &&
      !String(event.region ?? '')
        .toLowerCase()
        .includes(filterDistrict.toLowerCase()) &&
      !String(event.name ?? '')
        .toLowerCase()
        .includes(filterDistrict.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const districts = [
    'Sonbhadra',
    'Mathura',
    'Kanpur',
    'Prayagraj',
    'Aligarh',
    'Gorakhpur',
    'Lakhimpur',
  ];

  const timelineSteps = [
    {
      time: '08:00 IST',
      label: 'MODIS Aqua pass over UP',
      detail:
        'Singrauli & Sonbhadra basin thermal anomaly logged',
    },
    {
      time: '08:10 IST',
      label: 'VIIRS Suomi-NPP high-gain pass',
      detail:
        'Thermal hotspot detected and added to event stream',
    },
    {
      time: '08:14 IST',
      label: 'Context enrichment completed',
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
      label: 'Investigation workflow active',
      detail:
        'Event prioritized for analyst review',
    },
  ];

  return (
    <div className="space-y-8 select-text">

      {/* =========================================================
          HERO HEADER
      ========================================================= */}

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
            onClick={() => onNavigate('events')}
            className="px-6 py-2.5 rounded-xl border-2 border-cyan-400/80 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] cursor-pointer flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>EXPLORE THERMAL EVENTS</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('investigation')}
            className="px-6 py-2.5 rounded-xl border-2 border-purple-500/80 bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] cursor-pointer flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-purple-400" />
            <span>INVESTIGATION DOCKET</span>
          </button>

        </div>
      </div>


      {/* =========================================================
          STAT CARDS
      ========================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">

        {/* Card 1 */}
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


        {/* Card 2 */}
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


        {/* Card 3 */}
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


        {/* Card 4 */}
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


      {/* =========================================================
          MAP SECTION
      ========================================================= */}

      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">

        {/* Map Header */}

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


          {/* Filters */}

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

                {districts.map((district) => (
                  <option
                    key={district}
                    value={district}
                    className="bg-[#070b1e]"
                  >
                    {district}
                  </option>
                ))}

              </select>

            </div>

          </div>

        </div>


        {/* Map + Right Panel */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Map */}

          <div className="lg:col-span-8 min-h-[460px]">

              <IndiaMapVisualization
               events={filteredEvents}
               selectedEvent={selectedEvent}
               onSelectEvent={onSelectEvent}
            />

          </div>


          {/* Right panel */}

          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">

            {/* Severity */}

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

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">
                    Critical
                  </span>

                  <span className="text-red-400 font-mono font-bold">
                    {
                      events.filter(
                        (event) =>
                          event.investigationPriority ===
                          'CRITICAL',
                      ).length
                    }
                  </span>
                </div>


                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">
                    High Priority
                  </span>

                  <span className="text-orange-400 font-mono font-bold">
                    {
                      events.filter(
                        (event) =>
                          event.investigationPriority ===
                          'HIGH',
                      ).length
                    }
                  </span>
                </div>


                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">
                    Medium
                  </span>

                  <span className="text-amber-400 font-mono font-bold">
                    {
                      events.filter(
                        (event) =>
                          event.investigationPriority ===
                          'MEDIUM',
                      ).length
                    }
                  </span>
                </div>


                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">
                    Low / Controlled
                  </span>

                  <span className="text-emerald-400 font-mono font-bold">
                    {
                      events.filter(
                        (event) =>
                          event.investigationPriority ===
                          'LOW',
                      ).length
                    }
                  </span>
                </div>

              </div>

            </div>


            {/* =====================================================
                SELECTED EVENT CARD

                THIS IS THE IMPORTANT FIX.

                selectedEvent can be null on initial dashboard load.
                Therefore this entire card is rendered only when
                selectedEvent exists.
            ===================================================== */}

            {selectedEvent && (
              <div className="p-4 rounded-2xl bg-[#080d24] border border-[#1c275a] shadow-lg flex-1 flex flex-col justify-between card-hover-glow">

                <div>

                  <div className="flex items-center justify-between text-xs mb-2">

                    <span className="text-[10px] uppercase font-bold font-heading text-slate-400">
                      Selected On Map
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-heading ${
                        selectedEvent.investigationPriority ===
                        'CRITICAL'
                          ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                          : selectedEvent.investigationPriority ===
                            'HIGH'
                          ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
                          : selectedEvent.investigationPriority ===
                            'MEDIUM'
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                          : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                      }`}
                    >
                      {selectedEvent.investigationPriority}{' '}
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
                        {selectedEvent.frpMw} MW
                      </strong>
                    </div>

                    <div>
                      Temp:{' '}
                      <strong className="text-cyan-300 font-mono">
                        {selectedEvent.brightnessTempK} K
                      </strong>
                    </div>

                    <div>
                      Buffer:{' '}
                      <span className="font-medium text-slate-200">
                        {selectedEvent.spatialContext
                          ?.distanceKm ?? '—'}{' '}
                        km
                      </span>
                    </div>

                    <div>
                      Confidence:{' '}
                      <strong className="text-emerald-400 font-mono">
                        {Math.round(
                          (selectedEvent.confidence ?? 0) *
                            100,
                        )}
                        %
                      </strong>
                    </div>

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
          BOTTOM SECTION
      ========================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">

        {/* Timeline */}

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


        {/* Recent Events */}

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
                .map((event) => (
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
                            (event.confidence ?? 0) *
                              100,
                          )}
                          %
                        </div>

                      </div>

                    </div>


                    <div className="flex items-center gap-2.5">

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-heading ${
                          event.investigationPriority ===
                          'CRITICAL'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                            : event.investigationPriority ===
                              'HIGH'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                            : event.investigationPriority ===
                              'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                        }`}
                      >
                        {event.investigationPriority}
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
                ))}

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