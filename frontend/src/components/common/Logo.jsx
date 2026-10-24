import React from 'react';

export function Logo({ className = "h-6" }) {
  return (
    <div className={`flex items-center gap-2 select-none font-sans font-semibold tracking-tight text-text ${className}`}>
      {/* Pulse through rail line SVG icon */}
      <svg
        className="w-6 h-6 text-accent shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Parallel transit rails */}
        <line x1="2" y1="7" x2="22" y2="7" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="2" y1="17" x2="22" y2="17" strokeOpacity="0.3" strokeWidth="1.5" />
        {/* Pulse waveform along center line */}
        <path d="M2 12h5l2-5 3 10 3-8 2 3h7" strokeWidth="2.2" />
      </svg>
      <div className="flex items-baseline">
        <span className="text-base font-bold tracking-tight text-text">Crowd</span>
        <span className="text-base font-semibold text-accent tracking-tight">Pulse</span>
      </div>
    </div>
  );
}
