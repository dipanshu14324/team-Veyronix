import React, { useState } from 'react';
import {
  Search,
  Bell,
  User,
  ShieldCheck,
  ChevronDown,
  X,
  AlertTriangle,
  Menu,
  Database,
} from 'lucide-react';
import { AppPage } from '../types';

interface TopNavbarProps {
  currentPage: AppPage;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  onToggleMobileSidebar: () => void;
  onOpenApiModal?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentPage,
  searchQuery,
  onSearchChange,
  onNavigate,
  onLogout,
  onToggleMobileSidebar,
  onOpenApiModal,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'CRITICAL Radiance Alert: EVT-1040',
      time: '08:02 IST',
      desc: 'Singrauli Thermal Basin exceeded baseline by 34 MW',
      priority: 'CRITICAL',
    },
    {
      id: 2,
      title: 'New High Priority Case: EVT-1041',
      time: '08:16 IST',
      desc: 'Mathura Refinery elevated flare continuous signature logged',
      priority: 'HIGH',
    },
    {
      id: 3,
      title: 'Satellite Ingestion Pass Complete',
      time: '08:10 IST',
      desc: 'VIIRS Suomi-NPP: 12 scenes processed with 0 ingest errors',
      priority: 'INFO',
    },
  ];

  return (
    <header className="h-16 bg-[#070b20]/95 backdrop-blur-md border-b border-[#17224d] px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 relative z-30 select-text">
      {/* Left: Mobile menu button & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#0e163d] cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="font-heading font-bold text-white text-sm capitalize neon-glow-cyan">
            {currentPage.replace('-', ' ')}
          </span>
          <span className="text-slate-600">/</span>
          <span className="hidden sm:inline text-[11px] font-heading tracking-widest text-cyan-400/80">
            SATELLITE COMMAND
          </span>
        </div>
      </div>

      {/* Center: Search Box */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search thermal anomalies, NASA FIRMS IDs, districts (e.g. EVT-1040, Sonbhadra, Mathura)..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-[#0a0f2e] border border-[#1e2b66] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/40 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* API Info / Setup Button */}
        {onOpenApiModal && (
          <button
            onClick={onOpenApiModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-400/50 hover:bg-cyan-500/20 text-cyan-300 text-xs font-heading font-semibold transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] cursor-pointer"
            title="Live Satellite & GIS APIs (Operational out-of-the-box)"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">APIs &amp; Sources</span>
          </button>
        )}

        {/* System Online Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0f2e] border border-cyan-500/30 text-[11px] font-heading font-semibold text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          <span>SATELLITE ONLINE</span>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-[#0a0f2e] border border-[#1e2b66] text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all cursor-pointer"
            title="Recent Alerts"
          >
            <Bell className="w-4 h-4 text-cyan-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-bold font-mono flex items-center justify-center shadow-[0_0_8px_#06b6d4]">
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#090e2b] border border-[#1e2c69] rounded-2xl p-3 shadow-2xl z-50 text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#1b2554]">
                <span className="font-heading font-bold text-white uppercase tracking-wider text-[11px] neon-glow-cyan">
                  System Alerts
                </span>
                <span className="text-[10px] text-cyan-400/80 font-mono">3 unread alerts</span>
              </div>

              <div className="space-y-1.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('events');
                    }}
                    className="p-2.5 rounded-xl bg-[#050818] hover:bg-[#0e163d] border border-[#192454] cursor-pointer transition-colors space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px] font-heading">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug font-sans-clean">{n.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-1 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('investigation');
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline font-semibold font-heading"
                >
                  View Incident Queue &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-[#0a0f2e] border border-[#1e2b66] hover:border-cyan-500/50 text-xs font-semibold text-white cursor-pointer transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-bold font-heading text-white">Zonal Officer</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#090e2b] border border-[#1e2c69] rounded-xl p-2 shadow-2xl z-50 text-xs space-y-1">
              <div className="px-2.5 py-1.5 border-b border-[#1b2554]">
                <div className="font-bold font-heading text-white">Triage Command</div>
                <div className="text-[10px] text-slate-400 font-mono">command@firesight.up.gov.in</div>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('system');
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#0e163d] text-slate-300 font-medium"
              >
                System Settings
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 font-semibold"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
