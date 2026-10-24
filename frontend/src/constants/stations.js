export const STATIONS = [
  { id: 'BVI', name: 'Borivali', lat: 19.2291, lon: 72.8573, distance_km: 0.0, residential_share: 0.9, base_demand: 140 },
  { id: 'KILE', name: 'Kandivali', lat: 19.2043, lon: 72.8517, distance_km: 2.8, residential_share: 0.9, base_demand: 120 },
  { id: 'MLD', name: 'Malad', lat: 19.1872, lon: 72.8484, distance_km: 4.8, residential_share: 0.8, base_demand: 130 },
  { id: 'GMN', name: 'Goregaon', lat: 19.1646, lon: 72.8493, distance_km: 7.4, residential_share: 0.7, base_demand: 110 },
  { id: 'RAM', name: 'Ram Mandir', lat: 19.1604, lon: 72.8503, distance_km: 8.0, residential_share: 0.6, base_demand: 70 },
  { id: 'JOG', name: 'Jogeshwari', lat: 19.1361, lon: 72.8490, distance_km: 10.6, residential_share: 0.6, base_demand: 110 },
  { id: 'ADH', name: 'Andheri', lat: 19.1197, lon: 72.8464, distance_km: 12.6, residential_share: 0.3, base_demand: 170 },
  { id: 'VLP', name: 'Vile Parle', lat: 19.1000, lon: 72.8440, distance_km: 14.8, residential_share: 0.5, base_demand: 90 },
  { id: 'STC', name: 'Santacruz', lat: 19.0817, lon: 72.8417, distance_km: 17.0, residential_share: 0.5, base_demand: 80 },
  { id: 'KHR', name: 'Khar Road', lat: 19.0707, lon: 72.8395, distance_km: 18.5, residential_share: 0.5, base_demand: 70 },
  { id: 'BA', name: 'Bandra', lat: 19.0544, lon: 72.8402, distance_km: 20.6, residential_share: 0.2, base_demand: 120 }
];

export const STATION_MAP = Object.fromEntries(STATIONS.map(s => [s.id, s]));

export const CROWD_CATEGORIES = {
  Low: {
    label: 'Low',
    color: '#2E9E6B',
    bgColor: 'rgba(46, 158, 107, 0.12)',
    border: 'rgba(46, 158, 107, 0.3)',
    shape: 'circle',
    range: '< 0.35'
  },
  Moderate: {
    label: 'Moderate',
    color: '#E0A82E',
    bgColor: 'rgba(224, 168, 46, 0.14)',
    border: 'rgba(224, 168, 46, 0.35)',
    shape: 'square',
    range: '0.35 – 0.60'
  },
  High: {
    label: 'High',
    color: '#E4743B',
    bgColor: 'rgba(228, 116, 59, 0.14)',
    border: 'rgba(228, 116, 59, 0.35)',
    shape: 'triangle',
    range: '0.60 – 0.85'
  },
  Severe: {
    label: 'Severe',
    color: '#C7372F',
    bgColor: 'rgba(199, 55, 47, 0.15)',
    border: 'rgba(199, 55, 47, 0.4)',
    shape: 'diamond',
    range: '≥ 0.85'
  }
};

export const DEFAULT_DATE = '2026-08-03';
export const DEFAULT_TIME = '08:00';
export const DEFAULT_TIMESTAMP = '2026-08-03T08:00:00';
