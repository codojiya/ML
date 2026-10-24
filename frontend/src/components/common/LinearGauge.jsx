import React from 'react';
import { CROWD_CATEGORIES } from '../../constants/stations';

export function LinearGauge({ value = 0, className = '' }) {
  const clamped = Math.max(0, Math.min(1, value));
  const percent = clamped * 100;

  // Determine current category
  let categoryKey = 'Low';
  if (clamped >= 0.85) categoryKey = 'Severe';
  else if (clamped >= 0.60) categoryKey = 'High';
  else if (clamped >= 0.35) categoryKey = 'Moderate';

  const cat = CROWD_CATEGORIES[categoryKey];

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between items-baseline text-xs">
        <span className="text-muted font-medium text-2xs uppercase tracking-wider">Crowd Index</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-sm text-text tabular-nums">
            {clamped.toFixed(3)}
          </span>
          <span className="text-2xs font-semibold px-1 py-0.5 rounded" style={{ color: cat.color, backgroundColor: cat.bgColor }}>
            {cat.label}
          </span>
        </div>
      </div>

      {/* Meter track */}
      <div className="relative h-2.5 w-full bg-surface-subtle border border-border rounded overflow-hidden">
        {/* Color segments background */}
        <div className="absolute inset-0 flex">
          <div className="w-[35%] h-full bg-crowd-low/20 border-r border-border/50" />
          <div className="w-[25%] h-full bg-crowd-mod/20 border-r border-border/50" />
          <div className="w-[25%] h-full bg-crowd-high/20 border-r border-border/50" />
          <div className="w-[15%] h-full bg-crowd-sev/20" />
        </div>

        {/* Value fill */}
        <div
          className="absolute top-0 bottom-0 left-0 transition-all duration-300 ease-out"
          style={{
            width: `${percent}%`,
            backgroundColor: cat.color,
          }}
        />
      </div>

      {/* Scale ticks */}
      <div className="relative flex justify-between text-[10px] text-muted font-mono tabular-nums px-0.5">
        <span>0.0</span>
        <span className="absolute left-[35%] -translate-x-1/2">0.35</span>
        <span className="absolute left-[60%] -translate-x-1/2">0.60</span>
        <span className="absolute left-[85%] -translate-x-1/2">0.85</span>
        <span>1.0</span>
      </div>
    </div>
  );
}
