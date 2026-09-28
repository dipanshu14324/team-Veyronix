import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface InvestigationEvent {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  frpMw?: number;
  brightnessTempK?: number;
  likelySource?: string;
  confidence?: number;
  detectionTimeUtc?: string;
  sensor?: string;
  abnormality?: string;
  investigationPriority?: string;
}

interface Props {
  event: InvestigationEvent;
  events?: InvestigationEvent[];
  onSelectEvent?: (eventId: string) => void;
  nearbyPlaces?: NearbyPlace[];
}

export interface NearbyPlace {
  name: string;
  type: string;
  lat: number;
  lng: number;
  distanceKm?: number;
}

type MapMode = 'osm' | 'google';

export default function HotspotInvestigationMap({
  event,
  events = [],
  onSelectEvent,
  nearbyPlaces = [],
}: Props) {
  const [mode, setMode] =
    useState<MapMode>('osm');

  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<L.Map | null>(null);

  const hotspotLayerRef =
    useRef<L.LayerGroup | null>(null);

  const nearbyLayerRef =
    useRef<L.LayerGroup | null>(null);

  /*
   * ============================================================
   * CREATE MAP
   * ============================================================
   */

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const map = L.map(
      mapContainerRef.current,
      {
        center: [
          event.lat,
          event.lng,
        ],
        zoom: 13,
        zoomControl: true,
      },
    );

    /*
     * OpenStreetMap tiles.
     */
    L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; OpenStreetMap contributors',
      },
    ).addTo(map);

    mapRef.current = map;

    /*
     * Separate layers:
     *
     * hotspotLayer
     * nearbyLayer
     */
    hotspotLayerRef.current =
      L.layerGroup().addTo(map);

    nearbyLayerRef.current =
      L.layerGroup().addTo(map);

    /*
     * Fix Leaflet rendering when
     * container becomes visible.
     */
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
      hotspotLayerRef.current = null;
      nearbyLayerRef.current = null;
    };
  }, []);

  /*
   * ============================================================
   * RENDER HOTSPOTS
   * ============================================================
   */

  useEffect(() => {
    const map = mapRef.current;

    const layer =
      hotspotLayerRef.current;

    if (!map || !layer) {
      return;
    }

    layer.clearLayers();

    /*
     * If events are not supplied,
     * show the selected event.
     */
    const eventsToRender =
      events.length > 0
        ? events
        : [event];

    eventsToRender.forEach(
      (item) => {
        /*
         * Selected event is visually
         * larger than other hotspots.
         */
        const isSelected =
          item.id === event.id;

        const marker =
          L.circleMarker(
            [
              item.lat,
              item.lng,
            ],
            {
              radius:
                isSelected
                  ? 13
                  : 7,

              weight:
                isSelected
                  ? 3
                  : 2,

              fillOpacity:
                isSelected
                  ? 0.9
                  : 0.65,

              opacity: 1,
            },
          );

        /*
         * Popup content.
         */
        marker.bindPopup(`
          <div style="min-width:250px">

            <div style="
              font-size:16px;
              font-weight:700;
              margin-bottom:8px;
            ">
              🔥 VEYRONIX Hotspot
            </div>

            <div style="margin-bottom:5px">
              <b>Event ID:</b>
              ${escapeHtml(item.id)}
            </div>

            <div style="margin-bottom:5px">
              <b>Latitude:</b>
              ${formatCoordinate(item.lat)}
            </div>

            <div style="margin-bottom:5px">
              <b>Longitude:</b>
              ${formatCoordinate(item.lng)}
            </div>

            <div style="margin-bottom:5px">
              <b>FRP:</b>
              ${format(item.frpMw)} MW
            </div>

            <div style="margin-bottom:5px">
              <b>Source:</b>
              ${escapeHtml(
                item.likelySource ??
                  'Uncertain',
              )}
            </div>

            <div style="margin-bottom:5px">
              <b>Confidence:</b>
              ${confidence(
                item.confidence,
              )}
            </div>

            <div style="margin-top:8px">

              <a
                href="https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}"
                target="_blank"
                rel="noreferrer"
                style="
                  display:inline-block;
                  padding:6px 10px;
                  background:#111827;
                  color:white;
                  border-radius:6px;
                  text-decoration:none;
                  font-size:12px;
                "
              >
                Open in Google Maps
              </a>

            </div>

          </div>
        `);

        /*
         * Clicking a hotspot selects it.
         */
        marker.on(
          'click',
          () => {
            if (
              onSelectEvent &&
              item.id !== event.id
            ) {
              onSelectEvent(
                item.id,
              );
            }

            /*
             * Zoom to clicked hotspot.
             */
            map.setView(
              [
                item.lat,
                item.lng,
              ],
              14,
              {
                animate: true,
              },
            );
          },
        );

        marker.addTo(layer);
      },
    );
  }, [
    events,
    event,
    onSelectEvent,
  ]);

  /*
   * ============================================================
   * SELECTED EVENT / MAP POSITION
   * ============================================================
   */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    /*
     * When selectedEvent changes,
     * move the map to that event.
     */
    map.setView(
      [
        event.lat,
        event.lng,
      ],
      14,
      {
        animate: true,
      },
    );

    /*
     * Fix map size after rendering.
     */
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    /*
     * Open selected event popup.
     */
    const layer =
      hotspotLayerRef.current;

    if (!layer) {
      return;
    }

    layer.eachLayer(
      (layerItem) => {
        const marker =
          layerItem as L.CircleMarker;

        const latLng =
          marker.getLatLng();

        if (
          Math.abs(
            latLng.lat -
              event.lat,
          ) < 0.000001 &&
          Math.abs(
            latLng.lng -
              event.lng,
          ) < 0.000001
        ) {
          marker.openPopup();
        }
      },
    );
  }, [event]);

  /*
   * ============================================================
   * NEARBY PLACES
   * ============================================================
   */

  useEffect(() => {
    const layer =
      nearbyLayerRef.current;

    if (!layer) {
      return;
    }

    layer.clearLayers();

    nearbyPlaces.forEach(
      (place) => {
        const marker =
          L.marker([
            place.lat,
            place.lng,
          ]);

        marker.bindPopup(`
          <div>

            <strong>
              ${escapeHtml(
                place.name,
              )}
            </strong>

            <br/>

            Type:
            ${escapeHtml(
              place.type,
            )}

            ${
              place.distanceKm !==
              undefined
                ? `
                  <br/>
                  Distance:
                  ${place.distanceKm.toFixed(
                    2,
                  )} km
                `
                : ''
            }

          </div>
        `);

        marker.addTo(layer);
      },
    );
  }, [nearbyPlaces]);

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10">

      {/* ========================================================
          MAP HEADER
          ======================================================== */}

      <div className="flex flex-col gap-3 bg-black/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="text-sm font-semibold text-white">
            Hotspot Investigation
          </div>

          <div className="text-xs text-white/60">
            {events.length > 0
              ? `${events.length} VEYRONIX thermal hotspots loaded`
              : `Event ${event.id}`}
          </div>

        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={() =>
              setMode('osm')
            }
            className={`rounded-md px-3 py-2 text-xs ${
              mode === 'osm'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white'
            }`}
          >
            OSM Map
          </button>

          <button
            type="button"
            onClick={() =>
              setMode('google')
            }
            className={`rounded-md px-3 py-2 text-xs ${
              mode === 'google'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white'
            }`}
          >
            Google Maps
          </button>

        </div>

      </div>

      {/* ========================================================
          MAP
          ======================================================== */}

      <div className="relative">

        {mode === 'osm' ? (

          <div
            ref={mapContainerRef}
            className="h-[560px] w-full"
          />

        ) : (

          <GoogleMapView
            event={event}
          />

        )}

      </div>

      {/* ========================================================
          SELECTED EVENT DATA
          ======================================================== */}

      <div className="grid grid-cols-2 gap-3 bg-black/90 p-4 md:grid-cols-4">

        <Info
          label="Event"
          value={event.id}
        />

        <Info
          label="FRP"
          value={`${format(
            event.frpMw,
          )} MW`}
        />

        <Info
          label="Source"
          value={
            event.likelySource ??
            'Uncertain'
          }
        />

        <Info
          label="Confidence"
          value={confidence(
            event.confidence,
          )}
        />

      </div>

      {/* ========================================================
          LOCATION
          ======================================================== */}

      <div className="border-t border-white/10 bg-black/95 px-4 py-3">

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

          <Info
            label="Latitude"
            value={formatCoordinate(
              event.lat,
            )}
          />

          <Info
            label="Longitude"
            value={formatCoordinate(
              event.lng,
            )}
          />

          <Info
            label="Sensor"
            value={
              event.sensor ??
              'NASA FIRMS'
            }
          />

        </div>

      </div>

    </div>
  );
}

