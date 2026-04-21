'use client';

import { AnimatePresence, motion, MotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useMemo, useState } from 'react';
import { getAudioManager } from '@/lib/audio/audioManager';
import { MODULE_TIMELINE } from '@/lib/moduleTimeline';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';

const EMBER_COUNT = 7;

export default function CampEgg({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const [burst, setBurst] = useState(0); // increments to replay
  const reducedMotion = useReducedMotion();
  const window_ = MODULE_TIMELINE.camp;
  const opacity = useTransform(
    scrollProgress,
    [window_.enterEnd + 0.005, window_.enterEnd + 0.02, window_.exitStart, window_.exitEnd],
    [0, 1, 1, 0],
  );
  const pointerEvents = useTransform(opacity, (v) => (v > 0.4 ? 'auto' : 'none')) as unknown as MotionValue<string>;

  const embers = useMemo(
    () =>
      Array.from({ length: EMBER_COUNT }, (_, i) => ({
        id: i,
        dx: (i - (EMBER_COUNT - 1) / 2) * 10 + Math.sin(i * 7.3) * 12,
        dy: -120 - ((i * 13) % 40),
        delay: i * 0.06,
        size: 6 + ((i * 5) % 7),
      })),
    [],
  );

  const handleClick = () => {
    useFoundEggs.getState().markFound('ember');
    getAudioManager()?.boostSection('camp');
    setBurst((n) => n + 1);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label="Campfire embers — easter egg"
      data-egg="ember"
      style={{ opacity, pointerEvents }}
      className="fixed bottom-28 left-1/2 z-30 h-14 w-14 -translate-x-1/2 rounded-full text-[#f59e0b]"
    >
      <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" className="h-full w-full opacity-70">
        <path d="M24 6 C 22 14 18 18 15 22 C 12 26 12 32 16 36 C 20 40 28 40 32 36 C 36 32 36 26 33 22 C 30 18 26 14 24 6 Z" />
      </svg>

      <AnimatePresence>
        {embers.map((e) =>
          burst > 0 ? (
            <motion.span
              key={`${burst}-${e.id}`}
              className="pointer-events-none absolute left-1/2 top-1/2 rounded-full bg-[#f59e0b]"
              style={{ width: e.size, height: e.size, marginLeft: -e.size / 2, marginTop: -e.size / 2 }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.6 }}
              animate={
                reducedMotion
                  ? { y: e.dy * 0.4, opacity: [0, 1, 0], scale: 0.8 }
                  : { x: e.dx, y: e.dy, opacity: [0, 1, 1, 0], scale: [0.6, 1, 0.8, 0.4] }
              }
              exit={{ opacity: 0 }}
              transition={{
                duration: reducedMotion ? 0.6 : 1.4,
                delay: reducedMotion ? 0 : e.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ) : null,
        )}
      </AnimatePresence>
    </motion.button>
  );
}
