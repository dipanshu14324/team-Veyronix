import React, { useState } from 'react';
import {
  Search,
  Bell,
  User,
  ChevronDown,
  X,
  Menu,
} from 'lucide-react';
import { AppPage } from '../types';

interface TopNavbarProps {
  currentPage: AppPage;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  onToggleMobileSidebar: () => void;

  // Kept optional so existing parent component does not break.
  // APIs & Sources button is no longer rendered.
  onOpenApiModal?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentPage,
  searchQuery,
  onSearchChange,
  onNavigate,
  onLogout,
  onToggleMobileSidebar,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

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
    <header
      className="
        h-16
        w-full
        flex
        items-center
        justify-between
        gap-2
        sm:gap-3
        shrink-0
        relative
        z-30
        select-text
        px-2.5
        sm:px-4
        md:px-6
        border-b
        border-[#17224d]
        bg-[#070b20]/95
        backdrop-blur-md
        transition-all
        duration-300
      "
    >
      {/* ====================================================== */}
      {/* LEFT: MOBILE MENU + BREADCRUMBS */}
      {/* ====================================================== */}

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Mobile Menu */}

        <button
          onClick={onToggleMobileSidebar}
          className="
            md:hidden
            shrink-0
            rounded-xl
            p-2
            cursor-pointer
            transition-all
            text-slate-300
            hover:text-white
            hover:bg-[#0e163d]
          "
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}

        <div className="flex min-w-0 items-center gap-2 text-xs font-semibold">
          <span
            className="
              max-w-[110px]
              truncate
              font-heading
              font-bold
              text-sm
              capitalize
              transition-colors
              text-white
              neon-glow-cyan
            "
          >
            {currentPage.replace('-', ' ')}
          </span>

          <span className="text-slate-600">
            /
          </span>

          <span
            className="
              hidden
              text-[11px]
              font-heading
              tracking-widest
              sm:inline
              text-cyan-400/80
            "
          >
            SATELLITE COMMAND
          </span>
        </div>
      </div>

      {/* ====================================================== */}
      {/* CENTER: SEARCH BOX */}
      {/* ====================================================== */}

      <div className="hidden min-w-0 flex-1 sm:block sm:max-w-[250px] md:max-w-md lg:max-w-lg">
        <div className="relative">
          <Search
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              w-4
              h-4
              pointer-events-none
              text-slate-400
            "
          />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search thermal anomalies, NASA FIRMS IDs..."
            className="
              w-full
              pl-9
              pr-9
              py-1.5
              rounded-xl
              border
              border-[#1e2b66]
              bg-[#0a0f2e]
              text-white
              placeholder-slate-500
              text-xs
              focus:outline-none
              focus:ring-1
              focus:border-cyan-400/70
              focus:ring-cyan-400/40
              transition-all
            "
          />

          {/* Clear Search */}

          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="
                absolute
                right-2.5
                top-1/2
                -translate-y-1/2
                text-slate-400
                hover:text-white
                transition-colors
              "
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ====================================================== */}
      {/* RIGHT CONTROLS */}
      {/* ====================================================== */}

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">

        {/* ================================================== */}
        {/* SATELLITE ONLINE */}
        {/* ================================================== */}

        <div
          className="
            flex
            shrink-0
            items-center
            gap-1.5
            sm:gap-2
            px-2
            sm:px-3
            py-1.5
            rounded-full
            border
            border-cyan-500/30
            bg-[#0a0f2e]
            text-cyan-300
            shadow-[0_0_12px_rgba(6,182,212,0.2)]
            text-[9px]
            sm:text-[10px]
            lg:text-[11px]
            font-heading
            font-semibold
            transition-all
            duration-300
          "
        >
          <span
            className="
              w-2
              h-2
              shrink-0
              rounded-full
              bg-emerald-400
              shadow-[0_0_8px_#10b981]
            "
          />

          <span className="whitespace-nowrap">
            SATELLITE ONLINE
          </span>
        </div>

        {/* ================================================== */}
        {/* NOTIFICATIONS */}
        {/* ================================================== */}

        <div className="relative">
          <button
            onClick={() =>
              setShowNotifications(!showNotifications)
            }
            className="
              relative
              p-2
              rounded-xl
              border
              border-[#1e2b66]
              bg-[#0a0f2e]
              text-slate-300
              hover:text-white
              hover:border-cyan-500/50
              transition-all
              cursor-pointer
            "
            title="Recent Alerts"
            aria-label="Recent Alerts"
          >
            <Bell className="w-4 h-4 text-cyan-400" />

            {/* Notification Count */}

            <span
              className="
                absolute
                -top-1
                -right-1
                w-4
                h-4
                rounded-full
                bg-cyan-500
                text-slate-950
                text-[9px]
                font-bold
                font-mono
                flex
                items-center
                justify-center
                shadow-[0_0_8px_#06b6d4]
              "
            >
              3
            </span>
          </button>

          {/* ================================================= */}
          {/* NOTIFICATIONS DROPDOWN */}
          {/* ================================================= */}

          {showNotifications && (
            <div
              className="
                absolute
                right-0
                mt-2
                w-[calc(100vw-24px)]
                max-w-80
                sm:max-w-96
                rounded-2xl
                p-3
                shadow-2xl
                z-50
                text-xs
                space-y-2
                bg-[#090e2b]
                border
                border-[#1e2c69]
              "
            >
              {/* Header */}

              <div className="flex items-center justify-between pb-2 border-b border-[#1b2554]">
                <span
                  className="
                    font-heading
                    font-bold
                    text-white
                    uppercase
                    tracking-wider
                    text-[11px]
                    neon-glow-cyan
                  "
                >
                  System Alerts
                </span>

                <span className="text-[10px] text-cyan-400/80 font-mono">
                  3 unread alerts
                </span>
              </div>

              {/* Alert List */}

              <div className="space-y-1.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('events');
                    }}
                    className="
                      p-2.5
                      rounded-xl
                      bg-[#050818]
                      hover:bg-[#0e163d]
                      border
                      border-[#192454]
                      cursor-pointer
                      transition-colors
                      space-y-0.5
                    "
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white text-[11px] font-heading">
                        {n.title}
                      </span>

                      <span className="shrink-0 text-[10px] text-slate-400 font-mono">
                        {n.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug font-sans-clean">
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Queue */}

              <div className="pt-1 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('investigation');
                  }}
                  className="
                    text-xs
                    text-cyan-400
                    hover:text-cyan-300
                    hover:underline
                    font-semibold
                    font-heading
                  "
                >
                  View Incident Queue &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* USER PROFILE */}
        {/* ================================================== */}

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="
              flex
              items-center
              gap-1.5
              sm:gap-2
              pl-1.5
              sm:pl-2
              pr-2
              sm:pr-3
              py-1.5
              rounded-xl
              border
              border-[#1e2b66]
              bg-[#0a0f2e]
              text-white
              text-xs
              font-semibold
              cursor-pointer
              transition-all
              hover:border-cyan-500/50
            "
          >
            {/* User Icon */}

            <div
              className="
                w-6
                h-6
                shrink-0
                rounded-full
                border
                flex
                items-center
                justify-center
                font-bold
                text-xs
                bg-cyan-500/20
                border-cyan-400/50
                text-cyan-300
              "
            >
              <User className="w-3.5 h-3.5" />
            </div>

            {/* User Name */}

            <div className="text-left hidden sm:block">
              <div
                className="
                  text-[11px]
                  font-bold
                  font-heading
                  text-white
                "
              >
                Zonal Officer
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* ================================================= */}
          {/* USER MENU DROPDOWN */}
          {/* ================================================= */}

          {showUserMenu && (
            <div
              className="
                absolute
                right-0
                mt-2
                w-48
                bg-[#090e2b]
                border
                border-[#1e2c69]
                rounded-xl
                p-2
                shadow-2xl
                z-50
                text-xs
                space-y-1
              "
            >
              {/* User Info */}

              <div className="px-2.5 py-1.5 border-b border-[#1b2554]">
                <div className="font-bold font-heading text-white">
                  Triage Command
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                  command@firesight.up.gov.in
                </div>
              </div>

              {/* System Settings */}

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('system');
                }}
                className="
                  w-full
                  text-left
                  px-2.5
                  py-1.5
                  rounded-lg
                  hover:bg-[#0e163d]
                  text-slate-300
                  font-medium
                "
              >
                System Architecture
              </button>

              {/* Logout */}

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
                className="
                  w-full
                  text-left
                  px-2.5
                  py-1.5
                  rounded-lg
                  hover:bg-red-500/20
                  text-red-400
                  font-semibold
                "
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