/*
 * ============================================================
 * GOOGLE MAP VIEW
 * ============================================================
 *
 * We intentionally do not embed Google Maps JavaScript here
 * yet because that requires a Google Maps API key.
 *
 * The link opens the exact selected hotspot coordinates.
 */

function GoogleMapView({
  event,
}: {
  event: InvestigationEvent;
}) {
  const url =
    `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`;

  return (
    <div className="flex h-[560px] items-center justify-center bg-slate-950 p-8 text-center">

      <div className="max-w-md">

        <div className="mb-4 text-5xl">
          📍
        </div>

        <h3 className="text-xl font-semibold text-white">
          Google Maps
        </h3>

        <p className="mt-2 text-sm leading-6 text-white/60">
          Open the selected VEYRONIX
          satellite hotspot at its exact
          latitude and longitude.
        </p>

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
        >
          Open in Google Maps
        </a>

        <div className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/50">

          <div>
            Latitude:
            {' '}
            {formatCoordinate(
              event.lat,
            )}
          </div>

          <div className="mt-1">
            Longitude:
            {' '}
            {formatCoordinate(
              event.lng,
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

/*
 * ============================================================
 * INFO CARD
 * ============================================================
 */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <div className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </div>

      <div className="mt-1 truncate text-sm text-white">
        {value}
      </div>

    </div>
  );
}

/*
 * ============================================================
 * FORMATTERS
 * ============================================================
 */

function format(
  value?: number,
) {
  return Number.isFinite(value)
    ? Number(value).toFixed(1)
    : '—';
}

function confidence(
  value?: number,
) {
  return Number.isFinite(value)
    ? `${(
        Number(value) * 100
      ).toFixed(1)}%`
    : '—';
}

function formatCoordinate(
  value?: number,
) {
  return Number.isFinite(value)
    ? Number(value).toFixed(6)
    : '—';
}

/*
 * ============================================================
 * HTML ESCAPE
 * ============================================================
 */

function escapeHtml(
  value: string,
) {
  return value
    .replaceAll(
      '&',
      '&amp;',
    )
    .replaceAll(
      '<',
      '&lt;',
    )
    .replaceAll(
      '>',
      '&gt;',
    )
    .replaceAll(
      '"',
      '&quot;',
    )
    .replaceAll(
      "'",
      '&#039;',
    );
}