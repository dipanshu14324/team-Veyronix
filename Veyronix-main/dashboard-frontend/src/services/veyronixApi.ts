import type {
  AnalysisResponse,
  ThermalEvent,
} from '../types';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000';

export interface VeyronixEventsResponse {
  status?: string;
  count?: number;
  events: Array<Record<string, unknown>>;
}

/* =========================================================
   BASIC HELPERS
   ========================================================= */

function num(
  value: unknown,
  fallback = 0,
): number {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}

function str(
  value: unknown,
  fallback = '',
): string {
  return (
    typeof value === 'string' &&
    value.trim()
  )
    ? value
    : fallback;
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

/* =========================================================
   PROBABILITIES
   ========================================================= */

function getProbabilities(
  raw: Record<string, unknown>,
) {
  const p = (
    raw.probabilities ??
    raw.source_probabilities ??
    {}
  ) as Record<string, unknown>;

  return {
    industrial: num(
      p.Industrial ??
      p.industrial,
    ),

    agricultural: num(
      p.Agriculture_Biomass ??
      p.agricultural,
    ),

    vegetation: num(
      p.Forest_Natural ??
      p.vegetation,
    ),

    other: num(
      p.Waste_Other ??
      p.other,
    ),
  };
}

/* =========================================================
   PRIORITY
   =========================================================

   Backend thresholds:

   85+ = CRITICAL
   70+ = HIGH
   50+ = MEDIUM
   <50 = LOW
   ========================================================= */

function priorityFromScore(
  score: number,
): ThermalEvent['investigationPriority'] {
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

/* =========================================================
   NORMALIZE BACKEND PRIORITY
   ========================================================= */

function normalizePriority(
  value: unknown,
): ThermalEvent['investigationPriority'] | null {
  if (
    typeof value !== 'string'
  ) {
    return null;
  }

  const priority =
    value
      .trim()
      .toUpperCase();

  if (
    priority === 'CRITICAL' ||
    priority === 'HIGH' ||
    priority === 'MEDIUM' ||
    priority === 'LOW'
  ) {
    return priority;
  }

  return null;
}

/* =========================================================
   ABNORMALITY
   ========================================================= */

function abnormalityFromEvent(
  raw: Record<string, unknown>,
): ThermalEvent['abnormality'] {
  const anomaly =
    raw.is_anomaly ??
    raw.isAnomaly ??
    raw.anomaly ??
    false;

  const isAnomaly =
    anomaly === true ||
    anomaly === 'true' ||
    anomaly === 1 ||
    anomaly === '1';

  return isAnomaly
    ? 'HIGH'
    : 'LOW';
}

/* =========================================================
   MAP RAW API EVENT → FRONTEND EVENT
   ========================================================= */

function mapEvent(
  raw: Record<string, unknown>,
): ThermalEvent {
  /* -------------------------------------------------------
     EVENT ID
     ------------------------------------------------------- */

  const id = String(
    raw.event_id ??
    raw.id ??
    '',
  );

  /* -------------------------------------------------------
     LOCATION
     ------------------------------------------------------- */

  const lat = num(
    raw.latitude ??
    raw.lat,
  );

  const lng = num(
    raw.longitude ??
    raw.lng,
  );

  /* -------------------------------------------------------
     SOURCE
     ------------------------------------------------------- */

  const source = str(
    raw.predicted_source ??
    raw.predictedSource ??
    raw.likelySource ??
    raw.source,
    'Uncertain',
  );

  /* -------------------------------------------------------
     CONFIDENCE
     ------------------------------------------------------- */

  const confidence = clamp(
    num(
      raw.confidence,
      0,
    ),
    0,
    1,
  );

  /* =======================================================
     PRIORITY SCORE
     ======================================================= */

  const rawPriorityScore =
    raw.priority_score ??
    raw.priorityScore;

  const parsedPriorityScore =
    Number(rawPriorityScore);

  const hasBackendPriorityScore =
    Number.isFinite(
      parsedPriorityScore,
    );

  const priorityScore =
    hasBackendPriorityScore
      ? clamp(
          Math.round(
            parsedPriorityScore,
          ),
          0,
          100,
        )
      : Math.round(
          confidence * 100,
        );

  /* =======================================================
     PRIORITY
     ======================================================= */

  const backendPriority =
    normalizePriority(
      raw.priority ??
      raw.investigationPriority,
    );

  const investigationPriority =
    backendPriority ??
    priorityFromScore(
      priorityScore,
    );

  /* -------------------------------------------------------
     EVENT FEATURES
     ------------------------------------------------------- */

  const peakFrp = num(
    raw.peak_frp ??
    raw.peakFrp ??
    raw.mean_frp ??
    raw.frpMw,
  );

  const meanBrightness = num(
    raw.mean_brightness ??
    raw.brightnessTempK,
  );

  const observationCount = num(
    raw.observation_count ??
    raw.observationCount,
  );

  /* =======================================================
     ANOMALY
     ======================================================= */

  const anomalyValue =
    raw.is_anomaly ??
    raw.isAnomaly ??
    raw.anomaly ??
    false;

  const isAnomaly =
    anomalyValue === true ||
    anomalyValue === 'true' ||
    anomalyValue === 1 ||
    anomalyValue === '1';

  /*
   * IMPORTANT:
   *
   * Backend anomaly_score is 0–1.
   *
   * Frontend abnormalityScore is displayed as 0–100.
   *
   * Keep BOTH versions so AnalyticsPage can use the
   * original backend value correctly.
   */

  const rawAnomalyScore =
    num(
      raw.anomaly_score ??
      raw.anomalyScore,
    );

  const anomalyScore = clamp(
    rawAnomalyScore * 100,
    0,
    100,
  );

  /* =======================================================
     LIGHTGBM MODEL STATUS
     ======================================================= */

  const modelAvailable =
    raw.model_available === true ||
    raw.model_available === 'true' ||
    raw.model_available === 1 ||
    raw.model_available === '1' ||
    raw.modelAvailable === true;

  /* =======================================================
     SOURCE PROBABILITIES
     ======================================================= */

  const backendProbabilities =
    getProbabilities(raw);

  /* -------------------------------------------------------
     DATE
     ------------------------------------------------------- */

  const eventDate = str(
    raw.event_date ??
    raw.eventDate ??
    raw.start_time ??
    raw.startTime,
    'Unknown',
  );

  /* =======================================================
     FINAL FRONTEND EVENT
     ======================================================= */

  return {
    id,

    name:
      `Thermal Event ${id}`,

    region:
      'Satellite-detected area',

    state:
      'India',

    lat,

    lng,

    mapX:
      50,

    mapY:
      50,

    frpMw:
      peakFrp,

    brightnessTempK:
      meanBrightness,

    detectionTimeUtc:
      eventDate,

    detectionTimeIst:
      eventDate,

    sensor:
      str(
        raw.satellite,
        'NASA FIRMS',
      ),

    /* =====================================================
       ANOMALY
       ===================================================== */

    abnormality:
      abnormalityFromEvent(
        raw,
      ),

    abnormalityScore:
      anomalyScore,

    /*
     * Preserve backend anomaly fields.
     */

    isAnomaly,

    is_anomaly:
      isAnomaly,

    anomalyScore:
      rawAnomalyScore,

    anomaly_score:
      rawAnomalyScore,

    /* =====================================================
       SOURCE
       ===================================================== */

    likelySource:
      source,

    predictedSource:
      source,

    predicted_source:
      source,

    /* =====================================================
       PRIORITY
       ===================================================== */

    investigationPriority,

    priority:
      investigationPriority,

    priorityScore,

    priority_score:
      priorityScore,

    /* =====================================================
       LIGHTGBM CONFIDENCE
       ===================================================== */

    confidence,

    /* =====================================================
       MODEL STATUS
       ===================================================== */

    modelAvailable,

    model_available:
      modelAvailable,

    /* =====================================================
       SOURCE PROBABILITIES
       ===================================================== */

    /*
     * Existing normalized frontend format.
     */

    sourceProbabilities:
      backendProbabilities,

    /*
     * Backend-compatible format.
     */

    source_probabilities: {
      Agriculture_Biomass:
        backendProbabilities.agricultural,

      Forest_Natural:
        backendProbabilities.vegetation,

      Industrial:
        backendProbabilities.industrial,

      Waste_Other:
        backendProbabilities.other,
    },

    /*
     * AnalyticsPage-compatible format.
     */

    probabilities: {
      Agriculture_Biomass:
        backendProbabilities.agricultural,

      Forest_Natural:
        backendProbabilities.vegetation,

      Industrial:
        backendProbabilities.industrial,

      Waste_Other:
        backendProbabilities.other,
    },

    /* =====================================================
       EVIDENCE
       ===================================================== */

    insufficientEvidence:
      source === 'Uncertain',

    message:
      source === 'Uncertain'
        ? 'Evidence insufficient for reliable attribution.'
        : undefined,

    evidence: [
      `NASA FIRMS thermal event detected at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,

      `FRP: ${peakFrp.toFixed(1)} MW`,

      `Observations: ${observationCount}`,

      isAnomaly
        ? 'Thermal behaviour flagged as anomalous by the VEYRONIX anomaly model.'
        : 'Thermal behaviour was not flagged as anomalous.',

      source === 'Uncertain'
        ? 'Source attribution requires additional evidence.'
        : `VEYRONIX ML source prediction: ${source}`,

      `Investigation priority: ${investigationPriority}`,

      `Priority score: ${priorityScore}/100`,

      `LightGBM confidence: ${(confidence * 100).toFixed(1)}%`,
    ],

    /* =====================================================
       SPATIAL CONTEXT
       ===================================================== */

    spatialContext: {
      distanceKm:
        0,

      bufferRadiusKm:
        0.375,

      nearbyFacilitiesCount:
        0,

      landUseClassification:
        'Not yet matched',
    },

    /* =====================================================
       CONTEXT CARDS
       ===================================================== */

    contextCards: {
      localHistory: {
        title:
          'Local history',

        description:
          'Historical context supplied by VEYRONIX.',

        status:
          'inconclusive',

        tag:
          'API',
      },

      eventBehaviour: {
        title:
          'Event behaviour',

        description:
          'Thermal-event behaviour from the VEYRONIX event record.',

        status:
          isAnomaly
            ? 'verified'
            : 'caution',

        tag:
          isAnomaly
            ? 'ANOMALOUS'
            : 'NORMAL',
      },

      infrastructure: {
        title:
          'Infrastructure',

        description:
          'OSM facility matching is evaluated separately.',

        status:
          'inconclusive',

        tag:
          'PENDING',
      },

      regionalContext: {
        title:
          'Regional context',

        description:
          'Regional contextual evidence is evaluated separately.',

        status:
          'inconclusive',

        tag:
          'PENDING',
      },
    },

    /* =====================================================
       RAW ML SNAPSHOT
       ===================================================== */

    rawML: {
      predicted_source:
        source,

      confidence,

      probabilities:
        backendProbabilities,

      model_available:
        modelAvailable,

      priority:
        investigationPriority,

      priority_score:
        priorityScore,

      is_anomaly:
        isAnomaly,

      anomaly_score:
        rawAnomalyScore,
    },
  } as ThermalEvent;
}

/* =========================================================
   GET INITIAL EVENTS
   ========================================================= */

export async function fetchVeyronixEvents(
  limit = 100,
): Promise<ThermalEvent[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/events?limit=${limit}`,
    );

  if (!response.ok) {
    throw new Error(
      `VEYRONIX events API failed: HTTP ${response.status}`,
    );
  }

  const data =
    (await response.json()) as
      VeyronixEventsResponse;

  if (
    !Array.isArray(
      data.events,
    )
  ) {
    throw new Error(
      'VEYRONIX API returned an invalid events response.',
    );
  }

  return data.events.map(
    mapEvent,
  );
}

/* =========================================================
   GET ONE EVENT DIRECTLY FROM FULL CORPUS
   ========================================================= */

export async function fetchVeyronixEventById(
  eventId: string,
): Promise<ThermalEvent> {
  const cleanEventId =
    String(eventId).trim();

  if (!cleanEventId) {
    throw new Error(
      'Event ID is required.',
    );
  }

  const response =
    await fetch(
      `${API_BASE_URL}/events/${encodeURIComponent(cleanEventId)}`,
    );

  if (!response.ok) {
    if (
      response.status === 404
    ) {
      throw new Error(
        `Event ${cleanEventId} was not found in the VEYRONIX corpus.`,
      );
    }

    throw new Error(
      `VEYRONIX event lookup failed: HTTP ${response.status}`,
    );
  }

  const data =
    (await response.json()) as
      Record<string, unknown>;

  const rawEvent =
    data.event &&
    typeof data.event === 'object'
      ? (
          data.event as
            Record<string, unknown>
        )
      : data;

  return mapEvent(
    rawEvent,
  );
}

/* =========================================================
   GET EVENT ANALYSIS
   ========================================================= */

export async function fetchVeyronixAnalysis(
  eventId: number | string,
): Promise<AnalysisResponse> {
  const response =
    await fetch(
      `${API_BASE_URL}/event-analysis/${encodeURIComponent(eventId)}`,
    );

  if (!response.ok) {
    throw new Error(
      `VEYRONIX analysis API failed: HTTP ${response.status}`,
    );
  }

  return (
    await response.json()
  ) as AnalysisResponse;
}

/* =========================================================
   RUN ML PREDICTION FOR ONE EVENT
   ========================================================= */

export async function predictVeyronixEvent(
  eventId: string,
): Promise<Record<string, unknown>> {
  const response =
    await fetch(
      `${API_BASE_URL}/predict-event`,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            event_id:
              Number(eventId),
          }),
      },
    );

  if (!response.ok) {
    throw new Error(
      `VEYRONIX prediction API failed: HTTP ${response.status}`,
    );
  }

  return (
    await response.json()
  ) as Record<
    string,
    unknown
  >;
}

/* =========================================================
   HEALTH CHECK
   ========================================================= */

export async function checkVeyronixHealth(): Promise<boolean> {
  try {
    const response =
      await fetch(
        `${API_BASE_URL}/health`,
      );

    return response.ok;
  } catch {
    return false;
  }
}