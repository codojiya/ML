import React, { useState, useEffect } from 'react';
import {
  BookmarkPlus,
  Trash2,
  Edit2,
  Check,
  Download,
  BarChart2,
  FileJson,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { RECHARTS_THEME, CustomTooltip } from '../common/RechartsTheme';

const STORAGE_KEY = 'crowdpulse_saved_scenarios';

export function ScenarioTray({
  currentConfig,
  currentResult,
  onApplyScenario,
  className = ''
}) {
  const [scenarios, setScenarios] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  });

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showCompareChart, setShowCompareChart] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    } catch (_) {}
  }, [scenarios]);

  const handleSaveCurrent = () => {
    if (!currentResult || scenarios.length >= 4) return;
    const defaultName = `${currentConfig.delay}m Delay at ${currentConfig.stationId} (${currentConfig.direction === 'southbound' ? 'SB' : 'NB'})`;
    const newScen = {
      id: Date.now().toString(),
      name: defaultName,
      timestamp: new Date().toISOString(),
      config: { ...currentConfig },
      summary: {
        peak_station: currentResult.summary?.peak_station,
        scenario_peak: currentResult.stations?.find(s => s.station_id === currentConfig.stationId)?.scenario_peak || 0,
        affected_stations: currentResult.affected_stations,
        total_extra_waiting: currentResult.summary?.total_extra_waiting,
      },
      series: currentResult.stations?.find(s => s.station_id === currentConfig.stationId)?.scenario_series || []
    };
    setScenarios(prev => [...prev, newScen]);
  };

  const handleDelete = (id) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  const handleStartRename = (scen) => {
    setEditingId(scen.id);
    setEditName(scen.name);
  };

  const handleSaveRename = (id) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, name: editName } : s));
    setEditingId(null);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(scenarios, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crowdpulse_scenarios_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Prepare chart comparison data across 8 intervals (120 min / 15 = 8 steps)
  const chartData = [0, 15, 30, 45, 60, 75, 90, 105].map((min, idx) => {
    const pt = { minute: `+${min}m` };
    scenarios.forEach((scen, sIdx) => {
      pt[scen.name] = scen.series[idx] || 0;
    });
    return pt;
  });

  const colors = ['#1F4FD8', '#C7372F', '#E0A82E', '#2E9E6B'];

  return (
    <div className={`bg-surface border border-border rounded-lg p-4 space-y-3 select-none ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-text">
            Scenario Tray ({scenarios.length}/4)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {scenarios.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowCompareChart(!showCompareChart)}
                className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-surface-subtle text-muted hover:text-text transition-colors"
                title="Toggle comparison overlay chart"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>{showCompareChart ? 'Hide Chart' : 'Compare Chart'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-surface-subtle text-muted hover:text-text transition-colors"
                title="Export scenarios as JSON"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleSaveCurrent}
            disabled={scenarios.length >= 4 || !currentResult}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Current</span>
          </button>
        </div>
      </div>

      {/* Scenario List */}
      {scenarios.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted font-mono border border-dashed border-border rounded">
          No saved scenarios. Run a simulation and click "Save Current" to snapshot up to 4 scenarios for side-by-side evaluation.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {scenarios.map((scen, idx) => (
            <div
              key={scen.id}
              className="border border-border rounded p-2.5 bg-surface-subtle/50 flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                {editingId === scen.id ? (
                  <div className="flex items-center gap-1 w-full">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="px-1.5 py-0.5 text-xs bg-surface border border-accent rounded w-full text-text"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(scen.id)}
                      className="p-1 text-accent hover:text-accent-hover"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: colors[idx % colors.length] }}
                    />
                    <span className="font-semibold text-xs text-text truncate">
                      {scen.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartRename(scen)}
                    className="p-1 text-muted hover:text-text rounded"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(scen.id)}
                    className="p-1 text-muted hover:text-crowd-sev rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-3 gap-1 text-[11px] font-mono border-t border-border/50 pt-1.5 text-muted">
                <div>
                  Hold: <strong className="text-text">{scen.config.delay}m</strong>
                </div>
                <div>
                  Peak: <strong className="text-text">{Math.round(scen.summary.scenario_peak)}p</strong>
                </div>
                <div>
                  Extra: <strong className="text-text">{Math.round(scen.summary.total_extra_waiting || 0)}p</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onApplyScenario && onApplyScenario(scen.config)}
                className="w-full py-1 text-[11px] font-medium border border-border bg-surface hover:bg-surface-hover rounded text-text transition-colors"
              >
                Load this scenario
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Overlaid Comparison Chart */}
      {showCompareChart && scenarios.length > 0 && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="text-xs font-semibold text-text">
            Queue Trajectory Overlay across Saved Scenarios
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis dataKey="minute" {...RECHARTS_THEME.axis} />
                <YAxis {...RECHARTS_THEME.axis} tickFormatter={(v) => `${Math.round(v)}p`} />
                <Tooltip content={<CustomTooltip unit="passengers" />} />
                {scenarios.map((scen, idx) => (
                  <Line
                    key={scen.id}
                    type="monotone"
                    dataKey={scen.name}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 2.5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
