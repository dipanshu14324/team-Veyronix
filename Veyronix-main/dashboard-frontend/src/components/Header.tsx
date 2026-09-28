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
    <header
      className="
        w-full
        border-b
        border-cyan-500/20
        bg-[#081024]/90
        text-white
        backdrop-blur-md
        transition-all
        duration-300
      "
    >
      {/* ============================================================
          TOP BAR
          ============================================================ */}

      <div
        className="
          border-b
          border-cyan-500/15
          px-4
          py-2.5
          sm:px-6
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            flex-col
            gap-2
            text-xs
            text-slate-400
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          {/* LEFT */}

          <div className="flex min-w-0 items-center gap-2.5">
            {/* Architecture Button */}

            <button
              onClick={onOpenArchitecture}
              className="
                -ml-1
                shrink-0
                cursor-pointer
                rounded-lg
                p-1
                text-slate-300
                transition-colors
                hover:text-white
              "
              title="View Architecture Specification"
              aria-label="View Architecture Specification"
            >
              <Menu className="h-4 w-4 text-cyan-400" />
            </button>

            {/* Brand */}

            <div
              className="
                flex
                min-w-0
                items-center
                gap-2
                font-mono-code
              "
            >
              <span
                className="
                  shrink-0
                  font-heading
                  font-bold
                  tracking-tight
                  text-white
                "
              >
                FIREWATCH AI
              </span>

              <span className="shrink-0 text-cyan-500/50">
                /
              </span>

              <span
                className="
                  hidden
                  truncate
                  text-[11px]
                  font-medium
                  tracking-wide
                  text-cyan-400
                  sm:inline
                "
              >
                SMART INDIA HACKATHON · PS-162
              </span>
            </div>
          </div>

          {/* RIGHT - SENSOR STATUS */}

          <div
            className="
              flex
              items-center
              gap-2
              pl-8
              text-[10px]
              text-slate-400
              font-mono-code
              sm:pl-0
              sm:text-[11px]
            "
          >
            <span className="whitespace-nowrap">
              Last pass:{' '}
              <strong
                className="
                  font-semibold
                  text-cyan-300
                "
              >
                {activeSensorFeed}
              </strong>
            </span>

            <span className="text-cyan-500/40">
              •
            </span>

            <span
              className="
                whitespace-nowrap
                text-emerald-400
              "
            >
              12 scenes active
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================
          MAIN EDITORIAL HERO SECTION
          ============================================================ */}

      <div
        className="
          mx-auto
          max-w-7xl
          px-4
          pt-5
          pb-5
          sm:px-6
          sm:pt-6
        "
      >
        {/* Problem Statement Label */}

        <div
          className="
            mb-2
            flex
            items-center
            gap-1.5
            text-[10px]
            font-bold
            uppercase
            tracking-[0.14em]
            text-orange-400
            font-tech
            sm:text-[11px]
            sm:tracking-[0.16em]
          "
        >
          <Flame
            className="
              h-3.5
              w-3.5
              shrink-0
              text-orange-400
            "
          />

          <span>
            PROBLEM STATEMENT 162 · SMART INDIA HACKATHON
          </span>
        </div>

        {/* Main Heading */}

        <h1
          className="
            max-w-4xl
            font-heading
            text-2xl
            font-black
            leading-tight
            tracking-tight
            text-white
            sm:text-3xl
            md:text-4xl
          "
        >
          Contextual intelligence for satellite-observed
          thermal events.
        </h1>

        {/* Description */}

        <p
          className="
            mt-3
            max-w-3xl
            font-sans
            text-sm
            leading-relaxed
            text-slate-300
            sm:text-base
          "
        >
          The system begins with NASA FIRMS VIIRS &amp; ISRO
          INSAT-3D observations, then studies related hotspots
          as meaningful thermal events. It combines history,
          behaviour, regional activity, land, infrastructure,
          weather and available satellite evidence to support
          early industrial fire investigation.
        </p>
      </div>
    </header>
  );
};