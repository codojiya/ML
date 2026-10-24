import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { STATIONS } from '../constants/stations';
import { CrowdBadge } from '../components/common/CrowdBadge';
import {
  Database,
  Download,
  Filter,
  ArrowUpDown,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Info,
  SlidersHorizontal,
  X,
  RefreshCw
} from 'lucide-react';

export function DataExplorerPage() {
  // Query filters
  const [stationId, setStationId] = useState('');
  const [direction, setDirection] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hourFrom, setHourFrom] = useState('');
  const [hourTo, setHourTo] = useState('');
  const [weather, setWeather] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [density, setDensity] = useState('normal'); // 'normal' | 'compact'

  // Data states
  const [recordsData, setRecordsData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [generatorExplainerOpen, setGeneratorExplainerOpen] = useState(false);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    timestamp: true,
    station: true,
    direction: true,
    arrivals: true,
    waiting: true,
    onboard: true,
    crowdIndex: true,
    category: true,
    weather: true,
    event: false
  });
  const [colMenuOpen, setColMenuOpen] = useState(false);

  // Load summary on mount
  useEffect(() => {
    api.getDatasetSummary().then(setSummaryData).catch(() => {});
  }, []);

  // Fetch paginated records
  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDatasetRecords({
        page,
        page_size: pageSize,
        station_id: stationId || undefined,
        direction: direction || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        hour_from: hourFrom !== '' ? parseInt(hourFrom, 10) : undefined,
        hour_to: hourTo !== '' ? parseInt(hourTo, 10) : undefined,
        weather: weather || undefined,
        category: category || undefined,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setRecordsData(res);
    } catch (err) {
      setError(err.message || 'Failed to retrieve dataset records');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, stationId, direction, dateFrom, dateTo, hourFrom, hourTo, weather, category, sortBy, sortOrder]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Handle column sort toggle
  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  const handleExportCsv = () => {
    const url = api.getDatasetExportUrl({
      station_id: stationId || undefined,
      direction: direction || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      hour_from: hourFrom !== '' ? parseInt(hourFrom, 10) : undefined,
      hour_to: hourTo !== '' ? parseInt(hourTo, 10) : undefined,
      weather: weather || undefined,
      category: category || undefined
    });
    window.open(url, '_blank');
  };

  const resetFilters = () => {
    setStationId('');
    setDirection('');
    setDateFrom('');
    setDateTo('');
    setHourFrom('');
    setHourTo('');
    setWeather('');
    setCategory('');
    setPage(1);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text">
              Dataset Explorer
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface border border-border text-muted">
              {summaryData?.total_rows?.toLocaleString() || '134,640'} Rows
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Server-side paginated queries, filterable dimensions, and CSV streaming export.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setGeneratorExplainerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border bg-surface hover:bg-surface-hover rounded text-text transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-accent" />
            <span>Generation Methodology</span>
          </button>
          <button
            type="button"
            onClick={() => setDictionaryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border bg-surface hover:bg-surface-hover rounded text-text transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            <span>Data Dictionary</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent text-white hover:bg-accent-hover rounded shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Panel */}
      <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text">
            <Filter className="w-3.5 h-3.5 text-accent" />
            <span>Filter Query Dimensions</span>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-accent hover:underline font-medium"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Station */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Station</label>
            <select
              value={stationId}
              onChange={e => { setStationId(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 bg-surface border border-border rounded text-xs text-text"
            >
              <option value="">All 11 Stations</option>
              {STATIONS.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
          </div>

          {/* Direction */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Direction</label>
            <select
              value={direction}
              onChange={e => { setDirection(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 bg-surface border border-border rounded text-xs text-text"
            >
              <option value="">Both Directions</option>
              <option value="southbound">Southbound</option>
              <option value="northbound">Northbound</option>
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Crowd Level</label>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 bg-surface border border-border rounded text-xs text-text"
            >
              <option value="">All Categories</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
              <option value="Severe">Severe</option>
            </select>
          </div>

          {/* Weather */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Weather</label>
            <select
              value={weather}
              onChange={e => { setWeather(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 bg-surface border border-border rounded text-xs text-text"
            >
              <option value="">All Weather</option>
              <option value="Normal">Normal</option>
              <option value="Moderate">Moderate Rain</option>
              <option value="Heavy">Heavy Rain</option>
            </select>
          </div>

          {/* Hour From */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Hour Range</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="6"
                max="22"
                placeholder="6"
                value={hourFrom}
                onChange={e => { setHourFrom(e.target.value); setPage(1); }}
                className="w-full px-1.5 py-1 bg-surface border border-border rounded text-xs text-text font-mono"
              />
              <span className="text-muted text-xs">-</span>
              <input
                type="number"
                min="6"
                max="22"
                placeholder="22"
                value={hourTo}
                onChange={e => { setHourTo(e.target.value); setPage(1); }}
                className="w-full px-1.5 py-1 bg-surface border border-border rounded text-xs text-text font-mono"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-1">
            <label className="text-2xs uppercase tracking-wider text-muted font-medium">Date From</label>
            <input
              type="date"
              min="2026-06-01"
              max="2026-08-29"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-1.5 py-1 bg-surface border border-border rounded text-xs text-text font-mono"
            />
          </div>
        </div>
      </div>

      {/* Table Controls (Columns, Density, Count) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="text-muted font-mono">
          Showing <strong className="text-text">{recordsData?.records?.length || 0}</strong> of <strong className="text-text">{recordsData?.total?.toLocaleString() || 0}</strong> records
        </div>

        <div className="flex items-center gap-2">
          {/* Density Toggle */}
          <div className="flex items-center border border-border rounded overflow-hidden text-2xs">
            <button
              type="button"
              onClick={() => setDensity('normal')}
              className={`px-2 py-1 ${density === 'normal' ? 'bg-surface font-semibold text-text' : 'bg-surface-subtle text-muted'}`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2 py-1 ${density === 'compact' ? 'bg-surface font-semibold text-text' : 'bg-surface-subtle text-muted'}`}
            >
              Compact
            </button>
          </div>

          {/* Column Visibility Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setColMenuOpen(!colMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 border border-border rounded bg-surface hover:bg-surface-hover text-text"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Columns</span>
            </button>

            {colMenuOpen && (
              <div className="absolute right-0 top-8 z-30 w-44 bg-surface border border-border rounded shadow-lg p-2 space-y-1">
                {Object.keys(visibleColumns).map(key => (
                  <label key={key} className="flex items-center gap-2 text-xs text-text cursor-pointer hover:bg-surface-subtle p-1 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key]}
                      onChange={e => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded accent-accent"
                    />
                    <span className="capitalize">{key}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Paginated Data Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[560px] relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-surface-subtle border-b border-border shadow-xs">
              <tr className="text-muted text-[11px] font-mono uppercase tracking-wider">
                {visibleColumns.timestamp && (
                  <th onClick={() => handleSort('timestamp')} className="py-2.5 px-3 font-medium cursor-pointer hover:text-text">
                    <div className="flex items-center gap-1">
                      <span>Timestamp</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.station && (
                  <th onClick={() => handleSort('station_id')} className="py-2.5 px-3 font-medium cursor-pointer hover:text-text">
                    <div className="flex items-center gap-1">
                      <span>Station</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.direction && (
                  <th className="py-2.5 px-3 font-medium">Direction</th>
                )}
                {visibleColumns.arrivals && (
                  <th onClick={() => handleSort('simulated_passenger_arrivals')} className="py-2.5 px-3 font-medium cursor-pointer hover:text-text">
                    <div className="flex items-center gap-1">
                      <span>Arrivals</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.waiting && (
                  <th onClick={() => handleSort('waiting_passengers')} className="py-2.5 px-3 font-medium cursor-pointer hover:text-text">
                    <div className="flex items-center gap-1">
                      <span>Waiting</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.onboard && (
                  <th className="py-2.5 px-3 font-medium">Onboard Load</th>
                )}
                {visibleColumns.crowdIndex && (
                  <th onClick={() => handleSort('estimated_crowd_index')} className="py-2.5 px-3 font-medium cursor-pointer hover:text-text">
                    <div className="flex items-center gap-1">
                      <span>Crowd Index</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.category && (
                  <th className="py-2.5 px-3 font-medium">Category</th>
                )}
                {visibleColumns.weather && (
                  <th className="py-2.5 px-3 font-medium">Weather</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted font-mono">
                    Querying synthetic transit records...
                  </td>
                </tr>
              ) : recordsData?.records?.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted font-mono">
                    No matching records found for given filters.
                  </td>
                </tr>
              ) : (
                recordsData?.records?.map((r, idx) => {
                  const pad = density === 'compact' ? 'py-1 px-3' : 'py-2 px-3';
                  return (
                    <tr key={idx} className="hover:bg-surface-subtle transition-colors">
                      {visibleColumns.timestamp && (
                        <td className={`${pad} font-mono text-muted tabular-nums whitespace-nowrap`}>
                          {r.timestamp.slice(0, 10)} {r.timestamp.slice(11, 16)}
                        </td>
                      )}
                      {visibleColumns.station && (
                        <td className={`${pad} font-semibold text-text whitespace-nowrap`}>
                          {r.station_name} <span className="font-mono text-muted text-2xs">({r.station_id})</span>
                        </td>
                      )}
                      {visibleColumns.direction && (
                        <td className={`${pad} text-muted font-mono capitalize`}>
                          {r.direction === 'southbound' ? 'SB' : 'NB'}
                        </td>
                      )}
                      {visibleColumns.arrivals && (
                        <td className={`${pad} font-mono tabular-nums text-text font-medium`}>
                          {r.simulated_passenger_arrivals}
                        </td>
                      )}
                      {visibleColumns.waiting && (
                        <td className={`${pad} font-mono tabular-nums text-text font-bold`}>
                          {Math.round(r.waiting_passengers)}p
                        </td>
                      )}
                      {visibleColumns.onboard && (
                        <td className={`${pad} font-mono tabular-nums text-muted`}>
                          {Math.round(r.onboard_train_load)}
                        </td>
                      )}
                      {visibleColumns.crowdIndex && (
                        <td className={`${pad} font-mono tabular-nums text-text`}>
                          {r.estimated_crowd_index.toFixed(3)}
                        </td>
                      )}
                      {visibleColumns.category && (
                        <td className={`${pad}`}>
                          <CrowdBadge category={r.crowd_category} size="xs" />
                        </td>
                      )}
                      {visibleColumns.weather && (
                        <td className={`${pad} text-muted font-mono`}>
                          {r.rainfall_mm > 0 ? `${r.rainfall_mm}mm (${r.weather_category})` : 'Normal'}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-border bg-surface-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted">Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
              className="px-2 py-1 bg-surface border border-border rounded text-xs text-text font-mono"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted font-mono">
              Page {recordsData?.page || 1} of {recordsData?.total_pages || 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="p-1 border border-border rounded bg-surface hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed text-text"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(prev => Math.min(recordsData?.total_pages || 1, prev + 1))}
                disabled={page >= (recordsData?.total_pages || 1)}
                className="p-1 border border-border rounded bg-surface hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed text-text"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Dictionary Drawer */}
      {dictionaryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex justify-end animate-in fade-in duration-100"
          onClick={() => setDictionaryOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-surface h-full border-l border-border p-5 space-y-4 overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <h2 className="text-base font-bold text-text">Dataset Schema & Dictionary</h2>
              </div>
              <button type="button" onClick={() => setDictionaryOpen(false)} className="text-muted hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {(summaryData?.columns || []).map(col => (
                <div key={col.name} className="p-2.5 rounded border border-border bg-surface-subtle space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-text">{col.name}</span>
                    <span className="font-mono text-[10px] text-muted bg-surface px-1.5 py-0.2 rounded border border-border">
                      {col.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{col.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generation Explainer Modal */}
      {generatorExplainerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 select-none"
          onClick={() => setGeneratorExplainerOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-surface border border-border rounded-lg p-5 space-y-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2 font-bold text-sm text-text">
                <Info className="w-4 h-4 text-accent" />
                <span>Synthetic Generator Methodology</span>
              </div>
              <button type="button" onClick={() => setGeneratorExplainerOpen(false)} className="text-muted hover:text-text">
                ✕
              </button>
            </div>

            <div className="text-xs text-text space-y-2 leading-relaxed font-sans">
              <p>
                <strong>Diurnal Bimodal Distribution: </strong>Arrivals follow Gaussian mixtures centered at morning peak (08:45, σ=1.5h) and evening peak (18:30, σ=1.75h), weighted by station residential vs commercial catchment shares.
              </p>
              <p>
                <strong>Precipitation Impact: </strong>Rainfall modulates arrival rate via empirical piecewise factor: light rain (≤10mm) slightly increases road-to-rail diversion (+1%/mm), whereas torrential rain (&gt;10mm) depresses discretionary travel (-1.2%/mm).
              </p>
              <p>
                <strong>Poisson Noise: </strong>Arrivals are drawn from a Poisson process with arrival rate λ(t), using seed-reproducible inverse CDF sampling with common random numbers.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setGeneratorExplainerOpen(false)}
                className="px-3 py-1.5 bg-accent text-white rounded text-xs font-semibold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
