import React from 'react';
import { X, Layers, Flame, CheckCircle, ShieldCheck, Database, Cpu, Compass } from 'lucide-react';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="sih-card rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-cyan-500/40">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-[#081024]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0d1733] text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-400 font-tech uppercase tracking-wider bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-400/30">
                  SIH PS-162 SPECIFICATION
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight font-heading mt-0.5">
                Contextual Attribution Research Architecture
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Section 1: Problem Statement */}
          <div className="bg-[#081024] border border-cyan-500/20 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5 font-tech">
              <Flame className="w-4 h-4 text-orange-400" />
              1. The Core Problem in Industrial Fire Surveillance
            </div>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              Raw satellite thermal sensors (such as NASA FIRMS, MODIS, and VIIRS) detect high thermal radiance (FRP) indiscriminately. They frequently flag planned industrial flare stacks, blast furnaces, and legal incinerators as emergency wildfires or accidental fires, overwhelming response teams. Conversely, uncontained industrial accidents in dense industrial parks get lost in the noise.
            </p>
          </div>

          {/* Section 2: The Workflow */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white font-heading">
              2. The Contextual Attribution Workflow
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#081024] border border-cyan-500/20 p-3 rounded-lg space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5 font-heading">
                  <Database className="w-3.5 h-3.5 text-orange-400" />
                  <span>Stage 1: Satellite Ingestion</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed font-mono-code">
                  Pulls active fire pixels (FRP, brightness temperature, confidence) from VIIRS/MODIS and INSAT-3D feeds.
                </p>
              </div>

              <div className="bg-[#081024] border border-cyan-500/20 p-3 rounded-lg space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5 font-heading">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Stage 2: Geospatial Intersection</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Buffers thermal pixel against registered industrial facility polygons, flare stack databases, and OSM land-use rasters.
                </p>
              </div>

              <div className="bg-[#081024] border border-cyan-500/20 p-3 rounded-lg space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5 font-heading">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span>Stage 3: Behavioural &amp; History Analysis</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Evaluates historical recurrence baselines, diurnal cycles, and spatial dispersion vs stationary flare signatures.
                </p>
              </div>

              <div className="bg-[#081024] border border-cyan-500/20 p-3 rounded-lg space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5 font-heading">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stage 4: Safe Attribution Decision</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Outputs verified attribution tier. When evidence conflicts or data is sparse, safely returns &ldquo;Requires Review&rdquo;.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Safe Attribution */}
          <div className="bg-[#081024] border border-cyan-500/20 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 font-heading">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              3. Safety-First AI Safeguards
            </div>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              Unlike uncalibrated classification models that force an arbitrary label, this system enforces strict contextual convergence. If a hotspot has zero facility history and cloud shadow prevents corroboration, the system flags it as an Unknown Investigation Case rather than generating false confidence.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-cyan-500/20 flex items-center justify-between bg-[#081024]">
          <span className="text-[11px] text-cyan-400 font-mono-code">
            Smart India Hackathon 2024 · Problem Statement 162
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-colors cursor-pointer font-tech shadow-md"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
