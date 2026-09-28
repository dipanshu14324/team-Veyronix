import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import L from 'leaflet';

import {
  ThermalEvent,
  PriorityLevel,
} from '../types';

import {
  Maximize2,
  RadioTower,
  Compass,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Expand,
  Navigation,
  Eye,
  Flame,
} from 'lucide-react';

interface IndiaMapVisualizationProps {
  events: ThermalEvent[];
  selectedEvent?: ThermalEvent | null;
  onSelectEvent: (event: ThermalEvent) => void;
  isAnalyzing?: boolean;
}

/*
 * ============================================================
 * BASE MAP TYPES
 * ============================================================
 *
 * Satellite  -> Esri satellite imagery
 * Fire Heat  -> Dark basemap + NASA VIIRS thermal anomalies
 * OSM        -> OpenStreetMap
 *
 * GRID REMOVED
 * OLD THERMAL MAP REMOVED
 */

type BaseTileType =
  | 'satellite'
  | 'fire_heat'
  | 'osm_standard';

/*
 * ============================================================
 * INDIA MAP CONFIG
 * ============================================================
 */

const INDIA_BOUNDS: L.LatLngBoundsExpression = [
  [6.5, 66.0],
  [37.5, 99.0],
];

const INDIA_CENTER: [number, number] = [
  22.5,
  79.0,
];

const INDIA_DEFAULT_ZOOM = 5;

/*
 * ============================================================
 * NASA FIRE LAYER
 * ============================================================
 *
 * NASA GIBS VIIRS SNPP:
 *
 * VIIRS_SNPP_Thermal_Anomalies_375m_All
 *
 * This is the satellite thermal anomaly layer.
 */

const NASA_FIRE_LAYER =
  'VIIRS_SNPP_Thermal_Anomalies_375m_All';

/*
 * ============================================================
 * DATE HELPERS
 * ============================================================
 */

const getDateOnly = (
  value: unknown,
): string | null => {
  if (!value) {
    return null;
  }

  const text = String(value);

  /*
   * Already YYYY-MM-DD.
   */
  const directMatch =
    text.match(
      /^(\d{4}-\d{2}-\d{2})/,
    );

  if (directMatch) {
    return directMatch[1];
  }

  /*
   * Try normal Date parsing.
   */
  const parsed =
    new Date(text);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return null;
  }

  return parsed
    .toISOString()
    .slice(0, 10);
};

/*
 * ============================================================
 * GET EVENT DATE
 * ============================================================
 */

const getEventDate = (
  event?: ThermalEvent | null,
): string | null => {
  if (!event) {
    return null;
  }

  const possibleValues = [
    (event as any).eventDate,
    (event as any).event_date,
    (event as any).date,
    (event as any).acq_date,
    (event as any).start_time,
  ];

  for (
    const value of possibleValues
  ) {
    const date =
      getDateOnly(value);

    if (date) {
      return date;
    }
  }

  return null;
};

/*
 * ============================================================
 * FALLBACK NASA DATE
 * ============================================================
 */

const getDefaultFireDate = (): string => {
  return new Date()
    .toISOString()
    .slice(0, 10);
};

/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export const IndiaMapVisualization: React.FC<
  IndiaMapVisualizationProps
