import React, { useState } from 'react';
import {
  Radio,
  Layers,
  Flame,
  CloudSun,
  Database,
  ArrowRight,
  RefreshCw,
  Cpu,
  Compass,
  ShieldAlert,
  Satellite,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ThermalEvent } from '../../types';
import { IndiaMapVisualization } from '../IndiaMapVisualization';
import { REAL_INSAT3D_RECENT_FRAMES, SATELLITE_PILLARS, REAL_OSM_FACILITIES } from '../../data/realData';
import { TypewriterHeading } from '../TypewriterHeading';

interface LiveMonitorPageProps {
  events: ThermalEvent[];
  selectedEvent: ThermalEvent;
  onSelectEvent: (event: ThermalEvent) => void;
  onAnalyzeEvent: (event: ThermalEvent) => void;
}

export const LiveMonitorPage: React.FC<LiveMonitorPageProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onAnalyzeEvent,
}) => {
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [isPlayingFrames, setIsPlayingFrames] = useState(false);
  const [activeTab, setActiveTab] = useState<'observations' | 'insat3d' | 'fusion'>('observations');

  const currentFrame = REAL_INSAT3D_RECENT_FRAMES[selectedFrameIndex] || REAL_INSAT3D_RECENT_FRAMES[0];

  // Auto-play through 15-minute rapid scan frames
  React.useEffect(() => {
    if (!isPlayingFrames) return;
    const interval = setInterval(() => {
      setSelectedFrameIndex((prev) => (prev + 1) % REAL_INSAT3D_RECENT_FRAMES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlayingFrames]);

  const liveFeeds = [
    {
      name: 'ISRO INSAT-3D / 3DR Imager',
      status: 'RAPID SCAN ACTIVE',
      latency: '15m Cadence (82.0°E GEO)',
      type: 'Geostationary 3.9μm MIR',
      activeColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
      icon: Radio,
    },
    {
      name: 'NASA FIRMS VIIRS & MODIS',
      status: 'LANCE NRT PASS',
      latency: 'Suomi-NPP & NOAA-20',
      type: '375m High-Resolution',
      activeColor: 'text-red-400',
      badgeBg: 'bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
      icon: Satellite,
    },
    {
      name: 'OpenStreetMap (OSM) Overpass',
      status: 'GIS SYNCED',
      latency: 'Sub-meter Polygons',
      type: 'Industrial Infrastructure',
      activeColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
      icon: Database,
    },
    {
      name: 'IMD & CPCB Atmospheric Plume',
      status: 'STABLE DISPERSION',
      latency: 'Wind & Inversion Class',
      type: 'Surface Meteorology',
      activeColor: 'text-purple-400',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
      icon: CloudSun,
    },
  ];

  return (
    <div className="space-y-6 select-text">
      {/* Top Banner: Status & Real Sensor Feeds */}
      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1b2554]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Radio className="w-5 h-5 animate-pulse text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <TypewriterHeading
                  as="h1"
                  text="LIVE SATELLITE MONITOR"
                  className="text-xl sm:text-2xl font-bold text-white"
                  glow={true}
                  glowColor="cyan"
                  speed={20}
                />
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-heading bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  INSAT-3D &bull; FIRMS &bull; OSM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-sans-clean">
                Real-time Geostationary (ISRO INSAT-3D) &amp; Polar LEO (NASA FIRMS) multi-sensor telemetry over India.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-[#070b1e] border border-[#1e2c69] flex items-center gap-2 font-mono">
              <Satellite className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">GEO Slot:</span>
              <strong className="text-white">82.0° E &amp; 74.0° E</strong>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-xs font-bold font-heading text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>MOSDAC ACTIVE</span>
            </div>
          </div>
        </div>

        {/* 4 Sensor Sources Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          {liveFeeds.map((feed, i) => {
            const Icon = feed.icon;
            return (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#070b1e] border border-[#1b2554] flex items-center justify-between text-xs card-hover-glow cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg bg-[#0e163d] ${feed.activeColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold font-heading text-white text-[11px] leading-tight">
                      {feed.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{feed.latency}</div>
                  </div>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold font-heading border ${feed.badgeBg}`}>
                  LIVE
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* INSAT-3D Geostationary Rapid Scan Panel */}
      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1b2554]">
          <div className="flex items-center gap-2.5">
            <Satellite className="w-5 h-5 text-cyan-400" />
            <div>
              <TypewriterHeading
                as="h2"
                text="ISRO INSAT-3D / INSAT-3DR Geostationary Rapid Scan Stream"
                className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-300"
                glow={true}
                glowColor="cyan"
                speed={20}
                subtext="Continuous 15-minute thermal anomaly monitoring filling the 12-hour polar orbit revisit latency gap."
              />
            </div>
          </div>

          {/* Frame Player Controls */}
          <div className="flex items-center gap-2 bg-[#070b1e] border border-[#1e2c69] rounded-xl p-1.5">
            <button
              onClick={() => setIsPlayingFrames(!isPlayingFrames)}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-heading flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlayingFrames
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-[#0f1638] text-slate-300 hover:text-white'
              }`}
            >
              {isPlayingFrames ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingFrames ? 'Pause Stream' : 'Play 15m Loop'}</span>
            </button>
            <div className="text-xs text-slate-400 px-2 font-mono">
              Frame: <strong className="text-white">{selectedFrameIndex + 1}</strong> of {REAL_INSAT3D_RECENT_FRAMES.length}
            </div>
          </div>
        </div>

        {/* 15-Minute Frames Time Slider / Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-3">
          {REAL_INSAT3D_RECENT_FRAMES.map((frame, idx) => {
            const isSelected = selectedFrameIndex === idx;
            return (
              <button
                key={frame.frameId}
                onClick={() => {
                  setSelectedFrameIndex(idx);
                  setIsPlayingFrames(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer box-interactive-glow ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                    : 'bg-[#070b1e] border-[#1b2554] hover:border-cyan-500/40 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1 font-heading">
                  <span className={`font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`}>
                    {frame.satellite}
                  </span>
                  <span className="font-mono text-slate-400">{frame.timeIst}</span>
                </div>
                <div className="text-xs font-bold font-mono text-white">
                  {frame.timeUtc}
                </div>
                <div className="mt-1 flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400">Thermal:</span>
                  <span className="font-bold text-red-400 font-mono">{frame.activeThermalPixelsIndia} spots</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Max &Delta;T:</span>
                  <span className="font-bold text-emerald-400 font-mono">+{frame.maxDeltaTK.toFixed(1)} K</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Selected Frame Radiometric Telemetry Details */}
        <div className="mt-3 p-3.5 rounded-xl bg-[#070b1e] border border-[#1b2554] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-[10.5px] text-slate-400">HDF5 Ingest Frame</div>
            <div className="font-mono font-bold text-cyan-300 text-[11px] truncate" title={currentFrame.frameId}>
              {currentFrame.frameId}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] text-slate-400">Imager Band 4 (MIR 3.9 μm)</div>
            <div className="font-bold text-red-400 font-mono text-xs">
              {currentFrame.mirMaxK.toFixed(1)} K (Max Radiance)
            </div>
          </div>
          <div>
            <div className="text-[10.5px] text-slate-400">Split-Window Difference (&Delta;T)</div>
            <div className="font-bold text-emerald-400 font-mono text-xs">
              +{currentFrame.maxDeltaTK.toFixed(1)} K (&gt;8.5K trigger)
            </div>
          </div>
          <div>
            <div className="text-[10.5px] text-slate-400">MOSDAC Calibration</div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>L1B Calibrated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Thermal Observations Feed & Right Real Leaflet GIS Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Observations & Telemetry Feed */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b2554]">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('observations')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-heading uppercase transition-all cursor-pointer ${
                  activeTab === 'observations'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-[#070b1e] text-slate-400 border border-[#1e2c69]'
                }`}
              >
                FIRMS Hotspots ({events.length})
              </button>
              <button
                onClick={() => setActiveTab('insat3d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-heading uppercase transition-all cursor-pointer ${
                  activeTab === 'insat3d'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-[#070b1e] text-slate-400 border border-[#1e2c69]'
                }`}
              >
                INSAT-3D Telemetry
              </button>
            </div>
            <span className="text-[11px] text-cyan-400 font-semibold font-mono">
              Live GIS Sync
            </span>
          </div>

          {activeTab === 'observations' ? (
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {events.map((evt) => {
                const isSelected = selectedEvent.id === evt.id;

                return (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0e163d] border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                        : 'bg-[#070b1e] border-[#1b2554] hover:bg-[#0c1232]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-cyan-300">
                          {evt.id}
                        </span>
                        <span className="text-xs text-slate-400">&bull; {evt.state}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#0e163d] border border-[#1e2c69] text-slate-300">
                          {evt.sensor.split(' ')[0]}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-heading ${
                            evt.investigationPriority === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                              : evt.investigationPriority === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                              : evt.investigationPriority === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          }`}
                        >
                          {evt.investigationPriority}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-bold font-heading text-white mb-1.5 leading-snug">
                      {evt.name}
                    </div>

                    {/* Sensor Radiance Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 p-2.5 rounded-xl bg-[#050816] border border-[#1b2554] mb-2.5">
                      <div>
                        GPS: <span className="font-semibold text-cyan-300 font-mono">{evt.lat.toFixed(2)}°N, {evt.lng.toFixed(2)}°E</span>
                      </div>
                      <div>
                        FRP: <strong className="text-red-400 font-mono">{evt.frpMw.toFixed(1)} MW</strong>
                      </div>
                      <div>
                        Brightness: <strong className="text-cyan-300 font-mono">{evt.brightnessTempK.toFixed(1)} K</strong>
                      </div>
                      <div>
                        Confidence: <strong className="text-emerald-400 font-mono">{Math.round(evt.confidence * 100)}%</strong>
                      </div>
                    </div>

                    {/* OSM Proximity Indicator */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 px-1">
                      <span>OSM Proximity:</span>
                      <strong className="text-slate-200">
                        {evt.spatialContext.facilityName
                          ? `${evt.spatialContext.facilityName.slice(0, 24)}... (${evt.spatialContext.distanceKm} km)`
                          : `Within ${evt.spatialContext.distanceKm} km`}
                      </strong>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnalyzeEvent(evt);
                      }}
                      id={`btn-analyze-live-${evt.id}`}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold font-heading uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>RUN CONTEXTUAL AI ATTRIBUTION</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* INSAT-3D Channel Deep-Dive Tab */
            <div className="space-y-3 p-4 rounded-2xl bg-[#0a0f2b] border border-[#1e2a60] text-xs">
              <div className="font-bold font-heading text-white text-sm flex items-center gap-2">
                <Satellite className="w-4 h-4 text-cyan-400" />
                <span>INSAT-3D Multi-Spectral Imager Telemetry</span>
              </div>
              <p className="text-slate-400 text-[11px] font-sans-clean">
                Payload parameters operated by ISRO at 82.0° E geostationary orbital slot over the Indian subcontinent:
              </p>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[#070b1e] border border-[#1b2554]">
                  <div className="flex items-center justify-between font-bold text-white font-heading">
                    <span>Middle Infrared (MIR) Channel</span>
                    <span className="text-red-400 font-mono">3.80 - 4.00 μm</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-sans-clean">
                    Spatial Resolution: 4.0 km nadir. Highest sensitivity to sub-pixel high-temperature combustion targets (gas flares, industrial explosions, blast furnace tapping).
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#070b1e] border border-[#1b2554]">
                  <div className="flex items-center justify-between font-bold text-white font-heading">
                    <span>Thermal Infrared 1 (TIR-1) Channel</span>
                    <span className="text-cyan-400 font-mono">10.20 - 11.30 μm</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-sans-clean">
                    Spatial Resolution: 4.0 km nadir. Measures background Earth surface brightness temperature.
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#070b1e] border border-[#1b2554]">
                  <div className="flex items-center justify-between font-bold text-white font-heading">
                    <span>Split-Window &Delta;T (MIR - TIR1)</span>
                    <span className="text-emerald-400 font-mono">&gt; 8.5 K Threshold</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-sans-clean">
                    Automated thermal anomaly trigger logic: when brightness difference exceeds 8.5K above diurnal background, a persistent hotspot event is constructed.
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#070b1e] border border-[#1b2554]">
                  <div className="flex items-center justify-between font-bold text-white font-heading">
                    <span>Rapid Scan Frequency</span>
                    <span className="text-purple-400 font-mono">15 Minutes</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-sans-clean">
                    Provides 96 scans per day over India, eliminating the 12-hour blind spot inherent to polar-orbiting satellites like VIIRS or MODIS.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Real Interactive Leaflet Map */}
        <div className="lg:col-span-7">
          <IndiaMapVisualization
            events={events}
            selectedEvent={selectedEvent}
            onSelectEvent={onSelectEvent}
            isAnalyzing={false}
          />
        </div>
      </div>

      {/* Sensor Complementarity Matrix */}
      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1b2554] mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <TypewriterHeading
              as="h3"
              text="MULTI-PILLAR SATELLITE FUSION MATRIX"
              className="text-xs font-bold uppercase text-white"
              glow={true}
              glowColor="cyan"
              speed={25}
            />
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Space Agency Telemetry Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SATELLITE_PILLARS.map((pillar, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#070b1e] border border-[#1b2554] flex flex-col justify-between hover:border-cyan-500/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5 font-heading">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">
                    {pillar.agency}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {pillar.temporalResolution}
                  </span>
                </div>
                <h4 className="text-xs font-bold font-heading text-white mb-1">
                  {pillar.sensorName}
                </h4>
                <div className="text-[11px] text-slate-400 mb-2 font-mono">
                  Orbit: {pillar.orbit} &bull; Res: {pillar.spatialResolution}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans-clean">
                  {pillar.role}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1b2554] text-[10.5px] text-slate-300 font-mono">
                <strong className="text-cyan-400">Key Channels:</strong> {pillar.channels}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
