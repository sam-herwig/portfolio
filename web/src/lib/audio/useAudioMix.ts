'use client';

import { useEffect } from 'react';
import { useMotionValueEvent, type MotionValue } from 'framer-motion';
import { sceneOpacity } from '@/lib/moduleTimeline';
import { getAudioManager } from './audioManager';

/**
 * Drives per-section audio gain off scroll progress.
 * Reuses sceneOpacity() so the audio mix matches the visual scene crossfade
 * — when a module is fully visible, its bed is at full per-section volume.
 */
export function useAudioMix(scrollProgress: MotionValue<number>) {
  useMotionValueEvent(scrollProgress, 'change', (p) => {
    const mgr = getAudioManager();
    if (!mgr || !mgr.isEnabled()) return;

    mgr.setMix({
      hero: sceneOpacity('hero', p),
      forest: sceneOpacity('forest', p),
      camp: sceneOpacity('camp', p),
      alpine: sceneOpacity('alpine', p),
      summit: sceneOpacity('summit', p),
    });
  });

  useEffect(() => {
    const mgr = getAudioManager();
    if (!mgr) return;
    const p = scrollProgress.get();
    mgr.setMix({
      hero: sceneOpacity('hero', p),
      forest: sceneOpacity('forest', p),
      camp: sceneOpacity('camp', p),
      alpine: sceneOpacity('alpine', p),
      summit: sceneOpacity('summit', p),
    });
  }, [scrollProgress]);
}
