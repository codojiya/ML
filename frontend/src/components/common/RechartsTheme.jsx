import React from 'react';

export const RECHARTS_THEME = {
  grid: {
    stroke: 'var(--border)',
    strokeDasharray: '3 3',
    vertical: false,
  },
  axis: {
    stroke: 'var(--border-strong)',
    tick: { fill: 'var(--muted)', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' },
    tickLine: { stroke: 'var(--border)' },
  },
  colors: {
    accent: '#1F4FD8',
    baseline: '#8E9BAE',
    scenario: '#C7372F',
    actual: '#0B1B33',
    predicted: '#1F4FD8',
    low: '#2E9E6B',
    moderate: '#E0A82E',
    high: '#E4743B',
    severe: '#C7372F',
  }
};

export function CustomTooltip({ active, payload, label, unit = '', formatter = null }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-surface border border-border shadow-sm rounded p-2.5 text-xs font-sans min-w-[140px] z-50">
      {label !== undefined && (
        <div className="font-semibold text-text border-b border-border pb-1 mb-1.5 font-mono">
          {label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((item, idx) => {
          const val = formatter ? formatter(item.value, item.name) : item.value;
          return (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color || item.stroke || item.fill }}
                />
                <span className="text-muted text-2xs truncate">
                  {item.name}
                </span>
              </div>
              <span className="font-mono font-bold text-text tabular-nums">
                {typeof val === 'number' ? val.toLocaleString() : val} {unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
