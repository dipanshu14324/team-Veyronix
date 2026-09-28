import React from 'react';

import {
  LayoutDashboard,
  Radio,
  Search,
  ShieldAlert,
  BarChart3,
  Settings,
  Cpu,
  LogOut,
  X,
  Menu,
  Database,
  Layers,
} from 'lucide-react';

import { AppPage } from '../types';

interface SidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  openCasesCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenApiModal?: () => void;

  /*
   * Number of events currently loaded in the frontend.
   *
   * Default is 100 because VEYRONIX currently loads
   * the first 100 events from the API.
   */
  eventsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onLogout,
  openCasesCount,
  isCollapsed = false,
  onToggleCollapse,
  onOpenApiModal,
  eventsCount = 100,
}) => {
  /*
   * ============================================================
   * NAVIGATION
   * ============================================================
   */

  const navItems: Array<{
    id: AppPage;
    label: string;
    icon: React.ComponentType<{
      className?: string;
    }>;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },

    {
      id: 'live-monitor',
      label: 'Live Monitor',
      icon: Radio,
    },

    {
      id: 'events',
      label: 'Thermal Events',
      icon: Layers,
      badge: eventsCount,
    },

    {
      id: 'analysis',
      label: 'Event Analysis',
      icon: Search,
    },

    {
      id: 'investigation',
      label: 'Investigation',
      icon: ShieldAlert,
      badge: openCasesCount,
      badgeColor:
        'bg-red-500/30 text-red-300 border border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    },

    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },

    {
      id: 'system',
      label: 'System Architecture',
      icon: Settings,
    },
  ];

  /*
   * ============================================================
   * SIDEBAR
   * ============================================================
   */

  return (
    <aside
      className={`
        transition-all
        duration-300
        ease-in-out
        bg-[#070b20]
        border-r
        border-[#17224d]
        flex
        flex-col
        justify-between
        shrink-0
        select-text
        ${
          isCollapsed
            ? 'w-20'
            : 'w-64'
        }
      `}
    >
      {/* ======================================================
          TOP SECTION
      ====================================================== */}

      <div>
        {/* ====================================================
            BRAND HEADER
        ==================================================== */}

        <div
          className="
            p-3
            sm:p-4
            border-b
            border-[#17224d]
            flex
            items-center
            justify-between
            gap-2
            relative
          "
        >
          {/* ==================================================
              BRAND
          ================================================== */}

          {!isCollapsed && (
            <div
              className="
                min-w-0
                pl-1
              "
            >
              <div
                className="
                  text-sm
                  sm:text-base
                  font-bold
                  font-heading
                  text-white
                  tracking-wider
                  flex
                  items-center
                  gap-1.5
                  neon-glow-cyan
                  truncate
                "
              >
                <span>
                  VEYRONIX AI
                </span>
              </div>

              {/* No Uttar Pradesh text here */}
              <div
                className="
                  text-[10px]
                  font-heading
                  font-semibold
                  uppercase
                  tracking-widest
                  text-cyan-400/80
                  truncate
                "
              >
                SATELLITE THERMAL INTELLIGENCE
              </div>
            </div>
          )}

          {/* ==================================================
              COLLAPSE / EXPAND BUTTON
              
              THREE LINES MENU IS KEPT
          ================================================== */}

          {onToggleCollapse && (
            <button
              type="button"
              onClick={
                onToggleCollapse
              }
              className={`
                p-1.5
                rounded-lg
                border
                transition-all
                cursor-pointer
                ${
                  isCollapsed
                    ? `
                      bg-cyan-500/20
                      border-cyan-400/60
                      text-cyan-300
                      hover:bg-cyan-500/30
                      hover:border-cyan-300
                      shadow-[0_0_10px_rgba(6,182,212,0.3)]
                      mx-auto
                    `
                    : `
                      bg-red-500/20
                      border-red-500/50
                      text-red-300
                      hover:bg-red-500/30
                      hover:text-white
                      hover:border-red-400
                      shadow-[0_0_12px_rgba(239,68,68,0.3)]
                    `
                }
              `}
              title={
                isCollapsed
                  ? 'Expand Menu'
                  : 'Collapse Menu'
              }
            >
              {isCollapsed ? (
                <Menu
                  className="
                    w-4
                    h-4
                    text-cyan-400
                  "
                />
              ) : (
                <X
                  className="
                    w-4
                    h-4
                    text-red-400
                  "
                />
              )}
            </button>
          )}
        </div>

        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <nav
          className="
            p-2.5
            space-y-1.5
          "
        >
          {navItems.map(
            (item) => {
              const Icon =
                item.icon;

              const isActive =
                currentPage ===
                item.id;

              return (
                <button
                  type="button"
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() =>
                    onNavigate(
                      item.id,
                    )
                  }
                  title={
                    isCollapsed
                      ? item.label
                      : undefined
                  }
                  className={`
                    w-full
                    flex
                    items-center
                    ${
                      isCollapsed
                        ? 'justify-center px-2'
                        : 'justify-between px-3'
                    }
                    py-2.5
                    rounded-xl
                    text-xs
                    font-heading
                    font-semibold
                    transition-all
                    cursor-pointer
                    box-interactive-glow
                    ${
                      isActive
                        ? `
                          bg-cyan-500/20
                          border
                          border-cyan-400/80
                          text-cyan-200
                          shadow-[0_0_15px_rgba(6,182,212,0.35)]
                        `
                        : `
                          text-slate-400
                          hover:bg-[#0e163d]
                          hover:text-white
                          border
                          border-transparent
                        `
                    }
                  `}
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2.5
                      min-w-0
                    "
                  >
                    <Icon
                      className={`
                        w-4
                        h-4
                        shrink-0
                        ${
                          isActive
                            ? `
                              text-cyan-400
                              drop-shadow-[0_0_6px_#06b6d4]
                            `
                            : 'text-slate-500'
                        }
                      `}
                    />

                    {!isCollapsed && (
                      <span
                        className="
                          tracking-wide
                          truncate
                        "
                      >
                        {item.label}
                      </span>
                    )}
                  </div>

                  {/* ==================================================
                      NORMAL BADGE
                  ================================================== */}

                  {!isCollapsed &&
                    item.badge !==
                      undefined && (
                      <span
                        className={`
                          px-2
                          py-0.5
                          rounded-full
                          text-[10px]
                          font-bold
                          font-heading
                          shrink-0
                          ${
                            isActive
                              ? `
                                bg-cyan-400/30
                                text-cyan-100
                                border
                                border-cyan-300/40
                              `
                              : item.badgeColor ||
                                `
                                  bg-[#121a42]
                                  text-slate-400
                                  border
                                  border-[#212f73]
                                `
                          }
                        `}
                      >
                        {item.badge}
                      </span>
                    )}

                  {/* ==================================================
                      COLLAPSED BADGE
                  ================================================== */}

                  {isCollapsed &&
                    item.badge !==
                      undefined && (
                      <span className="sr-only">
                        ({item.badge})
                      </span>
                    )}
                </button>
              );
            },
          )}
        </nav>
      </div>

      {/* ========================================================
          SIDEBAR FOOTER
      ======================================================== */}

      <div
        className={`
          p-3
          border-t
          border-[#17224d]
          bg-[#050818]
          space-y-2.5
          ${
            isCollapsed
              ? 'text-center'
              : ''
          }
        `}
      >
        {/* ======================================================
            API INFO BUTTON
        ====================================================== */}

        {onOpenApiModal && (
          <button
            type="button"
            onClick={
              onOpenApiModal
            }
            className={`
              w-full
              flex
              items-center
              ${
                isCollapsed
                  ? 'justify-center p-2'
                  : 'justify-between px-3 py-2'
              }
              rounded-xl
              bg-cyan-950/40
              border
              border-cyan-500/40
              text-cyan-300
              hover:bg-cyan-500/20
              hover:border-cyan-400
              transition-all
              text-xs
              font-heading
              font-medium
              cursor-pointer
              shadow-[0_0_12px_rgba(6,182,212,0.2)]
            `}
            title="Real Satellite & GIS APIs"
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <Database
                className="
                  w-3.5
                  h-3.5
                  text-cyan-400
                  shrink-0
                "
              />

              {!isCollapsed && (
                <span
                  className="
                    text-[11px]
                    font-semibold
                  "
                >
                  Real Satellite APIs
                </span>
              )}
            </div>

            {!isCollapsed && (
              <span
                className="
                  text-[9px]
                  px-1.5
                  py-0.5
                  rounded
                  bg-cyan-400/20
                  text-cyan-200
                  border
                  border-cyan-400/40
                  font-mono
                "
              >
                NASA/OSM
              </span>
            )}
          </button>
        )}

        {/* ======================================================
            SATELLITE STATUS
        ====================================================== */}

        {!isCollapsed ? (
          <div
            className="
              space-y-1.5
              text-[11px]
              text-slate-400
              font-sans-clean
              px-1
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  w-2
                  h-2
                  rounded-full
                  bg-emerald-400
                  shadow-[0_0_8px_#10b981]
                  shrink-0
                "
              />

              <span
                className="
                  font-semibold
                  text-slate-200
                  font-heading
                  text-[10.5px]
                  truncate
                "
              >
                SATELLITE FEED ONLINE
              </span>
            </div>

            <div
              className="
                flex
                items-center
                gap-2
                text-[10px]
                text-cyan-400/80
                pl-4
                font-mono
                truncate
              "
            >
              <Cpu
                className="
                  w-3
                  h-3
                  text-cyan-400
                  shrink-0
                "
              />

              <span>
                NASA FIRMS VIIRS Active
              </span>
            </div>
          </div>
        ) : (
          <div
            className="
              flex
              justify-center
            "
            title="Satellite Feed Online"
          >
            <span
              className="
                w-2.5
                h-2.5
                rounded-full
                bg-emerald-400
                shadow-[0_0_10px_#10b981]
              "
            />
          </div>
        )}

        {/* ======================================================
            LOGOUT
        ====================================================== */}

        <button
          type="button"
          onClick={onLogout}
          title={
            isCollapsed
              ? 'Exit to Login'
              : undefined
          }
          className={`
            w-full
            flex
            items-center
            justify-center
            gap-1.5
            ${
              isCollapsed
                ? 'p-2'
                : 'px-3 py-2'
            }
            rounded-xl
            text-xs
            font-heading
            font-medium
            text-slate-400
            hover:text-red-400
            hover:bg-red-500/10
            hover:border-red-500/40
            transition-all
            border
            border-[#1b2554]
            cursor-pointer
          `}
        >
          <LogOut
            className="
              w-3.5
              h-3.5
              shrink-0
            "
          />

          {!isCollapsed && (
            <span>
              Exit to Login
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;