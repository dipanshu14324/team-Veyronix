import React from 'react';
import {
  ThermalEvent,
  AnalysisResponse,
  PriorityLevel,
  AbnormalityLevel,
} from '../types';
import {
  History,
  Activity,
  Factory,
  CloudSun,
  ShieldAlert,
  Flame,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface EventDetailPanelProps {
  event: ThermalEvent;
  analysisResult: AnalysisResponse | null;
  isAnalyzing: boolean;
  analysisStep: string;
  onRunAnalysis: (eventId: string) => void;
  onResetAnalysis: () => void;
}

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({
  event,
  analysisResult,
  isAnalyzing,
  analysisStep,
  onRunAnalysis,
  onResetAnalysis,
}) => {
  const getPriorityStyle = (priority: PriorityLevel) => {
    switch (priority) {
      case 'HIGH':
        return {
          bg: 'bg-rose-950/70',
          text: 'text-rose-300',
          border: 'border-rose-500/50',
          badge: 'bg-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-950/70',
          text: 'text-amber-300',
          border: 'border-amber-500/50',
          badge: 'bg-amber-600 text-white',
        };
      case 'LOW':
        return {
          bg: 'bg-emerald-950/70',
          text: 'text-emerald-300',
          border: 'border-emerald-500/50',
          badge: 'bg-emerald-600 text-white',
        };
      case 'UNKNOWN':
      default:
        return {
          bg: 'bg-slate-900',
          text: 'text-slate-400',
          border: 'border-slate-700',
          badge: 'bg-slate-700 text-white',
        };
    }
  };

  const getAbnormalityBadge = (level: AbnormalityLevel | string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-rose-950/70 text-rose-300 border border-rose-500/50 font-semibold';
      case 'MEDIUM':
        return 'bg-amber-950/70 text-amber-300 border border-amber-500/50 font-semibold';
      case 'LOW':
        return 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 font-semibold';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700 font-semibold';
    }
  };

  const priorityStyle = getPriorityStyle(event.investigationPriority);

  return (
    <div className="flex flex-col h-full sih-card rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl">
      {/* Panel Top Bar */}
      <div className="px-5 py-3.5 bg-[#081024] border-b border-cyan-500/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white font-heading">
            Thermal Event Inspector
          </h2>
        </div>
        <div className="flex items-center gap-2 font-mono-code">
          <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#0d1630] text-cyan-300 font-bold border border-cyan-500/30">
            {event.id}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 font-semibold border border-emerald-500/40">
            Target Active
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-slate-200">
        {/* Section: Event Identification & Primary Metadata */}
        <div className="bg-[#081024] border border-cyan-500/20 rounded-xl p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wide font-tech">
                Event Identification
              </span>
              <div className="text-xl font-bold text-white mt-0.5 font-mono-code">
                {event.id}
              </div>
              <div className="text-sm font-semibold text-orange-400 font-heading">
                {event.name}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono-code">
                Region: <strong className="text-slate-200">{event.region}</strong> ({event.state})
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold tracking-wide font-tech ${priorityStyle.badge}`}
              >
                {event.investigationPriority} Priority
              </span>
              <div className="text-xs text-slate-400 mt-1.5 font-mono-code">
                Confidence: <strong className="text-emerald-400">{Math.round(event.confidence * 100)}%</strong>
              </div>
            </div>
          </div>

          {/* Core At-A-Glance Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-cyan-500/15">
            <div className="bg-[#0b142c] p-2.5 rounded-lg border border-cyan-500/20">
              <span className="text-[10px] text-slate-400 uppercase block font-tech">
                Likely Source
              </span>
              <div className="text-xs font-semibold text-white mt-1 truncate" title={event.likelySource}>
                {event.likelySource}
              </div>
            </div>

            <div className="bg-[#0b142c] p-2.5 rounded-lg border border-cyan-500/20">
              <span className="text-[10px] text-slate-400 uppercase block font-tech">
                Abnormality
              </span>
              <div className="text-xs font-bold text-orange-400 mt-1">
                {event.abnormality}
              </div>
            </div>

            <div className="bg-[#0b142c] p-2.5 rounded-lg border border-cyan-500/20">
              <span className="text-[10px] text-slate-400 uppercase block font-tech">
                Triage Score
              </span>
              <div className="text-xs font-bold text-cyan-300 mt-1 font-mono-code">
                {event.priorityScore} / 100
              </div>
            </div>

            <div className="bg-[#0b142c] p-2.5 rounded-lg border border-cyan-500/20">
              <span className="text-[10px] text-slate-400 uppercase block font-tech">
                Buffer Proximity
              </span>
              <div className="text-xs font-semibold text-white mt-1 font-mono-code">
                {event.spatialContext.distanceKm} km
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 bg-[#0b142c] px-3 py-2 rounded-lg border border-cyan-500/20 flex-wrap gap-2 font-mono-code">
            <span>Sensor: <strong className="text-cyan-300 font-semibold">{event.sensor}</strong></span>
            <span>FRP: <strong className="text-orange-400 font-bold">{event.frpMw} MW</strong></span>
            <span>Temp: <strong className="text-white font-semibold">{event.brightnessTempK} K</strong></span>
          </div>
        </div>

        {/* Section: Prominent ANALYZE BUTTON */}
        <div className="pt-2">
          {!analysisResult && !isAnalyzing ? (
            <button
              id="btn-analyze-thermal-event"
              onClick={() => onRunAnalysis(event.id)}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer font-heading tracking-wide border border-orange-400/50"
            >
              <Flame className="w-4 h-4 fill-white" />
              <span>Analyze Thermal Event</span>
            </button>
          ) : isAnalyzing ? (
            <div className="bg-[#081024] border border-cyan-500/40 rounded-xl p-4 text-center space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold text-sm font-tech">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Running Contextual Inference Engine</span>
              </div>

              <div className="py-1 px-3 rounded-lg bg-[#0b142c] border border-cyan-500/30 inline-block text-xs text-cyan-300 font-mono-code font-semibold">
                &ldquo;{analysisStep}&rdquo;
              </div>

              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full w-3/4 animate-pulse rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                id="btn-reanalyze-event"
                onClick={() => onRunAnalysis(event.id)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer font-heading tracking-wide border border-orange-400/50"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white" />
                Re-Analyze {event.id}
              </button>
              <button
                id="btn-clear-analysis"
                onClick={onResetAnalysis}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#081024] hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer font-tech"
              >
                Reset Output
              </button>
            </div>
          )}
        </div>

        {/* Section: OUTPUT SECTION */}
        {analysisResult && (
          <div className="space-y-3 pt-3 border-t border-cyan-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-heading">
                  Attribution &amp; Analysis Output
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono-code">
                Convergence: <strong className="text-emerald-400 font-bold">{Math.round(analysisResult.confidence * 100)}%</strong>
              </span>
            </div>

            {/* Unknown Case Alert Box */}
            {analysisResult.insufficient_evidence && (
              <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-3.5 space-y-1.5 text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wide font-tech">
                      Safety Safeguard Active
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      &ldquo;Evidence insufficient for reliable attribution.&rdquo;
                    </div>
                    <p className="text-[11px] text-amber-200/90 mt-1 leading-relaxed">
                      The contextual AI safety threshold requires multi-layer convergence before asserting industrial vs wildfire attribution.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Three Main Result Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-[#081024] border border-cyan-500/20 rounded-xl p-3 text-center flex flex-col justify-between">
                <div className="text-[11px] font-bold text-slate-400 uppercase font-tech">
                  Abnormality
                </div>
                <div className="py-2">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono-code ${getAbnormalityBadge(
                      analysisResult.abnormality
                    )}`}
                  >
                    {analysisResult.abnormality}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono-code">
                  Thermal divergence
                </div>
              </div>

              <div className="bg-[#081024] border border-cyan-500/20 rounded-xl p-3 text-center flex flex-col justify-between">
                <div className="text-[11px] font-bold text-slate-400 uppercase font-tech">
                  Attributed Source
                </div>
                <div className="py-2">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono-code ${
                      analysisResult.source === 'UNKNOWN'
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {analysisResult.source}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono-code">
                  Classified origin
                </div>
              </div>

              <div className="bg-[#081024] border border-cyan-500/20 rounded-xl p-3 text-center flex flex-col justify-between">
                <div className="text-[11px] font-bold text-slate-400 uppercase font-tech">
                  Priority Tier
                </div>
                <div className="py-2">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono-code ${
                      analysisResult.priority === 'HIGH'
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-500/50'
                        : analysisResult.priority === 'MEDIUM'
                        ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {analysisResult.priority}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono-code">
                  Triage decision
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
