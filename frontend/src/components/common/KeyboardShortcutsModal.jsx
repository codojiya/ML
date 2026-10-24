import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Keyboard } from 'lucide-react';

export function KeyboardShortcutsModal() {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useApp();

  if (!shortcutsModalOpen) return null;

  const shortcuts = [
    { key: '← / →', desc: 'Step back / forward 15 minutes along timetable' },
    { key: 'Space', desc: 'Play / Pause continuous timeline playback' },
    { key: '1 – 6', desc: 'Jump to Pages (1: Overview, 2: Forecast, 3: Sim, 4: CCTV AI, 5: Insights, 6: Explorer)' },
    { key: 'S', desc: 'Swap corridor direction (Southbound ⇄ Northbound)' },
    { key: 'R', desc: 'Run or re-calculate simulation / forecast' },
    { key: '⌘K / Ctrl+K', desc: 'Open Command Palette & preset runner' },
    { key: '?', desc: 'Toggle this keyboard shortcut reference' },
    { key: 'Esc', desc: 'Close open modal or drawer' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 select-none"
      onClick={() => setShortcutsModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-surface border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-subtle">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <Keyboard className="w-4 h-4 text-accent" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            type="button"
            onClick={() => setShortcutsModalOpen(false)}
            className="p-1 text-muted hover:text-text rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 text-xs border-b border-border/50 last:border-b-0">
              <span className="text-text font-normal">{item.desc}</span>
              <kbd className="px-2 py-0.5 bg-surface-subtle border border-border rounded font-mono text-2xs font-semibold text-text tabular-nums shrink-0 ml-3">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 bg-surface-subtle border-t border-border text-center text-2xs text-muted">
          Press <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded font-mono">Esc</kbd> anytime to close
        </div>
      </div>
    </div>
  );
}
