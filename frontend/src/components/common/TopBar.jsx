import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { Logo } from './Logo';
import {
  Sun,
  Moon,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Command,
  HelpCircle,
  CloudRain
} from 'lucide-react';

export function TopBar() {
  const {
    direction,
    toggleDirection,
    currentDate,
    currentTime,
    stepTime,
    isPlaying,
    setIsPlaying,
    apiStatus,
    darkMode,
    toggleTheme,
    setCommandPaletteOpen,
    setShortcutsModalOpen,
  } = useApp();

  const [weather, setWeather] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.getLiveWeather()
      .then(w => {
        if (mounted) setWeather(w);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <header className="h-14 border-b border-border bg-surface px-4 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Left: Brand Wordmark */}
      <div className="flex items-center gap-3">
        <Logo />
        <span
          className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
          title="All datasets and measurements are synthetically simulated for academic evaluation"
        >
          SYNTHETIC DATA
        </span>

        {/* Live Weather Radar Telemetry Badge */}
        {weather && (
          <div
            className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
            title={`${weather.radar_station} (${weather.condition}) - Waterlogging Risk: ${weather.waterlogging_risk}. Speed limit: ${weather.track_speed_restriction_kmph} km/h.`}
          >
            <CloudRain className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>Santacruz Radar: {weather.rainfall_mm} mm/h</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 font-bold uppercase">
              {weather.rainfall_mm > 15 ? 'Monsoon Active' : 'Clear'}
            </span>
          </div>
        )}
      </div>

      {/* Center: Global Date-Time Scrubber Summary & Playback */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-surface-subtle border border-border rounded px-2 py-1">
        <button
          type="button"
          onClick={() => stepTime(-15)}
          className="p-1 text-muted hover:text-text rounded transition-colors"
          title="Step back 15 minutes (← key)"
          aria-label="Step back 15 minutes"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-1 rounded transition-colors ${isPlaying ? 'text-accent bg-accent-subtle' : 'text-muted hover:text-text'}`}
          title={isPlaying ? 'Pause simulation (Space)' : 'Play simulation (Space)'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={() => stepTime(15)}
          className="p-1 text-muted hover:text-text rounded transition-colors"
          title="Step forward 15 minutes (→ key)"
          aria-label="Step forward 15 minutes"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-[1px] bg-border mx-0.5" />

        <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-text font-medium px-1">
          <span className="hidden md:inline">{currentDate}</span>
          <span className="text-muted hidden md:inline">·</span>
          <span className="font-bold text-accent">{currentTime}</span>
        </div>
      </div>

      {/* Right: Direction toggle, Status, ⌘K, Theme, Help */}
      <div className="flex items-center gap-2">
        {/* Direction Toggle */}
        <button
          type="button"
          onClick={toggleDirection}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono font-medium rounded border border-border bg-surface hover:bg-surface-hover text-text transition-colors"
          title="Toggle Direction (S key)"
        >
          <ArrowRightLeft className="w-3 h-3 text-accent shrink-0" />
          <span className="capitalize">{direction === 'southbound' ? 'SB (Down)' : 'NB (Up)'}</span>
        </button>

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-2 py-1 text-xs text-muted hover:text-text rounded border border-border bg-surface hover:bg-surface-hover transition-colors"
          title="Command Palette"
        >
          <Command className="w-3 h-3" />
          <span className="text-2xs font-mono">{isMac ? '⌘K' : 'Ctrl+K'}</span>
        </button>

        {/* Keyboard Shortcuts Trigger */}
        <button
          type="button"
          onClick={() => setShortcutsModalOpen(true)}
          className="p-1.5 text-muted hover:text-text rounded border border-border bg-surface hover:bg-surface-hover transition-colors"
          title="Keyboard shortcuts (? key)"
          aria-label="Keyboard shortcuts"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 text-muted hover:text-text rounded border border-border bg-surface hover:bg-surface-hover transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* API Status Dot */}
        <div
          className="flex items-center pl-1"
          title={`Backend API: ${apiStatus === 'ok' ? 'Connected (FastAPI :8000)' : apiStatus === 'error' ? 'Disconnected' : 'Checking...'}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              apiStatus === 'ok'
                ? 'bg-emerald-500'
                : apiStatus === 'error'
                ? 'bg-red-500 animate-pulse'
                : 'bg-amber-500'
            }`}
            aria-hidden="true"
          />
        </div>
      </div>
    </header>
  );
}
