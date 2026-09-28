import React from 'react';
import { ThermalEvent } from '../types';
import { Layers, CheckCircle2, ShieldAlert, HelpCircle } from 'lucide-react';

interface EventSummaryCardsProps {
  events: ThermalEvent[];
  filterPriority: string | null;
  onFilterChange: (priority: string | null) => void;
}

export const EventSummaryCards: React.FC<EventSummaryCardsProps> = ({
  events,
  filterPriority,
  onFilterChange,
}) => {
  const totalEvents = events.length;
  const highCount = events.filter((e) => e.investigationPriority === 'HIGH' || e.investigationPriority === 'CRITICAL').length;
  const attributedCount = events.filter((e) => e.likelySource !== 'UNKNOWN' && e.investigationPriority !== 'UNKNOWN').length;
  const reviewCount = events.filter((e) => e.likelySource === 'UNKNOWN' || e.investigationPriority === 'UNKNOWN').length;

  return (
    <section className="sih-card rounded-2xl p-4 sm:p-5 shadow-2xl border border-cyan-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white font-heading">
            Event Summary &amp; Classification Metrics
          </h2>
        </div>
        <p className="text-xs text-slate-400 font-mono-code">
          Click any metric below to filter active observations
        </p>
      </div>

      {/* 4 Clean Metric Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Thermal Events */}
        <button
          onClick={() => onFilterChange(null)}
          className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filterPriority === null
              ? 'bg-[#091533] border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
              : 'bg-[#081024]/80 border-cyan-500/20 hover:border-cyan-400/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 font-tech">
              Thermal Events
            </span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl sm:text-4xl font-black text-white font-heading">
              {totalEvents}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              NASA FIRMS VIIRS hotspots
            </p>
          </div>
        </button>

        {/* Metric 2: High Priority */}
        <button
          onClick={() => onFilterChange('HIGH')}
          className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filterPriority === 'HIGH'
              ? 'bg-[#1f0f18] border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/50'
              : 'bg-[#081024]/80 border-cyan-500/20 hover:border-rose-400/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 font-tech">
              High Priority
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl sm:text-4xl font-black text-rose-400 font-heading">
              {highCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Rapid escalation needed
            </p>
          </div>
        </button>

        {/* Metric 3: Attributed */}
        <button
          onClick={() => onFilterChange('ATTRIBUTED')}
          className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filterPriority === 'ATTRIBUTED'
              ? 'bg-[#0a1c18] border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50'
              : 'bg-[#081024]/80 border-cyan-500/20 hover:border-emerald-400/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-tech">
              Attributed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-heading">
              {attributedCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Corroborated context
            </p>
          </div>
        </button>

        {/* Metric 4: Unknown / Review */}
        <button
          onClick={() => onFilterChange('UNKNOWN')}
          className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filterPriority === 'UNKNOWN'
              ? 'bg-[#181926] border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.3)] ring-1 ring-slate-400/50'
              : 'bg-[#081024]/80 border-cyan-500/20 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-tech">
              Unknown / Review
            </span>
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-300 font-heading">
              {reviewCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Requires field check
            </p>
          </div>
        </button>
      </div>
    </section>
  );
};
