import React from 'react';
import { ThermalEvent } from '../types';
import { Crosshair, ChevronRight } from 'lucide-react';

interface ThermalTargetSelectorProps {
  events: ThermalEvent[];
  selectedEventId: string;
  onSelectEvent: (event: ThermalEvent) => void;
  filterPriority: string | null;
  onClearFilter?: () => void;
}

export const ThermalTargetSelector: React.FC<ThermalTargetSelectorProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  filterPriority,
  onClearFilter,
}) => {
  return (
    <section className="sih-card rounded-2xl p-4 sm:p-5 shadow-2xl border border-cyan-500/30">
      {/* Header with Title & Filter indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white font-heading">
            Select Thermal Target
          </h2>
          <span className="text-[11px] text-slate-400 font-mono-code">
            (Choose a satellite hotspot to inspect)
          </span>
        </div>

        {filterPriority && (
          <div className="flex items-center gap-2 text-xs font-mono-code">
            <span className="text-slate-400">Filtered by: <strong className="text-orange-400">{filterPriority}</strong></span>
            {onClearFilter && (
              <button
                onClick={onClearFilter}
                className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                Reset filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid of Targets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {events.map((e) => {
          const isSelected = selectedEventId === e.id;
          const isUnknown = e.likelySource === 'UNKNOWN' || e.investigationPriority === 'UNKNOWN';

          let badgeClass = 'bg-[#081024] text-slate-400 border-slate-700';
          let indicatorDot = 'bg-slate-400';
          if (e.investigationPriority === 'HIGH' || e.investigationPriority === 'CRITICAL') {
            badgeClass = 'bg-rose-950/70 text-rose-300 border-rose-500/50';
            indicatorDot = 'bg-rose-500';
          } else if (e.investigationPriority === 'MEDIUM') {
            badgeClass = 'bg-amber-950/70 text-amber-300 border-amber-500/50';
            indicatorDot = 'bg-amber-500';
          } else if (e.investigationPriority === 'LOW') {
            badgeClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50';
            indicatorDot = 'bg-emerald-500';
          }

          return (
            <button
              key={e.id}
              onClick={() => onSelectEvent(e)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#091533] border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] transform -translate-y-0.5'
                  : 'bg-[#081024]/80 border-cyan-500/20 hover:bg-[#0c1630] hover:border-cyan-400/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5 font-mono-code">
                  <span className="text-[11px] font-bold text-cyan-300">
                    {e.id}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${indicatorDot}`} />
                </div>

                <div className="text-xs font-semibold text-white line-clamp-1 font-heading" title={e.name}>
                  {e.name}
                </div>

                <div className="text-[10px] text-slate-400 mt-0.5 font-mono-code truncate">
                  {e.region}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-cyan-500/15 flex items-center justify-between text-[10px] font-mono-code">
                <span className="text-orange-400 font-bold">{e.frpMw} MW</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${badgeClass}`}>
                  {isUnknown ? 'REVIEW' : e.investigationPriority}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