> = ({
  events,
  selectedEvent,
  onSelectEvent,
  isAnalyzing = false,
}) => {
  /*
   * ==========================================================
   * MAP REFS
   * ==========================================================
   */

  const mapContainerRef =
    useRef<HTMLDivElement>(null);

  const mapInstanceRef =
    useRef<L.Map | null>(null);

  const tileLayerRef =
    useRef<L.TileLayer | null>(null);

  const fireLayerRef =
    useRef<L.TileLayer | null>(null);

  const eventsLayerRef =
    useRef<L.LayerGroup | null>(null);

  const buffersLayerRef =
    useRef<L.LayerGroup | null>(null);

  /*
   * ==========================================================
   * UI STATE
   * ==========================================================
   */

  const [baseTile, setBaseTile] =
    useState<BaseTileType>(
      'fire_heat',
    );

  const [showEvents, setShowEvents] =
    useState(true);

  const [showBufferZones, setShowBufferZones] =
    useState(true);

  const [showEventCard, setShowEventCard] =
    useState(true);

  const [showTelemetryBar, setShowTelemetryBar] =
    useState(true);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [cursorCoords, setCursorCoords] =
    useState<{
      lat: number;
      lng: number;
    } | null>(null);

  const [currentZoom, setCurrentZoom] =
    useState(
      INDIA_DEFAULT_ZOOM,
    );

  const [
    fireLayerDate,
    setFireLayerDate,
  ] = useState(
    getEventDate(
      selectedEvent,
    ) ||
      getDefaultFireDate(),
  );

  /*
   * ============================================================
   * UPDATE FIRE DATE WHEN SELECTED EVENT CHANGES
   * ============================================================
   */

  useEffect(() => {
    const eventDate =
      getEventDate(
        selectedEvent,
      );

    if (eventDate) {
      setFireLayerDate(
        eventDate,
      );
    }
  }, [selectedEvent]);

  /*
   * ============================================================
   * TILE SOURCE CONFIG
   * ============================================================
   */

  const TILE_SOURCES: Record<
    'satellite' | 'osm_standard' | 'fire_base',
    {
      url: string;
      subdomains?: string | string[];
      attribution: string;
      name: string;
      maxZoom: number;
      maxNativeZoom: number;
    }
  > = {
    /*
     * ========================================================
     * ESRI SATELLITE
     * ========================================================
     */

    satellite: {
      url:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',

      attribution:
        '&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',

      name:
        'Satellite Imagery',

      maxZoom: 22,

      maxNativeZoom: 19,
    },

    /*
     * ========================================================
     * OPENSTREETMAP
     * ========================================================
     */

    osm_standard: {
      url:
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

      subdomains: [
        'a',
        'b',
        'c',
      ],

      attribution:
        '&copy; OpenStreetMap contributors',

      name:
        'OpenStreetMap',

      maxZoom: 22,

      maxNativeZoom: 19,
    },

    /*
     * ========================================================
     * DARK BASE FOR FIRE HEAT
     * ========================================================
     *
     * Dark Esri basemap is used underneath NASA VIIRS.
     *
     * NASA thermal anomalies are added separately above it.
     */

    fire_base: {
      url:
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',

      attribution:
        '&copy; Esri, HERE, Garmin, OpenStreetMap contributors',

      name:
        'Thermal Dark Base',

      maxZoom: 22,

      maxNativeZoom: 16,
    },
  };

  /*
   * ============================================================
   * NASA VIIRS FIRE TILE URL
   * ============================================================
   */

  const getNASAFireTileUrl = (
    date: string,
  ): string => {
    return (
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/` +
      `${NASA_FIRE_LAYER}/default/` +
      `${date}/GoogleMapsCompatible_Level9/` +
      `{z}/{y}/{x}.png`
    );
  };

  /*
   * ============================================================
   * PRIORITY STYLE
   * ============================================================
   */

  /*
   * ============================================================
   * NORMALIZE EVENT PRIORITY
   * ============================================================
   *
   * Different API/data versions may use:
   *   investigationPriority
   *   priority
   *   priorityLevel
   *   severity
   *
   * We normalize all of them before deciding the marker color.
   *
   * COLOR RULE:
   *   CRITICAL -> RED
   *   HIGH     -> RED-ORANGE
   *   MEDIUM   -> ORANGE
   *   LOW      -> GREEN
   */

  const normalizePriority = (
    event: ThermalEvent,
  ): PriorityLevel => {
    const rawPriority =
      (event as any).investigationPriority ??
      (event as any).priority ??
      (event as any).priorityLevel ??
      (event as any).severity ??
      '';

    const normalized = String(
      rawPriority,
    )
      .trim()
      .toUpperCase();

    if (normalized === 'CRITICAL') {
      return 'CRITICAL';
    }

    if (normalized === 'HIGH') {
      return 'HIGH';
    }

    if (normalized === 'MEDIUM' || normalized === 'MODERATE') {
      return 'MEDIUM';
    }

    if (normalized === 'LOW') {
      return 'LOW';
    }

    // Unknown/missing priority is kept visible as LOW so the map
    // does not accidentally show an unclassified blue marker.
    return 'LOW';
  };

  /*
   * ============================================================
   * PRIORITY STYLE
   * ============================================================
   */

  const getPriorityStyle = (
    priority: PriorityLevel,
  ) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          color: '#ef4444',
          border: '#b91c1c',
          glow:
            'rgba(239, 68, 68, 0.85)',
          label: 'CRITICAL',
        };

      case 'HIGH':
        return {
          color: '#f97316',
          border: '#ea580c',
          glow:
            'rgba(249, 115, 22, 0.85)',
          label: 'HIGH',
        };

      case 'MEDIUM':
        return {
          color: '#f59e0b',
          border: '#d97706',
          glow:
            'rgba(245, 158, 11, 0.85)',
          label: 'MEDIUM',
        };

      case 'LOW':
      default:
        return {
          color: '#10b981',
          border: '#059669',
          glow:
            'rgba(16, 185, 129, 0.85)',
          label: 'LOW',
        };
    }
  };

  /*
   * ============================================================
   * VALID EVENT COORDINATES
   * ============================================================
   */

  const getValidEventCoordinates =
    (): [number, number][] => {
      return events
        .map(
          (event) => {
            if (!event) {
              return null;
            }

            const lat =
              Number(
                event.lat,
              );

            const lng =
              Number(
                event.lng,
              );

            if (
              !Number.isFinite(
                lat,
              ) ||
              !Number.isFinite(
                lng,
              )
            ) {
              return null;
            }

            if (
              lat < -90 ||
              lat > 90 ||
              lng < -180 ||
              lng > 180
            ) {
              return null;
            }

            return [
              lat,
              lng,
            ] as [
              number,
              number,
            ];
          },
        )
        .filter(
          (
            item,
          ): item is [
            number,
            number,
          ] =>
            item !== null,
        );
    };

  /*
   * ============================================================
   * ESCAPE KEY
   * ============================================================
   */

  useEffect(() => {
    const handleKeyDown =
      (
        e: KeyboardEvent,
      ) => {
        if (
          e.key === 'Escape' &&
          isFullscreen
        ) {
          setIsFullscreen(
            false,
          );
        }
      };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [
    isFullscreen,
  ]);

  /*
   * ============================================================
   * FULLSCREEN BODY
   * ============================================================
   */

  useEffect(() => {
    document.body.style.overflow =
      isFullscreen
        ? 'hidden'
        : '';

    const timers = [
      window.setTimeout(
        () => {
          mapInstanceRef.current?.invalidateSize();
        },
        50,
      ),

      window.setTimeout(
        () => {
          mapInstanceRef.current?.invalidateSize();
        },
        180,
      ),

      window.setTimeout(
        () => {
          mapInstanceRef.current?.invalidateSize();
        },
        350,
      ),
    ];

    return () => {
      document.body.style.overflow =
        '';

      timers.forEach(
        (timer) =>
          window.clearTimeout(
            timer,
          ),
      );
    };
  }, [
    isFullscreen,
  ]);

  /*
   * ============================================================
   * INITIALIZE MAP
   * ============================================================
   */

  useEffect(() => {
    if (
      !mapContainerRef.current ||
      mapInstanceRef.current
    ) {
      return;
    }

    const map =
      L.map(
        mapContainerRef.current,
        {
          center:
            INDIA_CENTER,

          zoom:
            INDIA_DEFAULT_ZOOM,

          minZoom: 4,

          maxZoom: 22,

          zoomControl: false,

          zoomSnap: 0.5,

          zoomDelta: 1,

          wheelPxPerZoomLevel: 60,

          maxBounds: [
            [3, 60],
            [40, 105],
          ],

          maxBoundsViscosity:
            0.25,
        },
      );

    /*
     * ========================================================
     * INITIAL BASE LAYER
     * ========================================================
     *
     * Fire Heat starts with dark basemap.
     * Other modes are handled by CHANGE BASE MAP.
     */

    const tileSource =
      baseTile === 'fire_heat'
        ? TILE_SOURCES.fire_base
        : baseTile === 'osm_standard'
          ? TILE_SOURCES.osm_standard
          : TILE_SOURCES.satellite;

    const initialTileLayer =
      L.tileLayer(
        tileSource.url,
        {
          attribution:
            tileSource.attribution,

          subdomains:
            tileSource.subdomains ||
            'abc',

          maxZoom:
            tileSource.maxZoom,

          maxNativeZoom:
            tileSource.maxNativeZoom,
        },
      ).addTo(map);

    tileLayerRef.current =
      initialTileLayer;

    /*
     * ========================================================
     * INITIAL NASA FIRE LAYER
     * ========================================================
     */

    if (
      baseTile === 'fire_heat'
    ) {
      const initialFireLayer =
        L.tileLayer(
          getNASAFireTileUrl(
            fireLayerDate,
          ),
          {
            opacity: 0.88,

            maxZoom: 18,

            maxNativeZoom: 9,

            attribution:
              '&copy; NASA GIBS / FIRMS',
          },
        ).addTo(map);

      fireLayerRef.current =
        initialFireLayer;
    }

    /*
     * ========================================================
     * EVENT LAYERS
     * ========================================================
     */

    eventsLayerRef.current =
      L.layerGroup().addTo(
        map,
      );

    buffersLayerRef.current =
      L.layerGroup().addTo(
        map,
      );

    /*
     * ========================================================
     * ZOOM TRACKING
     * ========================================================
     */

    map.on(
      'zoomend',
      () => {
        setCurrentZoom(
          Math.round(
            map.getZoom(),
          ),
        );
      },
    );

    /*
     * ========================================================
     * CURSOR GPS
     * ========================================================
     */

    map.on(
      'mousemove',
      (e) => {
        if (
          !e ||
          !e.latlng
        ) {
          return;
        }

        const lat =
          Number(
            e.latlng.lat,
          );

        const lng =
          Number(
            e.latlng.lng,
          );

        if (
          Number.isFinite(
            lat,
          ) &&
          Number.isFinite(
            lng,
          )
        ) {
          setCursorCoords({
            lat: Number(
              lat.toFixed(
                4,
              ),
            ),

            lng: Number(
              lng.toFixed(
                4,
              ),
            ),
          });
        }
      },
    );

    mapInstanceRef.current =
      map;

    /*
     * ========================================================
     * INITIAL FIT
     * ========================================================
     */

    const coordinates =
      getValidEventCoordinates();

    if (
      coordinates.length >
      0
    ) {
      try {
        const bounds =
          L.latLngBounds(
            coordinates,
          );

        map.fitBounds(
          bounds,
          {
            padding: [
              50,
              50,
            ],

            maxZoom: 8,
          },
        );
      } catch {
        map.setView(
          INDIA_CENTER,
          INDIA_DEFAULT_ZOOM,
        );
      }
    } else {
      map.fitBounds(
        INDIA_BOUNDS,
        {
          padding: [
            20,
            20,
          ],
        },
      );
    }

    return () => {
      map.remove();

      mapInstanceRef.current =
        null;

      tileLayerRef.current =
        null;

      fireLayerRef.current =
        null;

      eventsLayerRef.current =
        null;

      buffersLayerRef.current =
        null;
    };

    // Initial setup only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * ============================================================
   * CHANGE BASE MAP
   * ============================================================
   *
   * Satellite
   * Fire Heat
   * OSM
   *
   * IMPORTANT:
   *
   * The event data, ML attribution, markers,
   * FRP, brightness temperature and locations
   * do NOT change when switching map mode.
   *
   * Only the visual base layer changes.
   */

  useEffect(() => {
    const map =
      mapInstanceRef.current;

    if (!map) {
      return;
    }

    /*
     * ========================================================
     * REMOVE CURRENT BASE LAYER
     * ========================================================
     */

    if (
      tileLayerRef.current
    ) {
      map.removeLayer(
        tileLayerRef.current,
      );

      tileLayerRef.current =
        null;
    }

    /*
     * ========================================================
     * REMOVE CURRENT FIRE LAYER
     * ========================================================
     */

    if (
      fireLayerRef.current
    ) {
      map.removeLayer(
        fireLayerRef.current,
      );

      fireLayerRef.current =
        null;
    }

    /*
     * ========================================================
     * SATELLITE
     * ========================================================
     */

    if (
      baseTile === 'satellite'
    ) {
      const source =
        TILE_SOURCES.satellite;

      tileLayerRef.current =
        L.tileLayer(
          source.url,
          {
            attribution:
              source.attribution,

            subdomains:
              source.subdomains ||
              'abc',

            maxZoom:
              source.maxZoom,

            maxNativeZoom:
              source.maxNativeZoom,
          },
        ).addTo(map);

      return;
    }

    /*
     * ========================================================
     * OSM
     * ========================================================
     */

    if (
      baseTile === 'osm_standard'
    ) {
      const source =
        TILE_SOURCES.osm_standard;

      tileLayerRef.current =
        L.tileLayer(
          source.url,
          {
            attribution:
              source.attribution,

            subdomains:
              source.subdomains ||
              'abc',

            maxZoom:
              source.maxZoom,

            maxNativeZoom:
              source.maxNativeZoom,
          },
        ).addTo(map);

      return;
    }

    /*
     * ========================================================
     * FIRE HEAT
     * ========================================================
     *
     * Dark basemap
     * +
     * NASA VIIRS 375m thermal anomalies
     */

    if (
      baseTile === 'fire_heat'
    ) {
      const source =
        TILE_SOURCES.fire_base;

      tileLayerRef.current =
        L.tileLayer(
          source.url,
          {
            attribution:
              source.attribution,

            subdomains:
              source.subdomains ||
              'abc',

            maxZoom:
              source.maxZoom,

            maxNativeZoom:
              source.maxNativeZoom,
          },
        ).addTo(map);

      /*
       * NASA VIIRS thermal anomaly layer.
       */

      const fireLayer =
        L.tileLayer(
          getNASAFireTileUrl(
            fireLayerDate,
          ),
          {
            opacity: 0.88,

            maxZoom: 18,

            /*
             * NASA VIIRS 375m product.
             *
             * Level 9 corresponds to the
             * native GIBS tile level.
             */

            maxNativeZoom: 9,

            attribution:
              '&copy; NASA GIBS / FIRMS',
          },
        ).addTo(map);

      fireLayerRef.current =
        fireLayer;
    }
  }, [
    baseTile,
    fireLayerDate,
  ]);

  /*
   * ============================================================
   * AUTO FIT EVENTS
   * ============================================================
   */

  useEffect(() => {
    const map =
      mapInstanceRef.current;

    if (!map) {
      return;
    }

    const coordinates =
      getValidEventCoordinates();

    if (
      coordinates.length ===
      0
    ) {
      map.fitBounds(
        INDIA_BOUNDS,
        {
          padding: [
            20,
            20,
          ],

          animate: true,

          duration: 0.8,
        },
      );

      return;
    }

    try {
      const bounds =
        L.latLngBounds(
          coordinates,
        );

      map.fitBounds(
        bounds,
        {
          padding: [
            60,
            60,
          ],

          maxZoom: 8,

          animate: true,

          duration: 0.8,
        },
      );
    } catch {
      map.fitBounds(
        INDIA_BOUNDS,
        {
          padding: [
            20,
            20,
          ],
        },
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    events.length,
  ]);

  /*
   * ============================================================
   * RENDER EVENT MARKERS
   * ============================================================
   */

  useEffect(() => {
    if (
      !eventsLayerRef.current ||
      !buffersLayerRef.current
    ) {
      return;
    }

    eventsLayerRef.current.clearLayers();

    buffersLayerRef.current.clearLayers();

    if (!showEvents) {
      return;
    }

    events.forEach(
      (event) => {
        if (!event) {
          return;
        }

        const eLat =
          Number(
            event.lat,
          );

        const eLng =
          Number(
            event.lng,
          );

        if (
          !Number.isFinite(
            eLat,
          ) ||
          !Number.isFinite(
            eLng,
          )
        ) {
          return;
        }

        const isSelected =
          selectedEvent?.id ===
          event.id;

        const priority =
          normalizePriority(event);

        const style =
          getPriorityStyle(
            priority,
          );

        /*
         * ======================================================
         * BUFFER
         * ======================================================
         */

        if (
          showBufferZones
        ) {
          const outerCircle =
            L.circle(
              [
                eLat,
                eLng,
              ],
              {
                radius:
                  5000,

                color:
                  style.color,

                weight:
                  1.2,

                dashArray:
                  '4, 4',

                fillColor:
                  style.color,

                fillOpacity:
                  isSelected
                    ? 0.16
                    : 0.05,
              },
            );

          const innerCircle =
            L.circle(
              [
                eLat,
                eLng,
              ],
              {
                radius:
                  2000,

                color:
                  style.color,

                weight:
                  1.8,

                fillColor:
                  style.color,

                fillOpacity:
                  isSelected
                    ? 0.3
                    : 0.12,
              },
            );

          buffersLayerRef.current?.addLayer(
            outerCircle,
          );

          buffersLayerRef.current?.addLayer(
            innerCircle,
          );
        }

        /*
         * ======================================================
         * EVENT MARKER
         * ======================================================
         */

        const pulseSize =
          isSelected
            ? 38
            : 30;

        const eventId =
          String(
            event.id,
          );

        const markerLabel =
          eventId.replace(
            'EVT-',
            '',
          );

        const markerHtml = `
          <div
            style="
              position:relative;
              width:${pulseSize}px;
              height:${pulseSize}px;
              display:flex;
              align-items:center;
              justify-content:center;
              cursor:pointer;
            "
          >
            <div
              style="
                position:absolute;
                inset:0;
                border-radius:50%;
                background:${style.glow};
                animation:veyronix-ping 2s
                  cubic-bezier(0,0,0.2,1)
                  infinite;
              "
            ></div>

            <div
              style="
                position:relative;
                width:${isSelected ? 24 : 20}px;
                height:${isSelected ? 24 : 20}px;
                border-radius:50%;
                background:${style.color};
                border:2px solid #ffffff;
                box-shadow:
                  0 0 18px ${style.color},
                  0 2px 8px rgba(0,0,0,0.85);
                display:flex;
                align-items:center;
                justify-content:center;
                color:#ffffff;
                font-size:9px;
                font-weight:900;
                font-family:'JetBrains Mono',monospace;
              "
            >
              ${markerLabel}
            </div>
          </div>
        `;

        const customIcon =
          L.divIcon({
            className:
              `veyronix-event-${eventId}`,

            html:
              markerHtml,

            iconSize: [
              pulseSize,
              pulseSize,
            ],

            iconAnchor: [
              pulseSize / 2,
              pulseSize / 2,
            ],
          });

        const eventMarker =
          L.marker(
            [
              eLat,
              eLng,
            ],
            {
              icon:
                customIcon,
            },
          );

        /*
         * ======================================================
         * POPUP DATA
         * ======================================================
         */

        const frp =
          Number(
            event.frpMw ||
              0,
          );

        const brightness =
          Number(
            event.brightnessTempK ||
              0,
          );

        const distanceKm =
          Number(
            event.spatialContext
              ?.distanceKm ||
              0,
          );

        const facilityName =
          event.spatialContext
            ?.facilityName ||
          'nearby location';

        const mlSource =
          event.likelySource ||
          'Uncertain';

        const confidence =
          Number(
            event.confidence ||
              0,
          );

        /*
         * ======================================================
         * POPUP
         * ======================================================
         */

        const popupHtml = `
          <div
            style="
              font-family:Inter,system-ui,sans-serif;
              font-size:12px;
              color:#e2e8f0;
              min-width:270px;
              padding:6px;
              background:#0a0e24;
              border-radius:10px;
            "
          >
            <div
              style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                margin-bottom:6px;
                gap:8px;
              "
            >
              <span
                style="
                  background:${style.color};
                  color:#ffffff;
                  font-size:10px;
                  font-weight:800;
                  padding:2px 7px;
                  border-radius:4px;
                  font-family:'JetBrains Mono',monospace;
                "
              >
                ${style.label}
              </span>

              <span
                style="
                  font-size:11px;
                  font-weight:600;
                  color:#94a3b8;
                  font-family:'JetBrains Mono',monospace;
                "
              >
                ${eventId}
              </span>
            </div>

            <h3
              style="
                font-size:13.5px;
                font-weight:700;
                color:#ffffff;
                margin:0 0 3px 0;
                line-height:1.3;
                font-family:'JetBrains Mono','Inter',monospace;
              "
            >
              ${event.name}
            </h3>

            <p
              style="
                font-size:11px;
                color:#94a3b8;
                margin:0 0 8px 0;
              "
            >
              ${
                event.region ||
                'Unknown region'
              },
              ${
                event.state ||
                'Unknown state'
              }
            </p>

            <div
              style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:6px;
                background:#0f1638;
                border:1px solid #1e295e;
                border-radius:8px;
                padding:8px;
                margin-bottom:8px;
              "
            >
              <div>
                <div
                  style="
                    font-size:10px;
                    color:#94a3b8;
                  "
                >
                  FRP
                </div>

                <div
                  style="
                    font-size:13px;
                    font-weight:700;
                    color:#f43f5e;
                    font-family:'JetBrains Mono',monospace;
                  "
                >
                  ${frp.toFixed(1)} MW
                </div>
              </div>

              <div>
                <div
                  style="
                    font-size:10px;
                    color:#94a3b8;
                  "
                >
                  Brightness
                </div>

                <div
                  style="
                    font-size:13px;
                    font-weight:700;
                    color:#38bdf8;
                    font-family:'JetBrains Mono',monospace;
                  "
                >
                  ${brightness.toFixed(1)} K
                </div>
              </div>

              <div>
                <div
                  style="
                    font-size:10px;
                    color:#94a3b8;
                  "
                >
                  Sensor
                </div>

                <div
                  style="
                    font-size:10px;
                    font-weight:600;
                    color:#e2e8f0;
                    font-family:'JetBrains Mono',monospace;
                  "
                >
                  ${String(
                    event.sensor ||
                    '',
                  )}
                </div>
              </div>

              <div>
                <div
                  style="
                    font-size:10px;
                    color:#94a3b8;
                  "
                >
                  ML Attribution
                </div>

                <div
                  style="
                    font-size:10px;
                    font-weight:700;
                    color:#10b981;
                  "
                >
                  ${mlSource}
                </div>

                <div
                  style="
                    font-size:9px;
                    color:#94a3b8;
                    margin-top:2px;
                  "
                >
                  Confidence:
                  ${(confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div
              style="
                display:flex;
                align-items:center;
                gap:6px;
                padding:7px 8px;
                margin-bottom:8px;
                border-radius:7px;
                background:rgba(249,115,22,0.10);
                border:1px solid rgba(249,115,22,0.35);
                color:#fdba74;
                font-size:10.5px;
              "
            >
              <span style="font-size:15px;">
                🔥
              </span>

              <span>
                NASA VIIRS thermal anomaly
              </span>
            </div>

            <div
              style="
                font-size:11px;
                color:#cbd5e1;
                margin-bottom:8px;
                line-height:1.4;
              "
            >
              <strong>
                Spatial Context:
              </strong>

              ${distanceKm.toFixed(2)}
              km from
              ${facilityName}.
            </div>

            <button
              id="veyronix-select-${eventId}"
              style="
                width:100%;
                background:#0284c7;
                color:#ffffff;
                border:1px solid #38bdf8;
                padding:7px 10px;
                border-radius:6px;
                font-size:11px;
                font-weight:700;
                font-family:'JetBrains Mono',monospace;
                cursor:pointer;
              "
            >
              Select for Detailed Analysis →
            </button>
          </div>
        `;

        eventMarker.bindPopup(
          popupHtml,
          {
            maxWidth: 320,
          },
        );

        /*
         * ======================================================
         * MARKER CLICK
         * ======================================================
         */

        eventMarker.on(
          'click',
          () => {
            setShowEventCard(
              true,
            );

            onSelectEvent(
              event,
            );
          },
        );

        /*
         * ======================================================
         * POPUP BUTTON
         * ======================================================
         */

        eventMarker.on(
          'popupopen',
          () => {
            const button =
              document.getElementById(
                `veyronix-select-${eventId}`,
              );

            if (button) {
              button.onclick =
                () => {
                  setShowEventCard(
                    true,
                  );

                  onSelectEvent(
                    event,
                  );
                };
            }
          },
        );

        eventsLayerRef.current?.addLayer(
          eventMarker,
        );
      },
    );
  }, [
    events,
    selectedEvent,
    showEvents,
    showBufferZones,
    onSelectEvent,
  ]);

  /*
   * ============================================================
   * FLY TO SELECTED EVENT
   * ============================================================
   */

  useEffect(() => {
    const map =
      mapInstanceRef.current;

    if (
      !map ||
      !selectedEvent
    ) {
      return;
    }

    const lat =
      Number(
        selectedEvent.lat,
      );

    const lng =
      Number(
        selectedEvent.lng,
      );

    if (
      !Number.isFinite(
        lat,
      ) ||
      !Number.isFinite(
        lng,
      )
    ) {
      return;
    }

    setShowEventCard(
      true,
    );

    try {
      map.flyTo(
        [
          lat,
          lng,
        ],
        13,
        {
          duration:
            1.2,

          easeLinearity:
            0.25,
        },
      );
    } catch {
      // Ignore.
    }
  }, [
    selectedEvent,
  ]);

  /*
   * ============================================================
   * RESET INDIA
   * ============================================================
   */

  const handleResetToIndia =
    () => {
      const map =
        mapInstanceRef.current;

      if (!map) {
        return;
      }

      try {
        map.fitBounds(
          INDIA_BOUNDS,
          {
            padding: [
              20,
              20,
            ],

            duration: 1,
          },
        );
      } catch {
        map.setView(
          INDIA_CENTER,
          INDIA_DEFAULT_ZOOM,
        );
      }
    };

  /*
   * ============================================================
   * ZOOM
   * ============================================================
   */

  const handleZoomIn =
    () => {
      mapInstanceRef.current?.zoomIn(
        1,
      );
    };

  const handleZoomOut =
    () => {
      mapInstanceRef.current?.zoomOut(
        1,
      );
    };

  /*
   * ============================================================
   * ZOOM SELECTED EVENT
   * ============================================================
   */

  const handleUltraZoomOnTarget =
    () => {
      const map =
        mapInstanceRef.current;

      if (
        !map ||
        !selectedEvent
      ) {
        return;
      }

      const lat =
        Number(
          selectedEvent.lat,
        );

      const lng =
        Number(
          selectedEvent.lng,
        );

      if (
        !Number.isFinite(
          lat,
        ) ||
        !Number.isFinite(
          lng,
        )
      ) {
        return;
      }

      try {
        map.flyTo(
          [
            lat,
            lng,
          ],
          18,
          {
            duration: 1,
          },
        );
      } catch {
        // Ignore.
      }
    };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <>
      <style>
        {`
          @keyframes veyronix-ping {
            0% {
              transform: scale(0.85);
              opacity: 0.85;
            }

            70% {
              transform: scale(1.45);
              opacity: 0;
            }

            100% {
              transform: scale(1.45);
              opacity: 0;
            }
          }

          .veyronix-map-container
            .leaflet-popup-content-wrapper {
            background:#080d24;
            color:#e2e8f0;
            border:1px solid #26366f;
            border-radius:12px;
            box-shadow:
              0 12px 35px rgba(0,0,0,0.55);
          }

          .veyronix-map-container
            .leaflet-popup-tip {
            background:#080d24;
          }

          .veyronix-map-container
            .leaflet-popup-close-button {
            color:#94a3b8 !important;
          }

          .veyronix-map-container
            .leaflet-control-attribution {
            background:rgba(5,8,22,0.82) !important;
            color:#94a3b8 !important;
            font-size:9px !important;
          }

          .veyronix-map-container
            .leaflet-control-attribution a {
            color:#38bdf8 !important;
          }

          .veyronix-map-container
            .leaflet-control-container {
            z-index:20;
          }
        `}
      </style>

      <div
        className={
          isFullscreen
            ? `
              fixed
              inset-0
              z-[999999]
              w-full
              h-full
              max-w-[100vw]
              max-h-[100vh]
              bg-[#050816]
              flex
              flex-col
              overflow-hidden
              m-0
              p-0
              rounded-none
              border-0
            `
            : `
              relative
              flex
              flex-col
              bg-[#0b102c]
              rounded-2xl
              border
              border-[#1e2a60]
              overflow-hidden
              shadow-2xl
              h-[520px]
              w-full
            `
        }
      >

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            px-3
            sm:px-4
            py-2.5
            bg-[#080c22]
            border-b
            border-[#1b2554]
            flex-wrap
            gap-2
            z-10
            shrink-0
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
              min-w-0
            "
          >

            <div
              className="
                flex
                items-center
                gap-1.5
                px-2.5
                py-1
                rounded-lg
                bg-cyan-950/40
                border
                border-cyan-500/40
                text-xs
                font-semibold
                text-cyan-300
                whitespace-nowrap
              "
            >

              <Compass
                className="
                  w-3.5
                  h-3.5
                  text-cyan-400
                "
              />

              <span>
                INDIA GEOSPATIAL GIS
              </span>

            </div>

            <span
              className="
                text-[11px]
                text-slate-400
                hidden
                lg:inline
                font-mono
                truncate
              "
            >
              NASA FIRMS VIIRS •
              MODIS 1km •
              VEYRONIX ML Attribution •
              Deep Zoom Level{' '}
              {currentZoom}/22
            </span>

          </div>

          {/* ==================================================
              CONTROLS
          ================================================== */}

          <div
            className="
              flex
              items-center
              gap-1.5
              sm:gap-2
              flex-wrap
            "
          >

            {/* =================================================
                BASE MAP
                SATELLITE / FIRE HEAT / OSM
            ================================================= */}

            <div
              className="
                flex
                items-center
                bg-[#0d1438]
                border
                border-[#1e2c69]
                rounded-lg
                p-0.5
                text-xs
              "
            >

              {/* SATELLITE */}

              <button
                type="button"
                onClick={() =>
                  setBaseTile(
                    'satellite',
                  )
                }
                className={`
                  px-2
                  py-1
                  rounded-md
                  text-[11px]
                  font-medium
                  ${
                    baseTile ===
                    'satellite'
                      ? `
                        bg-cyan-500
                        text-slate-950
                        font-bold
                      `
                      : 'text-slate-300'
                  }
                `}
              >
                Satellite
              </button>

              {/* FIRE HEAT */}

              <button
                type="button"
                onClick={() =>
                  setBaseTile(
                    'fire_heat',
                  )
                }
                className={`
                  px-2
                  py-1
                  rounded-md
                  text-[11px]
                  font-medium
                  flex
                  items-center
                  gap-1
                  ${
                    baseTile ===
                    'fire_heat'
                      ? `
                        bg-orange-500
                        text-white
                        font-bold
                      `
                      : 'text-slate-300'
                  }
                `}
              >

                <Flame
                  className="
                    w-3
                    h-3
                  "
                />

                Fire Heat

              </button>

              {/* OSM */}

              <button
                type="button"
                onClick={() =>
                  setBaseTile(
                    'osm_standard',
                  )
                }
                className={`
                  px-2
                  py-1
                  rounded-md
                  text-[11px]
                  font-medium
                  ${
                    baseTile ===
                    'osm_standard'
                      ? `
                        bg-cyan-500
                        text-slate-950
                        font-bold
                      `
                      : 'text-slate-300'
                  }
                `}
              >
                OSM
              </button>

            </div>

            {/* =================================================
                EVENTS
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                setShowEvents(
                  (
                    value,
                  ) =>
                    !value,
                )
              }
              className={`
                px-2.5
                py-1
                text-[11px]
                font-mono
                rounded-lg
                border
                flex
                items-center
                gap-1.5
                ${
                  showEvents
                    ? `
                      bg-cyan-500/20
                      border-cyan-400/70
                      text-cyan-300
                    `
                    : `
                      bg-[#0d1438]
                      border-[#1e2c69]
                      text-slate-400
                    `
                }
              `}
            >

              <RadioTower
                className="
                  w-3.5
                  h-3.5
                  text-cyan-400
                "
              />

              <span>
                Events ({events.length})
              </span>

            </button>

            {/* =================================================
                BUFFERS
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                setShowBufferZones(
                  (
                    value,
                  ) =>
                    !value,
                )
              }
              className={`
                px-2
                py-1
                text-[11px]
                rounded-lg
                border
                ${
                  showBufferZones
                    ? `
                      bg-purple-500/20
                      border-purple-500/60
                      text-purple-300
                    `
                    : `
                      bg-[#0d1438]
                      border-[#1e2c69]
                      text-slate-400
                    `
                }
              `}
            >
              Buffers
            </button>

            {/* =================================================
                RESET
            ================================================= */}

            <button
              type="button"
              onClick={
                handleResetToIndia
              }
              className="
                p-1.5
                rounded-lg
                bg-[#0d1438]
                border
                border-[#1e2c69]
                text-slate-300
                hover:text-white
              "
              title="Reset to India"
            >

              <RotateCcw
                className="
                  w-3.5
                  h-3.5
                "
              />

            </button>

            {/* =================================================
                FULLSCREEN
            ================================================= */}

            {!isFullscreen && (
              <button
                type="button"
                onClick={() =>
                  setIsFullscreen(
                    true,
                  )
                }
                className="
                  p-2
                  rounded-xl
                  bg-cyan-500/20
                  border
                  border-cyan-400/80
                  text-cyan-300
                "
                title="Full Size Map"
              >

                <Maximize2
                  className="
                    w-4
                    h-4
                  "
                />

              </button>
            )}

          </div>
        </div>

        {/* ====================================================
            MAP
        ==================================================== */}

        <div
          className="
            veyronix-map-container
            relative
            flex-1
            w-full
            h-full
            bg-[#050816]
            overflow-hidden
          "
        >

          <div
            ref={
              mapContainerRef
            }
            className="
              absolute
              inset-0
              w-full
              h-full
              z-0
            "
          />

          {/* ==================================================
              FULLSCREEN BUTTON
          ================================================== */}

          {!isFullscreen && (
            <button
              type="button"
              onClick={() =>
                setIsFullscreen(
                  true,
                )
              }
              className="
                absolute
                top-3
                right-3
                z-20
                p-2.5
                rounded-xl
                bg-[#080c24]/90
                border
                border-cyan-400/80
                text-cyan-300
              "
              title="Expand map"
            >

              <Expand
                className="
                  w-5
                  h-5
                "
              />

            </button>
          )}

          {/* ==================================================
              CLOSE FULLSCREEN
          ================================================== */}

          {isFullscreen && (
            <button
              type="button"
              onClick={() =>
                setIsFullscreen(
                  false,
                )
              }
              className="
                absolute
                top-3.5
                right-3.5
                z-[9999999]
                w-10
                h-10
                rounded-full
                bg-[#070b20]/90
                border-2
                border-cyan-400/80
                text-cyan-300
                flex
                items-center
                justify-center
              "
              title="Close Fullscreen"
            >

              <X
                className="
                  w-5
                  h-5
                "
              />

            </button>
          )}

          {/* ==================================================
              ZOOM CONTROLS
          ================================================== */}

          <div
            className="
              absolute
              top-3
              left-3
              z-10
              flex
              flex-col
              gap-1.5
            "
          >

            <button
              type="button"
              onClick={
                handleZoomIn
              }
              className="
                w-9
                h-9
                rounded-xl
                bg-[#0a0f2c]/95
                border
                border-cyan-500/50
                text-slate-200
                flex
                items-center
                justify-center
              "
              title="Zoom In"
            >

              <ZoomIn
                className="
                  w-4
                  h-4
                "
              />

            </button>

            <button
              type="button"
              onClick={
                handleZoomOut
              }
              className="
                w-9
                h-9
                rounded-xl
                bg-[#0a0f2c]/95
                border
                border-cyan-500/50
                text-slate-200
                flex
                items-center
                justify-center
              "
              title="Zoom Out"
            >

              <ZoomOut
                className="
                  w-4
                  h-4
                "
              />

            </button>

            <button
              type="button"
              onClick={
                handleUltraZoomOnTarget
              }
              className="
                w-9
                h-9
                rounded-xl
                bg-[#0a0f2c]/95
                border
                border-red-500/70
                text-red-400
                flex
                items-center
                justify-center
              "
              title="Zoom to selected event"
            >

              <Eye
                className="
                  w-4
                  h-4
                "
              />

            </button>

            <button
              type="button"
              onClick={
                handleResetToIndia
              }
              className="
                w-9
                h-9
                rounded-xl
                bg-[#0a0f2c]/95
                border
                border-cyan-500/70
                text-cyan-400
                flex
                items-center
                justify-center
              "
              title="Reset to India"
            >

              <Navigation
                className="
                  w-4
                  h-4
                "
              />

            </button>

          </div>

          {/* ==================================================
              FIRE LAYER INFO
          ================================================== */}

          {baseTile ===
            'fire_heat' && (
            <div
              className="
                absolute
                top-3
                left-1/2
                -translate-x-1/2
                z-20
                px-3
                py-1.5
                rounded-lg
                bg-[#080d24]/90
                backdrop-blur-md
                border
                border-orange-500/50
                text-orange-300
                text-[10px]
                font-mono
                shadow-xl
                flex
                items-center
                gap-1.5
              "
            >

              <Flame
                className="
                  w-3.5
                  h-3.5
                  text-orange-400
                "
              />

              <span>
                NASA VIIRS THERMAL
                • {fireLayerDate}
              </span>

            </div>
          )}

          {/* ==================================================
              ANALYZING
          ================================================== */}

          {isAnalyzing && (
            <div
              className="
                absolute
                top-12
                left-1/2
                -translate-x-1/2
                z-20
                px-3
                py-1.5
                rounded-lg
                bg-cyan-950/90
                border
                border-cyan-400/60
                text-cyan-300
                text-[11px]
                font-mono
                shadow-xl
              "
            >
              VEYRONIX AI ANALYZING EVENT...
            </div>
          )}

          {/* ==================================================
              SELECTED EVENT CARD
          ================================================== */}

          {showEventCard &&
            selectedEvent &&
            Number.isFinite(
              Number(
                selectedEvent.lat,
              ),
            ) &&
            Number.isFinite(
              Number(
                selectedEvent.lng,
              ),
            ) && (
              <div
                className={`
                  absolute
                  z-10
                  w-[280px]
                  sm:w-[320px]
                  bg-[#090e28]/95
                  backdrop-blur-md
                  border
                  border-[#1e2b66]
                  rounded-xl
                  p-3
                  shadow-2xl
                  text-xs
                  ${
                    isFullscreen
                      ? 'bottom-14 left-4'
                      : 'bottom-14 right-3'
                  }
                `}
              >

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-2
                    pb-1.5
                    border-b
                    border-[#1b2554]
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-1.5
                      min-w-0
                    "
                  >

                    <span
                      className="
                        font-bold
                        text-white
                        truncate
                        text-xs
                      "
                    >
                      {
                        selectedEvent.name
                      }
                    </span>

                    <span
                      className="
                        px-1.5
                        py-0.5
                        rounded
                        text-[10px]
                        font-bold
                      "
                      style={{
                        color:
                          getPriorityStyle(
                            normalizePriority(
                              selectedEvent,
                            ),
                          ).color,
                        backgroundColor:
                          `${getPriorityStyle(
                            normalizePriority(
                              selectedEvent,
                            ),
                          ).color}26`,
                        border:
                          `1px solid ${getPriorityStyle(
                            normalizePriority(
                              selectedEvent,
                            ),
                          ).border}`,
                      }}
                    >
                      {getPriorityStyle(
                        normalizePriority(
                          selectedEvent,
                        ),
                      ).label}
                      {' • '}
                      {typeof selectedEvent.frpMw ===
                      'number'
                        ? selectedEvent.frpMw.toFixed(
                            0,
                          )
                        : '0'}{' '}
                      MW
                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowEventCard(
                        false,
                      )
                    }
                    className="
                      p-1
                      rounded-md
                      text-slate-400
                      hover:text-white
                    "
                    title="Close target box"
                  >

                    <X
                      className="
                        w-3.5
                        h-3.5
                      "
                    />

                  </button>

                </div>

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-x-2
                    gap-y-1
                    pt-1.5
                    text-[11px]
                  "
                >

                  <span className="text-slate-400">
                    Coordinates:
                  </span>

                  <span
                    className="
                      font-mono
                      text-right
                      text-cyan-300
                    "
                  >
                    {Number(
                      selectedEvent.lat,
                    ).toFixed(
                      3,
                    )}
                    °N,{' '}
                    {Number(
                      selectedEvent.lng,
                    ).toFixed(
                      3,
                    )}
                    °E
                  </span>

                  <span className="text-slate-400">
                    ML Attribution:
                  </span>

                  <span
                    className="
                      font-semibold
                      text-right
                      text-emerald-400
                      truncate
                    "
                  >
                    {
                      selectedEvent.likelySource ||
                      'Uncertain'
                    }
                  </span>

                  <span className="text-slate-400">
                    Region:
                  </span>

                  <span
                    className="
                      font-medium
                      text-right
                      text-slate-200
                      truncate
                    "
                  >
                    {
                      selectedEvent.region ||
                      'India'
                    }
                  </span>

                  <span className="text-slate-400">
                    Event ID:
                  </span>

                  <span
                    className="
                      font-mono
                      text-right
                      text-slate-300
                    "
                  >
                    {
                      selectedEvent.id
                    }
                  </span>

                  <span className="text-slate-400">
                    Fire Layer:
                  </span>

                  <span
                    className="
                      font-mono
                      text-right
                      text-orange-300
                    "
                  >
                    VIIRS 375m
                  </span>

                </div>
              </div>
            )}

          {/* ==================================================
              REOPEN EVENT CARD
          ================================================== */}

          {!showEventCard &&
            selectedEvent && (
              <button
                type="button"
                onClick={() =>
                  setShowEventCard(
                    true,
                  )
                }
                className={`
                  absolute
                  z-10
                  px-3
                  py-1.5
                  rounded-xl
                  bg-[#090e28]/95
                  border
                  border-cyan-500/60
                  text-cyan-300
                  text-xs
                  font-mono
                  flex
                  items-center
                  gap-1.5
                  ${
                    isFullscreen
                      ? 'bottom-14 left-4'
                      : 'bottom-14 right-3'
                  }
                `}
              >

                <Eye
                  className="
                    w-3.5
                    h-3.5
                    text-cyan-400
                  "
                />

                <span>
                  Target Details (
                  {
                    selectedEvent.id
                  }
                  )
                </span>

              </button>
            )}

          {/* ==================================================
              TELEMETRY BAR
          ================================================== */}

          {showTelemetryBar ? (
            <div
              className="
                absolute
                bottom-2
                left-3
                right-3
                z-10
                flex
                items-center
                justify-between
                bg-[#080d24]/95
                backdrop-blur-md
                border
                border-[#1c275a]
                rounded-lg
                px-2.5
                sm:px-3
                py-1.5
                text-[11px]
                text-slate-300
                shadow-xl
                overflow-hidden
                gap-2
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  sm:gap-3
                  min-w-0
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-1
                    font-mono
                    text-cyan-300
                    whitespace-nowrap
                  "
                >

                  <MapPin
                    className="
                      w-3.5
                      h-3.5
                      text-cyan-400
                    "
                  />

                  <span>
                    {cursorCoords
                      ? `${cursorCoords.lat}° N, ${cursorCoords.lng}° E`
                      : 'Hover map for GPS'}
                  </span>

                </div>

                <span
                  className="
                    text-[#1c275a]
                    hidden
                    sm:inline
                  "
                >
                  |
                </span>

                <div
                  className="
                    hidden
                    md:flex
                    items-center
                    gap-1.5
                    whitespace-nowrap
                  "
                >

                  <span
                    className="
                      w-2
                      h-2
                      rounded-full
                      bg-emerald-400
                      animate-pulse
                    "
                  />

                  <span
                    className="
                      text-emerald-300
                      font-mono
                      text-[10.5px]
                    "
                  >
                    INDIA SATELLITE
                    TELEMETRY
                  </span>

                </div>

              </div>

              <div
                className="
                  flex
                  items-center
                  gap-1.5
                  sm:gap-2
                  text-[10px]
                  font-mono
                  shrink-0
                "
              >

                <span
                  className="
                    px-2
                    py-0.5
                    rounded
                    bg-[#0d1438]
                    border
                    border-[#1e2a60]
                    text-slate-300
                  "
                >
                  Zoom:
                  Level{' '}
                  {currentZoom}/22
                </span>

                <span
                  className="
                    px-2
                    py-0.5
                    rounded
                    bg-[#0d1438]
                    border
                    border-orange-500/40
                    text-orange-300
                    hidden
                    sm:inline
                  "
                >
                  VIIRS 375m
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setShowTelemetryBar(
                      false,
                    )
                  }
                  className="
                    p-1
                    rounded
                    text-slate-400
                    hover:text-white
                  "
                  title="Close telemetry"
                >

                  <X
                    className="
                      w-3.5
                      h-3.5
                    "
                  />

                </button>

              </div>

            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                setShowTelemetryBar(
                  true,
                )
              }
              className="
                absolute
                bottom-2
                left-3
                z-10
                px-2.5
                py-1
                rounded-lg
                bg-[#080d24]/90
                border
                border-cyan-500/50
                text-cyan-300
                text-[10.5px]
                font-mono
                flex
                items-center
                gap-1.5
              "
            >

              <MapPin
                className="
                  w-3
                  h-3
                "
              />

              <span>
                Show Telemetry
              </span>

            </button>
          )}

        </div>
      </div>
    </>
  );
};

export default IndiaMapVisualization;