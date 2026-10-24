import React from 'react';

export function StatStrip({ items, className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border border border-border rounded-lg bg-surface ${className}`}
      role="region"
      aria-label="Summary Statistics"
    >
      {items.map((item, idx) => (
        <div key={idx} className="px-4 py-3 flex flex-col justify-center">
          <div className="text-2xs uppercase tracking-wider text-muted font-medium mb-1">
            {item.label}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg md:text-xl font-bold tracking-tight text-text font-mono tabular-nums">
              {item.value}
            </span>
            {item.subtext && (
              <span className="text-xs text-muted truncate">
                {item.subtext}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
