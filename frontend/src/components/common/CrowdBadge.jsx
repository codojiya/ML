import React from 'react';
import { CROWD_CATEGORIES } from '../../constants/stations';

export function CrowdBadge({ category, size = 'sm', showShape = true }) {
  const cat = CROWD_CATEGORIES[category] || CROWD_CATEGORIES.Low;

  const renderShape = () => {
    switch (cat.shape) {
      case 'circle':
        return (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: cat.color }}
            aria-hidden="true"
          />
        );
      case 'square':
        return (
          <span
            className="inline-block w-1.5 h-1.5 rounded-none shrink-0"
            style={{ backgroundColor: cat.color }}
            aria-hidden="true"
          />
        );
      case 'triangle':
        return (
          <span
            className="inline-block w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] shrink-0"
            style={{ borderBottomColor: cat.color }}
            aria-hidden="true"
          />
        );
      case 'diamond':
        return (
          <span
            className="inline-block w-1.5 h-1.5 rotate-45 shrink-0"
            style={{ backgroundColor: cat.color }}
            aria-hidden="true"
          />
        );
      default:
        return null;
    }
  };

  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${pad} tabular-nums`}
      style={{
        backgroundColor: cat.bgColor,
        color: cat.color,
        borderColor: cat.border,
      }}
      title={`Crowd Level: ${cat.label} (${cat.range})`}
    >
      {showShape && renderShape()}
      <span>{cat.label}</span>
    </span>
  );
}
