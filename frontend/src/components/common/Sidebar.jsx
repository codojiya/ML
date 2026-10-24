import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  TrendingUp,
  Cpu,
  Camera,
  Brain,
  Database,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: Activity, key: '1' },
  { path: '/forecast', label: 'Forecast', icon: TrendingUp, key: '2' },
  { path: '/simulation', label: 'Simulation Lab', icon: Cpu, key: '3' },
  { path: '/cctv', label: 'Platform CCTV AI', icon: Camera, key: '4' },
  { path: '/insights', label: 'Model Insights', icon: Brain, key: '5' },
  { path: '/explorer', label: 'Data Explorer', icon: Database, key: '6' },
];

export function Sidebar({ collapsed, setCollapsed }) {
  const { setDemoModeActive, setDemoStep } = useApp();

  const handleStartDemo = () => {
    setDemoStep(0);
    setDemoModeActive(true);
  };

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between border-r border-border bg-surface shrink-0 transition-all duration-200 select-none ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className="flex flex-col py-3">
          {/* Collapse Toggle */}
          <div className="px-3 pb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded text-muted hover:text-text hover:bg-surface-subtle transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-0.5" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'text-accent bg-accent-subtle/40 font-semibold'
                        : 'text-muted hover:text-text hover:bg-surface-subtle'
                    }`
                  }
                  title={collapsed ? `${item.label} (${item.key})` : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active 2px indicator bar */}
                      {isActive && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent"
                          aria-hidden="true"
                        />
                      )}
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span>{item.label}</span>
                          <span className="text-[10px] text-muted/60 font-mono group-hover:text-muted">
                            {item.key}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Demo Mode */}
        <div className="p-3 border-t border-border">
          <button
            type="button"
            onClick={handleStartDemo}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded border border-accent/30 bg-accent/5 hover:bg-accent/10 text-accent text-xs font-medium transition-colors ${
              collapsed ? 'justify-center' : 'justify-start'
            }`}
            title="Start Guided 4-Minute Walkthrough"
          >
            <Sparkles className="w-4 h-4 shrink-0 text-accent" />
            {!collapsed && (
              <div className="text-left">
                <div className="font-semibold leading-tight">Demo Mode</div>
                <div className="text-[10px] text-muted font-normal">4-min tour</div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (<= 768px, including 390px iPhone) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex items-center justify-around py-1 px-2 select-none"
        aria-label="Mobile Navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 text-[10px] rounded transition-colors ${
                  isActive ? 'text-accent font-semibold' : 'text-muted'
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={handleStartDemo}
          className="flex flex-col items-center justify-center py-1 px-2 text-[10px] text-accent font-medium"
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span>Demo</span>
        </button>
      </nav>
    </>
  );
}
