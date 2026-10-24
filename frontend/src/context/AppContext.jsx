import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { DEFAULT_TIMESTAMP, DEFAULT_DATE, DEFAULT_TIME } from '../constants/stations';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Parse URL query parameters on initial load
  const getInitialParams = () => {
    try {
      const search = new URLSearchParams(window.location.search);
      return {
        station: search.get('station') || 'ADH',
        dir: search.get('dir') || 'southbound',
        time: search.get('time') || DEFAULT_TIMESTAMP,
      };
    } catch (_) {
      return { station: 'ADH', dir: 'southbound', time: DEFAULT_TIMESTAMP };
    }
  };

  const initial = getInitialParams();
  const [stationId, setStationId] = useState(initial.station);
  const [direction, setDirection] = useState(initial.dir);
  const [timestamp, setTimestamp] = useState(initial.time);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [apiStatus, setApiStatus] = useState('checking'); // 'ok' | 'error' | 'checking'
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('crowdpulse_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Dark Mode support
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('crowdpulse_theme');
      if (saved) return saved === 'dark';
      return false; // Light mode first as required
    } catch {
      return false;
    }
  });

  // Demo mode
  const [demoModeActive, setDemoModeActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Sync dark mode class with DOM
  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('crowdpulse_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('crowdpulse_theme', 'light');
      }
    } catch (_) {}
  }, [darkMode]);

  const toggleTheme = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem('crowdpulse_banner_dismissed', 'true');
    } catch (_) {}
  }, []);

  // Sync state to URL params for deep-linking
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      params.set('station', stationId);
      params.set('dir', direction);
      params.set('time', timestamp);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    } catch (_) {}
  }, [stationId, direction, timestamp]);

  // Periodic Health Check
  const checkHealth = useCallback(async () => {
    try {
      await api.getHealth();
      setApiStatus('ok');
    } catch (_) {
      setApiStatus('error');
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Date and Time helpers
  const currentDate = timestamp.slice(0, 10);
  const currentTime = timestamp.slice(11, 16);

  const setDateOnly = useCallback((newDateStr) => {
    setTimestamp(`${newDateStr}T${currentTime}:00`);
  }, [currentTime]);

  const setTimeOnly = useCallback((newTimeStr) => {
    setTimestamp(`${currentDate}T${newTimeStr}:00`);
  }, [currentDate]);

  const stepTime = useCallback((deltaMinutes) => {
    setTimestamp(prev => {
      const dt = new Date(prev);
      dt.setMinutes(dt.getMinutes() + deltaMinutes);
      // Clamp between 06:00 and 22:45
      const hours = dt.getHours();
      const mins = dt.getMinutes();
      if (hours < 6) {
        dt.setHours(6, 0, 0, 0);
      } else if (hours > 22 || (hours === 22 && mins > 45)) {
        dt.setHours(22, 45, 0, 0);
      }
      const pad = (n) => String(n).padStart(2, '0');
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;
    });
  }, []);

  const toggleDirection = useCallback(() => {
    setDirection(prev => prev === 'southbound' ? 'northbound' : 'southbound');
  }, []);

  // Playback timer
  const playIntervalRef = useRef(null);
  useEffect(() => {
    if (isPlaying) {
      const delay = Math.max(250, 1200 / playbackSpeed);
      playIntervalRef.current = setInterval(() => {
        setTimestamp(prev => {
          const dt = new Date(prev);
          dt.setMinutes(dt.getMinutes() + 15);
          if (dt.getHours() > 22 || (dt.getHours() === 22 && dt.getMinutes() > 45)) {
            // Loop back to 06:00
            dt.setHours(6, 0, 0, 0);
          }
          const pad = (n) => String(n).padStart(2, '0');
          return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;
        });
      }, delay);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  return (
    <AppContext.Provider
      value={{
        stationId,
        setStationId,
        direction,
        setDirection,
        toggleDirection,
        timestamp,
        setTimestamp,
        currentDate,
        currentTime,
        setDateOnly,
        setTimeOnly,
        stepTime,
        isPlaying,
        setIsPlaying,
        playbackSpeed,
        setPlaybackSpeed,
        apiStatus,
        checkHealth,
        darkMode,
        toggleTheme,
        commandPaletteOpen,
        setCommandPaletteOpen,
        shortcutsModalOpen,
        setShortcutsModalOpen,
        bannerDismissed,
        dismissBanner,
        demoModeActive,
        setDemoModeActive,
        demoStep,
        setDemoStep
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
