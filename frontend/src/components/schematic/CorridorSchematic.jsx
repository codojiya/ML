import React, { useState } from 'react';
import { STATIONS, CROWD_CATEGORIES } from '../../constants/stations';

export function CorridorSchematic({
  stationsData = [],
  selectedStationId = 'ADH',
  onSelectStation,
  direction = 'southbound',
  activeMinute = 0,
  trains = [],
  className = '',
  isMobileVertical = false,
}) {
  const [hoveredStation, setHoveredStation] = useState(null);

  // Map station details by ID
  const dataMap = Object.fromEntries((stationsData || []).map(s => [s.station_id || s.id, s]));

  // Calculate normalized positions with 75% physical distance + 25% uniform spacing to avoid collision at RAM/GMN
  const totalKm = 20.6;
  const numStations = STATIONS.length;
  
  const stationPositions = STATIONS.map((s, idx) => {
    const physFrac = s.distance_km / totalKm;
    const uniformFrac = idx / (numStations - 1);
    const frac = 0.75 * physFrac + 0.25 * uniformFrac;
    return { ...s, frac, index: idx };
  });

  // Category helper
  const getCategory = (sid) => {
    const data = dataMap[sid];
    if (!data) return CROWD_CATEGORIES.Low;
    // Dynamic per-minute simulation scale when waiting_passengers is passed
    if (data.waiting_passengers !== undefined) {
      const w = data.waiting_passengers;
      if (w >= 300) return CROWD_CATEGORIES.Severe;
      if (w >= 180) return CROWD_CATEGORIES.High;
      if (w >= 70) return CROWD_CATEGORIES.Moderate;
      return CROWD_CATEGORIES.Low;
    }
    if (data.crowd_category) return CROWD_CATEGORIES[data.crowd_category] || CROWD_CATEGORIES.Low;
    if (data.scenario_category) return CROWD_CATEGORIES[data.scenario_category] || CROWD_CATEGORIES.Low;
    if (data.estimated_crowd_index !== undefined) {
      const ci = data.estimated_crowd_index;
      if (ci >= 0.85) return CROWD_CATEGORIES.Severe;
      if (ci >= 0.60) return CROWD_CATEGORIES.High;
      if (ci >= 0.35) return CROWD_CATEGORIES.Moderate;
      return CROWD_CATEGORIES.Low;
    }
    return CROWD_CATEGORIES.Low;
  };

  const getWaiting = (sid) => {
    const data = dataMap[sid];
    return data?.waiting_passengers ?? data?.scenario_peak ?? data?.baseline_peak ?? 0;
  };

  // Layout geometry
  if (isMobileVertical) {
    // Vertical layout for small screens (390px)
    const height = 680;
    const width = 340;
    const paddingY = 40;
    const lineX = 70;
    const usableHeight = height - paddingY * 2;

    return (
      <div className={`relative w-full overflow-hidden select-none bg-surface border border-border rounded-lg p-2 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Main Transit Line Track */}
          <line
            x1={lineX}
            y1={paddingY}
            x2={lineX}
            y2={height - paddingY}
            stroke="var(--border-strong)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Directional Flow Chevrons */}
          {[0.2, 0.4, 0.6, 0.8].map((f, i) => {
            const y = paddingY + usableHeight * f;
            const dy = direction === 'southbound' ? 6 : -6;
            return (
              <path
                key={i}
                d={`M ${lineX - 4} ${y - dy} L ${lineX} ${y} L ${lineX + 4} ${y - dy}`}
                fill="none"
                stroke="var(--muted)"
                strokeWidth="1.5"
                opacity="0.6"
              />
            );
          })}

          {/* Stations Nodes */}
          {stationPositions.map((st, idx) => {
            const y = paddingY + usableHeight * st.frac;
            const isSelected = st.id === selectedStationId;
            const isHovered = hoveredStation === st.id;
            const cat = getCategory(st.id);
            const waiting = getWaiting(st.id);
            const ringThickness = Math.min(10, Math.max(2, Math.sqrt(waiting) * 0.4));

            return (
              <g
                key={st.id}
                tabIndex={0}
                role="button"
                aria-label={`${st.name} station, crowd level ${cat.label}, ${Math.round(waiting)} waiting`}
                onClick={() => onSelectStation && onSelectStation(st.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectStation && onSelectStation(st.id);
                  }
                }}
                onMouseEnter={() => setHoveredStation(st.id)}
                onMouseLeave={() => setHoveredStation(null)}
                className="cursor-pointer focus:outline-none"
              >
                {/* Waiting passenger volume outer ring */}
                <circle
                  cx={lineX}
                  cy={y}
                  r={8 + ringThickness}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth="2"
                  strokeOpacity="0.4"
                  className="transition-all duration-300"
                />

                {/* Selection Halo */}
                {isSelected && (
                  <circle
                    cx={lineX}
                    cy={y}
                    r={16}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Core Station Node */}
                <circle
                  cx={lineX}
                  cy={y}
                  r={isHovered || isSelected ? 8 : 6.5}
                  fill={cat.color}
                  stroke="var(--surface)"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                {/* Station Label & Details */}
                <text
                  x={lineX + 24}
                  y={y - 2}
                  className="text-xs font-semibold select-none"
                  fill="var(--text)"
                >
                  {st.name}
                  <tspan fill="var(--muted)" className="text-[10px] font-mono ml-1"> ({st.id})</tspan>
                </text>
                <text
                  x={lineX + 24}
                  y={y + 12}
                  className="text-[11px] font-mono select-none tabular-nums"
                  fill="var(--muted)"
                >
                  {Math.round(waiting)} waiting · {cat.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Horizontal layout (standard desktop operations center)
  const svgWidth = 1000;
  const svgHeight = 180;
  const padX = 55;
  const lineY = 88;
  const usableWidth = svgWidth - padX * 2;

  // Compute interpolated train positions along this exact track
  const activeTrains = trains.filter(t => {
    if (!t.positions_by_minute) return false;
    const pos = t.positions_by_minute[activeMinute];
    return pos !== null && pos !== undefined;
  });

  return (
    <div className={`relative w-full overflow-x-auto select-none bg-surface border border-border rounded-lg p-3 ${className}`}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto min-w-[700px] overflow-visible"
        role="img"
        aria-label="Mumbai Western Line schematic corridor (Borivali to Bandra)"
      >
        {/* Track Ground Shadow */}
        <line
          x1={padX}
          y1={lineY}
          x2={svgWidth - padX}
          y2={lineY}
          stroke="var(--border-strong)"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Direction Flow Chevrons */}
        {[0.12, 0.28, 0.44, 0.60, 0.76, 0.90].map((f, i) => {
          const x = padX + usableWidth * f;
          const dx = direction === 'southbound' ? 7 : -7;
          return (
            <path
              key={i}
              d={`M ${x - dx} ${lineY - 4} L ${x} ${lineY} L ${x - dx} ${lineY + 4}`}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="1.6"
              opacity="0.7"
            />
          );
        })}

        {/* Dynamic Trains Layer */}
        {activeTrains.map((tr) => {
          const pos = tr.positions_by_minute[activeMinute];
          // pos is 0.0 (BVI) to 10.0 (BA)
          const fracIdx = Math.max(0, Math.min(10, pos));
          const baseIdx = Math.floor(fracIdx);
          const rem = fracIdx - baseIdx;
          const nextIdx = Math.min(10, baseIdx + 1);

          const x1 = padX + usableWidth * stationPositions[baseIdx].frac;
          const x2 = padX + usableWidth * stationPositions[nextIdx].frac;
          const trainX = x1 + (x2 - x1) * rem;

          const load = tr.loads_by_minute ? tr.loads_by_minute[activeMinute] : 600;
          const isHeld = tr.held_by_minute ? tr.held_by_minute[activeMinute] : false;
          const loadRatio = Math.min(1, Math.max(0.1, load / 1400));

          return (
            <g
              key={tr.id}
              className="transition-all duration-150 ease-out pointer-events-none"
              transform={`translate(${trainX}, ${lineY})`}
            >
              {/* Held Warning Indicator */}
              {isHeld && (
                <circle
                  cx={0}
                  cy={0}
                  r={18}
                  fill="none"
                  stroke="var(--crowd-severe)"
                  strokeWidth="2.5"
                  strokeDasharray="3 3"
                  className="animate-pulse"
                />
              )}

              {/* Train Capsule */}
              <rect
                x={-14}
                y={-8}
                width={28}
                height={16}
                rx={4}
                fill={isHeld ? "var(--crowd-severe)" : "var(--accent)"}
                fillOpacity={0.85 + loadRatio * 0.15}
                stroke="var(--surface)"
                strokeWidth="1.5"
              />

              {/* Train load bar inside capsule */}
              <rect
                x={-12}
                y={3}
                width={24 * loadRatio}
                height={3}
                rx={1}
                fill="#FFFFFF"
                opacity="0.9"
              />

              {/* Train Label */}
              <text
                x={0}
                y={-12}
                textAnchor="middle"
                className="text-[9px] font-mono font-bold select-none"
                fill={isHeld ? "var(--crowd-severe)" : "var(--accent)"}
              >
                {isHeld ? 'HELD' : tr.id}
              </text>
            </g>
          );
        })}

        {/* Station Nodes & Alternating Labels */}
        {stationPositions.map((st, idx) => {
          const x = padX + usableWidth * st.frac;
          const isSelected = st.id === selectedStationId;
          const isHovered = hoveredStation === st.id;
          const cat = getCategory(st.id);
          const waiting = getWaiting(st.id);
          const ringThickness = Math.min(12, Math.max(2, Math.sqrt(waiting) * 0.4));
          const isOdd = idx % 2 === 1;

          // Staggered label positions to prevent collisions
          const labelY = isOdd ? lineY - 34 : lineY + 38;
          const subY = isOdd ? lineY - 20 : lineY + 52;
          const stemY2 = isOdd ? lineY - 14 : lineY + 14;

          return (
            <g
              key={st.id}
              tabIndex={0}
              role="button"
              aria-label={`${st.name} station, crowd status ${cat.label}, ${Math.round(waiting)} waiting passengers`}
              onClick={() => onSelectStation && onSelectStation(st.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectStation && onSelectStation(st.id);
                }
              }}
              onMouseEnter={() => setHoveredStation(st.id)}
              onMouseLeave={() => setHoveredStation(null)}
              className="cursor-pointer focus:outline-none group"
            >
              {/* Connector tick line */}
              <line
                x1={x}
                y1={lineY}
                x2={x}
                y2={stemY2}
                stroke="var(--border-strong)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* Waiting passenger volume outer ring */}
              <circle
                cx={x}
                cy={lineY}
                r={8 + ringThickness}
                fill="none"
                stroke={cat.color}
                strokeWidth="2.5"
                strokeOpacity={isHovered ? 0.7 : 0.4}
                className="transition-all duration-300"
              />

              {/* Selected station outer blue ring */}
              {isSelected && (
                <circle
                  cx={x}
                  cy={lineY}
                  r={17}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
              )}

              {/* Core Station Node */}
              <circle
                cx={x}
                cy={lineY}
                r={isHovered || isSelected ? 8.5 : 7}
                fill={cat.color}
                stroke="var(--surface)"
                strokeWidth="2.5"
                className="transition-all duration-200"
              />

              {/* Center Dot */}
              <circle
                cx={x}
                cy={lineY}
                r={2.5}
                fill="var(--surface)"
              />

              {/* Station Label */}
              <text
                x={x}
                y={labelY}
                textAnchor="middle"
                className={`text-xs select-none transition-colors ${
                  isSelected ? 'font-bold fill-accent' : 'font-semibold fill-text'
                }`}
              >
                {st.name}
              </text>

              {/* Station Code & Waiting count */}
              <text
                x={x}
                y={subY}
                textAnchor="middle"
                className="text-[10px] font-mono fill-muted tabular-nums select-none"
              >
                {st.id} · {Math.round(waiting)}p
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
