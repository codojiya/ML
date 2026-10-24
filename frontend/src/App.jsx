import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { TopBar } from './components/common/TopBar';
import { Sidebar } from './components/common/Sidebar';
import { NotificationBanner } from './components/common/NotificationBanner';
import { CommandPalette } from './components/common/CommandPalette';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { DemoTour } from './components/demo/DemoTour';

// Code-split routes
const OverviewPage = lazy(() => import('./pages/OverviewPage').then(m => ({ default: m.OverviewPage })));
const ForecastPage = lazy(() => import('./pages/ForecastPage').then(m => ({ default: m.ForecastPage })));
const SimulationPage = lazy(() => import('./pages/SimulationPage').then(m => ({ default: m.SimulationPage })));
const PlatformVisionPage = lazy(() => import('./pages/PlatformVisionPage').then(m => ({ default: m.PlatformVisionPage })));
const ModelInsightsPage = lazy(() => import('./pages/ModelInsightsPage').then(m => ({ default: m.ModelInsightsPage })));
const DataExplorerPage = lazy(() => import('./pages/DataExplorerPage').then(m => ({ default: m.DataExplorerPage })));

function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 bg-surface border border-border rounded w-1/3" />
      <div className="h-16 bg-surface border border-border rounded w-full" />
      <div className="h-64 bg-surface border border-border rounded w-full" />
    </div>
  );
}

export function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    stepTime,
    isPlaying,
    setIsPlaying,
    toggleDirection,
    setCommandPaletteOpen,
    setShortcutsModalOpen,
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      // ⌘K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
        return;
      }

      // ? for shortcuts modal
      if (e.key === '?') {
        e.preventDefault();
        setShortcutsModalOpen(prev => !prev);
        return;
      }

      // Arrow keys (← / →) for 15m step
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepTime(-15);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepTime(15);
        return;
      }

      // Space for play/pause
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
        return;
      }

      // S for direction swap
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        toggleDirection();
        return;
      }

      // Number keys 1–6 for page navigation
      if (e.key === '1') {
        navigate('/');
      } else if (e.key === '2') {
        navigate('/forecast');
      } else if (e.key === '3') {
        navigate('/simulation');
      } else if (e.key === '4') {
        navigate('/cctv');
      } else if (e.key === '5') {
        navigate('/insights');
      } else if (e.key === '6') {
        navigate('/explorer');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepTime, isPlaying, setIsPlaying, toggleDirection, navigate, setCommandPaletteOpen, setShortcutsModalOpen]);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans selection:bg-accent/20 selection:text-accent">
      {/* Top Navigation Bar */}
      <TopBar />

      {/* Persistent Slim Disclaimer Banner */}
      <NotificationBanner />

      {/* Main Operations Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-6 focus:outline-none" tabIndex={-1}>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/forecast" element={<ForecastPage />} />
              <Route path="/simulation" element={<SimulationPage />} />
              <Route path="/cctv" element={<PlatformVisionPage />} />
              <Route path="/insights" element={<ModelInsightsPage />} />
              <Route path="/explorer" element={<DataExplorerPage />} />
              <Route path="*" element={<OverviewPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Overlays & Modals */}
      <CommandPalette />
      <KeyboardShortcutsModal />
      <DemoTour />
    </div>
  );
}

export default App;
