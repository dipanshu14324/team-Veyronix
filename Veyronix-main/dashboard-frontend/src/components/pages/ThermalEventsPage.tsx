import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { ThermalEvent, PriorityLevel } from '../../types';
import { TypewriterHeading } from '../TypewriterHeading';

interface ThermalEventsPageProps {
  events: ThermalEvent[];
  onViewEvent: (event: ThermalEvent) => void;
}

export const ThermalEventsPage: React.FC<ThermalEventsPageProps> = ({
  events,
  onViewEvent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('TODAY');

  const uniqueStates = Array.from(new Set(events.map((e) => e.state)));

  const filteredEvents = events.filter((e) => {
    if (
      searchTerm &&
      !e.id.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !e.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !e.state.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (stateFilter !== 'ALL' && e.state !== stateFilter) return false;
    if (severityFilter !== 'ALL' && e.investigationPriority !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 select-text">
      {/* Page Header */}
      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1b2554]">
          <div>
            <TypewriterHeading
              as="h1"
              text="THERMAL EVENTS DATABASE"
              className="text-xl sm:text-2xl font-bold text-white"
              glow={true}
              glowColor="cyan"
              speed={20}
              subtext="Filterable index of NASA FIRMS VIIRS & MODIS satellite-observed hotspots across India."
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-heading text-cyan-300 bg-cyan-950/40 border border-cyan-500/40 px-3 py-1.5 rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              Showing {filteredEvents.length} of {events.length} events
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Event ID or facility..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070b1e] border border-[#1e2c69] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
            />
          </div>

          {/* State Filter */}
          <div className="relative">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#070b1e] border border-[#1e2c69] text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="ALL" className="bg-[#070b1e]">All States (India)</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st} className="bg-[#070b1e]">
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#070b1e] border border-[#1e2c69] text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="ALL" className="bg-[#070b1e]">All Severity Levels</option>
              <option value="CRITICAL" className="bg-[#070b1e]">Critical</option>
              <option value="HIGH" className="bg-[#070b1e]">High</option>
              <option value="MEDIUM" className="bg-[#070b1e]">Medium</option>
              <option value="LOW" className="bg-[#070b1e]">Low</option>
              <option value="UNKNOWN" className="bg-[#070b1e]">Requires Review</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#070b1e] border border-[#1e2c69] text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="TODAY" className="bg-[#070b1e]">15 Sep 2026 (Today)</option>
              <option value="YESTERDAY" className="bg-[#070b1e]">14 Sep 2026</option>
              <option value="WEEK" className="bg-[#070b1e]">Last 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Events Table */}
      <div className="bg-[#0a0f2b]/95 border border-[#1e2a60] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#070b1e] border-b border-[#1b2554] text-slate-400 font-bold font-heading uppercase text-[11px]">
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Location / Facility</th>
                <th className="py-3 px-4">Obs. Date</th>
                <th className="py-3 px-4">FRP</th>
                <th className="py-3 px-4">Sensor Conf</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17224d]">
              {filteredEvents.map((evt) => (
                <tr
                  key={evt.id}
                  className="hover:bg-[#0e163d]/80 transition-all group cursor-pointer hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                  onClick={() => onViewEvent(evt)}
                >
                  <td className="py-3 px-4 font-bold font-mono text-cyan-300 group-hover:neon-glow-cyan">
                    {evt.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-white font-heading group-hover:text-cyan-200 transition-colors">{evt.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {evt.state} &bull; ({evt.lat.toFixed(2)}°N, {evt.lng.toFixed(2)}°E)
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                    15 Sep 2026 <span className="text-[10px] text-slate-500 font-mono block">{evt.detectionTimeIst}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold font-mono text-red-400">{evt.frpMw} MW</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-emerald-400 font-mono">
                        {Math.round(evt.confidence * 100)}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">({evt.sensor.split(' ')[0]})</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-heading ${
                        evt.investigationPriority === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                          : evt.investigationPriority === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                          : evt.investigationPriority === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                          : evt.investigationPriority === 'LOW'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          : 'bg-[#0f1638] text-slate-400 border border-[#1e2a60]'
                      }`}
                    >
                      {evt.investigationPriority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewEvent(evt);
                      }}
                      id={`btn-table-view-${evt.id}`}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-400/60 text-cyan-300 text-xs font-bold font-heading uppercase transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] box-interactive-glow inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>VIEW</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
