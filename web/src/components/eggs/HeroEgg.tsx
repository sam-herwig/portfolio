'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { getAudioManager } from '@/lib/audio/audioManager';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';

export default function HeroEgg() {
  const [firing, setFiring] = useState(false);
  const reducedMotion = useReducedMotion();
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const handleClick = () => {
    useFoundEggs.getState().markFound('trailhead');
    getAudioManager()?.boostSection('hero');
    setFiring(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setFiring(false), reducedMotion ? 900 : 1800);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Trailhead stamp — easter egg"
        data-egg="trailhead"
        className="group absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-background/40 text-foreground/60 backdrop-blur-sm transition-all duration-300 hover:border-foreground/40 hover:text-foreground md:right-6 md:top-6"
      >
        <svg width="22" height="22" viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden="true">
          <circle cx="50" cy="50" r="36" strokeWidth="3" />
          <path d="M28 62 L40 42 L50 54 L62 34 L72 62 Z" fill="currentColor" stroke="none" />
          <circle cx="50" cy="28" r="2.5" fill="currentColor" stroke="none" />
        </svg>
      </button>

      <AnimatePresence>
        {firing && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { scale: 0.2, rotate: -18, opacity: 0 }}
              animate={
                reducedMotion
                  ? { opacity: [0, 1, 1, 0] }
                  : { scale: [0.2, 1.12, 1], rotate: [-18, 4, -2], opacity: [0, 1, 1, 0.95, 0] }
              }
              transition={
                reducedMotion
                  ? { duration: 0.8, times: [0, 0.2, 0.7, 1] }
                  : { duration: 1.6, times: [0, 0.18, 0.35, 0.7, 1], ease: [0.22, 1, 0.36, 1] }
              }
              className="relative h-[46vmin] w-[46vmin] max-h-[520px] max-w-[520px]"
            >
              <Image
                src="/stamps/trailhead-stamp.webp"
                alt=""
                fill
                className="object-contain mix-blend-multiply"
                sizes="46vmin"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
