import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  ReferenceLine
} from 'recharts';
import { RECHARTS_THEME, CustomTooltip } from '../common/RechartsTheme';

export function SensitivityCurve({
  sweepData = [],
  currentDelay = 20,
  stationName = 'Andheri',
  stationId = 'ADH',
  loading = false,
  className = ''
}) {
  if (loading) {
    return (
      <div className={`h-64 flex items-center justify-center bg-surface border border-border rounded-lg text-xs text-muted font-mono ${className}`}>
        Calculating delay sweep sensitivity curve (0 – 30 min)...
      </div>
    );
  }

  if (!sweepData || sweepData.length === 0) {
    return (
      <div className={`h-64 flex items-center justify-center bg-surface border border-border rounded-lg text-xs text-muted ${className}`}>
        No sweep data available.
      </div>
    );
  }

  // Find the point corresponding to current delay
  const currentPoint = sweepData.find(d => d.delay_min === currentDelay) || sweepData[0];

  return (
    <div className={`bg-surface border border-border rounded-lg p-4 space-y-3 select-none ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
            <span>Delay Sensitivity Curve</span>
            <span className="text-[10px] font-mono text-muted">
              Nonlinear Capacity Bottleneck
            </span>
          </div>
          <p className="text-[11px] text-muted mt-0.5">
            How queue size escalates across 0–30 min service holds at {stationName}.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-text font-medium">{stationId} Peak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span className="text-text font-medium">Corridor Peak</span>
          </div>
        </div>
      </div>

      {/* Recharts Curve */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sweepData} margin={{ top: 12, right: 16, bottom: 4, left: -10 }}>
            <CartesianGrid {...RECHARTS_THEME.grid} />
            <XAxis
              dataKey="delay_min"
              {...RECHARTS_THEME.axis}
              tickFormatter={(v) => `${v}m`}
              label={{ value: 'Train Delay (min)', position: 'insideBottomRight', offset: -4, fill: 'var(--muted)', fontSize: 10 }}
            />
            <YAxis
              {...RECHARTS_THEME.axis}
              tickFormatter={(v) => `${Math.round(v)}p`}
            />
            <Tooltip
              content={
                <CustomTooltip
                  unit="passengers"
                  formatter={(val) => Math.round(val)}
                />
              }
            />

            {/* Current setting vertical marker */}
            <ReferenceLine
              x={currentDelay}
              stroke="var(--accent)"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
            />

            {/* Station peak curve */}
            <Line
              type="monotone"
              dataKey="station_peak_waiting"
              name={`${stationName} Peak`}
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'var(--accent)' }}
              activeDot={{ r: 5 }}
            />

            {/* Corridor peak curve */}
            <Line
              type="monotone"
              dataKey="corridor_peak_waiting"
              name="Corridor Peak"
              stroke="#D97706"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={{ r: 2.5, fill: '#D97706' }}
            />

            {/* Highlighted current setting dot */}
            {currentPoint && (
              <ReferenceDot
                x={currentPoint.delay_min}
                y={currentPoint.station_peak_waiting}
                r={6}
                fill="var(--accent)"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[10px] text-muted font-mono border-t border-border/60 pt-2 flex items-center justify-between">
        <span>Current Setting: <strong>{currentDelay}m delay</strong> → {Math.round(currentPoint?.station_peak_waiting || 0)} max waiting</span>
        <span className="hidden sm:inline">Nonlinearity honestly shows queuing theory surge</span>
      </div>
    </div>
  );
}
