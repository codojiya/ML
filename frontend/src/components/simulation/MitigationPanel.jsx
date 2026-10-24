import React, { useState } from 'react';
import {
  ShieldAlert,
  Train,
  SlidersHorizontal,
  Navigation,
  Send,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  Radio,
  Layers,
  Sparkles
} from 'lucide-react';

export function MitigationPanel({
  mitigationData = null,
  activeMitigation = 'none',
  onSelectMitigation,
  onResetMitigation,
  loading = false
}) {
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [activePlanTab, setActivePlanTab] = useState('relief_rake');

  if (!mitigationData) {
    return (
      <div className="bg-surface border border-border rounded-lg p-5 text-center text-xs text-muted">
        <SlidersHorizontal className="w-6 h-6 mx-auto mb-2 text-muted/60" />
        <span>Configure a train hold delay in the Scenario Parameters to generate prescriptive AI mitigation plans.</span>
      </div>
    );
  }

  const {
    station_name,
    unmitigated_peak,
    baseline_peak,
    unmitigated_density,
    unmitigated_los,
    stampede_risk,
    plans = [],
    multi_modal_advisory = []
  } = mitigationData;

  const handleSendBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 4000);
  };

  const currentPlan = plans.find(p => p.id === activePlanTab) || plans[0];

  return (
    <div className="bg-surface border border-accent/30 rounded-lg p-4 md:p-5 space-y-5 shadow-xs">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                AI Incident Dispatcher & Mitigation Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                Prescriptive Control
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Automated operations research recommendations to prevent platform crush and recover corridor throughput.
            </p>
          </div>
        </div>

        {activeMitigation !== 'none' && (
          <button
            type="button"
            onClick={onResetMitigation}
            className="text-2xs font-mono text-muted hover:text-text border border-border px-2 py-1 rounded bg-surface hover:bg-surface-hover transition-colors"
          >
            Reset to Unmitigated
          </button>
        )}
      </div>

      {/* Stampede Risk & Density Assessment Banner */}
      <div className={`p-3.5 rounded-lg border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        stampede_risk
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
      }`}>
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-crowd-sev" />
          <div>
            <div className="font-bold flex items-center gap-2">
              <span>Fruin Pedestrian Platform Safety Index:</span>
              <span className="font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-surface border border-border/40">
                {unmitigated_los}
              </span>
            </div>
            <p className="text-[11px] opacity-90 mt-0.5">
              Unmitigated surge reaches <strong>{unmitigated_peak} commuters</strong> ({unmitigated_density} persons/m² usable platform space).
              {stampede_risk
                ? ' Warning: Density exceeds 2.5 p/m² safety threshold. Immediate dispatch intervention required to avert Foot Overbridge bottleneck.'
                : ' Elevated crowding requires scheduled headway recovery.'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 font-mono text-xs">
          <div className="text-[10px] uppercase text-muted">Baseline vs Incident Peak</div>
          <div className="font-bold">{baseline_peak}p → <span className="text-crowd-sev">{unmitigated_peak}p</span> (+{Math.round(unmitigated_peak - baseline_peak)}p)</div>
        </div>
      </div>

      {/* Plan Selection Tabs */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
          <Train className="w-3.5 h-3.5 text-accent" />
          <span>Select Tactical Mitigation Strategy:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {plans.map((plan) => {
            const isSelected = activePlanTab === plan.id;
            const isDeployed = activeMitigation === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setActivePlanTab(plan.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-surface hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-2xs font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-surface border border-border text-text">
                    {plan.badge}
                  </span>
                  {isDeployed && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Deployed
                    </span>
                  )}
                </div>

                <div className="font-bold text-xs text-text">{plan.name}</div>
                <div className="text-[11px] text-muted line-clamp-2 mt-1 mb-2">
                  {plan.description}
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Crowd Relieved:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    -{plan.waiting_relieved}p ({plan.recovery_pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Plan Detail & 1-Click Deployment */}
      {currentPlan && (
        <div className="p-4 rounded-lg border border-accent/30 bg-surface-subtle space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
            <div>
              <div className="text-xs font-bold text-text flex items-center gap-2">
                <span>{currentPlan.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent text-white font-semibold">
                  {currentPlan.badge}
                </span>
              </div>
              <p className="text-[11px] text-muted mt-0.5">{currentPlan.description}</p>
            </div>

            <button
              type="button"
              disabled={loading || activeMitigation === currentPlan.id}
              onClick={() => onSelectMitigation(currentPlan.id)}
              className={`px-3.5 py-2 rounded-md text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                activeMitigation === currentPlan.id
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-accent hover:bg-accent-hover text-white cursor-pointer hover:shadow-sm'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {loading
                  ? 'Simulating Recovery...'
                  : activeMitigation === currentPlan.id
                  ? 'Plan Currently Active'
                  : 'Deploy Plan & Re-Simulate'}
              </span>
            </button>
          </div>

          {/* Action Checklist & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5 bg-surface border border-border p-2.5 rounded">
              <span className="text-2xs font-bold uppercase text-muted tracking-wider">
                Operational Dispatch Action Steps
              </span>
              <ul className="space-y-1 text-[11px] text-text">
                {currentPlan.action_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <ArrowRight className="w-3 h-3 shrink-0 text-accent mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 bg-surface border border-border p-2.5 rounded">
              <span className="text-2xs font-bold uppercase text-muted tracking-wider">
                Projected Impact on {station_name} Platform
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-surface-subtle border border-border">
                  <div className="text-[10px] text-muted">Mitigated Peak</div>
                  <div className="text-sm font-bold text-accent">{currentPlan.peak_waiting}p</div>
                  <div className="text-[9px] text-muted">vs {unmitigated_peak}p unmitigated</div>
                </div>

                <div className="p-2 rounded bg-surface-subtle border border-border">
                  <div className="text-[10px] text-muted">Platform Density</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {currentPlan.density_sqm} p/m²
                  </div>
                  <div className="text-[9px] text-muted">{currentPlan.los}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Modal Metro Re-routing & Citizen Broadcast Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-border">
        {/* Metro Multi-modal integration */}
        <div className="p-3 rounded-lg border border-border bg-surface space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text">
            <Navigation className="w-3.5 h-3.5 text-accent" />
            <span>Multi-Modal Metro Commuter Diversion</span>
          </div>

          <div className="space-y-1.5 text-xs">
            {multi_modal_advisory.map((adv, idx) => (
              <div key={idx} className="p-2 rounded bg-surface-subtle border border-border/60 text-[11px]">
                <div className="font-bold text-accent">{adv.line}</div>
                <div className="text-muted text-[10px]">{adv.transfer_station} · {adv.capacity_available}</div>
                <div className="text-text mt-1">{adv.recommendation}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Passenger Alert Broadcast Simulator */}
        <div className="p-3 rounded-lg border border-border bg-surface space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-text">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-crowd-sev" />
                <span>Commuter Push Advisory Simulator</span>
              </div>
              <span className="text-[10px] font-mono font-normal text-muted">2.4M Commuters</span>
            </div>

            <div className="mt-2 p-2.5 rounded bg-surface-subtle border border-border font-mono text-[11px] text-text space-y-1">
              <div className="font-bold text-accent">[Western Railway Passenger Alert]</div>
              <div>
                Platform congestion alert at {station_name}. A 20-min headway delay is active.
                {activeMitigation === 'relief_rake'
                  ? ' Standby relief rake R-104 is entering service. Avoid Platform 1 FOB crush.'
                  : ' Commuters are advised to divert to Metro Line 1 / 7 concourse.'}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {broadcastSent ? (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Broadcast dispatched to UTS & Telegram channels!
              </span>
            ) : (
              <span className="text-[10px] text-muted font-mono">Ready to broadcast advisory</span>
            )}

            <button
              type="button"
              onClick={handleSendBroadcast}
              className="px-3 py-1.5 rounded border border-accent bg-accent/10 hover:bg-accent/20 text-accent font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Test Broadcast</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
