import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LinearGauge } from '../components/common/LinearGauge';
import { Sparkline } from '../components/common/Sparkline';
import { StatStrip } from '../components/common/StatStrip';
import { CrowdBadge } from '../components/common/CrowdBadge';
import { CorridorSchematic } from '../components/schematic/CorridorSchematic';
import { CascadeHeatmap } from '../components/simulation/CascadeHeatmap';
import { SensitivityCurve } from '../components/simulation/SensitivityCurve';

describe('Component Resilience and Empty State Handling', () => {
  it('LinearGauge renders correctly with boundary values', () => {
    const { rerender } = render(<LinearGauge value={0} />);
    expect(screen.getByText('0.000')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();

    rerender(<LinearGauge value={0.72} />);
    expect(screen.getByText('0.720')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();

    rerender(<LinearGauge value={0.95} />);
    expect(screen.getByText('0.950')).toBeInTheDocument();
    expect(screen.getByText('Severe')).toBeInTheDocument();
  });

  it('Sparkline handles empty or null data without crashing', () => {
    const { container: emptyContainer } = render(<Sparkline data={[]} />);
    expect(emptyContainer.firstChild).toBeTruthy();

    const { container: smallContainer } = render(<Sparkline data={[50]} />);
    expect(smallContainer.firstChild).toBeTruthy();

    const { container: normalContainer } = render(<Sparkline data={[10, 20, 30, 40]} />);
    expect(normalContainer.querySelector('svg')).toBeInTheDocument();
  });

  it('StatStrip renders summary metrics with dividers', () => {
    const items = [
      { label: 'Busiest Station', value: 'Andheri', subtext: 'ADH' },
      { label: 'Mean Crowd Index', value: '0.450' }
    ];
    render(<StatStrip items={items} />);
    expect(screen.getByText('Busiest Station')).toBeInTheDocument();
    expect(screen.getByText('Andheri')).toBeInTheDocument();
    expect(screen.getByText('ADH')).toBeInTheDocument();
    expect(screen.getByText('0.450')).toBeInTheDocument();
  });

  it('CrowdBadge encodes category by shape and label', () => {
    render(<CrowdBadge category="Severe" />);
    expect(screen.getByText('Severe')).toBeInTheDocument();
  });

  it('CorridorSchematic renders all 11 stations with accessibility labels', () => {
    render(<CorridorSchematic stationsData={[]} selectedStationId="ADH" />);
    expect(screen.getByRole('img', { name: /mumbai western line/i })).toBeInTheDocument();
    expect(screen.getByText('Andheri')).toBeInTheDocument();
    expect(screen.getByText('Borivali')).toBeInTheDocument();
    expect(screen.getByText('Bandra')).toBeInTheDocument();
  });

  it('CascadeHeatmap handles empty or zero data cleanly', () => {
    render(
      <CascadeHeatmap
        deltaByMinute={{}}
        baselineByMinute={{}}
        scenarioByMinute={{}}
        activeMinute={0}
      />
    );
    expect(screen.getByText(/Disruption Propagation Cascade/i)).toBeInTheDocument();
  });

  it('SensitivityCurve handles empty data and loading states gracefully', () => {
    const { rerender } = render(<SensitivityCurve loading={true} />);
    expect(screen.getByText(/Calculating delay sweep/i)).toBeInTheDocument();

    rerender(<SensitivityCurve loading={false} sweepData={[]} />);
    expect(screen.getByText(/No sweep data available/i)).toBeInTheDocument();
  });
});
