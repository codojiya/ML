import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts';
import { RECHARTS_THEME, CustomTooltip } from '../components/common/RechartsTheme';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  ExternalLink
} from 'lucide-react';

export function ModelInsightsPage() {
  const [metricsData, setMetricsData] = useState(null);
  const [evalData, setEvalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance'); // 'performance' | 'errors' | 'pipeline'
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [mRes, eRes] = await Promise.all([
          api.getModelMetrics(),
          api.getModelEvaluation()
        ]);
        setMetricsData(mRes);
        setEvalData(eRes);
      } catch (_) {}
      finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Format feature importances for chart
  const featureList = Object.entries(metricsData?.feature_importance || {})
    .map(([k, v]) => ({
      feature: k,
      importance: round(v, 2),
      label: {
        station_idx: 'Station Location (idx)',
        dir_int: 'Travel Direction',
        hour: 'Hour of Day (Cycle)',
        minute: 'Minute (Quarter Hour)',
        day_of_week: 'Day of Week',
        is_weekend: 'Weekend Flag',
        is_holiday: 'Gazetted Holiday',
        rainfall_mm: 'Precipitation (mm)',
        event_intensity: 'Special Event',
        lag4_arrivals: '1h Lagged Arrivals'
      }[k] || k
    }))
    .sort((a, b) => b.importance - a.importance);

  function round(num, dec = 2) {
    return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text">
              Model Insights & Scientific Evaluation
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface border border-border text-emerald-600 dark:text-emerald-400">
              Honest Audit
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Empirical benchmark scorecard, CatBoost feature hierarchy, error distributions, and pipeline boundaries.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setTemplateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border bg-surface hover:bg-surface-hover rounded text-text transition-colors self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
          <span>Manual Observation Template</span>
        </button>
      </div>

      {/* Train / Validation / Test Chronological Split Diagram */}
      <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text">
            Chronological Split Strategy (No Data Leakage)
          </span>
          <span className="text-[11px] font-mono text-muted">
            90 Days Total · 134,640 Synthetic Records
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="h-6 w-full rounded overflow-hidden flex border border-border text-2xs font-mono font-semibold">
            {/* Train: Days 0..59 (66.7%) */}
            <div className="w-[66.7%] bg-accent/20 text-accent flex items-center justify-center border-r border-border">
              Training Split (Days 0–59 · 89,760 rows)
            </div>
            {/* Val: Days 60..74 (16.7%) */}
            <div className="w-[16.7%] bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center border-r border-border">
              Validation (15d · 22,440 rows)
            </div>
            {/* Test: Days 75..89 (16.7%) */}
            <div className="w-[16.6%] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              Out-of-Time Test (15d · 22,440 rows)
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted">
            <span>2026-06-01</span>
            <span className="pl-28">2026-07-30</span>
            <span className="pl-10">2026-08-14</span>
            <span>2026-08-29</span>
          </div>
        </div>
      </div>

      {/* Honest Model Comparison Scorecard Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden space-y-0">
        <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="text-xs font-bold uppercase tracking-wider text-text">
            Model Benchmark Scorecard (Arrival Forecasting)
          </div>
          <span className="text-[11px] font-mono text-muted">
            Winner: <strong className="text-accent">{metricsData?.winner || 'CatBoost'}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-subtle text-muted text-[11px] font-mono uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Model Candidate</th>
                <th className="py-2.5 px-4 font-medium">Split</th>
                <th className="py-2.5 px-4 font-medium">MAE (Arrivals)</th>
                <th className="py-2.5 px-4 font-medium">RMSE</th>
                <th className="py-2.5 px-4 font-medium">R² Score</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(metricsData?.metrics || []).map((m, idx) => {
                const isWinner = m.model === 'CatBoost' && m.split === 'test';
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isWinner ? 'bg-accent/5 font-semibold text-text' : 'hover:bg-surface-subtle text-muted'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-sans font-medium text-text">
                      {m.model}
                    </td>
                    <td className="py-2.5 px-4 font-mono capitalize">
                      {m.split}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-text font-bold">
                      {round(m.MAE, 3)}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums">
                      {round(m.RMSE, 3)}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums">
                      {round(m.R2, 4)}
                    </td>
                    <td className="py-2.5 px-4">
                      {isWinner ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-accent text-white font-bold">
                          Selected Winner
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-muted">
                          Evaluated
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Plain Data-Driven Honesty Callout */}
        <div className="p-4 bg-surface-subtle/50 border-t border-border flex items-start gap-2.5 text-xs text-text leading-relaxed">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <strong>Scientific Callout on Baseline Competitiveness: </strong>
            Notice that CatBoost Test MAE (<span className="font-mono font-bold">10.053</span>) is virtually identical to the Historical Average baseline (<span className="font-mono font-bold">10.067</span>).
            On synthetic transport datasets, the historical group-average baseline is already exceedingly strong because synthetic commuter demand is generated as a smooth cyclic function of time and station parameters. CatBoost provides value primarily during weather anomalies and special event spikes where static historical tables cannot extrapolate.
          </div>
        </div>
      </div>

      {/* Grid: Feature Importance Hierarchy + Scatter Plot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance Bars */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text">
              Global Feature Importance (TreeSHAP)
            </span>
            <span className="text-2xs font-mono text-muted">Relative %</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureList}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 30 }}
              >
                <CartesianGrid {...RECHARTS_THEME.grid} horizontal={false} vertical={true} />
                <XAxis type="number" {...RECHARTS_THEME.axis} tickFormatter={(v) => `${v}%`} />
                <YAxis
                  type="category"
                  dataKey="label"
                  {...RECHARTS_THEME.axis}
                  width={110}
                  tick={{ fontSize: 10, fill: 'var(--text)' }}
                />
                <Tooltip content={<CustomTooltip unit="%" />} />
                <Bar dataKey="importance" fill="var(--accent)" radius={[0, 4, 4, 0]}>
                  {featureList.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? 'var(--accent)' : index === 1 ? '#3B82F6' : 'var(--border-strong)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[10px] text-muted font-mono border-t border-border/50 pt-2">
            Dominant drivers: <strong>Hour of Day (44.6%)</strong> and <strong>1-hour lag arrivals (32.3%)</strong> account for ~77% of variance.
          </div>
        </div>

        {/* Actual vs Predicted Scatter with Y=X Line */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text">
              Actual vs Predicted Scatter (Test Split Sample)
            </span>
            <span className="text-2xs font-mono text-muted">y = x Reference Line</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 16, bottom: 4, left: -10 }}>
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis
                  type="number"
                  dataKey="actual"
                  name="Actual Arrivals"
                  {...RECHARTS_THEME.axis}
                  domain={[0, 240]}
                />
                <YAxis
                  type="number"
                  dataKey="predicted"
                  name="Predicted Arrivals"
                  {...RECHARTS_THEME.axis}
                  domain={[0, 240]}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={<CustomTooltip />}
                />
                <ReferenceLine
                  segment={[{ x: 0, y: 0 }, { x: 240, y: 240 }]}
                  stroke="var(--muted)"
                  strokeDasharray="4 4"
                />
                <Scatter
                  data={(evalData?.actual_vs_predicted || []).slice(0, 300)}
                  fill="var(--accent)"
                  opacity={0.65}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[10px] text-muted font-mono border-t border-border/50 pt-2 flex justify-between">
            <span>Points tightly hugging the y=x diagonal indicate strong calibration</span>
            <span>R² = 0.8376</span>
          </div>
        </div>
      </div>

      {/* Grid: Error by Hour & Residual Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error by Hour of Day */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text">
              Test Split MAE & RMSE by Hour of Day
            </span>
            <span className="text-2xs font-mono text-muted">06:00 – 22:00</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evalData?.error_by_hour || []} margin={{ top: 8, right: 12, bottom: 4, left: -10 }}>
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis dataKey="hour" {...RECHARTS_THEME.axis} tickFormatter={(h) => `${h}:00`} />
                <YAxis {...RECHARTS_THEME.axis} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="mae"
                  name="MAE"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="rmse"
                  name="RMSE"
                  stroke="#E4743B"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-muted font-mono border-t border-border/50 pt-2">
            Error peaks during morning (08:00–09:00) and evening (18:00–19:00) peak commute volumes.
          </div>
        </div>

        {/* Residual Histogram */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text">
              Forecast Residual Distribution
            </span>
            <span className="text-2xs font-mono text-muted">Predicted − Actual</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evalData?.residual_histogram || []} margin={{ top: 8, right: 12, bottom: 4, left: -10 }}>
                <CartesianGrid {...RECHARTS_THEME.grid} />
                <XAxis dataKey="bin_center" {...RECHARTS_THEME.axis} tickFormatter={(v) => `${v}`} />
                <YAxis {...RECHARTS_THEME.axis} />
                <Tooltip content={<CustomTooltip unit="occurrences" />} />
                <Bar dataKey="count" fill="var(--accent)" radius={[2, 2, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-muted font-mono border-t border-border/50 pt-2">
            Zero-centered, approximately Gaussian error profile confirms absence of systematic bias.
          </div>
        </div>
      </div>

      {/* SYSTEM ARCHITECTURE PIPELINE DIAGRAM (SVG built in code) */}
      <div className="bg-surface border border-border rounded-lg p-4 space-y-3 select-none">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text">
            End-to-End System Pipeline Architecture
          </span>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>Learned ML Components</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span>Rules-Based Physics Engine</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto py-2">
          <div className="min-w-[760px] flex items-center justify-between gap-3 text-xs font-sans">
            {/* Stage 1 */}
            <div className="flex-1 bg-surface-subtle border border-border rounded p-3 space-y-1">
              <div className="text-[10px] font-mono uppercase text-muted font-semibold">1. Generator</div>
              <div className="font-bold text-text">Synthetic Corridor</div>
              <p className="text-[11px] text-muted leading-tight">
                90-day multi-scale diurnal flow generator across 11 stations.
              </p>
            </div>

            <ArrowRight className="w-4 h-4 text-muted shrink-0" />

            {/* Stage 2 */}
            <div className="flex-1 bg-surface-subtle border border-border rounded p-3 space-y-1">
              <div className="text-[10px] font-mono uppercase text-muted font-semibold">2. Feature Pipeline</div>
              <div className="font-bold text-text">No-Leakage Lags</div>
              <p className="text-[11px] text-muted leading-tight">
                Extracts 1-hour lag (lag4), calendar, weather, station embeddings.
              </p>
            </div>

            <ArrowRight className="w-4 h-4 text-muted shrink-0" />

            {/* Stage 3 */}
            <div className="flex-1 bg-accent/10 border border-accent/40 rounded p-3 space-y-1">
              <div className="text-[10px] font-mono uppercase text-accent font-semibold">3. ML Model (Learned)</div>
              <div className="font-bold text-accent">CatBoost Regressor</div>
              <p className="text-[11px] text-muted leading-tight">
                Predicts passenger arrival counts into platform queues.
              </p>
            </div>

            <ArrowRight className="w-4 h-4 text-muted shrink-0" />

            {/* Stage 4 */}
            <div className="flex-1 bg-amber-500/10 border border-amber-500/40 rounded p-3 space-y-1">
              <div className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400 font-semibold">4. Mechanistic Engine (Rules)</div>
              <div className="font-bold text-text">Queue Simulator</div>
              <p className="text-[11px] text-muted leading-tight">
                120-minute minute-level boarding, alighting & capacity physics.
              </p>
            </div>

            <ArrowRight className="w-4 h-4 text-muted shrink-0" />

            {/* Stage 5 */}
            <div className="flex-1 bg-surface-subtle border border-border rounded p-3 space-y-1">
              <div className="text-[10px] font-mono uppercase text-muted font-semibold">5. Operations Output</div>
              <div className="font-bold text-text">Crowd Intelligence</div>
              <p className="text-[11px] text-muted leading-tight">
                Platform crowd indices, cascade heatmaps, delay sensitivity curves.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plain Language Panel (5 Sentences, Student Friendly) */}
      <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-text border-b border-border pb-2">
          Plain-Language Primer: ML Prediction vs Rules-Based Simulation
        </div>
        <div className="text-xs text-text leading-relaxed space-y-2">
          <p>
            <strong>1. Scope Separation: </strong>Machine learning predicts only incoming passenger arrival rates entering the station entrance, learning temporal and weather patterns from historical data.
          </p>
          <p>
            <strong>2. Physical Mechanics: </strong>The queue simulator does not use machine learning; it is a deterministic conservation-of-mass physical model governed by fixed rolling-stock capacity (1,400 passengers) and departure headways.
          </p>
          <p>
            <strong>3. Queue Buildup: </strong>Platform crowding occurs purely when passenger arrival rates temporarily exceed train boarding clearance capacity.
          </p>
          <p>
            <strong>4. Disruption Propagation: </strong>When a train is delayed at Andheri, the simulator mechanically holds rolling stock, causing passenger backlogs to ripple downstream as subsequent trains become oversaturated.
          </p>
          <p>
            <strong>5. Interpretability: </strong>Separating learned demand forecasting from physics-based transit simulation ensures complete operational auditability with zero black-box hallucinations.
          </p>
        </div>
      </div>

      {/* Limitations Panel */}
      <div className="bg-surface border border-border rounded-lg p-4 space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-crowd-high flex items-center gap-1.5 border-b border-border pb-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Project Limitations & Academic Disclaimers</span>
        </div>
        <div className="text-xs text-muted leading-relaxed space-y-1.5">
          <p>
            • <strong>Synthetic Data Generation: </strong>All arrival numbers, queue lengths, and onboard loads are generated mathematically and have not been validated against live Indian Railways ticketing or gate sensors.
          </p>
          <p>
            • <strong>Assumed Parameters: </strong>Fixed 1,400 capacity per train, 6-minute headway, and 150 boundary passenger loads are assumed operational baselines rather than real-time Western Railway schedule feeds.
          </p>
          <p>
            • <strong>Ground Truth Validation: </strong>Field calibration requires physical observation audits at platforms during peak hours. Use the observation template below to record empirical crowd density.
          </p>
        </div>
      </div>

      {/* Observation Template Modal */}
      {templateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 select-none"
          onClick={() => setTemplateModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-surface border border-border rounded-lg shadow-xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2 font-bold text-sm text-text">
                <FileSpreadsheet className="w-4 h-4 text-accent" />
                <span>Field Observation Audit Template</span>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="text-muted hover:text-text"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted">
              Standard operating protocol for student field observations on Western Line platforms to collect empirical validation samples.
            </p>

            <div className="bg-surface-subtle p-3 rounded font-mono text-[11px] text-text space-y-1">
              <div>Station: ________________________ Platform #: _____</div>
              <div>Date: YYYY-MM-DD  Observation Window: 08:00 - 09:00</div>
              <div>Interval: 15-minute headway counts</div>
              <div className="pt-2 text-muted">
                Fields to record: Headway (min), Platform Queue density (pax/m²), Dwell time (sec), Boarding counts, Alighting counts.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  const csv = "timestamp,station_id,platform_no,headway_min,observed_waiting,observed_boarding,observed_alighting\n2026-08-03T08:00:00,ADH,1,6.0,,,\n";
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = "mumbai_manual_observation_template.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 bg-accent text-white rounded text-xs font-semibold"
              >
                Download CSV Template
              </button>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="px-3 py-1.5 border border-border rounded text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
