'use client';

import { useSyncExternalStore } from 'react';
import { getAudioManager } from '@/lib/audio/audioManager';

function subscribe(listener: () => void) {
  const mgr = getAudioManager();
  if (!mgr) return () => {};
  return mgr.subscribe(listener);
}

function getEnabled() {
  return getAudioManager()?.isEnabled() ?? false;
}

export default function AudioToggle() {
  // useSyncExternalStore handles SSR via the third-arg server snapshot — no need
  // for a mounted flag. Server renders aria-pressed=false; client hydrates to the
  // real localStorage state. Both first paints produce identical HTML.
  const enabled = useSyncExternalStore(subscribe, getEnabled, () => false);

  const handleToggle = () => {
    const mgr = getAudioManager();
    if (!mgr) return;
    mgr.setEnabled(!mgr.isEnabled());
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={enabled ? 'Mute ambient sound' : 'Enable ambient sound'}
      aria-pressed={enabled}
      title={enabled ? 'Sound on' : 'Sound off'}
      className="group fixed top-5 right-5 z-[80] flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-background/85 text-foreground/70 backdrop-blur-md transition-all duration-300 hover:border-foreground/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 md:top-6 md:right-6"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Speaker body — always visible */}
        <path d="M5 9 L9 9 L13 5 L13 19 L9 15 L5 15 Z" fill="currentColor" stroke="none" />
        {/* Sound waves — only when enabled */}
        {enabled ? (
          <>
            <path d="M16.5 8.5 a5 5 0 0 1 0 7" />
            <path d="M19 6 a8 8 0 0 1 0 12" />
          </>
        ) : (
          // Slash through the speaker when muted
          <line x1="16" y1="7" x2="22" y2="17" />
        )}
      </svg>
      <span className="sr-only">{enabled ? 'Sound on' : 'Sound off'}</span>
    </button>
  );
}
