import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import { STATIONS, CROWD_CATEGORIES } from '../../constants/stations';
import { CorridorSchematic } from './CorridorSchematic';
import { AlertTriangle } from 'lucide-react';

export function InteractiveMap({
  stationsData = [],
  selectedStationId = 'ADH',
  onSelectStation,
  direction = 'southbound',
  className = ''
}) {
  const [tileError, setTileError] = useState(false);
  const dataMap = Object.fromEntries((stationsData || []).map(s => [s.station_id || s.id, s]));

  // Western Line corridor coordinates for polyline
  const corridorCoords = STATIONS.map(s => [s.lat, s.lon]);

  // Fallback to schematic if tile error occurred
  if (tileError) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Map tile service unavailable. Switched to vector schematic view.</span>
        </div>
        <CorridorSchematic
          stationsData={stationsData}
          selectedStationId={selectedStationId}
          onSelectStation={onSelectStation}
          direction={direction}
          className={className}
        />
      </div>
    );
  }

  return (
    <div className={`relative border border-border rounded-lg overflow-hidden bg-surface-subtle ${className}`}>
      {/* Subtle coordinates notice */}
      <div className="absolute top-2 right-2 z-[400] bg-surface/90 backdrop-blur-sm border border-border px-2 py-0.5 rounded text-[10px] text-muted font-mono select-none">
        Coordinates approximate
      </div>

      <MapContainer
        center={[19.14, 72.848]}
        zoom={11.5}
        scrollWheelZoom={false}
        className="h-[340px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setTileError(true)
          }}
        />

        {/* Transit Line Path */}
        <Polyline
          positions={corridorCoords}
          pathOptions={{
            color: '#1F4FD8',
            weight: 4,
            opacity: 0.7,
            dashArray: '6 4'
          }}
        />

        {/* Station Markers */}
        {STATIONS.map((s) => {
          const data = dataMap[s.id];
          const catName = data?.crowd_category || 'Low';
          const cat = CROWD_CATEGORIES[catName] || CROWD_CATEGORIES.Low;
          const wait = data?.waiting_passengers || 0;
          const isSelected = s.id === selectedStationId;

          return (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lon]}
              radius={isSelected ? 10 : 7}
              pathOptions={{
                color: isSelected ? '#1F4FD8' : cat.color,
                fillColor: cat.color,
                fillOpacity: 0.9,
                weight: isSelected ? 3 : 1.5
              }}
              eventHandlers={{
                click: () => onSelectStation && onSelectStation(s.id)
              }}
            >
              <Popup>
                <div className="text-xs font-sans space-y-1">
                  <div className="font-bold text-text flex items-center justify-between">
                    <span>{s.name} ({s.id})</span>
                    <span
                      className="px-1.5 py-0.2 rounded text-[10px]"
                      style={{ backgroundColor: cat.bgColor, color: cat.color }}
                    >
                      {cat.label}
                    </span>
                  </div>
                  <div className="text-muted text-[11px]">
                    Waiting: <span className="font-mono font-semibold text-text">{Math.round(wait)}</span> passengers
                  </div>
                  {data?.simulated_passenger_arrivals !== undefined && (
                    <div className="text-muted text-[11px]">
                      Arrivals: <span className="font-mono text-text">{Math.round(data.simulated_passenger_arrivals)}</span>/15m
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectStation && onSelectStation(s.id)}
                    className="w-full mt-1.5 py-1 text-[10px] bg-accent text-white rounded font-medium hover:bg-accent-hover transition-colors"
                  >
                    Select Station
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
