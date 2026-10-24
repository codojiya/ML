import React from 'react';
import { useApp } from '../../context/AppContext';
import { Info, X } from 'lucide-react';

export function NotificationBanner() {
  const { bannerDismissed, dismissBanner } = useApp();

  if (bannerDismissed) return null;

  return (
    <div
      role="banner"
      className="bg-accent-subtle/70 text-text border-b border-border py-1.5 px-4 text-xs flex items-center justify-between gap-2 select-none"
    >
      <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
        <Info className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
        <span className="font-medium text-text">
          Synthetic transport simulation — not live Mumbai Railway data.
        </span>
        <span className="text-muted hidden sm:inline text-2xs">
          University ML & queue modeling project for Western Line corridor (Borivali → Bandra).
        </span>
      </div>
      <button
        type="button"
        onClick={dismissBanner}
        aria-label="Dismiss banner"
        className="text-muted hover:text-text p-0.5 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
