import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError } from '../api/client';

describe('API Client Payloads and Error Propagation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getForecast sends valid POST payload structure', async () => {
    const mockResponse = {
      kind: 'ML prediction (passenger arrivals only)',
      model: 'CatBoost',
      forecast: [
        { timestamp: '2026-08-03T08:15:00', predicted_arrivals: 125.4 }
      ],
      explanation: []
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => mockResponse
    });

    const payload = {
      station_id: 'ADH',
      direction: 'southbound',
      timestamp: '2026-08-03T08:00:00',
      rainfall_mm: 5.0,
      event_intensity: 1,
      horizon_steps: 4
    };

    const res = await api.getForecast(payload);
    expect(res.model).toBe('CatBoost');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/forecast',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload)
      })
    );
  });

  it('getSimulation sends full simulation payload and handles response', async () => {
    const mockSim = {
      stations: [],
      affected_stations: 3,
      capacity_violations: 0,
      conservation_residual: { baseline: 0, scenario: 0 }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => mockSim
    });

    const payload = {
      station_id: 'ADH',
      direction: 'southbound',
      timestamp: '2026-08-03T08:00:00',
      train_delay_min: 20,
      rainfall_mm: 0,
      event_intensity: 0,
      demand_multiplier: 1.0
    };

    const res = await api.getSimulation(payload);
    expect(res.affected_stations).toBe(3);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/simulate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload)
      })
    );
  });

  it('propagates 422 validation error message from backend', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: "Unknown station_id 'XYZ'. Valid: ['BVI', ...]" })
    });

    await expect(api.getOverview('2026-08-03T08:00:00')).rejects.toThrow(
      "Unknown station_id 'XYZ'"
    );
  });

  it('handles network failure with clear offline recovery message', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    await expect(api.getHealth()).rejects.toThrow(
      'Unable to connect to CrowdPulse backend'
    );
  });
});
