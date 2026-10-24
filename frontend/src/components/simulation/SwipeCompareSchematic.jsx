import React, { useState, useRef, useEffect } from 'react';
import { CorridorSchematic } from '../schematic/CorridorSchematic';

export function SwipeCompareSchematic({
  baselineStations = [],
  scenarioStations = [],
  selectedStationId = 'ADH',
  onSelectStation,
  direction = 'southbound',
  activeMinute = 0,
  trains = [],
  baselineTrains = []
}) {
  const [viewMode, setViewMode] = useState('stacked'); // 'stacked', 'swipe', 'scenario'
  const [sliderPos, setSliderPos] = useState(50); // percentage 0..100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setSliderPos((x / rect.width) * 100);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  return (
    <div className="space-y-3">
      {/* View Mode Selector & Legend Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="font-semibold text-text uppercase tracking-wider text-[11px]">Baseline Schedule</span>
          </div>
          <span className="text-muted">vs</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-crowd-sev" />
            <span className="font-semibold text-accent uppercase tracking-wider text-[11px]">Disrupted Scenario</span>
          </div>
        </div>

        {/* View Mode Toggles */}
        <div className="flex items-center border border-border rounded overflow-hidden text-[11px] font-sans">
          <button
            type="button"
            onClick={() => setViewMode('stacked')}
            className={`px-2.5 py-1 font-medium transition-colors ${
              viewMode === 'stacked' ? 'bg-accent text-white font-semibold' : 'bg-surface hover:bg-surface-hover text-muted'
            }`}
          >
            Stacked View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('swipe')}
            className={`px-2.5 py-1 font-medium transition-colors border-l border-border ${
              viewMode === 'swipe' ? 'bg-accent text-white font-semibold' : 'bg-surface hover:bg-surface-hover text-muted'
            }`}
          >
            Swipe Split
          </button>
          <button
            type="button"
            onClick={() => setViewMode('scenario')}
            className={`px-2.5 py-1 font-medium transition-colors border-l border-border ${
              viewMode === 'scenario' ? 'bg-accent text-white font-semibold' : 'bg-surface hover:bg-surface-hover text-muted'
            }`}
          >
            Scenario Only
          </button>
        </div>
      </div>

      {/* Mode 1: Stacked View (Default & Recommended - reveals both full lines simultaneously) */}
      {viewMode === 'stacked' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted px-1">
              <span className="font-semibold text-text uppercase">1. Baseline (On-Time Timetable)</span>
              <span>Clean operations</span>
            </div>
            <CorridorSchematic
              stationsData={baselineStations}
              selectedStationId={selectedStationId}
              onSelectStation={onSelectStation}
              direction={direction}
              activeMinute={activeMinute}
              trains={baselineTrains && baselineTrains.length > 0 ? baselineTrains : trains}
              className="border border-border"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted px-1">
              <span className="font-semibold text-accent uppercase">2. Scenario (Injected Incident & Cascade)</span>
              <span className="text-crowd-sev font-semibold">Live Disruption</span>
            </div>
            <CorridorSchematic
              stationsData={scenarioStations}
              selectedStationId={selectedStationId}
              onSelectStation={onSelectStation}
              direction={direction}
              activeMinute={activeMinute}
              trains={trains}
              className="border border-accent/40 bg-accent/5"
            />
          </div>
        </div>
      )}

      {/* Mode 2: Swipe Split (Interactive horizontal divider) */}
      {viewMode === 'swipe' && (
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          className="relative w-full overflow-hidden rounded-lg border border-border select-none bg-surface"
          style={{ minHeight: '190px' }}
        >
          {/* Layer 1: Baseline Schematic (Background) */}
          <div className="w-full">
            <CorridorSchematic
              stationsData={baselineStations}
              selectedStationId={selectedStationId}
              onSelectStation={onSelectStation}
              direction={direction}
              activeMinute={activeMinute}
              trains={baselineTrains && baselineTrains.length > 0 ? baselineTrains : trains}
              className="border-0 rounded-none shadow-none"
            />
          </div>

          {/* Layer 2: Scenario Schematic (Clipped Foreground) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: `polygon(${sliderPos}% 0%, 100% 0%, 100% 100%, ${sliderPos}% 100%)`
            }}
          >
            <CorridorSchematic
              stationsData={scenarioStations}
              selectedStationId={selectedStationId}
              onSelectStation={onSelectStation}
              direction={direction}
              activeMinute={activeMinute}
              trains={trains}
              className="border-0 rounded-none shadow-none bg-surface/95"
            />
          </div>

          {/* Draggable Divider Bar */}
          <div
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className="absolute top-0 bottom-0 z-20 w-8 -ml-4 flex items-center justify-center cursor-ew-resize group"
            style={{ left: `${sliderPos}%` }}
            aria-label="Swipe comparison slider"
          >
            <div className="w-[2px] h-full bg-accent group-hover:bg-accent-hover shadow-sm" />
            <div className="absolute w-5 h-8 bg-surface border border-accent rounded-sm flex items-center justify-center shadow-md">
              <div className="w-[2px] h-3 bg-accent rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Scenario Focus */}
      {viewMode === 'scenario' && (
        <div className="w-full">
          <CorridorSchematic
            stationsData={scenarioStations}
            selectedStationId={selectedStationId}
            onSelectStation={onSelectStation}
            direction={direction}
            activeMinute={activeMinute}
            trains={trains}
            className="border border-border"
          />
        </div>
      )}
    </div>
  );
}
