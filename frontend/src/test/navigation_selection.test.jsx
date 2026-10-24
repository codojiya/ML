import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider, useApp } from '../context/AppContext';
import { Sidebar } from '../components/common/Sidebar';
import { TopBar } from '../components/common/TopBar';
import { api } from '../api/client';

describe('Navigation, Context and Station Selection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function TestContextConsumer() {
    const { stationId, setStationId, direction, toggleDirection, timestamp, stepTime } = useApp();
    return (
      <div>
        <span data-testid="station">{stationId}</span>
        <span data-testid="direction">{direction}</span>
        <span data-testid="timestamp">{timestamp}</span>
        <button onClick={() => setStationId('BVI')}>Select Borivali</button>
        <button onClick={toggleDirection}>Toggle Dir</button>
        <button onClick={() => stepTime(15)}>Step Time</button>
      </div>
    );
  }

  it('AppContext updates station and direction correctly', () => {
    render(
      <AppProvider>
        <TestContextConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId('station').textContent).toBe('ADH');
    expect(screen.getByTestId('direction').textContent).toBe('southbound');

    fireEvent.click(screen.getByText('Select Borivali'));
    expect(screen.getByTestId('station').textContent).toBe('BVI');

    fireEvent.click(screen.getByText('Toggle Dir'));
    expect(screen.getByTestId('direction').textContent).toBe('northbound');

    const prevTime = screen.getByTestId('timestamp').textContent;
    fireEvent.click(screen.getByText('Step Time'));
    const newTime = screen.getByTestId('timestamp').textContent;
    expect(newTime).not.toBe(prevTime);
  });

  it('Sidebar renders all 5 primary operational routes', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppProvider>
          <Sidebar collapsed={false} setCollapsed={() => {}} />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getAllByText('Overview')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Forecast')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Simulation Lab')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Model Insights')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Data Explorer')[0]).toBeInTheDocument();
  });

  it('TopBar renders logo, scrubber, and direction controls', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppProvider>
          <TopBar />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Crowd')).toBeInTheDocument();
    expect(screen.getByText('Pulse')).toBeInTheDocument();
    expect(screen.getByText('SYNTHETIC DATA')).toBeInTheDocument();
  });
});
