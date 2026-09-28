import React from 'react';
import { Flame, Database, Cpu, ShieldCheck } from 'lucide-react';

interface WorkflowPipelineProps {
  currentStage: number;
  isAnalyzing: boolean;
}

export const WorkflowPipeline: React.FC<WorkflowPipelineProps> = ({
  currentStage,
  isAnalyzing,
}) => {
  const stages = [
    {
      stepNumber: '01',
      title: '01 · Observe and construct',
      description:
        'NASA FIRMS VIIRS & INSAT-3D supply location, time, FRP and confidence. Related observations are grouped by spatial and temporal relationships into a thermal event.',
      icon: Flame,
    },
    {
      stepNumber: '02',
      title: '02 · Build event context',
      description:
        'Local history, event behaviour and regional activity are combined with infrastructure, land cover and weather information.',
      icon: Database,
    },
    {
      stepNumber: '03',
      title: '03 · Engineer evidence',
      description:
        'The system converts FRP change, persistence, facility distance, nearby event count, land class, weather and Sentinel evidence into structured features.',
      icon: Cpu,
    },
    {
      stepNumber: '04',
      title: '04 · Analyse and prioritise',
      description:
        'AI estimates abnormality and possible source association, checks uncertainty, and ranks events for human investigation without claiming causality.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="sih-card rounded-2xl p-4 sm:p-5 shadow-2xl border border-cyan-500/30">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-cyan-500/20">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
            From hotspot to investigation priority
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 font-sans">
            Contextual reasoning stages converting raw sensor detections into reliable attribution assessments.
          </p>
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-950/70 border border-orange-500/40 text-xs text-orange-300 font-semibold shrink-0 self-start sm:self-center font-mono-code">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
            <span>Analyzing Contextual Evidence...</span>
          </div>
        )}
      </div>

      {/* 4 Pipeline Stages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isCurrent = currentStage === index + 1;
          const isPassed = currentStage > index + 1;

          return (
            <div
              key={stage.stepNumber}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'bg-[#091533] border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] transform -translate-y-0.5'
                  : isPassed
                  ? 'bg-[#081024]/90 border-cyan-500/30'
                  : 'bg-[#060b18]/80 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg border ${
                        isCurrent
                          ? 'bg-cyan-500 text-black border-cyan-300'
                          : isPassed
                          ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] font-mono-code font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      STAGE {stage.stepNumber}
                    </span>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-xs sm:text-sm text-white mt-1">
                  {stage.title}
                </h3>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed font-sans">
                  {stage.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-cyan-500/15 flex items-center justify-between text-[11px] font-mono-code">
                <span className="text-slate-400">Step {index + 1} of 4</span>
                {isPassed && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    ✓ Complete
                  </span>
                )}
                {isCurrent && (
                  <span className="text-cyan-400 font-semibold animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Active Pipeline
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
