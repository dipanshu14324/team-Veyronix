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

function abnormalityFromEvent(
  raw: Record<string, unknown>,
): ThermalEvent['abnormality'] {
  const anomaly = Boolean(
    raw.is_anomaly ??
    raw.anomaly ??
    false,
  );

  return anomaly
    ? 'HIGH'
    : 'LOW';
}

function mapEvent(
  raw: Record<string, unknown>,
): ThermalEvent {
  const id = String(
    raw.event_id ??
    raw.id ??
    '',
  );

  const lat = num(
    raw.latitude ??
    raw.lat,
  );

  const lng = num(
    raw.longitude ??
    raw.lng,
  );

  const source = str(
    raw.predicted_source ??
    raw.source,
    'Uncertain',
  );

  const confidence = clamp(
    num(raw.confidence),
    0,
    1,
  );

  const priorityScore =
    Math.round(
      confidence * 100,
    );

  const peakFrp = num(
    raw.peak_frp ??
    raw.mean_frp,
  );

  const meanBrightness = num(
    raw.mean_brightness,
  );

  const observationCount = num(
    raw.observation_count,
  );

  const isAnomaly = Boolean(
    raw.is_anomaly ??
    false,
  );

  const anomalyScore = clamp(
    num(raw.anomaly_score) * 100,
    0,
    100,
  );

  const eventDate = str(
    raw.event_date ??
    raw.start_time,
    'Unknown',
  );

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

    mapX: 50,

    mapY: 50,

    frpMw:
      peakFrp,

    brightnessTempK:
      meanBrightness,

    detectionTimeUtc:
      eventDate,

    detectionTimeIst:
      eventDate,

    sensor: str(
      raw.satellite,
      'NASA FIRMS',
    ),

    abnormality:
      abnormalityFromEvent(raw),

    abnormalityScore:
      anomalyScore,

    likelySource:
      source,

    investigationPriority:
      priorityFromScore(
        priorityScore,
      ),

    priorityScore,

    confidence,

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
    ],

    spatialContext: {
      distanceKm: 0,

      bufferRadiusKm: 0.375,

      nearbyFacilitiesCount: 0,

      landUseClassification:
        'Not yet matched',
    },

    sourceProbabilities:
      getProbabilities(raw),

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
  };
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
    !Array.isArray(data.events)
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
    if (response.status === 404) {
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
  eventId:number | string,
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
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
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