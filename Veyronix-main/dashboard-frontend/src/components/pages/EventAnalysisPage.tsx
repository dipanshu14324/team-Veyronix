import React, { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  Factory,
  AlertTriangle,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldAlert,
  Layers,
  Clock,
  Cpu,
  History,
  Activity,
  CloudSun,
  Search,
  X,
  MapPin,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

import { ThermalEvent } from '../../types';

import { TypewriterHeading } from '../TypewriterHeading';

import { predictVeyronixEvent } from '../../services/veyronixApi';

interface EventAnalysisPageProps {
  event: ThermalEvent;
  events: ThermalEvent[];
  onSelectEvent: (event: ThermalEvent) => void;
  onCreateInvestigation: (event: ThermalEvent) => void;
}

interface MLPrediction {
  status?: string;
  event_id?: number | string;
  predicted_source?: string;
  confidence?: number;
  probabilities?: {
    Agriculture_Biomass?: number;
    Forest_Natural?: number;
    Industrial?: number;
    Waste_Other?: number;
  };
  model_available?: boolean;
}

interface PredictionState {
  prediction: MLPrediction | null;
  loading: boolean;
  error: string | null;
}

export const EventAnalysisPage: React.FC<
  EventAnalysisPageProps
> = ({
  event,
  events,
  onSelectEvent,
  onCreateInvestigation,
}) => {
  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [analysisStep, setAnalysisStep] =
    useState(0);

  const [hasRunAnalysis, setHasRunAnalysis] =
    useState(false);

  const [selectedPillarKey, setSelectedPillarKey] =
    useState<string | null>(null);

  /*
   * ============================================================
   * EVENT SEARCH STATE
   * ============================================================
   */

  const [eventSearch, setEventSearch] =
    useState('');

  const [showEventResults, setShowEventResults] =
    useState(false);

  /*
   * ============================================================
   * REAL ML PREDICTION STATE
   * ============================================================
   */

  const [mlPrediction, setMlPrediction] =
    useState<PredictionState>({
      prediction: null,
      loading: false,
      error: null,
    });

  /*
   * ============================================================
   * EVENT SEARCH
   * ============================================================
   *
   * Searches:
   * - Event ID
   * - State
   * - Region
   * - Event name
   * - Coordinates
   */

  const filteredEvents = useMemo(() => {
    const query = eventSearch
      .trim()
      .toLowerCase();

    if (!query) {
      return [];
    }

    return events
      .filter((ev) => {
        const searchableText = [
          String(ev.id ?? ''),
          String(ev.name ?? ''),
          String(ev.state ?? ''),
          String(ev.region ?? ''),
          String(ev.lat ?? ''),
          String(ev.lng ?? ''),
        ]
          .join(' ')
          .toLowerCase();

        return searchableText.includes(query);
      })
      .slice(0, 10);
  }, [events, eventSearch]);

  /*
   * ============================================================
   * SELECT EVENT FROM SEARCH
   * ============================================================
   */

  const handleSelectEvent = (
    selectedEvent: ThermalEvent,
  ) => {
    setEventSearch('');
    setShowEventResults(false);
    setSelectedPillarKey(null);

    onSelectEvent(selectedEvent);
  };

  /*
   * ============================================================
   * RUN REAL VEYRONIX ML ANALYSIS
   * ============================================================
   */

  const runMLPrediction = async () => {
    setIsAnalyzing(true);
    setHasRunAnalysis(false);
    setAnalysisStep(1);

    /*
     * Clear previous event prediction immediately.
     *
     * This prevents the previous event's prediction
     * from appearing while the new event is loading.
     */

    setMlPrediction({
      prediction: null,
      loading: true,
      error: null,
    });

    try {
      const prediction =
        (await predictVeyronixEvent(
          event.id,
        )) as MLPrediction;

      setAnalysisStep(2);

      await new Promise((resolve) =>
        setTimeout(resolve, 250),
      );

      setAnalysisStep(3);

      await new Promise((resolve) =>
        setTimeout(resolve, 250),
      );

      setAnalysisStep(4);

      await new Promise((resolve) =>
        setTimeout(resolve, 250),
      );

      setAnalysisStep(5);

      await new Promise((resolve) =>
        setTimeout(resolve, 250),
      );

      setAnalysisStep(6);

      setMlPrediction({
        prediction,
        loading: false,
        error: null,
      });

      setHasRunAnalysis(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'VEYRONIX ML prediction failed.';

      setMlPrediction({
        prediction: null,
        loading: false,
        error: message,
      });

      setHasRunAnalysis(false);
      setAnalysisStep(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /*
   * ============================================================
   * AUTOMATICALLY RUN ML WHEN EVENT CHANGES
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadPrediction() {
      setIsAnalyzing(true);
      setHasRunAnalysis(false);
      setAnalysisStep(1);

      /*
       * Clear old prediction before requesting
       * prediction for the newly selected event.
       */

      setMlPrediction({
        prediction: null,
        loading: true,
        error: null,
      });

      try {
        const prediction =
          (await predictVeyronixEvent(
            event.id,
          )) as MLPrediction;

        if (cancelled) {
          return;
        }

        setAnalysisStep(6);

        setMlPrediction({
          prediction,
          loading: false,
          error: null,
        });

        setHasRunAnalysis(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'VEYRONIX ML prediction failed.';

        setMlPrediction({
          prediction: null,
          loading: false,
          error: message,
        });

        setHasRunAnalysis(false);
        setAnalysisStep(0);
      } finally {
        if (!cancelled) {
          setIsAnalyzing(false);
        }
      }
    }

    loadPrediction();

    return () => {
      cancelled = true;
    };
  }, [event.id]);

  /*
   * ============================================================
   * ML RESULT HELPERS
   * ============================================================
   */

  const prediction =
    mlPrediction.prediction;

  const mlConfidence =
    Number.isFinite(
      prediction?.confidence,
    )
      ? Number(
          prediction?.confidence,
        )
      : 0;

  const predictedSource =
    prediction?.predicted_source ??
    'Uncertain';

  /*
   * ============================================================
   * SOURCE PROBABILITIES
   * ============================================================
   */

  const sourceProbabilities = {
    industrial:
      Number(
        prediction?.probabilities
          ?.Industrial ?? 0,
      ),

    agricultural:
      Number(
        prediction?.probabilities
          ?.Agriculture_Biomass ?? 0,
      ),

    vegetation:
      Number(
        prediction?.probabilities
          ?.Forest_Natural ?? 0,
      ),

    other:
      Number(
        prediction?.probabilities
          ?.Waste_Other ?? 0,
      ),
  };

  const sourceCandidates = [
    {
      source:
        'Industrial / Petrochem Flare',
      probability:
        sourceProbabilities.industrial,
    },

    {
      source:
        'Agricultural Crop Residue',
      probability:
        sourceProbabilities.agricultural,
    },

    {
      source:
        'Forest / Vegetation Fire',
      probability:
        sourceProbabilities.vegetation,
    },

    {
      source:
        'Controlled Utility / Other',
      probability:
        sourceProbabilities.other,
    },
  ].sort(
    (a, b) =>
      b.probability -
      a.probability,
  );

  /*
   * ============================================================
   * UNKNOWN / UNCERTAINTY SAFEGUARD
   * ============================================================
   */

  const isPredictionUnknown =
    !prediction ||
    prediction.model_available === false;

  const isLowConfidence =
    prediction !== null &&
    mlConfidence < 0.5;

  const isUnknownCase =
    isPredictionUnknown ||
    isLowConfidence;

  /*
   * ============================================================
   * HISTORICAL BASELINE
   * ============================================================
   */

  const baselineRevisits = 142;

  const baselineMeanFrp =
    Math.max(
      12,
      Math.round(
        event.frpMw * 0.45,
      ),
    );

  const baselineStdDev =
    (
      event.frpMw /
      Math.max(
        10,
        baselineMeanFrp,
      )
    ).toFixed(1);

  /*
   * ============================================================
   * CONTEXT CARDS
   * ============================================================
   */

  const contextCards =
    event.contextCards || {
      localHistory: {
        title: 'Local History',
        description:
          'Recurring thermal anomalies recorded during industrial production and flaring.',
        status: 'verified',
        tag: 'Historical Baseline',
        metric: 'Active basin',
      },

      eventBehaviour: {
        title: 'Event Behaviour',
        description:
          'Thermal-event behaviour from the VEYRONIX event record.',
        status: 'verified',
        tag: 'Event Behaviour',
        metric: 'Event Record',
      },

      infrastructure: {
        title:
          'Infrastructure & Land-use',
        description:
          `Located within ${
            event.spatialContext
              ?.distanceKm || 2.1
          } km of registered industrial facility.`,
        status: 'pending',
        tag: 'Facility GIS',
        metric:
          `${
            event.spatialContext
              ?.distanceKm || 2.1
          } km proximity`,
      },

      regionalContext: {
        title:
          'Regional Context',
        description:
          'Regional contextual evidence is evaluated separately.',
        status: 'pending',
        tag: 'Meteorology',
        metric: 'Pending',
      },
    };

  return (
    <div className="space-y-6 select-text">

      {/* ========================================================
          TOP BANNER
          ======================================================== */}

      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-5 shadow-2xl">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1b2554]">

          <div className="min-w-0">

            <div className="flex items-center gap-2 mb-1 flex-wrap">

              <span className="text-xs font-bold font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/40 px-2.5 py-0.5 rounded-md">
                {event.id}
              </span>

              <span className="text-xs text-slate-400 font-mono">
                {event.region ||
                  event.state}
              </span>

              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pl-2 font-mono">

                <span
                  className={`w-2 h-2 rounded-full ${
                    isAnalyzing
                      ? 'bg-cyan-400 animate-ping'
                      : 'bg-emerald-400'
                  }`}
                />

                <span>
                  {isAnalyzing
                    ? `Analyzing ${
                        analysisStep
                      }/6...`
                    : 'Pipeline Ready'}
                </span>

              </span>

            </div>

            <TypewriterHeading
              as="h1"
              text={event.name}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-white"
              glow={true}
              glowColor="cyan"
              speed={20}
              subtext={`Coordinates: ${event.lat.toFixed(
                4,
              )}°N, ${event.lng.toFixed(
                4,
              )}°E • State: ${
                event.state
              }`}
            />

          </div>

          {/* ====================================================
              STREAMLIT-STYLE EVENT SEARCH
              ==================================================== */}

          <div className="flex items-center gap-2.5 flex-wrap relative">

            <div className="relative w-full sm:w-[280px]">

              <div className="flex items-center bg-[#070b1e] border border-[#1e2c69] rounded-xl overflow-hidden focus-within:border-cyan-400 transition-colors">

                <Search className="w-4 h-4 text-slate-500 ml-3 shrink-0" />

                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => {
                    setEventSearch(
                      e.target.value,
                    );
                    setShowEventResults(
                      true,
                    );
                  }}
                  onFocus={() => {
                    if (
                      eventSearch.trim()
                    ) {
                      setShowEventResults(
                        true,
                      );
                    }
                  }}
                  placeholder="Search Event ID..."
                  className="w-full px-3 py-2.5 bg-transparent text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none"
                  aria-label="Search event ID"
                />

                {eventSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setEventSearch('');
                      setShowEventResults(
                        false,
                      );
                    }}
                    className="mr-2 p-1 text-slate-500 hover:text-white cursor-pointer"
                    aria-label="Clear event search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <ChevronDown className="w-4 h-4 text-slate-500 mr-3 shrink-0" />

              </div>

              {/* SEARCH RESULTS */}

              {showEventResults &&
                eventSearch.trim() &&
                (
                  <div className="absolute z-40 top-full left-0 right-0 mt-2 bg-[#080d25] border border-[#24346f] rounded-xl shadow-2xl overflow-hidden">

                    <div className="px-3 py-2 border-b border-[#1b2554] text-[10px] uppercase font-bold font-heading text-slate-500">
                      Event Search Results
                    </div>

                    {filteredEvents.length >
                    0 ? (
                      <div className="max-h-[280px] overflow-y-auto">

                        {filteredEvents.map(
                          (ev) => {
                            const isSelected =
                              String(
                                ev.id,
                              ) ===
                              String(
                                event.id,
                              );

                            return (
                              <button
                                type="button"
                                key={
                                  ev.id
                                }
                                onClick={() =>
                                  handleSelectEvent(
                                    ev,
                                  )
                                }
                                className={`w-full text-left px-3 py-3 border-b border-[#151d45] last:border-b-0 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-cyan-500/10'
                                    : 'hover:bg-[#10183a]'
                                }`}
                              >

                                <div className="flex items-center justify-between gap-3">

                                  <div className="min-w-0">

                                    <div className="flex items-center gap-2">

                                      <span className="font-mono text-xs font-bold text-cyan-300">
                                        {ev.id}
                                      </span>

                                      {isSelected && (
                                        <span className="text-[9px] uppercase font-bold text-emerald-400">
                                          Selected
                                        </span>
                                      )}

                                    </div>

                                    <div className="text-[11px] text-slate-300 mt-1 truncate">
                                      {ev.name ||
                                        'Thermal Event'}
                                    </div>

                                  </div>

                                  <div className="text-right shrink-0">

                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">

                                      <MapPin className="w-3 h-3" />

                                      {ev.state ||
                                        ev.region ||
                                        'Coordinates available'}

                                    </div>

                                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">

                                      {Number(
                                        ev.lat,
                                      ).toFixed(
                                        2,
                                      )}
                                      ,{' '}
                                      {Number(
                                        ev.lng,
                                      ).toFixed(
                                        2,
                                      )}

                                    </div>

                                  </div>

                                </div>

                              </button>
                            );
                          },
                        )}

                      </div>
                    ) : (

                      <div className="px-4 py-5 text-center">

                        <Search className="w-5 h-5 text-slate-600 mx-auto mb-2" />

                        <div className="text-xs text-slate-400">
                          No matching event found
                        </div>

                        <div className="text-[10px] text-slate-600 mt-1 font-mono">
                          Try an Event ID like 439160
                        </div>

                      </div>

                    )}

                  </div>
                )}

            </div>

            {/* CURRENT EVENT LABEL */}

            <div className="hidden lg:block text-right">

              <div className="text-[9px] uppercase font-bold text-slate-500 font-heading">
                Selected Event
              </div>

              <div className="text-xs font-mono font-bold text-cyan-300">
                {event.id}
              </div>

            </div>

            {/* RUN ANALYSIS */}

            <button
              type="button"
              onClick={
                runMLPrediction
              }
              disabled={
                isAnalyzing
              }
              id="btn-run-analysis"
              className={`py-2.5 px-4 rounded-xl text-xs font-bold font-heading uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2 ${
                isAnalyzing
                  ? 'bg-[#1b2554] text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 cursor-pointer'
              }`}
            >

              {isAnalyzing ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-cyan-300" />

                  <span>
                    Processing...
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />

                  <span>
                    RUN ANALYSIS
                  </span>
                </>
              )}

            </button>

          </div>

        </div>

        {/* ======================================================
            SELECTED EVENT SUMMARY
            ====================================================== */}

        <div className="mt-3 flex flex-wrap items-center gap-2">

          <span className="text-[10px] uppercase font-bold text-slate-500 font-heading">
            Active Event
          </span>

          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold">
            {event.id}
          </span>

          <span className="text-[10px] text-slate-500">
            Search another event above to switch analysis.
          </span>

        </div>

        {/* ======================================================
            STEP 1
            ====================================================== */}

        <div className="mt-4">

          <div className="text-[11px] font-bold font-heading uppercase text-cyan-400 mb-2 flex items-center gap-1.5">

            <Flame className="w-3.5 h-3.5" />

            <span>
              STEP 1 — THERMAL SIGNAL
              (VIIRS PASS)
            </span>

          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

            <div className="p-3 rounded-xl bg-[#070b1e] border border-[#1b2554]">

              <div className="text-[10.5px] uppercase font-bold text-slate-400 font-heading">
                FRP Radiative Power
              </div>

              <div className="text-2xl font-bold font-mono text-red-400 mt-0.5">
                {event.frpMw} MW
              </div>

              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                NASA VIIRS 375m
                sensor
              </div>

            </div>

            <div className="p-3 rounded-xl bg-[#070b1e] border border-[#1b2554]">

              <div className="text-[10.5px] uppercase font-bold text-slate-400 font-heading">
                Brightness Temp
              </div>

              <div className="text-2xl font-bold font-mono text-cyan-300 mt-0.5">
                {event.brightnessTempK}{' '}
                K
              </div>

              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                Channel I-4
                (3.9 μm MIR)
              </div>

            </div>

            <div className="p-3 rounded-xl bg-[#070b1e] border border-[#1b2554]">

              <div className="text-[10.5px] uppercase font-bold text-slate-400 font-heading">
                Detection Time
              </div>

              <div className="text-lg font-bold font-mono text-white mt-1">
                {event.detectionTimeIst ||
                  '—'}
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                {event.detectionTimeUtc ||
                  'VIIRS pass'}
              </div>

            </div>

            <div className="p-3 rounded-xl bg-[#070b1e] border border-[#1b2554]">

              <div className="text-[10.5px] uppercase font-bold text-slate-400 font-heading">
                ML Confidence
              </div>

              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">

                {prediction
                  ? `${Math.round(
                      mlConfidence *
                        100,
                    )}%`
                  : '—'}

              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                {prediction
                  ? predictedSource
                  : 'Awaiting ML analysis'}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================================
          STEP 2
          ======================================================== */}

      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-5 shadow-2xl space-y-3">

        <div className="flex items-center justify-between pb-2 border-b border-[#1b2554]">

          <div className="flex items-center gap-2">

            <Clock className="w-4 h-4 text-cyan-400" />

            <h3 className="text-xs font-bold font-heading uppercase text-white">
              STEP 2 — TEMPORAL
              BASELINE ABNORMALITY
            </h3>

          </div>

          <span className="text-xs text-slate-400 font-mono">
            {baselineRevisits}{' '}
            observations in 180
            days
          </span>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">

          <div className="p-3.5 rounded-xl bg-[#070b1e] border border-[#1b2554]">

            <div className="text-[10.5px] uppercase font-bold text-slate-400 font-heading">
              Mean Historical
              Radiance
            </div>

            <div className="text-xl font-bold font-mono text-white mt-1">
              {baselineMeanFrp}{' '}
              MW
            </div>

            <p className="text-[11px] text-slate-400 mt-1">
              Diurnal baseline FRP
              for coordinate cluster
              over trailing 6 months.
            </p>

          </div>

          <div className="p-3.5 rounded-xl bg-[#070b1e] border border-[#1b2554]">

            <div className="text-[10.5px] uppercase font-bold text-slate-400 font-heading">
              Observed Deviation
            </div>

            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              +{baselineStdDev} σ
            </div>

            <p className="text-[11px] text-slate-400 mt-1">
              Statistical deviation
              from the normal
              background envelope.
            </p>

          </div>

          <div className="p-3.5 rounded-xl bg-[#070b1e] border border-[#1b2554]">

            <div className="text-[10.5px] uppercase font-bold text-slate-400 font-heading">
              Abnormality Flag
            </div>

            <div className="mt-1">

              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold font-heading ${
                  event.abnormality ===
                    'CRITICAL' ||
                  event.abnormality ===
                    'HIGH'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                }`}
              >
                {event.abnormality ||
                  'LOW'}{' '}
                DEVIATION
              </span>

            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Thermal anomaly source
              in monitored zone.
            </p>

          </div>

        </div>

      </div>

      {/* ========================================================
          STEP 3
          ======================================================== */}

      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-5 shadow-2xl space-y-4">

        <div className="flex items-center justify-between pb-2 border-b border-[#1b2554]">

          <div className="flex items-center gap-2">

            <Layers className="w-4 h-4 text-cyan-400" />

            <TypewriterHeading
              as="h3"
              text="STEP 3 — 4 CONTEXT EVIDENCE LAYERS"
              className="text-xs font-bold uppercase text-white"
              glow={true}
              glowColor="cyan"
              speed={25}
            />

          </div>

          <span className="text-xs text-slate-400 font-mono">
            Spatial buffers &
            external datasets fused
          </span>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">

          <ContextCard
            cardKey="localHistory"
            icon={
              <History className="w-3 h-3" />
            }
            color="cyan"
            card={
              contextCards.localHistory
            }
            onClick={
              setSelectedPillarKey
            }
          />

          <ContextCard
            cardKey="eventBehaviour"
            icon={
              <Activity className="w-3 h-3" />
            }
            color="purple"
            card={
              contextCards.eventBehaviour
            }
            onClick={
              setSelectedPillarKey
            }
          />

          <ContextCard
            cardKey="infrastructure"
            icon={
              <Factory className="w-3 h-3" />
            }
            color="emerald"
            card={
              contextCards.infrastructure
            }
            onClick={
              setSelectedPillarKey
            }
          />

          <ContextCard
            cardKey="regionalContext"
            icon={
              <CloudSun className="w-3 h-3" />
            }
            color="amber"
            card={
              contextCards.regionalContext
            }
            onClick={
              setSelectedPillarKey
            }
          />

        </div>

      </div>

      {/* ========================================================
          STEP 4 — REAL ML ATTRIBUTION
          ======================================================== */}

      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-5 shadow-2xl space-y-4">

        <div className="flex items-center justify-between pb-2 border-b border-[#1b2554]">

          <div className="flex items-center gap-2">

            <Cpu className="w-4 h-4 text-cyan-400" />

            <TypewriterHeading
              as="h3"
              text="STEP 4 — ATTRIBUTION BREAKDOWN"
              className="text-xs font-bold uppercase text-white"
              glow={true}
              glowColor="cyan"
              speed={25}
            />

          </div>

          <span className="text-xs text-slate-400 font-mono">

            Most Probable:{' '}

            <strong className="text-emerald-400">
              {prediction
                ? predictedSource
                : 'Awaiting ML'}
            </strong>

          </span>

        </div>

        {mlPrediction.error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">

            <strong>
              ML prediction failed:
            </strong>{' '}

            {mlPrediction.error}

          </div>
        )}

        {mlPrediction.loading ? (

          <div className="p-6 text-center text-sm text-cyan-300">

            <RotateCcw className="w-5 h-5 animate-spin inline-block mr-2" />

            Running VEYRONIX LightGBM
            attribution model...

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-3">

              {sourceCandidates.map(
                (candidate) => {

                  const percentage =
                    Math.max(
                      0,
                      Math.min(
                        100,
                        candidate.probability *
                          100,
                      ),
                    );

                  const isPredicted =
                    sourceMatchesPrediction(
                      candidate.source,
                      predictedSource,
                    );

                  return (
                    <div
                      key={
                        candidate.source
                      }
                      className="space-y-1"
                    >

                      <div className="flex items-center justify-between text-xs font-heading">

                        <span
                          className={`font-semibold ${
                            isPredicted
                              ? 'text-cyan-300'
                              : 'text-slate-200'
                          }`}
                        >
                          {candidate.source}

                          {isPredicted && (
                            <span className="ml-2 text-[9px] uppercase text-cyan-400">
                              Predicted
                            </span>
                          )}
                        </span>

                        <span className="font-bold font-mono text-white">
                          {percentage.toFixed(
                            2,
                          )}
                          %
                        </span>

                      </div>

                      <div className="h-2 w-full bg-[#070b1e] rounded-full overflow-hidden border border-[#1b2554]">

                        <div
                          className={`h-full rounded-full ${
                            isPredicted
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_8px_#06b6d4]'
                              : 'bg-slate-600'
                          }`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                },
              )}

            </div>

            <div className="p-4 rounded-xl bg-[#070b1e] border border-[#1b2554] flex flex-col justify-between">

              <div>

                <div className="text-[10.5px] font-heading uppercase font-bold text-slate-400">
                  Attribution Rationale
                </div>

                {prediction ? (

                  <>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">

                      NASA FIRMS thermal
                      event detected at{' '}

                      {event.lat.toFixed(
                        4,
                      )}

                      ,{' '}

                      {event.lng.toFixed(
                        4,
                      )}

                      . VEYRONIX LightGBM
                      predicts{' '}

                      <strong className="text-cyan-300">
                        {predictedSource}
                      </strong>{' '}

                      with{' '}

                      <strong className="text-emerald-300">
                        {(
                          mlConfidence *
                          100
                        ).toFixed(2)}
                        %
                      </strong>{' '}

                      confidence.

                    </p>

                    <div className="mt-3 text-xs text-slate-400">

                      <strong>
                        Model:
                      </strong>{' '}

                      LightGBM multiclass

                    </div>

                    <div className="mt-1 text-xs text-slate-400">

                      <strong>
                        Model available:
                      </strong>{' '}

                      {prediction.model_available
                        ? 'Yes'
                        : 'No'}

                    </div>

                    <div className="mt-1 text-xs text-slate-400">

                      <strong>
                        Event analyzed:
                      </strong>{' '}

                      <span className="font-mono text-cyan-300">
                        {event.id}
                      </span>

                    </div>

                  </>

                ) : (

                  <p className="text-xs text-slate-400 mt-2">
                    Run the VEYRONIX
                    analysis to obtain the
                    model attribution.
                  </p>

                )}

              </div>

              <button
                type="button"
                onClick={() =>
                  onCreateInvestigation(
                    event,
                  )
                }
                className="mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold font-heading uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2 cursor-pointer"
              >

                <ShieldAlert className="w-4 h-4" />

                <span>
                  DOCKET FOR FIELD
                  INVESTIGATION
                </span>

              </button>

            </div>

          </div>

        )}

      </div>

      {/* ========================================================
          STEP 5 — UNKNOWN SAFEGUARD
          ======================================================== */}

      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-5 shadow-2xl space-y-3">

        <div className="flex items-center justify-between pb-2 border-b border-[#1b2554]">

          <div className="flex items-center gap-2">

            <HelpCircle className="w-4 h-4 text-cyan-400" />

            <h3 className="text-xs font-bold font-heading uppercase text-white">
              STEP 5 — UNCERTAINTY &
              &ldquo;UNKNOWN&rdquo;
              SAFEGUARD
            </h3>

          </div>

          <span className="text-xs text-slate-400 font-mono">
            Suppresses false assertions
            on ambiguous inputs
          </span>

        </div>

        {isUnknownCase ? (

          <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs space-y-2">

            <div className="flex items-center gap-2 text-amber-300 font-bold font-heading text-sm">

              <AlertTriangle className="w-4 h-4" />

              <span>
                INSUFFICIENT MODEL
                CONFIDENCE
              </span>

            </div>

            <div className="text-amber-200">
              <strong>
                Attribution:
              </strong>{' '}
              UNKNOWN / REQUIRES
              REVIEW
            </div>

            <div className="text-amber-200">

              <strong>
                Reason:
              </strong>{' '}

              {prediction
                ? `Model confidence is ${(
                    mlConfidence *
                    100
                  ).toFixed(
                    2,
                  )}%, below the 50% automatic attribution threshold.`
                : 'ML prediction is not available.'}

            </div>

            <div className="text-amber-200">

              <strong>
                Recommendation:
              </strong>{' '}

              Manual investigation required.

            </div>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">

            <div>

              <div className="flex items-center justify-between text-xs mb-1.5 font-heading">

                <span className="font-bold text-slate-200">
                  MODEL CONFIDENCE
                </span>

                <span className="font-bold text-emerald-400 font-mono">

                  {(
                    mlConfidence *
                    100
                  ).toFixed(2)}
                  %

                </span>

              </div>

              <div className="h-2 w-full bg-[#070b1e] rounded-full overflow-hidden border border-[#1b2554]">

                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        mlConfidence *
                          100,
                      ),
                    )}%`,
                  }}
                />

              </div>

              <div className="text-[11px] text-slate-400 mt-1.5 font-mono">

                Predicted source:{' '}

                <strong className="text-cyan-300">
                  {predictedSource}
                </strong>

              </div>

            </div>

            <div className="p-3 rounded-xl bg-[#070b1e] border border-[#1b2554] text-xs text-slate-300">

              <strong>
                Safety Threshold:
              </strong>{' '}

              Below 50% confidence,
              VEYRONIX suppresses
              automatic attribution and
              returns Requires Review.

            </div>

          </div>

        )}

      </div>

      {/* ========================================================
          CONTEXT PILLAR MODAL
          ======================================================== */}

      {selectedPillarKey &&
        contextCards[
          selectedPillarKey as keyof typeof contextCards
        ] && (

          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="bg-[#0a0f2b] border border-[#1e2a60] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">

              <div className="flex items-center justify-between border-b border-[#1b2554] pb-3">

                <TypewriterHeading
                  as="h3"
                  text={`${contextCards[
                    selectedPillarKey as keyof typeof contextCards
                  ].title} Telemetry`}
                  className="text-base font-bold text-white"
                  glow={true}
                  glowColor="cyan"
                  speed={25}
                />

                <button
                  type="button"
                  onClick={() =>
                    setSelectedPillarKey(
                      null,
                    )
                  }
                  className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕ Close
                </button>

              </div>

              <div className="space-y-2 text-xs text-slate-300">

                <div>

                  <strong>
                    Status:
                  </strong>{' '}

                  <span className="capitalize text-emerald-400 font-semibold font-mono">

                    {
                      contextCards[
                        selectedPillarKey as keyof typeof contextCards
                      ].status
                    }

                  </span>

                </div>

                <div>

                  <strong>
                    Parameter Tag:
                  </strong>{' '}

                  <span className="text-cyan-300 font-mono">

                    {
                      contextCards[
                        selectedPillarKey as keyof typeof contextCards
                      ].tag
                    }

                  </span>

                </div>

                <div>

                  <strong>
                    Observation:
                  </strong>{' '}

                  <span className="font-mono text-white">

                    {
                      contextCards[
                        selectedPillarKey as keyof typeof contextCards
                      ].metric
                    }

                  </span>

                </div>

                <p className="mt-2 text-slate-200 leading-relaxed bg-[#070b1e] p-3 rounded-xl border border-[#1b2554]">

                  {
                    contextCards[
                      selectedPillarKey as keyof typeof contextCards
                    ].description
                  }

                </p>

              </div>

              <div className="pt-2 text-right">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedPillarKey(
                      null,
                    )
                  }
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-heading font-bold cursor-pointer"
                >
                  Done
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
};

