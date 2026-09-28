import React from 'react';
import { ThermalEvent, PriorityLevel } from '../types';
import {
  Layers,
  Flame,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Filter
} from 'lucide-react';

interface SummaryBarProps {
  events: ThermalEvent[];
  selectedEventId: string;
  onSelectEvent: (event: ThermalEvent) => void;
  filterPriority: string | null;
  onFilterChange: (priority: string | null) => void;
}

export const SummaryBar: React.FC<SummaryBarProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  filterPriority,
  onFilterChange,
}) => {
  const totalEvents = events.length;
  const highCount = events.filter((e) => e.investigationPriority === 'HIGH').length;
  const medCount = events.filter((e) => e.investigationPriority === 'MEDIUM' && e.likelySource !== 'UNKNOWN').length;
  const lowCount = events.filter((e) => e.investigationPriority === 'LOW').length;
  const unknownCount = events.filter((e) => e.investigationPriority === 'UNKNOWN' || e.likelySource === 'UNKNOWN').length;

  return (
    <footer className="w-full bg-[#090d16] border-t border-slate-800 px-4 sm:px-6 py-6 text-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Label */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              EVENT SUMMARY &amp; QUICK TARGET SELECTION
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Click any metric card below to filter by priority tier, or click a target ID to inspect.
          </p>
        </div>

        {/* Square-style Metric Cards (User requested: "ek achhe box me square type me kardo") */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* Card 1: Total Demo Events */}
          <button
            onClick={() => onFilterChange(null)}
            className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              filterPriority === null
                ? 'bg-slate-900 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                : 'bg-[#0c121e] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Total Demo Events
              </span>
              <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {totalEvents}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All sensor alerts
              </p>
            </div>
          </button>

          {/* Card 2: High Priority */}
          <button
            onClick={() => onFilterChange(filterPriority === 'HIGH' ? null : 'HIGH')}
            className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              filterPriority === 'HIGH'
                ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] ring-1 ring-red-500'
                : 'bg-[#0c121e] border-slate-800 hover:border-red-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-300">
                High Priority
              </span>
              <div className="p-1.5 rounded-lg bg-red-500/15 text-red-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-red-400 tracking-tight">
                {highCount}
              </span>
              <p className="text-[11px] text-red-300/70 mt-0.5">
                Immediate triage
              </p>
            </div>
          </button>

          {/* Card 3: Medium Priority */}
          <button
            onClick={() => onFilterChange(filterPriority === 'MEDIUM' ? null : 'MEDIUM')}
            className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              filterPriority === 'MEDIUM'
                ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-500'
                : 'bg-[#0c121e] border-slate-800 hover:border-amber-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300">
                Medium Priority
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight">
                {medCount}
              </span>
              <p className="text-[11px] text-amber-300/70 mt-0.5">
                Flare variation check
              </p>
            </div>
          </button>

          {/* Card 4: Low Priority */}
          <button
            onClick={() => onFilterChange(filterPriority === 'LOW' ? null : 'LOW')}
            className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              filterPriority === 'LOW'
                ? 'bg-yellow-950/40 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)] ring-1 ring-yellow-400'
                : 'bg-[#0c121e] border-slate-800 hover:border-yellow-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-yellow-300">
                Low Priority
              </span>
              <div className="p-1.5 rounded-lg bg-yellow-500/15 text-yellow-400">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-yellow-300 tracking-tight">
                {lowCount}
              </span>
              <p className="text-[11px] text-yellow-200/70 mt-0.5">
                Normal regulated flare
              </p>
            </div>
          </button>

          {/* Card 5: Unknown / Insufficient */}
          <button
            onClick={() => onFilterChange(filterPriority === 'UNKNOWN' ? null : 'UNKNOWN')}
            className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              filterPriority === 'UNKNOWN'
                ? 'bg-slate-800/80 border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.2)] ring-1 ring-slate-400'
                : 'bg-[#0c121e] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Unknown
              </span>
              <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-300 tracking-tight">
                {unknownCount}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Insufficient evidence
              </p>
            </div>
          </button>
        </div>

        {/* Quick Select Buttons Grid (User requested list: FIRMS-DEMO-024, 102, 045, 063, 071, 019, 088) */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Select Thermal Target:
            </span>
            {filterPriority && (
              <button
                onClick={() => onFilterChange(null)}
                className="text-xs text-amber-400 hover:underline cursor-pointer"
              >
                Clear filter (showing {filterPriority})
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {events.map((e) => {
              const isSelected = selectedEventId === e.id;
              const isUnknown = e.likelySource === 'UNKNOWN';

              // Priority dot color
              let dotColor = 'bg-amber-400';
              if (e.investigationPriority === 'HIGH') dotColor = 'bg-red-500';
              if (e.investigationPriority === 'LOW') dotColor = 'bg-yellow-400';
              if (isUnknown) dotColor = 'bg-slate-400';

              return (
                <button
                  key={e.id}
                  onClick={() => onSelectEvent(e)}
                  className={`flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500 shadow-md'
                      : 'bg-[#0c121e] border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-white">
                      {e.id}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  </div>

                  <span className="text-[11px] text-slate-400 mt-1 truncate">
                    {e.state}
                  </span>

                  <div className="mt-1.5 flex items-center justify-between text-[10px]">
                    <span className={isSelected ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
                      {isUnknown ? 'Unknown' : e.investigationPriority}
                    </span>
                    <span className="text-slate-400">
                      {e.brightnessTempK}K
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-400">
              Prototype using Demonstration Data
            </span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span>
              Real FIRMS, satellite, GIS, infrastructure, land-use and weather data integration will be implemented in the next development stage.
            </span>
          </div>
          <span className="text-slate-400 font-medium">
            Smart India Hackathon Prototype
          </span>
        </div>
      </div>
    </footer>
  );
};
