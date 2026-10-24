const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, status, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      let errorDetail = null;
      let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        errorDetail = errorJson.detail || errorJson;
        if (typeof errorDetail === 'string') {
          errorMsg = errorDetail;
        } else if (errorDetail && errorDetail[0]?.msg) {
          errorMsg = `${errorDetail[0].loc?.join('.')}: ${errorDetail[0].msg}`;
        }
      } catch (_) {
        // Fallback to text status
      }
      throw new ApiError(errorMsg, res.status, errorDetail);
    }

    // Special case for CSV downloads
    if (res.headers.get('content-type')?.includes('text/csv')) {
      return await res.text();
    }

    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      'Unable to connect to CrowdPulse backend. Ensure the FastAPI server is running on port 8001.',
      0,
      err.message
    );
  }
}

export const api = {
  getHealth: () => request('/health'),
  getStations: () => request('/stations'),
  
  getOverview: (timestamp, direction = 'southbound') => {
    const params = new URLSearchParams();
    if (timestamp) params.append('timestamp', timestamp);
    if (direction) params.append('direction', direction);
    return request(`/overview?${params.toString()}`);
  },

  getOverviewTimeline: (date = '2026-08-03', direction = 'southbound') => {
    const params = new URLSearchParams({ date, direction });
    return request(`/overview/timeline?${params.toString()}`);
  },

  getForecast: (payload) => request('/forecast', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getSimulation: (payload) => request('/simulate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getSimulationSweep: (payload) => request('/simulate/sweep', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getMitigation: (payload) => request('/mitigate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getLiveWeather: () => request('/weather/live'),

  getCctvStream: (stationId = 'ADH') => request(`/cctv/stream?station_id=${stationId}`),

  getModelMetrics: () => request('/model/metrics'),
  getModelFeatures: () => request('/model/features'),
  getModelEvaluation: () => request('/model/evaluation'),

  getDatasetSummary: () => request('/dataset/summary'),
  getDatasetRecords: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        q.append(k, v);
      }
    });
    return request(`/dataset/records?${q.toString()}`);
  },

  getDatasetExportUrl: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        q.append(k, v);
      }
    });
    return `${API_BASE}/dataset/export?${q.toString()}`;
  }
};
