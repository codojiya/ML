import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { STATIONS, STATION_MAP } from '../constants/stations';
import { SwipeCompareSchematic } from '../components/simulation/SwipeCompareSchematic';
import { CascadeHeatmap } from '../components/simulation/CascadeHeatmap';
import { SensitivityCurve } from '../components/simulation/SensitivityCurve';
import { OperatorBriefing } from '../components/simulation/OperatorBriefing';
import { ScenarioTray } from '../components/simulation/ScenarioTray';
import { MitigationPanel } from '../components/simulation/MitigationPanel';
import { StatStrip } from '../components/common/StatStrip';
import {
  Play,
  Pause,
  RotateCcw,
  Printer,
  Share2,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Zap,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function SimulationPage() {
  const {
    stationId,
    setStationId,
    direction,
    setDirection,
    currentDate,
    currentTime,
    setTimeOnly
  } = useApp();

  const [searchParams] = useSearchParams();

  // Simulation Controls State
  const [delayMin, setDelayMin] = useState(() => {
    const d = searchParams.get('delay');
    return d !== null ? parseInt(d, 10) : 20;
  });
  const [rainMm, setRainMm] = useState(() => {
    const r = searchParams.get('rain');
    return r !== null ? parseFloat(r) : 0;
  });
  const [eventIntensity, setEventIntensity] = useState(0);
  const [demandMultiplier, setDemandMultiplier] = useState(1.0);
  const [autoRun, setAutoRun] = useState(true);

  // Active minute in the 120-minute simulation window (0..119)
  const [activeSimMinute, setActiveSimMinute] = useState(20);
  const [isPlayingSim, setIsPlayingSim] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [justRan, setJustRan] = useState(false);

  // Simulation Results State
  const [simData, setSimData] = useState(null);
  const [sweepData, setSweepData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sweepLoading, setSweepLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Prescriptive AI Mitigation State
  const [mitigationStrategy, setMitigationStrategy] = useState('none');
  const [mitigationData, setMitigationData] = useState(null);
  const [mitigationLoading, setMitigationLoading] = useState(false);

  // Run simulation
  const runSimulation = useCallback(async (overrideMitigation) => {
    try {
      setLoading(true);
      setError(null);
      const isoTs = `${currentDate}T${currentTime}:00`;
      const mit = overrideMitigation !== undefined ? overrideMitigation : mitigationStrategy;

      const simRes = await api.getSimulation({
        station_id: stationId,
        direction,
        timestamp: isoTs,
        train_delay_min: delayMin,
        rainfall_mm: rainMm,
        event_intensity: eventIntensity,
        demand_multiplier: demandMultiplier,
        mitigation: mit
      });
      setSimData(simRes);
    } catch (err) {
      setError(err.message || 'Simulation execution failed');
    } finally {
      setLoading(false);
    }
  }, [stationId, direction, currentDate, currentTime, delayMin, rainMm, eventIntensity, demandMultiplier, mitigationStrategy]);

  // Fetch Prescriptive AI Mitigations
  const fetchMitigation = useCallback(async () => {
    if (delayMin <= 0) {
      setMitigationData(null);
      return;
    }
    try {
      setMitigationLoading(true);
      const isoTs = `${currentDate}T${currentTime}:00`;
      const mitRes = await api.getMitigation({
        station_id: stationId,
        direction,
        timestamp: isoTs,
        train_delay_min: delayMin,
        rainfall_mm: rainMm,
        event_intensity: eventIntensity,
        demand_multiplier: demandMultiplier
      });
      setMitigationData(mitRes);
    } catch (_) {
      // Non-fatal
    } finally {
      setMitigationLoading(false);
    }
  }, [stationId, direction, currentDate, currentTime, delayMin, rainMm, eventIntensity, demandMultiplier]);

  // Run sensitivity sweep
  const runSweep = useCallback(async () => {
    try {
      setSweepLoading(true);
      const isoTs = `${currentDate}T${currentTime}:00`;
      const sweepRes = await api.getSimulationSweep({
        station_id: stationId,
        direction,
        timestamp: isoTs,
        rainfall_mm: rainMm,
        event_intensity: eventIntensity,
        demand_multiplier: demandMultiplier
      });
      setSweepData(sweepRes.sweep || []);
    } catch (_) {}
    finally {
      setSweepLoading(false);
    }
  }, [stationId, direction, currentDate, currentTime, rainMm, eventIntensity, demandMultiplier]);

  // Initial and param-based trigger
  useEffect(() => {
    runSimulation();
    runSweep();
    fetchMitigation();
  }, []);

  // Debounced auto-run when inputs change
  useEffect(() => {
    if (!autoRun) return;
    const timer = setTimeout(() => {
      runSimulation();
      runSweep();
      fetchMitigation();
    }, 400);
    return () => clearTimeout(timer);
  }, [stationId, direction, currentDate, currentTime, delayMin, rainMm, eventIntensity, demandMultiplier, autoRun, runSimulation, runSweep, fetchMitigation]);

  // Simulation window playback ticker
  useEffect(() => {
    let interval = null;
    if (isPlayingSim) {
      const delayMs = Math.max(30, Math.round(150 / playbackSpeed));
      interval = setInterval(() => {
        setActiveSimMinute(prev => (prev >= 119 ? 0 : prev + 1));
      }, delayMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingSim, playbackSpeed]);

  const handleManualRun = useCallback(() => {
    runSimulation();
    runSweep();
    fetchMitigation();
    setIsPlayingSim(true);
    setJustRan(true);
    setTimeout(() => setJustRan(false), 3500);
  }, [runSimulation, runSweep, fetchMitigation]);

  const handleDeployMitigation = (strategyId) => {
    setMitigationStrategy(strategyId);
    runSimulation(strategyId);
  };

  const handleResetMitigation = () => {
    setMitigationStrategy('none');
    runSimulation('none');
  };

  // Keyboard shortcut: Cmd+Enter / Ctrl+Enter to run
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleManualRun();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleManualRun]);

  const handleReset = () => {
    setDelayMin(0);
    setRainMm(0);
    setEventIntensity(0);
    setDemandMultiplier(1.0);
    setActiveSimMinute(0);
    setIsPlayingSim(false);
    setMitigationStrategy('none');
    setMitigationData(null);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/simulation?station=${stationId}&delay=${delayMin}&dir=${direction}&time=${currentDate}T${currentTime}:00`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Convert current per-minute waiting to station cards for schematic
  const baselineStationSnapshots = (simData?.stations || []).map(s => {
    const val = simData.baseline_waiting_by_minute ? simData.baseline_waiting_by_minute[s.station_id]?.[activeSimMinute] : s.baseline_peak;
    return { ...s, waiting_passengers: val || 0 };
  });

  const scenarioStationSnapshots = (simData?.stations || []).map(s => {
    const val = simData.waiting_by_minute ? simData.waiting_by_minute[s.station_id]?.[activeSimMinute] : s.scenario_peak;
    return { ...s, waiting_passengers: val || 0 };
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Operational Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text">
              Disruption Simulation Lab
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface border border-border text-crowd-sev">
              Minute-Level Flow Engine
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Simulate timetable disruptions, track animated rolling stock, and analyze downstream congestion cascade.
          </p>
        </div>

        {/* Reproducibility & Print Export */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border bg-surface hover:bg-surface-hover rounded text-text transition-colors"
            title="Copy reproducible link with current parameters"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{linkCopied ? 'Link Copied!' : 'Share Scenario'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border bg-surface hover:bg-surface-hover rounded text-text transition-colors no-print"
            title="Export official scenario briefing as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Operations Layout: Left Sticky Controls, Right Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sticky Control Panel */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-lg p-4 space-y-4 self-start lg:sticky lg:top-20 z-10 no-print">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text">
              Scenario Parameters
            </span>
            <div className="flex items-center gap-1">
              <label className="text-[10px] text-muted flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRun}
                  onChange={e => setAutoRun(e.target.checked)}
                  className="rounded accent-accent"
                />
                <span>Auto-run</span>
              </label>
            </div>
          </div>

          {/* Station Selector */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Disruption Station</label>
            <select
              value={stationId}
              onChange={e => setStationId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-surface border border-border rounded text-xs text-text font-medium"
            >
              {STATIONS.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
          </div>

          {/* Direction */}
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

          {/* Service Delay Slider (0 to 30 min) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className="uppercase text-2xs text-muted font-medium">Train Hold Delay</span>
              <span className="font-bold text-sm text-crowd-sev tabular-nums">{delayMin} min</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={delayMin}
              onChange={e => setDelayMin(parseInt(e.target.value, 10))}
              className="w-full accent-crowd-sev cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-muted">
              <span>0m</span>
              <span>10m</span>
              <span>20m</span>
              <span>30m</span>
            </div>
          </div>

          {/* Weather Segmented Control (0, 15, 40 mm) */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Weather Condition</label>
            <div className="grid grid-cols-3 gap-1 text-2xs font-medium">
              {[
                { label: 'Normal', mm: 0 },
                { label: 'Moderate', mm: 15 },
                { label: 'Heavy Rain', mm: 40 }
              ].map(w => (
                <button
                  key={w.mm}
                  type="button"
                  onClick={() => setRainMm(w.mm)}
                  className={`py-1.5 border rounded text-center transition-colors ${
                    rainMm === w.mm ? 'bg-accent text-white border-accent' : 'border-border bg-surface hover:bg-surface-hover text-muted'
                  }`}
                >
                  <div>{w.label}</div>
                  <div className="font-mono text-[9px] opacity-75">{w.mm}mm</div>
                </button>
              ))}
            </div>
          </div>

          {/* Event Segmented Control */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Special Event Surge</label>
            <div className="grid grid-cols-3 gap-1 text-2xs font-medium">
              {[
                { label: 'None', val: 0 },
                { label: 'Moderate', val: 1 },
                { label: 'Major', val: 2 }
              ].map(ev => (
                <button
                  key={ev.val}
                  type="button"
                  onClick={() => setEventIntensity(ev.val)}
                  className={`py-1.5 border rounded text-center transition-colors ${
                    eventIntensity === ev.val ? 'bg-accent text-white border-accent' : 'border-border bg-surface hover:bg-surface-hover text-muted'
                  }`}
                >
                  {ev.label}
                </button>
              ))}
            </div>
          </div>

          {/* Demand Multiplier Slider (0.5x to 2.5x) */}
          <div className="space-y-1">
            <div className="flex justify-between text-2xs font-mono">
              <span className="uppercase text-muted">Demand Scale</span>
              <span className="font-bold text-text">{demandMultiplier.toFixed(1)}×</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={demandMultiplier}
              onChange={e => setDemandMultiplier(parseFloat(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
          </div>

          {/* Action Buttons: Run & Reset */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
            <button
              type="button"
              onClick={handleReset}
              className="py-2 border border-border bg-surface hover:bg-surface-hover text-text rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={handleManualRun}
              disabled={loading}
              className="py-2 bg-accent hover:bg-accent-hover text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
            </button>
          </div>

          {/* Reproducibility Footnote */}
          <div className="text-[10px] font-mono text-muted text-center border-t border-border/50 pt-2">
            Seed: 7 · Common Random Numbers (CRN)
          </div>
        </div>

        {/* Right Operations Visuals & Analytics */}
        <div className="lg:col-span-3 space-y-6">
          {/* Error Alert if any */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-crowd-severe rounded-lg text-xs flex items-center justify-between">
              <span className="font-medium">Simulation Error: {error}</span>
              <button onClick={handleManualRun} className="underline font-semibold text-accent hover:opacity-80">
                Retry Simulation
              </button>
            </div>
          )}

          {/* Success / Running Live Indicator */}
          {justRan && !error && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Simulation Active: <strong>{delayMin}m hold</strong> at <strong>{STATION_MAP[stationId]?.name || stationId}</strong> · Live rolling-stock animation playing (T+0m to T+120m)
              </span>
            </div>
          )}

          {/* Impact Summary Strip */}
          <StatStrip
            items={[
              {
                label: 'Affected Stations',
                value: `${simData?.affected_stations ?? 0} / 11`,
                subtext: 'Δ Peak > 5 passengers'
              },
              {
                label: 'Corridor Peak Station',
                value: simData?.summary?.peak_station_name || 'Andheri',
                subtext: `T+${simData?.summary?.peak_minute ?? 0}m`
              },
              {
                label: 'Elevated Queue Time',
                value: `${Math.max(...Object.values(simData?.summary?.minutes_elevated_by_station || { [stationId]: 0 }))} min`,
                subtext: 'Max platform recovery'
              },
              {
                label: 'Extra Platform Waiting',
                value: `+${Math.round(simData?.summary?.total_extra_waiting ?? 0).toLocaleString()}p`,
                subtext: 'Corridor passenger-min'
              },
              {
                label: 'Capacity Violations',
                value: `${simData?.capacity_violations ?? 0}`,
                subtext: 'Rolling-stock safety'
              }
            ]}
          />

          {/* SWIPE COMPARE SCHEMATIC WITH ANIMATED TRAINS */}
          <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
                  <span>Corridor Timeline Scrubber & Train Tracking</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent/10 text-accent font-semibold">
                    T+0m to T+120m Window
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-0.5">
                  Live train movements along Western Line. Held trains dwell visibly at {STATION_MAP[stationId]?.name}.
                </p>
              </div>

              {/* Time Scrubber Controls */}
              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveSimMinute(prev => Math.max(0, prev - 1))}
                  className="p-1.5 rounded border border-border bg-surface hover:bg-surface-hover text-text transition-colors"
                  title="Step 1 minute backward"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlayingSim(!isPlayingSim)}
                  className={`px-2.5 py-1.5 rounded border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isPlayingSim ? 'bg-accent text-white border-accent' : 'bg-surface hover:bg-surface-hover text-text border-border'
                  }`}
                  title={isPlayingSim ? 'Pause train movement' : 'Play train animation across 120 minutes'}
                >
                  {isPlayingSim ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingSim ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSimMinute(prev => Math.min(119, prev + 1))}
                  className="p-1.5 rounded border border-border bg-surface hover:bg-surface-hover text-text transition-colors"
                  title="Step 1 minute forward"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSimMinute(simData?.summary?.peak_minute ?? 20)}
                  className="px-2 py-1 rounded border border-border bg-surface hover:bg-surface-hover text-[11px] font-medium text-muted hover:text-text transition-colors"
                  title="Jump to the minute of maximum queue congestion"
                >
                  Peak (T+{simData?.summary?.peak_minute ?? 20}m)
                </button>

                {/* Speed selector 1x, 2x, 4x */}
                <div className="flex items-center border border-border rounded overflow-hidden text-[10px] font-mono">
                  {[1, 2, 4].map(spd => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-1.5 py-1 transition-colors ${
                        playbackSpeed === spd ? 'bg-accent text-white font-bold' : 'bg-surface hover:bg-surface-hover text-muted'
                      }`}
                    >
                      {spd}×
                    </button>
                  ))}
                </div>

                <div className="font-mono text-xs font-bold text-accent px-2 py-1 bg-surface-subtle border border-border rounded tabular-nums">
                  T+{activeSimMinute}m
                </div>
              </div>
            </div>

            {/* Minute Scrubber Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="119"
                value={activeSimMinute}
                onChange={e => setActiveSimMinute(parseInt(e.target.value, 10))}
                className="w-full accent-accent cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted">
                <span>T+0m (Start)</span>
                <span>T+30m</span>
                <span>T+60m (1h)</span>
                <span>T+90m</span>
                <span>T+120m (End)</span>
              </div>
            </div>

            {/* Draggable Swipe Comparison Component */}
            <SwipeCompareSchematic
              baselineStations={baselineStationSnapshots}
              scenarioStations={scenarioStationSnapshots}
              selectedStationId={stationId}
              onSelectStation={setStationId}
              direction={direction}
              activeMinute={activeSimMinute}
              trains={simData?.trains || []}
              baselineTrains={simData?.baseline_trains || []}
            />
          </div>

          {/* PRESCRIPTIVE AI DISPATCHER & MITIGATION ENGINE */}
          <MitigationPanel
            mitigationData={mitigationData}
            activeMitigation={mitigationStrategy}
            onSelectMitigation={handleDeployMitigation}
            onResetMitigation={handleResetMitigation}
            loading={loading || mitigationLoading}
          />

          {/* DISRUPTION CASCADE HEATMAP (THE WOW VISUAL) */}
          <CascadeHeatmap
            deltaByMinute={simData?.delta_by_minute || {}}
            baselineByMinute={simData?.baseline_waiting_by_minute || {}}
            scenarioByMinute={simData?.waiting_by_minute || {}}
            activeMinute={activeSimMinute}
            onSelectMinute={setActiveSimMinute}
            onSelectStation={setStationId}
            direction={direction}
          />

          {/* DELAY SENSITIVITY CURVE */}
          <SensitivityCurve
            sweepData={sweepData}
            currentDelay={delayMin}
            stationName={STATION_MAP[stationId]?.name || 'Andheri'}
            stationId={stationId}
            loading={sweepLoading}
          />

          {/* OPERATOR BRIEFING */}
          <OperatorBriefing
            stationName={STATION_MAP[stationId]?.name || 'Andheri'}
            stationId={stationId}
            delayMin={delayMin}
            startTime={currentTime}
            simResult={simData}
          />

          {/* SCENARIO TRAY (UP TO 4 SNAPSHOTS) */}
          <ScenarioTray
            currentConfig={{
              stationId,
              direction,
              delay: delayMin,
              rain: rainMm,
              event: eventIntensity,
              multiplier: demandMultiplier
            }}
            currentResult={simData}
            onApplyScenario={cfg => {
              setStationId(cfg.stationId);
              setDirection(cfg.direction);
              setDelayMin(cfg.delay);
              setRainMm(cfg.rain);
              setEventIntensity(cfg.event);
              setDemandMultiplier(cfg.multiplier);
            }}
          />

          {/* ASSUMPTIONS ACCORDION */}
          <div className="border border-border rounded-lg bg-surface overflow-hidden">
            <button
              type="button"
              onClick={() => setAssumptionsOpen(!assumptionsOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-text hover:bg-surface-subtle transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-accent" />
                <span>Engine Modeling Assumptions & Limits</span>
              </div>
              {assumptionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {assumptionsOpen && (
              <div className="p-4 border-t border-border text-xs text-muted space-y-2 bg-surface-subtle/40 font-sans leading-relaxed">
                <p>
                  <strong>Rolling Stock Capacity: </strong>Fixed 1,400 passengers per 12-car rake. Boarding occurs uniformly across destination compartments until physical capacity is saturated.
                </p>
                <p>
                  <strong>Service Headway: </strong>Nominal 6.0-minute inter-train headway; 3-minute inter-station running segment travel time.
                </p>
                <p>
                  <strong>Common Random Numbers (CRN): </strong>Identical random uniform sequences U drive both baseline and disrupted scenarios, guaranteeing that all observed delta queues result purely from the induced delay rather than stochastic noise.
                </p>
                <p>
                  <strong>Boundary Passenger Load: </strong>Initial boundary train load assumed at 150 passengers entering Borivali / Bandra.
                </p>
                <div className="pt-2 border-t border-border/50 text-[11px] font-mono text-muted flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Conservation residual: Scenario = {(simData?.conservation_residual?.scenario ?? 0).toFixed(6)} passengers</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
