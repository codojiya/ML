import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Mic,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const STEPS = [
  {
    title: '1. Corridor Operations & Schematic',
    route: '/',
    action: (ctx) => {
      ctx.setStationId('ADH');
      ctx.setDirection('southbound');
      ctx.setTimeOnly('08:00');
    },
    description:
      'Welcome to Mumbai CrowdPulse: an operations-center control dashboard for the 11-station Western Line corridor from Borivali to Bandra. The primary hero visual is a custom SVG transit schematic with true relative physical spacing, crowd status fills, and passenger queue ring gauges.',
    talkingPoint:
      'Point out the operations-room aesthetic: clean typography, zero decorative gradients or AI slop, and a high-density information architecture inspired by Linear and Swiss transit design.'
  },
  {
    title: '2. Morning Peak Congestion Scrubbing',
    route: '/',
    action: (ctx) => {
      ctx.setTimeOnly('08:45');
    },
    description:
      'Scrubbing forward to 08:45 AM jumps into the morning peak rush. Notice the queue volume rings expanding at Borivali and Andheri, the corridor mean crowd index elevating to peak intensity, and the corridor heatmap strip showing the entire diurnal cycle.',
    talkingPoint:
      'Demonstrate the 15-minute timetable scrubber and show how clicking any cell in the corridor heatmap strip instantly repositions the playhead across the 68 operating slots.'
  },
  {
    title: '3. Station Operations Drilldown',
    route: '/',
    action: (ctx) => {
      ctx.setStationId('ADH');
    },
    description:
      'Selecting Andheri (ADH) reveals the platform queue density, 15-minute passenger arrival rates, onboard passenger load, and the full 24-slot diurnal queue trajectory.',
    talkingPoint:
      'Highlight the linear crowd index meter: designed intentionally without cliché circular donut charts to provide an honest operations gauge.'
  },
  {
    title: '4. Machine Learning Arrivals Forecast',
    route: '/forecast?station=ADH',
    action: (ctx) => {
      ctx.setStationId('ADH');
    },
    description:
      'The Forecast view utilizes a trained CatBoost regressor to forecast platform passenger arrivals across a 15–60 minute horizon. The TreeSHAP attribution panel breaks down the exact statistical factors (hour of day, recent lag, precipitation) using strictly non-causal language.',
    talkingPoint:
      'Emphasize the scientific separation: ML forecasts incoming arrivals only. Queues and crowding are computed by the physics simulator, avoiding ungrounded generative hallucinations.'
  },
  {
    title: '5. Disruption Simulation Lab',
    route: '/simulation?station=ADH&delay=20',
    action: (ctx) => {
      ctx.setStationId('ADH');
      ctx.setTimeOnly('08:00');
    },
    description:
      'The Simulation Lab models rolling-stock operations with 1,400-passenger train capacity and 6-minute headway. A 20-minute hold at Andheri traps passengers on the platform and holds trains, while the animated train layer visualizes rolling stock in real time.',
    talkingPoint:
      'Show the swipe comparison divider: drag it to contrast undisturbed baseline timetable queues against the disrupted scenario with common random numbers.'
  },
  {
    title: '6. Disruption Cascade Heatmap',
    route: '/simulation?station=ADH&delay=20',
    action: (ctx) => {
      ctx.setStationId('ADH');
    },
    description:
      'The Disruption Cascade Heatmap plots excess queue passengers (Scenario − Baseline) across 11 stations × 120 minutes. It captures the downstream ripple propagating towards Bandra and the subsequent recovery phase.',
    talkingPoint:
      'Direct attention to the Delay Sensitivity Curve below: it honestly demonstrates nonlinear capacity saturation as delay extends from 0 to 30 minutes.'
  },
  {
    title: '7. Scientific Honesty & Model Audit',
    route: '/insights',
    action: () => {},
    description:
      'The Model Insights dashboard provides an honest scientific scorecard: CatBoost achieves 10.05 test MAE, matching the historical average baseline. The architectural pipeline diagram clearly delineates learned ML from rules-based physics.',
    talkingPoint:
      'Conclude the viva presentation by emphasizing academic honesty: admitting that CatBoost matches historical tables on smooth synthetic data demonstrates scientific maturity.'
  }
];

export function DemoTour() {
  const {
    demoModeActive,
    setDemoModeActive,
    demoStep,
    setDemoStep,
    setStationId,
    setDirection,
    setTimeOnly
  } = useApp();

  const [showNotes, setShowNotes] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const currentStep = STEPS[demoStep] || STEPS[0];

  useEffect(() => {
    if (!demoModeActive) return;
    const step = STEPS[demoStep];
    if (step) {
      step.action({ setStationId, setDirection, setTimeOnly });
      if (location.pathname !== step.route.split('?')[0]) {
        navigate(step.route);
      }
    }
  }, [demoModeActive, demoStep, navigate]);

  // Esc key to exit demo
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && demoModeActive) {
        setDemoModeActive(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [demoModeActive, setDemoModeActive]);

  if (!demoModeActive) return null;

  const handleNext = () => {
    if (demoStep < STEPS.length - 1) {
      setDemoStep(demoStep + 1);
    } else {
      setDemoModeActive(false);
    }
  };

  const handlePrev = () => {
    if (demoStep > 0) {
      setDemoStep(demoStep - 1);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-4 duration-200 select-none">
      <div className="bg-surface border-2 border-accent rounded-lg shadow-2xl p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-accent/10 text-accent">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="font-bold text-xs text-text uppercase tracking-wider">
              Professor Demo Walkthrough
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className={`p-1 rounded text-xs transition-colors flex items-center gap-1 ${
                showNotes ? 'bg-accent/10 text-accent font-semibold' : 'text-muted hover:text-text'
              }`}
              title="Toggle presenter viva notes"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="text-[10px]">Notes</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoModeActive(false)}
              className="p-1 text-muted hover:text-text rounded"
              title="Exit Demo Mode (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Title & Content */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-accent">
            {currentStep.title}
          </h3>
          <p className="text-xs text-text leading-relaxed font-sans">
            {currentStep.description}
          </p>
        </div>

        {/* Presenter Talking Points */}
        {showNotes && (
          <div className="p-2.5 rounded bg-accent/5 border border-accent/20 text-xs text-text space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-accent font-bold uppercase tracking-wider">
              <Mic className="w-3 h-3" />
              <span>Viva Talking Point:</span>
            </div>
            <p className="text-[11px] italic text-text leading-normal">
              "{currentStep.talkingPoint}"
            </p>
          </div>
        )}

        {/* Progress Dots & Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                onClick={() => setDemoStep(i)}
                className={`h-1.5 rounded-full cursor-pointer transition-all ${
                  i === demoStep ? 'w-5 bg-accent' : 'w-1.5 bg-border hover:bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={demoStep === 0}
              className="px-2.5 py-1 text-xs border border-border rounded bg-surface hover:bg-surface-hover disabled:opacity-40 text-text transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Prev</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-3 py-1 text-xs font-semibold bg-accent hover:bg-accent-hover text-white rounded transition-colors flex items-center gap-1"
            >
              <span>{demoStep === STEPS.length - 1 ? 'Finish' : 'Next'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
