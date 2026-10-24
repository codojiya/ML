import React, { useState } from 'react';
import { STATIONS } from '../../constants/stations';

export function CascadeHeatmap({
  deltaByMinute = {},
  baselineByMinute = {},
  scenarioByMinute = {},
  activeMinute = 0,
  onSelectMinute,
  onSelectStation,
  direction = 'southbound',
  className = ''
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const numMinutes = 120;
  // Stations ordered along corridor
  const corridorStations = direction === 'southbound' ? STATIONS : [...STATIONS].reverse();

  // Find max delta for color scaling
  let maxDelta = 50;
  corridorStations.forEach(s => {
    const arr = deltaByMinute[s.id] || [];
    arr.forEach(val => {
      if (val > maxDelta) maxDelta = val;
    });
  });

  const getColor = (delta) => {
    if (!delta || delta <= 1.0) return 'var(--surface-subtle)';
    const ratio = Math.min(1.0, delta / maxDelta);
    if (ratio < 0.15) return 'rgba(245, 158, 11, 0.25)';
    if (ratio < 0.35) return 'rgba(245, 158, 11, 0.6)';
    if (ratio < 0.6) return 'rgba(234, 88, 12, 0.8)';
    if (ratio < 0.85) return 'rgba(220, 38, 38, 0.9)';
    return '#B91C1C';
  };

  return (
    <div className={`space-y-3 bg-surface border border-border rounded-lg p-4 select-none ${className}`}>
      {/* Header with Title and Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-2.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
            <span>Disruption Propagation Cascade</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent/10 text-accent font-semibold">
              Δ Queue (Scenario − Baseline)
            </span>
          </div>
          <p className="text-[11px] text-muted mt-0.5">
            Real-time ripple showing downstream queue surge and recovery across 120 minutes.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted">
          <span>0p</span>
          <div className="flex h-2.5 rounded overflow-hidden border border-border">
            <span className="w-4 bg-surface-subtle" />
            <span className="w-4 bg-amber-500/30" />
            <span className="w-4 bg-amber-500/70" />
            <span className="w-4 bg-orange-600/80" />
            <span className="w-4 bg-red-600" />
          </div>
          <span>+{Math.round(maxDelta)}p</span>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[720px] relative">
          {/* Active Minute Playhead */}
          <div
            className="absolute top-0 bottom-6 w-[2px] bg-accent z-20 pointer-events-none transition-all duration-75"
            style={{
              left: `calc(72px + ${(activeMinute / (numMinutes - 1)) * 100}% * ((100% - 72px) / 100))`
            }}
          >
            <div className="absolute -top-4 -left-3 px-1 py-0.2 bg-accent text-white text-[9px] font-mono rounded font-bold">
              T+{activeMinute}m
            </div>
          </div>

          {/* Grid rows */}
          <div className="space-y-[2px]">
            {corridorStations.map((st) => {
              const deltaSeries = deltaByMinute[st.id] || [];
              const baseSeries = baselineByMinute[st.id] || [];
              const scSeries = scenarioByMinute[st.id] || [];

              return (
                <div key={st.id} className="flex items-center h-5">
                  {/* Station Code label */}
                  <div
                    onClick={() => onSelectStation && onSelectStation(st.id)}
                    className="w-[72px] shrink-0 text-[11px] font-mono font-medium text-text hover:text-accent cursor-pointer truncate pr-2 flex items-center justify-between"
                    title={`Click to focus on ${st.name}`}
                  >
                    <span>{st.id}</span>
                    <span className="text-[9px] text-muted truncate">{st.name.slice(0, 4)}</span>
                  </div>

                  {/* 120 Minute Columns */}
                  <div className="flex-1 flex h-full gap-[1px]">
                    {Array.from({ length: numMinutes }).map((_, m) => {
                      const delta = deltaSeries[m] || 0;
                      const base = baseSeries[m] || 0;
                      const scen = scSeries[m] || 0;
                      const color = getColor(delta);
                      const isCurrent = m === activeMinute;

                      return (
                        <div
                          key={m}
                          onClick={() => onSelectMinute && onSelectMinute(m)}
                          onMouseEnter={() => setHoveredCell({
                            stationId: st.id,
                            stationName: st.name,
                            minute: m,
                            delta,
                            baseline: base,
                            scenario: scen,
                          })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`flex-1 h-full cursor-pointer transition-opacity duration-75 ${
                            isCurrent ? 'ring-1 ring-accent z-10' : 'hover:opacity-75'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time axis marks */}
          <div className="flex items-center text-[10px] font-mono text-muted pt-2 pl-[72px]">
            {[0, 15, 30, 45, 60, 75, 90, 105, 120].map((t) => (
              <div
                key={t}
                className="flex-1 text-left first:text-left last:text-right"
              >
                +{t}m
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Info Strip */}
      <div className="h-6 flex items-center justify-between text-xs font-mono border-t border-border/60 pt-2 text-muted">
        {hoveredCell ? (
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-text font-bold">
              {hoveredCell.stationName} ({hoveredCell.stationId}) at T+{hoveredCell.minute}m:
            </span>
            <span>
              Baseline: <strong className="text-text">{Math.round(hoveredCell.baseline)}</strong>
            </span>
            <span>
              Scenario: <strong className="text-text">{Math.round(hoveredCell.scenario)}</strong>
            </span>
            <span className="text-crowd-sev font-bold">
              Δ Extra: +{Math.round(hoveredCell.delta)} passengers
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted">
            Hover over any cell for minute-level queue metrics · Click to jump playhead to minute
          </span>
        )}
      </div>
    </div>
  );
}