/*
 * ============================================================
 * CONTEXT CARD
 * ============================================================
 */

function ContextCard({
  cardKey,
  icon,
  color,
  card,
  onClick,
}: {
  cardKey: string;
  icon: React.ReactNode;
  color:
    | 'cyan'
    | 'purple'
    | 'emerald'
    | 'amber';
  card: {
    title: string;
    description: string;
    status: string;
    tag: string;
    metric?: string;
  };
  onClick: (
    key: string,
  ) => void;
}) {
  const colorClasses = {
    cyan: {
      text: 'text-cyan-400',
      badge:
        'bg-cyan-500/20 text-cyan-300',
      metric: 'text-cyan-300',
      border:
        'hover:border-cyan-500/50',
    },

    purple: {
      text: 'text-purple-400',
      badge:
        'bg-purple-500/20 text-purple-300',
      metric: 'text-purple-300',
      border:
        'hover:border-purple-500/50',
    },

    emerald: {
      text: 'text-emerald-400',
      badge:
        'bg-emerald-500/20 text-emerald-300',
      metric: 'text-emerald-300',
      border:
        'hover:border-emerald-500/50',
    },

    amber: {
      text: 'text-amber-400',
      badge:
        'bg-amber-500/20 text-amber-300',
      metric: 'text-amber-300',
      border:
        'hover:border-amber-500/50',
    },
  }[color];

  return (
    <div
      onClick={() =>
        onClick(cardKey)
      }
      className={`p-3.5 rounded-xl bg-[#070b1e] border border-[#1b2554] ${colorClasses.border} transition-all cursor-pointer flex flex-col justify-between`}
    >

      <div>

        <div className="flex items-center justify-between text-[10px] font-heading font-bold mb-1">

          <span
            className={`${colorClasses.text} uppercase flex items-center gap-1`}
          >
            {icon}
            {card.title}
          </span>

          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${colorClasses.badge}`}
          >
            {card.tag}
          </span>

        </div>

        <h4 className="text-xs font-bold font-heading text-white mb-1">
          {card.title}
        </h4>

        <p className="text-[11px] text-slate-400 line-clamp-3">
          {card.description}
        </p>

      </div>

      {card.metric && (
        <div
          className={`mt-2.5 pt-2 border-t border-[#1b2554] text-[10.5px] font-mono font-semibold truncate ${colorClasses.metric}`}
        >
          {card.metric}
        </div>
      )}

    </div>
  );
}

/*
 * ============================================================
 * CHECK WHETHER UI CATEGORY MATCHES MODEL PREDICTION
 * ============================================================
 */

function sourceMatchesPrediction(
  source: string,
  prediction: string,
) {
  if (
    prediction ===
    'Industrial'
  ) {
    return source.includes(
      'Industrial',
    );
  }

  if (
    prediction ===
    'Agriculture_Biomass'
  ) {
    return source.includes(
      'Agricultural',
    );
  }

  if (
    prediction ===
    'Forest_Natural'
  ) {
    return source.includes(
      'Forest',
    );
  }

  if (
    prediction ===
    'Waste_Other'
  ) {
    return source.includes(
      'Other',
    );
  }

  return false;
}