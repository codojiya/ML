import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { STATIONS } from '../../constants/stations';
import {
  Search,
  Activity,
  TrendingUp,
  Cpu,
  Camera,
  Brain,
  Database,
  MapPin,
  Sparkles,
  ArrowRightLeft,
  Sun,
  Moon,
  Download,
  HelpCircle,
  X
} from 'lucide-react';

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setStationId,
    setDirection,
    setTimestamp,
    toggleTheme,
    darkMode,
    setDemoModeActive,
    setDemoStep,
    setShortcutsModalOpen,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // Command items definitions
  const items = [
    // Pages
    { id: 'p-overview', category: 'Navigation', label: 'Go to Overview', icon: Activity, action: () => navigate('/') },
    { id: 'p-forecast', category: 'Navigation', label: 'Go to Forecast', icon: TrendingUp, action: () => navigate('/forecast') },
    { id: 'p-sim', category: 'Navigation', label: 'Go to Simulation Lab', icon: Cpu, action: () => navigate('/simulation') },
    { id: 'p-cctv', category: 'Navigation', label: 'Go to Platform CCTV AI Vision', icon: Camera, action: () => navigate('/cctv') },
    { id: 'p-insights', category: 'Navigation', label: 'Go to Model Insights', icon: Brain, action: () => navigate('/insights') },
    { id: 'p-data', category: 'Navigation', label: 'Go to Data Explorer', icon: Database, action: () => navigate('/explorer') },

    // Presets
    {
      id: 'pre-andheri-20',
      category: 'Simulation Presets',
      label: 'Preset: Simulate 20-min delay at Andheri, 8 AM',
      icon: Cpu,
      action: () => {
        setStationId('ADH');
        setDirection('southbound');
        setTimestamp('2026-08-03T08:00:00');
        navigate('/simulation?delay=20&station=ADH&time=2026-08-03T08:00:00');
      }
    },
    {
      id: 'pre-borivali-rain',
      category: 'Simulation Presets',
      label: 'Preset: Simulate Heavy Rain at Borivali, 8:45 AM peak',
      icon: Cpu,
      action: () => {
        setStationId('BVI');
        setDirection('southbound');
        setTimestamp('2026-08-03T08:45:00');
        navigate('/simulation?rain=40&station=BVI&time=2026-08-03T08:45:00');
      }
    },
    {
      id: 'pre-bandra-nb',
      category: 'Simulation Presets',
      label: 'Preset: Simulate 15-min delay at Bandra (Northbound)',
      icon: Cpu,
      action: () => {
        setStationId('BA');
        setDirection('northbound');
        setTimestamp('2026-08-03T18:30:00');
        navigate('/simulation?delay=15&station=BA&dir=northbound&time=2026-08-03T18:30:00');
      }
    },

    // Actions
    {
      id: 'act-demo',
      category: 'Actions',
      label: 'Start 4-Minute Guided Walkthrough (Demo Mode)',
      icon: Sparkles,
      action: () => {
        setDemoStep(0);
        setDemoModeActive(true);
      }
    },
    {
      id: 'act-theme',
      category: 'Actions',
      label: darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: darkMode ? Sun : Moon,
      action: toggleTheme
    },
    {
      id: 'act-dir',
      category: 'Actions',
      label: 'Toggle Travel Direction (Southbound / Northbound)',
      icon: ArrowRightLeft,
      action: () => setDirection(prev => prev === 'southbound' ? 'northbound' : 'southbound')
    },
    {
      id: 'act-shortcuts',
      category: 'Actions',
      label: 'Show Keyboard Shortcuts Reference (?)',
      icon: HelpCircle,
      action: () => setShortcutsModalOpen(true)
    },
    {
      id: 'act-export',
      category: 'Actions',
      label: 'Export Corridor Dataset CSV',
      icon: Download,
      action: () => window.open('/api/dataset/export', '_blank')
    },

    // Stations
    ...STATIONS.map((s) => ({
      id: `st-${s.id}`,
      category: 'Stations',
      label: `Select Station: ${s.name} (${s.id})`,
      icon: MapPin,
      action: () => {
        setStationId(s.id);
        navigate(`/?station=${s.id}`);
      }
    }))
  ];

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item) => {
    setCommandPaletteOpen(false);
    item.action();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-none flex items-start justify-center pt-20 p-4"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-3 border-b border-border">
          <Search className="w-4 h-4 text-muted shrink-0 mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, station name, or preset..."
            className="w-full py-3 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 text-muted hover:text-text rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">
              No matching commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2 cursor-pointer text-xs ${
                    isSelected ? 'bg-accent/10 text-accent font-medium' : 'text-text hover:bg-surface-subtle'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="text-[10px] text-muted font-mono uppercase tracking-wider ml-2 shrink-0">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-3.5 py-2 bg-surface-subtle border-t border-border flex items-center justify-between text-[11px] text-muted">
          <span>Use ↑↓ to navigate</span>
          <span>↵ to execute</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
