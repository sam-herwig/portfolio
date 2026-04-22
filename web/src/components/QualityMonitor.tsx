'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { useQualityStore } from '@/lib/quality';

/**
 * Samples framerate once per second. If fps stays below 50 for 3 consecutive
 * seconds, downshifts the global quality tier once (high → medium, ultra → high).
 * Never auto-upshifts — user has to reload for a higher tier to be reconsidered.
 * Must be rendered inside the R3F Canvas.
 */
export default function QualityMonitor() {
  const tier = useQualityStore((s) => s.tier);
  const setTier = useQualityStore((s) => s.setTier);

  const tracker = useRef({ frames: 0, lastSecond: 0, lowSeconds: 0 });

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    tracker.current.frames++;

    if (t - tracker.current.lastSecond < 1.0) return;

    const fps = tracker.current.frames;
    tracker.current.frames = 0;
    tracker.current.lastSecond = t;

    if (fps < 50) {
      tracker.current.lowSeconds++;
      if (tracker.current.lowSeconds >= 3) {
        if (tier === 'ultra') setTier('high');
        else if (tier === 'high') setTier('medium');
        tracker.current.lowSeconds = 0;
      }
    } else {
      tracker.current.lowSeconds = 0;
    }
  });

  return null;
}
