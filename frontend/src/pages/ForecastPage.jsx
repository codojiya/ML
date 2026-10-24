import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { STATIONS, STATION_MAP } from '../constants/stations';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { RECHARTS_THEME, CustomTooltip } from '../components/common/RechartsTheme';
import {
  TrendingUp,
  Brain,
  HelpCircle,
  Cpu,
  Layers,
  ArrowRightLeft,
  CloudRain,
  Calendar,
  AlertCircle
} from 'lucide-react';

export function ForecastPage() {
  const {
    stationId,
    setStationId,
    direction,
    setDirection,
    timestamp,
    currentDate,
    currentTime,
    setDateOnly,
    setTimeOnly
  } = useApp();

  // Inputs
  const [rainfall, setRainfall] = useState(0);
  const [eventIntensity, setEventIntensity] = useState(0);
  const [horizonSteps, setHorizonSteps] = useState(4); // 1..4 (15m to 60m)
  const [compareAllMode, setCompareAllMode] = useState(false);

  // Data states
  const [forecastResult, setForecastResult] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [allStationsForecasts, setAllStationsForecasts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch forecast for single station + complementary queue simulation
  const fetchForecastData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const isoTs = `${currentDate}T${currentTime}:00`;
      
      const [fcRes, simRes] = await Promise.all([
        api.getForecast({
          station_id: stationId,
          direction,
          timestamp: isoTs,
          rainfall_mm: parseFloat(rainfall) || 0,
          event_intensity: parseInt(eventIntensity, 10) || 0,
          horizon_steps: horizonSteps
        }),
        api.getSimulation({
          station_id: stationId,
          direction,
          timestamp: isoTs,
          train_delay_min: 0,
          rainfall_mm: parseFloat(rainfall) || 0,
          event_intensity: parseInt(eventIntensity, 10) || 0,
          demand_multiplier: 1.0
        })
      ]);

      setForecastResult(fcRes);
      setSimResult(simRes);
    } catch (err) {
      setError(err.message || 'Forecast computation failed');
    } finally {
      setLoading(false);
    }
  }, [stationId, direction, currentDate, currentTime, rainfall, eventIntensity, horizonSteps]);

  // Fetch all stations for compare-stations mode
  const fetchAllStationsForecast = useCallback(async () => {
    if (!compareAllMode) return;
    try {
      const isoTs = `${currentDate}T${currentTime}:00`;
      const promises = STATIONS.map(s =>
        api.getForecast({
          station_id: s.id,
          direction,
          timestamp: isoTs,
          rainfall_mm: parseFloat(rainfall) || 0,
          event_intensity: parseInt(eventIntensity, 10) || 0,
          horizon_steps: 4
        }).then(res => ({ id: s.id, data: res.forecast }))
      );
      const results = await Promise.all(promises);
      const map = {};
      results.forEach(r => { map[r.id] = r.data; });
      setAllStationsForecasts(map);
    } catch (_) {}
  }, [compareAllMode, direction, currentDate, currentTime, rainfall, eventIntensity]);

  useEffect(() => {
    fetchForecastData();
  }, [fetchForecastData]);

  useEffect(() => {
    fetchAllStationsForecast();
  }, [fetchAllStationsForecast]);

  // Prepare chart series: Actual (historical average / baseline) vs Predicted arrivals
  const chartSeries = (forecastResult?.forecast || []).map((pt, i) => {
    const timeStr = pt.timestamp.slice(11, 16);
    return {
      step: `+${(i + 1) * 15}m`,
      time: timeStr,
      predicted: pt.predicted_arrivals,
      // Complementary simulation queue size at this step
      simQueue: simResult?.stations?.find(s => s.station_id === stationId)?.baseline_series[i] || 0
    };
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text">
              Arrival Forecasting & SHAP Attribution
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface border border-border text-accent">
              CatBoost Regressor
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Machine learning forecast of passenger platform arrival rates with CatBoost SHAP factor explanations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCompareAllMode(!compareAllMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
            compareAllMode
              ? 'bg-accent text-white border-accent'
              : 'bg-surface hover:bg-surface-hover text-text border-border'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{compareAllMode ? 'Single Station Mode' : 'Compare All 11 Stations'}</span>
        </button>
      </div>

      {/* Main Grid: Left Rail Controls + Right Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Rail Inputs */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-lg p-4 space-y-4 self-start">
          <div className="text-xs font-bold uppercase tracking-wider text-text border-b border-border pb-2">
            Forecast Inputs
          </div>

          {/* Station Selection */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Station</label>
            <select
              value={stationId}
              onChange={e => setStationId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-surface border border-border rounded text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent font-medium"
            >
              {STATIONS.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
          </div>

          {/* Direction Toggle */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Direction</label>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setDirection('southbound')}
                className={`py-1.5 px-2 rounded font-medium border text-center transition-colors ${
                  direction === 'southbound' ? 'bg-accent text-white border-accent' : 'border-border bg-surface hover:bg-surface-hover text-muted'
                }`}
              >
                Southbound
              </button>
              <button
                type="button"
                onClick={() => setDirection('northbound')}
                className={`py-1.5 px-2 rounded font-medium border text-center transition-colors ${
                  direction === 'northbound' ? 'bg-accent text-white border-accent' : 'border-border bg-surface hover:bg-surface-hover text-muted'
                }`}
              >
                Northbound
              </button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-2xs uppercase tracking-wider text-muted font-medium">Date</label>
              <input
                type="date"
                min="2026-06-01"
                max="2026-08-29"
                value={currentDate}
                onChange={e => setDateOnly(e.target.value)}
                className="w-full px-2 py-1 bg-surface border border-border rounded text-xs font-mono text-text"
              />
            </div>
            <div className="space-y-1">
              <label className="text-2xs uppercase tracking-wider text-muted font-medium">Origin Time</label>
              <input
                type="time"
                value={currentTime}
                step="900"
                onChange={e => setTimeOnly(e.target.value)}
                className="w-full px-2 py-1 bg-surface border border-border rounded text-xs font-mono text-text"
              />
            </div>
          </div>

          {/* Horizon Selection (15 to 60m) */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Horizon Steps</label>
            <div className="grid grid-cols-4 gap-1 text-2xs font-mono">
              {[1, 2, 3, 4].map(steps => (
                <button
                  key={steps}
                  type="button"
                  onClick={() => setHorizonSteps(steps)}
                  className={`py-1.5 border rounded text-center transition-colors ${
                    horizonSteps === steps ? 'bg-accent text-white border-accent font-bold' : 'border-border bg-surface hover:bg-surface-hover text-muted'
                  }`}
                >
                  +{steps * 15}m
                </button>
              ))}
            </div>
          </div>

          {/* Rainfall Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-2xs font-mono">
              <span className="uppercase text-muted">Precipitation</span>
              <span className="font-bold text-text">{rainfall} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={rainfall}
              onChange={e => setRainfall(parseFloat(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
          </div>

          {/* Event Intensity Segmented */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Special Event</label>
            <div className="grid grid-cols-3 gap-1 text-2xs font-medium">
              {[
                { val: 0, label: 'None' },
                { val: 1, label: 'Moderate' },
                { val: 2, label: 'Major' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setEventIntensity(opt.val)}
                  className={`py-1 border rounded text-center transition-colors ${
                    eventIntensity === opt.val ? 'bg-accent text-white border-accent' : 'border-border bg-surface hover:bg-surface-hover text-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={fetchForecastData}
            disabled={loading}
            className="w-full py-2 bg-accent hover:bg-accent-hover text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{loading ? 'Computing...' : 'Recalculate Forecast'}</span>
          </button>
        </div>

        {/* Main Forecast Visuals & Sections */}
        <div className="lg:col-span-3 space-y-6">
          {compareAllMode ? (
            /* Compare Stations Mode (Small Multiples of all 11 stations) */
            <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-text">
                  Corridor Cross-Section Forecast (11 Stations Multiples)
                </span>
                <span className="text-2xs font-mono text-muted">
                  +15m to +60m Passenger Arrivals
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {STATIONS.map(s => {
                  const pts = allStationsForecasts[s.id] || [];
                  const isCurrent = s.id === stationId;
                  const peakArrival = pts.length > 0 ? Math.max(...pts.map(p => p.predicted_arrivals)) : 0;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setStationId(s.id)}
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        isCurrent ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:bg-surface-subtle'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-text">
                        <span>{s.name}</span>
                        <span className="font-mono text-2xs text-muted">({s.id})</span>
                      </div>
                      <div className="text-[11px] font-mono text-muted mt-1">
                        Peak: <strong className="text-text font-bold">{Math.round(peakArrival)}</strong> /15m
                      </div>
                      <div className="flex items-end gap-1 h-8 mt-2 pt-1 border-t border-border/40">
                        {pts.map((p, pIdx) => {
                          const h = Math.min(24, Math.max(4, (p.predicted_arrivals / 250) * 24));
                          return (
                            <div
                              key={pIdx}
                              className="flex-1 bg-accent/80 hover:bg-accent rounded-xs"
                              style={{ height: `${h}px` }}
                              title={`+${(pIdx + 1) * 15}m: ${Math.round(p.predicted_arrivals)}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* SECTION A: ML PREDICTION (Passenger Arrivals) */}
              <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-text">
                        ML Prediction: Passenger Arrivals
                      </span>
                      <span className="text-2xs font-mono px-1.5 py-0.2 rounded bg-accent-subtle text-accent font-semibold">
                        Pure Machine Learning Output
                      </span>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">
                      Predicted arrivals entering platform at {STATION_MAP[stationId]?.name} across 15–60 minute horizon.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                      <span className="text-text font-semibold">Predicted Arrivals</span>
                    </div>
                  </div>
                </div>

                {/* Forecast Chart */}
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartSeries} margin={{ top: 12, right: 16, bottom: 4, left: -10 }}>
                      <CartesianGrid {...RECHARTS_THEME.grid} />
                      <XAxis dataKey="step" {...RECHARTS_THEME.axis} />
                      <YAxis {...RECHARTS_THEME.axis} tickFormatter={(v) => `${Math.round(v)}`} />
                      <Tooltip content={<CustomTooltip unit="arrivals/15m" />} />
                      
                      {/* Shaded horizon area */}
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        name="Arrivals"
                        fill="rgba(31, 79, 216, 0.12)"
                        stroke="var(--accent)"
                        strokeWidth={2.5}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-muted border-t border-border/60 pt-2">
                  <span>Origin: {currentTime} · Horizon: +{horizonSteps * 15} min</span>
                  <span>Model: CatBoost Regressor (depth=6, lr=0.08)</span>
                </div>
              </div>

              {/* SECTION B: SIMULATION ESTIMATE (Queues & Crowd Index) */}
              <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-text">
                        Simulation Estimate: Queues & Crowd Consequences
                      </span>
                      <span className="text-2xs font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/20">
                        Mechanistic Simulator Output
                      </span>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">
                      Estimated platform queue backlog under rolling-stock headway constraints (6-min service).
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                      <span className="text-text font-semibold">Platform Queue</span>
                    </div>
                  </div>
                </div>

                {/* Queue Trajectory Chart */}
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartSeries} margin={{ top: 8, right: 16, bottom: 4, left: -10 }}>
                      <CartesianGrid {...RECHARTS_THEME.grid} />
                      <XAxis dataKey="step" {...RECHARTS_THEME.axis} />
                      <YAxis {...RECHARTS_THEME.axis} tickFormatter={(v) => `${Math.round(v)}p`} />
                      <Tooltip content={<CustomTooltip unit="waiting passengers" />} />
                      <Line
                        type="monotone"
                        dataKey="simQueue"
                        name="Platform Queue"
                        stroke="#D97706"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#D97706' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* "WHY THIS FORECAST" SHAP ATTRIBUTION PANEL */}
              <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold uppercase tracking-wider text-text">
                      Why This Forecast: Factor Attributions
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1 text-[11px] text-muted cursor-help"
                    title="SHAP values quantify the additive contribution of each input relative to the expected base value in the model. They reflect statistical correlation, not direct physical causation."
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Non-Causal Explanation</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {(forecastResult?.explanation || []).map((exp, idx) => {
                    const isPositive = exp.shap_value >= 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-text">{exp.label}</span>
                          <span className={`font-mono font-bold tabular-nums ${isPositive ? 'text-accent' : 'text-slate-500'}`}>
                            {isPositive ? '+' : ''}{exp.shap_value} arrivals
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-subtle rounded overflow-hidden flex">
                          <div
                            className={`h-full rounded ${isPositive ? 'bg-accent' : 'bg-slate-400'}`}
                            style={{ width: `${Math.min(100, (exp.abs_impact / 45) * 100)}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-muted font-sans">
                          {exp.description}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Scientific Honesty Disclaimer Banner */}
                <div className="flex items-start gap-2 p-2.5 bg-surface-subtle border border-border rounded text-[11px] text-muted">
                  <AlertCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span>
                    <strong>Scientific Note: </strong>
                    {forecastResult?.disclaimer || "Feature attributions are derived from CatBoost TreeSHAP. Wording strictly reflects statistical association within the trained model, not physical causal proof."}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
