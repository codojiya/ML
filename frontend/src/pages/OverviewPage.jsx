import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { STATIONS, CROWD_CATEGORIES } from '../constants/stations';
import { CorridorSchematic } from '../components/schematic/CorridorSchematic';
import { InteractiveMap } from '../components/schematic/InteractiveMap';
import { StatStrip } from '../components/common/StatStrip';
import { CrowdBadge } from '../components/common/CrowdBadge';
import { LinearGauge } from '../components/common/LinearGauge';
import { Sparkline } from '../components/common/Sparkline';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Cpu,
  Map as MapIcon,
  Layers,
  Zap,
  ArrowUpDown,
  X
} from 'lucide-react';

export function OverviewPage() {
  const {
    stationId,
    setStationId,
    direction,
    timestamp,
    currentDate,
    currentTime,
    setDateOnly,
    setTimeOnly,
    stepTime,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
  } = useApp();

  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('schematic'); // 'schematic' | 'map'
  const [overviewData, setOverviewData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch overview data for current timestamp and direction
  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getOverview(timestamp, direction);
      setOverviewData(data);
    } catch (err) {
      setError(err.message || 'Failed to load corridor status');
    } finally {
      setLoading(false);
    }
  }, [timestamp, direction]);

  // Fetch timeline data for corridor heatmap strip (date & direction)
  const loadTimeline = useCallback(async () => {
    try {
      const data = await api.getOverviewTimeline(currentDate, direction);
      setTimelineData(data);
    } catch (_) {}
  }, [currentDate, direction]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  // Handle station click to open detail drawer
  const handleSelectStation = (sid) => {
    setStationId(sid);
    setDrawerOpen(true);
  };

  // Selected station record
  const selectedStationRecord = useMemo(() => {
    if (!overviewData?.stations) return null;
    return overviewData.stations.find(s => s.station_id === stationId) || overviewData.stations[0];
  }, [overviewData, stationId]);

  // Jump to peak time today
  const handleJumpToPeak = () => {
    if (overviewData?.summary?.peak_time_today) {
      setTimeOnly(overviewData.summary.peak_time_today);
    }
  };

  // Convert current time to slot index for timeline playhead (0..67)
  const currentSlotIndex = useMemo(() => {
    if (!timelineData?.slots) return 0;
    const idx = timelineData.slots.indexOf(currentTime);
    return idx >= 0 ? idx : 8; // fallback to 08:00
  }, [timelineData, currentTime]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text">
              Corridor Operations
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface border border-border text-muted">
              Western Line (11 Stations)
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Real-time crowd state, platform queue indices, and timetable scrubber.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-surface-subtle border border-border rounded p-0.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('schematic')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'schematic' ? 'bg-surface text-accent font-semibold shadow-xs' : 'text-muted hover:text-text'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Schematic</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'map' ? 'bg-surface text-accent font-semibold shadow-xs' : 'text-muted hover:text-text'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Geo Map</span>
          </button>
        </div>
      </div>

      {/* 5-item Stat Strip */}
      <StatStrip
        items={[
          {
            label: 'Busiest Station',
            value: overviewData?.summary?.busiest_station || 'Andheri',
            subtext: `${overviewData?.summary?.busiest_station_id || 'ADH'}`
          },
          {
            label: 'Corridor Mean CI',
            value: overviewData?.summary?.corridor_mean_crowd_index?.toFixed(3) || '0.342',
            subtext: 'Normalized [0-1]'
          },
          {
            label: 'High / Severe Alert',
            value: `${overviewData?.summary?.high_severe_count ?? 0} / 11`,
            subtext: 'Stations elevated'
          },
          {
            label: 'Peak Time Today',
            value: overviewData?.summary?.peak_time_today || '08:45',
            subtext: 'Corridor max load'
          },
          {
            label: 'Total Platform Queues',
            value: `${Math.round(overviewData?.summary?.total_waiting ?? 0).toLocaleString()}p`,
            subtext: 'Passengers waiting'
          }
        ]}
      />

      {/* Hero Corridor Visual (Schematic or Map) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-muted">
          <span>Corridor Flow: {direction === 'southbound' ? 'Borivali → Bandra (Southbound)' : 'Bandra → Borivali (Northbound)'}</span>
          <span className="hidden sm:inline">Node ring = Waiting passengers · Fill = Crowd category</span>
        </div>

        {viewMode === 'schematic' ? (
          <>
            {/* Desktop horizontal view */}
            <div className="hidden md:block">
              <CorridorSchematic
                stationsData={overviewData?.stations || []}
                selectedStationId={stationId}
                onSelectStation={handleSelectStation}
                direction={direction}
              />
            </div>
            {/* Mobile vertical view */}
            <div className="md:hidden">
              <CorridorSchematic
                stationsData={overviewData?.stations || []}
                selectedStationId={stationId}
                onSelectStation={handleSelectStation}
                direction={direction}
                isMobileVertical={true}
              />
            </div>
          </>
        ) : (
          <InteractiveMap
            stationsData={overviewData?.stations || []}
            selectedStationId={stationId}
            onSelectStation={handleSelectStation}
            direction={direction}
          />
        )}
      </div>

      {/* Timetable Scrubber & Time Controls */}
      <div className="bg-surface border border-border rounded-lg p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text">
              Timetable Scrubber
            </span>
            <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-surface-subtle border border-border text-muted">
              15-min Intervals
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Date Picker */}
            <input
              type="date"
              min="2026-06-01"
              max="2026-08-29"
              value={currentDate}
              onChange={e => setDateOnly(e.target.value)}
              className="px-2 py-1 bg-surface border border-border rounded text-xs font-mono text-text focus:outline-none focus:ring-1 focus:ring-accent"
            />

            {/* Jump to Peak Button */}
            <button
              type="button"
              onClick={handleJumpToPeak}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-border bg-surface hover:bg-surface-hover rounded text-text transition-colors"
              title="Jump to today's corridor peak volume"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Jump to Peak ({overviewData?.summary?.peak_time_today || '08:45'})</span>
            </button>
          </div>
        </div>

        {/* Playback Controls & Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => stepTime(-15)}
              className="p-1.5 border border-border rounded bg-surface hover:bg-surface-hover text-muted hover:text-text transition-colors"
              title="Step -15m (←)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 border rounded transition-colors ${
                isPlaying ? 'border-accent bg-accent text-white' : 'border-border bg-surface hover:bg-surface-hover text-text'
              }`}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => stepTime(15)}
              className="p-1.5 border border-border rounded bg-surface hover:bg-surface-hover text-muted hover:text-text transition-colors"
              title="Step +15m (→)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Time Slider */}
          <div className="flex-1 flex flex-col justify-center">
            <input
              type="range"
              min="0"
              max="67"
              step="1"
              value={currentSlotIndex}
              onChange={e => {
                const idx = parseInt(e.target.value, 10);
                if (timelineData?.slots && timelineData.slots[idx]) {
                  setTimeOnly(timelineData.slots[idx]);
                }
              }}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-muted mt-1">
              <span>06:00</span>
              <span>08:45 (Peak)</span>
              <span>12:00</span>
              <span>18:30 (Eve Peak)</span>
              <span>22:45</span>
            </div>
          </div>

          {/* Playback Speed Segmented control */}
          <div className="flex items-center border border-border rounded overflow-hidden text-2xs font-mono">
            {[1, 2, 4].map(spd => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 transition-colors ${
                  playbackSpeed === spd ? 'bg-accent text-white font-bold' : 'bg-surface hover:bg-surface-hover text-muted'
                }`}
              >
                {spd}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Corridor Heatmap Strip */}
      {timelineData && (
        <div className="bg-surface border border-border rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-text">
              Corridor Heatmap Strip ({currentDate})
            </span>
            <span className="text-[11px] font-mono text-muted">
              Click any cell to jump playhead
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[680px] relative">
              {/* Playhead indicator line */}
              <div
                className="absolute top-0 bottom-4 w-[2px] bg-accent z-20 pointer-events-none"
                style={{
                  left: `calc(48px + ${(currentSlotIndex / 67) * 100}% * ((100% - 48px) / 100))`
                }}
              />

              {/* Rows */}
              <div className="space-y-[1.5px]">
                {STATIONS.map((s) => {
                  const row = timelineData.matrix[s.id] || [];
                  return (
                    <div key={s.id} className="flex items-center h-4">
                      <span className="w-12 text-[10px] font-mono text-muted truncate pr-1">
                        {s.id}
                      </span>
                      <div className="flex-1 flex h-full gap-[1px]">
                        {row.map((ci, slotIdx) => {
                          const slotTime = timelineData.slots[slotIdx];
                          const color = ci < 0.35 ? '#2E9E6B' : ci < 0.6 ? '#E0A82E' : ci < 0.85 ? '#E4743B' : '#C7372F';
                          return (
                            <div
                              key={slotIdx}
                              onClick={() => setTimeOnly(slotTime)}
                              title={`${s.name} at ${slotTime}: CI ${ci.toFixed(2)}`}
                              className="flex-1 h-full cursor-pointer hover:opacity-75 transition-opacity"
                              style={{ backgroundColor: color, opacity: 0.85 }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Slot time marks */}
              <div className="flex justify-between text-[9px] font-mono text-muted pt-1.5 pl-12">
                <span>06:00</span>
                <span>09:00</span>
                <span>12:00</span>
                <span>15:00</span>
                <span>18:00</span>
                <span>21:00</span>
                <span>22:45</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranked Congestion Table with Sparklines */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden space-y-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-text">
            Corridor Station Ranking ({currentTime})
          </div>
          <span className="text-2xs text-muted font-mono">
            Sorted by estimated crowd index descending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-subtle text-muted text-[11px] font-mono uppercase tracking-wider">
                <th className="py-2 px-3 font-medium">Rank & Station</th>
                <th className="py-2 px-3 font-medium">Crowd Level</th>
                <th className="py-2 px-3 font-medium">Platform Queue</th>
                <th className="py-2 px-3 font-medium">15m Arrivals</th>
                <th className="py-2 px-3 font-medium">Onboard Load</th>
                <th className="py-2 px-3 font-medium">Day Trend</th>
                <th className="py-2 px-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {overviewData?.stations
                ? [...overviewData.stations]
                    .sort((a, b) => b.estimated_crowd_index - a.estimated_crowd_index)
                    .map((st, idx) => (
                      <tr
                        key={st.station_id}
                        onClick={() => handleSelectStation(st.station_id)}
                        className={`cursor-pointer transition-colors ${
                          st.station_id === stationId ? 'bg-accent/5 font-medium' : 'hover:bg-surface-subtle'
                        }`}
                      >
                        <td className="py-2 px-3 font-semibold text-text">
                          <span className="font-mono text-muted mr-2">#{idx + 1}</span>
                          {st.station_name} <span className="font-mono text-muted text-2xs">({st.station_id})</span>
                        </td>
                        <td className="py-2 px-3">
                          <CrowdBadge category={st.crowd_category} size="xs" />
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-text font-bold">
                          {Math.round(st.waiting_passengers)}p
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-muted">
                          {Math.round(st.simulated_passenger_arrivals)}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-muted">
                          {Math.round(st.onboard_train_load)}
                        </td>
                        <td className="py-2 px-3">
                          <Sparkline
                            data={st.trend_sparkline}
                            color={st.crowd_category === 'Severe' ? '#C7372F' : st.crowd_category === 'High' ? '#E4743B' : '#1F4FD8'}
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectStation(st.station_id);
                            }}
                            className="text-accent hover:underline text-2xs font-mono font-medium"
                          >
                            Details →
                          </button>
                        </td>
                      </tr>
                    ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Station Detail Drawer */}
      {drawerOpen && selectedStationRecord && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex justify-end animate-in fade-in duration-100"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface h-full border-l border-border p-5 space-y-5 overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text">
                    {selectedStationRecord.station_name}
                  </h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-subtle border border-border text-muted">
                    {selectedStationRecord.station_id}
                  </span>
                </div>
                <div className="text-xs text-muted mt-0.5">
                  Western Line · {direction === 'southbound' ? 'Southbound' : 'Northbound'} · {currentTime}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-muted hover:text-text rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Crowd Gauge */}
            <LinearGauge value={selectedStationRecord.estimated_crowd_index} />

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-surface-subtle p-2.5 rounded border border-border">
                <div className="text-2xs text-muted uppercase font-medium">Waiting Queue</div>
                <div className="text-base font-bold font-mono text-text mt-0.5 tabular-nums">
                  {Math.round(selectedStationRecord.waiting_passengers)}p
                </div>
              </div>
              <div className="bg-surface-subtle p-2.5 rounded border border-border">
                <div className="text-2xs text-muted uppercase font-medium">15m Arrivals</div>
                <div className="text-base font-bold font-mono text-text mt-0.5 tabular-nums">
                  {Math.round(selectedStationRecord.simulated_passenger_arrivals)}
                </div>
              </div>
              <div className="bg-surface-subtle p-2.5 rounded border border-border">
                <div className="text-2xs text-muted uppercase font-medium">Onboard Load</div>
                <div className="text-base font-bold font-mono text-text mt-0.5 tabular-nums">
                  {Math.round(selectedStationRecord.onboard_train_load)}
                </div>
              </div>
            </div>

            {/* Weather & Event context */}
            <div className="bg-surface-subtle p-3 rounded border border-border text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-muted">Precipitation:</span>
                <span className="text-text font-medium">{selectedStationRecord.rainfall_mm} mm ({selectedStationRecord.weather_category})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Special Event:</span>
                <span className="text-text font-medium">Intensity {selectedStationRecord.event_intensity}</span>
              </div>
            </div>

            {/* 24-slot Trend Sparkline Chart */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-text uppercase tracking-wider text-[11px]">
                Platform Waiting Trajectory (Full Operating Day)
              </div>
              <div className="p-3 bg-surface-subtle border border-border rounded flex items-center justify-center">
                <Sparkline
                  data={selectedStationRecord.waiting_sparkline || []}
                  width={340}
                  height={60}
                  color="var(--accent)"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  navigate(`/forecast?station=${selectedStationRecord.station_id}`);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-accent text-white rounded hover:bg-accent-hover transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Forecast Arrivals at {selectedStationRecord.station_name}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  navigate(`/simulation?station=${selectedStationRecord.station_id}`);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold border border-border bg-surface hover:bg-surface-hover text-text rounded transition-colors"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Simulate Disruption at {selectedStationRecord.station_name}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
