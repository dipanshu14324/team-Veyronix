import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Flame,
  Gauge,
  Layers,
  Loader2,
  ShieldAlert,
  Target,
  TrendingUp,
  Database,
} from 'lucide-react';

import type { ThermalEvent } from '../../types';

import { predictVeyronixEvent } from '../../services/veyronixApi';

interface AnalyticsPageProps {
  events: ThermalEvent[];
}

/* ============================================================
   ML RESPONSE
   ============================================================ */

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

    agricultural?: number;
    vegetation?: number;
    industrial?: number;
    other?: number;
  };

  model_available?: boolean;
}

/* ============================================================
   ANALYTICS PREDICTION RECORD
   ============================================================ */

interface PredictionRecord {
  event: ThermalEvent;
  prediction: MLPrediction;
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
  min = 0,
  max = 1,
): number {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function normalizeSource(
  source: unknown,
): string {
  const value = String(
    source ?? '',
  );

  if (
    value === 'Industrial'
  ) {
    return 'Industrial';
  }

  if (
    value ===
    'Agriculture_Biomass'
  ) {
    return 'Agriculture_Biomass';
  }

  if (
    value ===
    'Forest_Natural'
  ) {
    return 'Forest_Natural';
  }

  if (
    value === 'Waste_Other'
  ) {
    return 'Waste_Other';
  }

  return 'Uncertain';
}

/* ============================================================
   DATE PARSER
   ============================================================ */

function getEventDate(
  event: ThermalEvent,
): Date | null {
  const raw =
    (
      event as ThermalEvent & {
        eventDate?: string;
        event_date?: string;
        startTime?: string;
        start_time?: string;
      }
    ).eventDate ??
    (
      event as ThermalEvent & {
        event_date?: string;
      }
    ).event_date ??
    (
      event as ThermalEvent & {
        startTime?: string;
      }
    ).startTime ??
    (
      event as ThermalEvent & {
        start_time?: string;
      }
    ).start_time;

  if (!raw) {
    return null;
  }

  const date =
    new Date(String(raw));

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
   COMPONENT
   ============================================================ */

export const AnalyticsPage: React.FC<
  AnalyticsPageProps
> = ({
  events,
}) => {
  const [predictions, setPredictions] =
    useState<
      PredictionRecord[]
    >([]);

  const [isLoadingML, setIsLoadingML] =
    useState(false);

  const [predictionErrors, setPredictionErrors] =
    useState(0);

  /* ==========================================================
     RUN LIGHTGBM FOR THE 100 LOADED EVENTS
     ========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadMLAnalytics() {
      if (!events.length) {
        setPredictions([]);
        return;
      }

      setIsLoadingML(true);
      setPredictionErrors(0);

      /*
       * The application intentionally loads
       * only the first 100 events.
       *
       * Analytics therefore describes those
       * 100 loaded events, not the full
       * 439,251-event corpus.
       */

      const results =
        await Promise.allSettled(
          events.map(
            async (event) => {
              const prediction =
                (await predictVeyronixEvent(
                  event.id,
                )) as MLPrediction;

              return {
                event,
                prediction,
              };
            },
          ),
        );

      if (cancelled) {
        return;
      }

      const successful: PredictionRecord[] =
        [];

      let errors = 0;

      results.forEach(
        (result) => {
          if (
            result.status ===
            'fulfilled'
          ) {
            successful.push(
              result.value,
            );
          } else {
            errors += 1;
          }
        },
      );

      setPredictions(
        successful,
      );

      setPredictionErrors(
        errors,
      );

      setIsLoadingML(false);
    }

    loadMLAnalytics();

    return () => {
      cancelled = true;
    };
  }, [events]);

  /* ==========================================================
     TOTAL EVENTS
     ========================================================== */

  const totalEvents =
    events.length;

  /* ==========================================================
     MODEL COVERAGE
     ========================================================== */

  const modelCoverage =
    totalEvents > 0
      ? (
          predictions.length /
          totalEvents
        ) * 100
      : 0;

  /* ==========================================================
     CONFIDENCE
     ========================================================== */

  const averageConfidence =
    predictions.length > 0
      ? predictions.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            safeNumber(
              item.prediction
                .confidence,
            ),
          0,
        ) /
        predictions.length
      : 0;

  /* ==========================================================
     PRIORITY
     ========================================================== */

  const priorityCounts =
    useMemo(() => {
      let critical = 0;
      let high = 0;
      let medium = 0;
      let low = 0;

      predictions.forEach(
        ({
          prediction,
        }) => {
          const confidence =
            safeNumber(
              prediction.confidence,
            );

          if (
            confidence >=
            0.85
          ) {
            critical += 1;
          } else if (
            confidence >=
            0.70
          ) {
            high += 1;
          } else if (
            confidence >=
            0.50
          ) {
            medium += 1;
          } else {
            low += 1;
          }
        },
      );

      return {
        critical,
        high,
        medium,
        low,
      };
    }, [predictions]);

  const actionableEvents =
    priorityCounts.critical +
    priorityCounts.high;

  /* ==========================================================
     SOURCE ATTRIBUTION
     ========================================================== */

  const sourceCounts =
    useMemo(() => {
      const counts = {
        Industrial: 0,
        Agriculture_Biomass: 0,
        Forest_Natural: 0,
        Waste_Other: 0,
        Uncertain: 0,
      };

      predictions.forEach(
        ({
          prediction,
        }) => {
          const source =
            normalizeSource(
              prediction.predicted_source,
            );

          if (
            source ===
            'Industrial'
          ) {
            counts.Industrial += 1;
          } else if (
            source ===
            'Agriculture_Biomass'
          ) {
            counts.Agriculture_Biomass +=
              1;
          } else if (
            source ===
            'Forest_Natural'
          ) {
            counts.Forest_Natural +=
              1;
          } else if (
            source ===
            'Waste_Other'
          ) {
            counts.Waste_Other +=
              1;
          } else {
            counts.Uncertain += 1;
          }
        },
      );

      return counts;
    }, [predictions]);

  const sourceTotal =
    predictions.length;

  const sourcePercentage =
    (
      count: number,
    ) =>
      sourceTotal > 0
        ? (
            count /
            sourceTotal
          ) * 100
        : 0;

  /* ==========================================================
     WEEKLY DETECTION CADENCE
     ========================================================== */

  const weeklyData =
    useMemo(() => {
      const now =
        new Date();

      const buckets =
        [
          {
            label: '7d',
            start:
              new Date(
                now.getTime() -
                  7 *
                    24 *
                    60 *
                    60 *
                    1000,
              ),
            count: 0,
          },
          {
            label: '14d',
            start:
              new Date(
                now.getTime() -
                  14 *
                    24 *
                    60 *
                    60 *
                    1000,
              ),
            count: 0,
          },
          {
            label: '21d',
            start:
              new Date(
                now.getTime() -
                  21 *
                    24 *
                    60 *
                    60 *
                    1000,
              ),
            count: 0,
          },
          {
            label: '28d',
            start:
              new Date(
                now.getTime() -
                  28 *
                    24 *
                    60 *
                    60 *
                    1000,
              ),
            count: 0,
          },
        ];

      events.forEach(
        (event) => {
          const date =
            getEventDate(
              event,
            );

          if (!date) {
            return;
          }

          const age =
            now.getTime() -
            date.getTime();

          const days =
            age /
            (
              24 *
              60 *
              60 *
              1000
            );

          if (
            days >= 0 &&
            days < 7
          ) {
            buckets[0].count += 1;
          } else if (
            days >= 7 &&
            days < 14
          ) {
            buckets[1].count += 1;
          } else if (
            days >= 14 &&
            days < 21
          ) {
            buckets[2].count += 1;
          } else if (
            days >= 21 &&
            days < 28
          ) {
            buckets[3].count += 1;
          }
        },
      );

      return [
        ...buckets,
      ].reverse();
    }, [events]);

  const maxWeekly =
    Math.max(
      1,
      ...weeklyData.map(
        (item) =>
          item.count,
      ),
    );

  /* ==========================================================
     ANOMALY EVENTS
     ========================================================== */

  const anomalyCount =
    events.filter(
      (event) =>
        Boolean(
          (
            event as ThermalEvent & {
              isAnomaly?: boolean;
              anomalyScore?: number;
            }
          ).isAnomaly,
        ),
    ).length;

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="
      min-h-full
      space-y-6
      select-text
      pb-8
    ">

      {/* ======================================================
          HERO
          ====================================================== */}

      <div className="
        rounded-3xl
        border
        border-[#24346f]
        bg-[#080d25]/95
        px-6
        py-7
        shadow-2xl
      ">

        <div className="
          flex
          items-start
          justify-between
          gap-5
          flex-wrap
        ">

          <div>

            <div className="
              flex
              items-center
              gap-3
              mb-2
            ">

              <div className="
                w-10
                h-10
                rounded-xl
                bg-cyan-500/10
                border
                border-cyan-500/40
                flex
                items-center
                justify-center
              ">
                <Activity className="
                  w-5
                  h-5
                  text-cyan-400
                " />
              </div>

              <h1 className="
                text-2xl
                sm:text-3xl
                font-black
                font-heading
                text-white
                tracking-wide
              ">
                MACRO ANALYTICS &
                ATTRIBUTION METRICS
              </h1>

            </div>

            <p className="
              text-sm
              text-slate-400
              max-w-3xl
            ">
              VEYRONIX LightGBM source
              attribution, investigation
              priority and thermal-event
              statistics from the
              currently loaded event set.
            </p>

          </div>

          <div className="
            flex
            items-center
            gap-2
            px-3
            py-2
            rounded-xl
            border
            border-cyan-500/30
            bg-cyan-500/10
          ">

            <Database className="
              w-4
              h-4
              text-cyan-400
            " />

            <span className="
              text-xs
              font-mono
              text-cyan-300
            ">
              DATASET WINDOW:
              {totalEvents}
            </span>

          </div>

        </div>

      </div>

      {/* ======================================================
          TOP METRICS
          ====================================================== */}

      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        xl:grid-cols-4
        gap-5
      ">

        {/* TOTAL */}

        <MetricCard
          title="LOADED EVENTS"
          value={String(
            totalEvents,
          )}
          description="
            Current VEYRONIX dashboard
            event window
          "
          icon={
            <Flame className="
              w-5
              h-5
              text-cyan-400
            " />
          }
          valueClass="text-cyan-300"
        />

        {/* ACTIONABLE */}

        <MetricCard
          title="ACTIONABLE PRIORITY"
          value={String(
            actionableEvents,
          )}
          description="
            Critical + High confidence
            ML predictions
          "
          icon={
            <ShieldAlert className="
              w-5
              h-5
              text-orange-400
            " />
          }
          valueClass="text-orange-400"
        />

        {/* CONFIDENCE */}

        <MetricCard
          title="AVG ML CONFIDENCE"
          value={`${(
            averageConfidence *
            100
          ).toFixed(1)}%`}
          description="
            Mean LightGBM prediction
            confidence
          "
          icon={
            <BrainCircuit className="
              w-5
              h-5
              text-emerald-400
            " />
          }
          valueClass="text-emerald-400"
        />

        {/* COVERAGE */}

        <MetricCard
          title="MODEL COVERAGE"
          value={`${modelCoverage.toFixed(
            0,
          )}%`}
          description={
            predictionErrors > 0
              ? `${predictions.length} predictions • ${predictionErrors} failed`
              : `${predictions.length} / ${totalEvents} events analyzed`
          }
          icon={
            <Target className="
              w-5
              h-5
              text-purple-400
            " />
          }
          valueClass="text-purple-400"
        />

      </div>

      {/* ======================================================
          MAIN ANALYTICS
          ====================================================== */}

      <div className="
        grid
        grid-cols-1
        xl:grid-cols-12
        gap-5
      ">

        {/* WEEKLY */}

        <div className="
          xl:col-span-7
          rounded-2xl
          border
          border-[#1e2a60]
          bg-[#080d24]
          p-5
        ">

          <div className="
            flex
            items-center
            justify-between
            pb-3
            border-b
            border-[#1b2554]
          ">

            <div>

              <h2 className="
                text-sm
                font-bold
                font-heading
                text-white
              ">
                EVENT DETECTION CADENCE
              </h2>

              <p className="
                text-[11px]
                text-slate-500
                mt-1
              ">
                Actual dates from the
                loaded VEYRONIX events
              </p>

            </div>

            <span className="
              text-xs
              text-cyan-400
              font-mono
            ">
              7-DAY WINDOWS
            </span>

          </div>

          <div className="
            h-64
            flex
            items-end
            justify-between
            gap-4
            pt-8
          ">

            {weeklyData.map(
              (
                item,
              ) => {

                const height =
                  Math.max(
                    8,
                    (
                      item.count /
                      maxWeekly
                    ) *
                      190,
                  );

                return (
                  <div
                    key={
                      item.label
                    }
                    className="
                      flex-1
                      h-full
                      flex
                      flex-col
                      justify-end
                      items-center
                      gap-2
                    "
                  >

                    <span className="
                      text-xs
                      font-mono
                      text-cyan-300
                      font-bold
                    ">
                      {item.count}
                    </span>

                    <div
                      className="
                        w-full
                        max-w-[75px]
                        rounded-t-xl
                        bg-gradient-to-t
                        from-cyan-600
                        to-cyan-400
                        shadow-[0_0_20px_rgba(6,182,212,0.25)]
                      "
                      style={{
                        height: `${height}px`,
                      }}
                    />

                    <span className="
                      text-[10px]
                      font-mono
                      text-slate-500
                    ">
                      {item.label}
                    </span>

                  </div>
                );
              },
            )}

          </div>

          <div className="
            mt-4
            pt-3
            border-t
            border-[#1b2554]
            text-[10px]
            text-slate-500
          ">
            Note: this chart uses only
            event dates available in the
            current {totalEvents}-event
            dashboard window.
          </div>

        </div>

        {/* SOURCE ATTRIBUTION */}

        <div className="
          xl:col-span-5
          rounded-2xl
          border
          border-[#1e2a60]
          bg-[#080d24]
          p-5
        ">

          <div className="
            flex
            items-center
            justify-between
            pb-3
            border-b
            border-[#1b2554]
          ">

            <div>

              <h2 className="
                text-sm
                font-bold
                font-heading
                text-white
              ">
                LIGHTGBM SOURCE
                ATTRIBUTION
              </h2>

              <p className="
                text-[11px]
                text-slate-500
                mt-1
              ">
                Predictions from the
                production VEYRONIX model
              </p>

            </div>

            <BrainCircuit className="
              w-4
              h-4
              text-cyan-400
            " />

          </div>

          <div className="
            space-y-5
            pt-5
          ">

            <SourceBar
              label="Industrial Activity"
              value={
                sourcePercentage(
                  sourceCounts.Industrial,
                )
              }
              count={
                sourceCounts.Industrial
              }
              suffix="Industrial"
            />

            <SourceBar
              label="Agriculture / Biomass"
              value={
                sourcePercentage(
                  sourceCounts
                    .Agriculture_Biomass,
                )
              }
              count={
                sourceCounts
                  .Agriculture_Biomass
              }
              suffix="Agriculture"
            />

            <SourceBar
              label="Forest / Natural"
              value={
                sourcePercentage(
                  sourceCounts
                    .Forest_Natural,
                )
              }
              count={
                sourceCounts
                  .Forest_Natural
              }
              suffix="Forest"
            />

            <SourceBar
              label="Waste / Other"
              value={
                sourcePercentage(
                  sourceCounts
                    .Waste_Other,
                )
              }
              count={
                sourceCounts
                  .Waste_Other
              }
              suffix="Waste"
            />

            <SourceBar
              label="Uncertain / Review"
              value={
                sourcePercentage(
                  sourceCounts
                    .Uncertain,
                )
              }
              count={
                sourceCounts
                  .Uncertain
              }
              suffix="Uncertain"
            />

          </div>

          <div className="
            mt-5
            pt-3
            border-t
            border-[#1b2554]
            text-[10px]
            text-slate-500
          ">
            Denominator:
            {sourceTotal}
            successful LightGBM
            predictions.
          </div>

        </div>

      </div>

      {/* ======================================================
          PRIORITY + MODEL STATUS
          ====================================================== */}

      <div className="
        grid
        grid-cols-1
        lg:grid-cols-2
        gap-5
      ">

        {/* PRIORITY */}

        <div className="
          rounded-2xl
          border
          border-[#1e2a60]
          bg-[#080d24]
          p-5
        ">

          <div className="
            flex
            items-center
            justify-between
            pb-3
            border-b
            border-[#1b2554]
          ">

            <h2 className="
              text-sm
              font-bold
              font-heading
              text-white
            ">
              PRIORITY SEVERITY SPREAD
            </h2>

            <Gauge className="
              w-4
              h-4
              text-orange-400
            " />

          </div>

          <div className="
            grid
            grid-cols-2
            gap-3
            mt-5
          ">

            <PriorityCard
              label="Critical"
              value={
                priorityCounts.critical
              }
              color="red"
            />

            <PriorityCard
              label="High"
              value={
                priorityCounts.high
              }
              color="orange"
            />

            <PriorityCard
              label="Medium"
              value={
                priorityCounts.medium
              }
              color="amber"
            />

            <PriorityCard
              label="Low / Review"
              value={
                priorityCounts.low
              }
              color="emerald"
            />

          </div>

          <div className="
            mt-4
            text-[10px]
            text-slate-500
            leading-relaxed
          ">
            Priority is derived from
            the production LightGBM
            confidence thresholds used
            by VEYRONIX:
            ≥85% Critical,
            ≥70% High,
            ≥50% Medium,
            otherwise Low/Review.
          </div>

        </div>

        {/* MODEL STATUS */}

        <div className="
          rounded-2xl
          border
          border-[#1e2a60]
          bg-[#080d24]
          p-5
        ">

          <div className="
            flex
            items-center
            justify-between
            pb-3
            border-b
            border-[#1b2554]
          ">

            <h2 className="
              text-sm
              font-bold
              font-heading
              text-white
            ">
              VEYRONIX MODEL STATUS
            </h2>

            <CheckCircle2 className="
              w-4
              h-4
              text-emerald-400
            " />

          </div>

          <div className="
            space-y-4
            mt-5
          ">

            <StatusRow
              label="Model"
              value="LightGBM"
              active
            />

            <StatusRow
              label="Task"
              value="Thermal Source Classification"
              active
            />

            <StatusRow
              label="Classes"
              value="4"
              active
            />

            <StatusRow
              label="Anomaly Detector"
              value="Isolation Forest"
              active
            />

            <StatusRow
              label="Events Loaded"
              value={String(
                totalEvents,
              )}
              active
            />

            <StatusRow
              label="ML Predictions"
              value={String(
                predictions.length,
              )}
              active={
                predictions.length >
                0
              }
            />

            <StatusRow
              label="Prediction Errors"
              value={String(
                predictionErrors,
              )}
              active={
                predictionErrors ===
                0
              }
            />

          </div>

        </div>

      </div>

      {/* ======================================================
          ANOMALY / DATASET NOTE
          ====================================================== */}

      <div className="
        rounded-2xl
        border
        border-[#1e2a60]
        bg-[#080d24]
        p-5
      ">

        <div className="
          flex
          items-center
          gap-3
        ">

          <Layers className="
            w-5
            h-5
            text-purple-400
          " />

          <div>

            <h2 className="
              text-sm
              font-bold
              font-heading
              text-white
            ">
              ANOMALY & DATA COVERAGE
            </h2>

            <p className="
              text-[11px]
              text-slate-500
              mt-1
            ">
              Current dashboard window
            </p>

          </div>

        </div>

        <div className="
          grid
          grid-cols-1
          sm:grid-cols-3
          gap-4
          mt-5
        ">

          <div className="
            rounded-xl
            bg-[#070b1e]
            border
            border-[#1b2554]
            p-4
          ">

            <div className="
              text-[10px]
              uppercase
              text-slate-500
              font-bold
            ">
              Loaded Events
            </div>

            <div className="
              text-2xl
              font-mono
              font-bold
              text-cyan-300
              mt-1
            ">
              {totalEvents}
            </div>

          </div>

          <div className="
            rounded-xl
            bg-[#070b1e]
            border
            border-[#1b2554]
            p-4
          ">

            <div className="
              text-[10px]
              uppercase
              text-slate-500
              font-bold
            ">
              Flagged Anomalies
            </div>

            <div className="
              text-2xl
              font-mono
              font-bold
              text-purple-400
              mt-1
            ">
              {anomalyCount}
            </div>

          </div>

          <div className="
            rounded-xl
            bg-[#070b1e]
            border
            border-[#1b2554]
            p-4
          ">

            <div className="
              text-[10px]
              uppercase
              text-slate-500
              font-bold
            ">
              ML Coverage
            </div>

            <div className="
              text-2xl
              font-mono
              font-bold
              text-emerald-400
              mt-1
            ">
              {modelCoverage.toFixed(
                0,
              )}%
            </div>

          </div>

        </div>

        <div className="
          mt-4
          text-[10px]
          text-slate-500
          leading-relaxed
        ">
          This analytics screen describes
          the current 100-event frontend
          window. It does not represent
          the complete 439,251-event
          training/processed corpus.
        </div>

      </div>

      {/* ======================================================
          LOADING OVERLAY
          ====================================================== */}

      {isLoadingML && (
        <div className="
          fixed
          bottom-5
          right-5
          z-50
          flex
          items-center
          gap-2
          px-4
          py-3
          rounded-xl
          bg-[#080d24]/95
          border
          border-cyan-500/50
          shadow-2xl
        ">

          <Loader2 className="
            w-4
            h-4
            animate-spin
            text-cyan-400
          " />

          <span className="
            text-xs
            text-cyan-300
            font-mono
          ">
            Running LightGBM on{' '}
            {events.length}{' '}
            events...
          </span>

        </div>
      )}

    </div>
  );
};

/* ============================================================
   METRIC CARD
   ============================================================ */

function MetricCard({
  title,
  value,
  description,
  icon,
  valueClass,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  valueClass: string;
}) {
  return (
    <div className="
      rounded-2xl
      border
      border-[#1e2a60]
      bg-[#080d24]
      p-5
      min-h-[165px]
      flex
      flex-col
      justify-between
    ">

      <div className="
        flex
        items-center
        justify-between
      ">

        <span className="
          text-[10px]
          uppercase
          font-bold
          font-heading
          text-slate-400
        ">
          {title}
        </span>

        {icon}

      </div>

      <div>

        <div className={`
          text-4xl
          sm:text-5xl
          font-black
          font-mono
          mt-4
          ${valueClass}
        `}>
          {value}
        </div>

        <p className="
          text-[11px]
          text-slate-500
          mt-2
          whitespace-pre-line
        ">
          {description}
        </p>

      </div>

    </div>
  );
}

/* ============================================================
   SOURCE BAR
   ============================================================ */

function SourceBar({
  label,
  value,
  count,
  suffix,
}: {
  label: string;
  value: number;
  count: number;
  suffix: string;
}) {
  const safeValue =
    clamp(
      value / 100,
    ) * 100;

  return (
    <div>

      <div className="
        flex
        items-center
        justify-between
        mb-1.5
      ">

        <span className="
          text-xs
          text-slate-300
          font-mono
        ">
          {label}
        </span>

        <span className="
          text-xs
          text-white
          font-mono
          font-bold
        ">
          {value.toFixed(1)}%
        </span>

      </div>

      <div className="
        h-2.5
        w-full
        rounded-full
        bg-[#050816]
        border
        border-[#1b2554]
        overflow-hidden
      ">

        <div
          className="
            h-full
            rounded-full
            bg-cyan-400
            transition-all
          "
          style={{
            width: `${safeValue}%`,
          }}
        />

      </div>

      <div className="
        mt-1
        text-[9px]
        text-slate-600
        font-mono
      ">
        {count} predicted as
        {' '}
        {suffix}
      </div>

    </div>
  );
}

/* ============================================================
   PRIORITY CARD
   ============================================================ */

function PriorityCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color:
    | 'red'
    | 'orange'
    | 'amber'
    | 'emerald';
}) {
  const classes = {
    red: {
      value:
        'text-red-400',
      border:
        'border-red-500/30',
    },

    orange: {
      value:
        'text-orange-400',
      border:
        'border-orange-500/30',
    },

    amber: {
      value:
        'text-amber-400',
      border:
        'border-amber-500/30',
    },

    emerald: {
      value:
        'text-emerald-400',
      border:
        'border-emerald-500/30',
    },
  }[color];

  return (
    <div className={`
      p-4
      rounded-xl
      bg-[#070b1e]
      border
      ${classes.border}
    `}>

      <div className="
        text-[10px]
        uppercase
        text-slate-500
        font-bold
      ">
        {label}
      </div>

      <div className={`
        text-3xl
        font-black
        font-mono
        mt-1
        ${classes.value}
      `}>
        {value}
      </div>

    </div>
  );
}

/* ============================================================
   STATUS ROW
   ============================================================ */

function StatusRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="
      flex
      items-center
      justify-between
      gap-4
      p-3
      rounded-xl
      bg-[#070b1e]
      border
      border-[#1b2554]
    ">

      <div className="
        flex
        items-center
        gap-2
      ">

        <span className={`
          w-2
          h-2
          rounded-full
          ${
            active
              ? 'bg-emerald-400'
              : 'bg-slate-600'
          }
        `} />

        <span className="
          text-xs
          text-slate-400
        ">
          {label}
        </span>

      </div>

      <span className="
        text-xs
        text-cyan-300
        font-mono
        font-semibold
        text-right
      ">
        {value}
      </span>

    </div>
  );
}

export default AnalyticsPage;