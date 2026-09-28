import React, { useState } from 'react';
import { Flame, ShieldCheck, ArrowRight, KeyRound, UserCheck } from 'lucide-react';
import { TypewriterHeading } from '../TypewriterHeading';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('officer.sen@smartcampus.gov.in');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-[#060814] text-[#e2e8f0] flex items-center justify-center p-4 sm:p-8 select-text relative overflow-hidden">
      {/* Background Neon ambient light */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl bg-[#090e2b]/95 border border-[#1e2a60] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10">
        {/* Left Side: Brand Identity */}
        <div className="p-8 sm:p-12 bg-[#060a22] border-b md:border-b-0 md:border-r border-[#17224d] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                <Flame className="w-7 h-7 fill-cyan-400 text-cyan-400" />
              </div>
              <div>
                <span className="text-xs font-bold font-heading uppercase text-cyan-400/80 tracking-widest">
                  SMART CAMPUS
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white leading-none neon-glow-cyan">
                  FIRE-SIGHT AI
                </h1>
              </div>
            </div>

            <TypewriterHeading
              as="h2"
              text="Complaint & Resource Management System"
              className="text-lg sm:text-xl font-bold text-white leading-snug mb-4"
              glow={true}
              glowColor="cyan"
              speed={25}
            />

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 font-sans-clean">
              Every voice is heard, every resource is used wisely, and every campus event is monitored with real-time geospatial surveillance.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/40 text-xs font-heading font-semibold text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Detect &bull; Manage &bull; Attribute</span>
            </div>
          </div>

          <div className="pt-8 border-t border-[#17224d] text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Autonomous AI Command</span>
            <span>Version 2.4 Cyber</span>
          </div>
        </div>

        {/* Right Side: Simple System Login Box */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-[#090e2b]">
          <div className="mb-6">
            <TypewriterHeading
              as="h3"
              text="SYSTEM LOGIN"
              className="text-xl sm:text-2xl font-bold text-white"
              glow={true}
              glowColor="cyan"
              speed={30}
              subtext="Authorized personnel access to Smart Campus command terminal."
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-heading uppercase text-slate-300 mb-1.5">
                Username / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter authorized username..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060a22] border border-[#1e2a60] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-heading uppercase text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060a22] border border-[#1e2a60] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
              />
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold font-heading uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ACCESS COMMAND TERMINAL</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </form>

          {/* Quick Demo Access Bypass Button */}
          <div className="mt-5 pt-4 border-t border-[#17224d] text-center">
            <button
              type="button"
              id="btn-demo-access"
              onClick={onLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-950/30 border border-cyan-500/50 hover:bg-cyan-500/20 text-xs font-heading font-semibold text-cyan-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            >
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Instant Demo Access (Skip Auth)</span>
            </button>
            <p className="text-[11px] text-slate-500 mt-2 font-sans-clean">
              Click Instant Demo Access to evaluate the dashboard and map immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
