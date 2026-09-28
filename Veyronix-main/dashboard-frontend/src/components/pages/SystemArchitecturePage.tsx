import React from 'react';
import {
  Settings,
  Cpu,
  Database,
  CloudSun,
  Flame,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Server,
  ArrowDown,
} from 'lucide-react';
import { TypewriterHeading } from '../TypewriterHeading';

export const SystemArchitecturePage: React.FC = () => {
  const architectureLayers = [
    {
      title: 'DATA SOURCES',
      items: ['NASA FIRMS (VIIRS / MODIS)', 'Sentinel-2 Level-2A Archive', 'GFS & ECMWF Weather Telemetry', 'Bhuvan / OpenStreetMap Industrial GIS'],
      icon: Flame,
    },
    {
      title: 'PREPROCESSING & INGESTION',
      items: ['Radiance Threshold Filtering', 'Cloud Cover & Smoke Masking', 'Sensor Coordinate Normalization'],
      icon: Database,
    },
    {
      title: 'EVENT CONSTRUCTION',
      items: ['Spatial Clustering (DBSCAN 1.5km)', 'Temporal Radiance Coalescence', 'Diurnal FRP Delta Tracking'],
      icon: Layers,
    },
    {
      title: 'CONTEXT ENGINE',
      items: ['5 km Facility Proximity Buffer', 'Corridor Zoning (Petrochem / Steel / Power)', '180-day Revisit Baseline Comparison'],
      icon: Cpu,
    },
    {
      title: 'AI / ML INFERENCE ENGINE',
      items: ['Statistical Abnormality Scoring', 'Gradient Boosted Source Classifier', 'Uncertainty & Unknown Trigger Guardrail'],
      icon: ShieldCheck,
    },
    {
      title: 'ATTRIBUTION & TRIAGE',
      items: ['Likely Source Association (Industrial vs Agro vs Wildfire)', 'Human Investigation Priority Ranking (0-100)'],
      icon: CheckCircle2,
    },
    {
      title: 'INVESTIGATION DASHBOARD',
      items: ['Real-time Dispatch Docket', 'Evidence Verification Audit Trail', 'Zonal Field Action Integration'],
      icon: Server,
    },
  ];

  const systemStatus = [
    { service: 'FIRMS VIIRS & MODIS Feed', status: 'ONLINE', ping: '12ms' },
    { service: 'Weather Telemetry Engine', status: 'ONLINE', ping: '18ms' },
    { service: 'Industrial GIS Proximity Store', status: 'ONLINE', ping: '8ms' },
    { service: 'Contextual AI Scoring Engine', status: 'READY', ping: '4ms' },
    { service: 'Investigation Database', status: 'ONLINE', ping: '15ms' },
    { service: 'SMS / Email Dispatch Gateway', status: 'ONLINE', ping: '24ms' },
  ];

  return (
    <div className="space-y-6 select-text">
      {/* Header */}
      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-cyan-400" />
          <TypewriterHeading
            as="h1"
            text="SYSTEM ARCHITECTURE & PIPELINE"
            className="text-xl sm:text-2xl font-bold text-white"
            glow={true}
            glowColor="cyan"
            speed={20}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1 font-sans-clean">
          Full technical topology: 7-layer ingest pipeline from orbital satellite radiometers to edge investigation dispatch.
        </p>
      </div>

      {/* 7-Layer Ingestion Pipeline */}
      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-5 shadow-2xl space-y-4">
        <TypewriterHeading
          as="h2"
          text="END-TO-END INFERENCE TOPOLOGY"
          className="text-xs font-bold uppercase text-cyan-300 pb-2 border-b border-[#1b2554]"
          glow={true}
          glowColor="cyan"
          speed={25}
        />

        <div className="space-y-3">
          {architectureLayers.map((layer, idx) => {
            const Icon = layer.icon;
            return (
              <div key={idx} className="relative">
                <div className="p-4 rounded-xl bg-[#070b1e] border border-[#1b2554] flex flex-col md:flex-row md:items-center justify-between gap-3 card-hover-glow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs font-mono shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                      0{idx + 1}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold font-heading text-white flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{layer.title}</span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {layer.items.map((item, itemIdx) => (
                      <span
                        key={itemIdx}
                        className="px-2.5 py-1 rounded-lg bg-[#0e163d] border border-[#1e2c69] text-slate-300 text-[11px] font-sans-clean box-interactive-glow"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {idx < architectureLayers.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowDown className="w-4 h-4 text-cyan-500/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Subsystem Health Monitor */}
      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-5 shadow-2xl">
        <TypewriterHeading
          as="h3"
          text="LIVE SUBSYSTEM HEALTH & CONNECTIVITY"
          className="text-xs font-bold uppercase text-white mb-3 pb-2 border-b border-[#1b2554]"
          glow={true}
          glowColor="white"
          speed={25}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {systemStatus.map((s, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#070b1e] border border-[#1b2554] flex items-center justify-between font-mono text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                <span className="text-slate-300 text-[11.5px] font-sans-clean">{s.service}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyan-400 font-bold">{s.status}</span>
                <span className="text-[10px] text-slate-500">{s.ping}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
