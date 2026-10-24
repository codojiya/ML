import React from 'react';
import { FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export function OperatorBriefing({
  stationName = 'Andheri',
  stationId = 'ADH',
  delayMin = 20,
  startTime = '08:00',
  simResult = null,
  className = ''
}) {
  if (!simResult) return null;

  const summary = simResult.summary || {};
  const stations = simResult.stations || [];
  const targetStation = stations.find(s => s.station_id === stationId) || stations[0] || {};

  const basePeak = Math.round(targetStation.baseline_peak || 0);
  const scPeak = Math.round(targetStation.scenario_peak || 0);
  const delta = Math.round(scPeak - basePeak);

  // Compute peak clock time
  const [hStr, mStr] = startTime.split(':');
  const startHour = parseInt(hStr || '8', 10);
  const startMin = parseInt(mStr || '0', 10);
  const peakMinOffset = targetStation.scenario_peak_minute || summary.peak_minute || 0;
  
  const peakDate = new Date();
  peakDate.setHours(startHour, startMin + peakMinOffset, 0, 0);
  const peakTimeFormatted = `${String(peakDate.getHours()).padStart(2, '0')}:${String(peakDate.getMinutes()).padStart(2, '0')}`;

  const affectedCount = simResult.affected_stations || 0;
  const totalExtra = Math.round(summary.total_extra_waiting || 0);
  const maxElevated = Math.max(...Object.values(summary.minutes_elevated_by_station || { [stationId]: 0 }));
  const violations = simResult.capacity_violations || 0;
  const residual = (simResult.conservation_residual?.scenario ?? 0).toFixed(4);

  return (
    <div className={`bg-surface border border-border rounded-lg p-4 space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text">
          <FileText className="w-3.5 h-3.5 text-accent" />
          <span>Operator Intelligence Briefing</span>
        </div>
        <span className="text-[10px] font-mono text-muted bg-surface-subtle border border-border px-1.5 py-0.5 rounded">
          Deterministic Narrative
        </span>
      </div>

      <div className="text-xs text-text leading-relaxed space-y-1.5 font-sans">
        <p>
          <strong className="text-text font-semibold">1. Incident Impact: </strong>
          {delayMin > 0 ? (
            <>
              A <span className="font-mono font-bold text-accent">{delayMin}-minute</span> service hold at <strong>{stationName} ({stationId})</strong> raises peak platform waiting from <span className="font-mono">{basePeak}</span> to <span className="font-mono font-bold text-crowd-sev">{scPeak}</span> passengers (Δ +{delta}) at <span className="font-mono font-semibold">{peakTimeFormatted}</span>.
            </>
          ) : (
            <>
              Under undisturbed baseline conditions, platform queue at <strong>{stationName} ({stationId})</strong> peaks at <span className="font-mono font-bold">{basePeak}</span> passengers at <span className="font-mono">{peakTimeFormatted}</span>.
            </>
          )}
        </p>

        <p>
          <strong className="text-text font-semibold">2. Downstream Ripple: </strong>
          Disruption waves propagate across <span className="font-mono font-bold text-text">{affectedCount} stations</span> along the corridor, accumulating <span className="font-mono font-bold text-text">{totalExtra.toLocaleString()} passenger-minutes</span> of excess queue time. Downstream platforms remain elevated for up to <span className="font-mono font-bold text-text">{maxElevated} minutes</span> before scheduled 6-minute headway clears passenger backlog.
        </p>

        <p>
          <strong className="text-text font-semibold">3. Conservation & Safety: </strong>
          Active train operations recorded <span className="font-mono font-bold">{violations}</span> rolling-stock capacity violations (1,400 passengers/train threshold). System mass-conservation residual is verified at <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{residual} passengers</span>.
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-border/50 text-[10px] text-muted font-mono">
        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Validated against minute-level passenger flow simulation model</span>
      </div>
    </div>
  );
}
