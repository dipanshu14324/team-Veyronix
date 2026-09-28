import React from 'react';
import { Menu, Flame } from 'lucide-react';

interface HeaderProps {
  onOpenArchitecture?: () => void;
  activeSensorFeed: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenArchitecture,
  activeSensorFeed,
}) => {
  return (
    <header className="w-full border-b border-cyan-500/20 bg-[#081024]/90 text-white backdrop-blur-md">
      {/* Top Bar: Minimalist title strip */}
      <div className="border-b border-cyan-500/15 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenArchitecture}
              className="p-1 -ml-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="View Architecture Specification"
            >
              <Menu className="w-4 h-4 text-cyan-400" />
            </button>
            <div className="flex items-center gap-2 font-mono-code">
              <span className="font-bold text-white tracking-tight font-heading">
                FIREWATCH AI
              </span>
              <span className="text-cyan-500/50">/</span>
              <span className="text-[11px] font-medium tracking-wide text-cyan-400">
                SMART INDIA HACKATHON · PS-162
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono-code">
            <span>Last pass: <strong className="text-cyan-300 font-semibold">{activeSensorFeed}</strong></span>
            <span>•</span>
            <span className="text-emerald-400">12 scenes active</span>
          </div>
        </div>
      </div>

      {/* Main Editorial Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-5">
        <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-400 mb-2 font-tech flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>PROBLEM STATEMENT 162 · SMART INDIA HACKATHON</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-white tracking-tight max-w-4xl font-heading">
          Contextual intelligence for satellite-observed thermal events.
        </h1>

        <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl font-sans">
          The system begins with NASA FIRMS VIIRS &amp; ISRO INSAT-3D observations, then studies related hotspots as meaningful thermal events. It combines history, behaviour, regional activity, land, infrastructure, weather and available satellite evidence to support early industrial fire investigation.
        </p>
      </div>
    </header>
  );
};
