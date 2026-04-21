'use client';

import { motion, MotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { getAudioManager } from '@/lib/audio/audioManager';
import { MODULE_TIMELINE } from '@/lib/moduleTimeline';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';

export default function ForestEgg({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const [firing, setFiring] = useState(false);
  const reducedMotion = useReducedMotion();
  const timerRef = useRef<number | null>(null);
  const window_ = MODULE_TIMELINE.forest;
  const opacity = useTransform(
    scrollProgress,
    [window_.enterStart, window_.enterEnd, window_.exitStart, window_.exitEnd],
    [0, 1, 1, 0],
  );
  const pointerEvents = useTransform(opacity, (v) => (v > 0.4 ? 'auto' : 'none')) as unknown as MotionValue<string>;

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const handleClick = () => {
    useFoundEggs.getState().markFound('owl');
    getAudioManager()?.boostSection('forest');
    setFiring(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setFiring(false), reducedMotion ? 800 : 1400);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label="Forest owl — easter egg"
      data-egg="owl"
      style={{ opacity, pointerEvents }}
      className="fixed bottom-24 right-8 z-30 h-16 w-14 text-foreground md:h-20 md:w-16"
    >
      <svg viewBox="0 0 120 140" fill="none" stroke="currentColor" aria-hidden="true" className="h-full w-full">
        <g id="body">
          <path
            d="M60 42 C 36 42 22 60 22 88 C 22 112 38 128 60 128 C 82 128 98 112 98 88 C 98 60 84 42 60 42 Z"
            strokeWidth="3"
            fill="currentColor"
            fillOpacity="0.08"
          />
          <path
            d="M40 118 L38 132 M52 124 L52 136 M68 124 L68 136 M80 118 L82 132"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M44 76 Q 60 86 76 76 M42 92 Q 60 104 78 92 M46 108 Q 60 116 74 108"
            strokeWidth="1.5"
            opacity="0.6"
          />
        </g>
        <g id="head">
          <path d="M30 24 L40 44 L54 36 Z" strokeWidth="3" fill="currentColor" />
          <path d="M90 24 L80 44 L66 36 Z" strokeWidth="3" fill="currentColor" />
          <circle cx="60" cy="52" r="26" strokeWidth="3" fill="currentColor" fillOpacity="0.08" />
          <path d="M57 62 L60 70 L63 62 Z" strokeWidth="2" fill="currentColor" />
          <motion.g
            id="eyes-open"
            animate={firing && !reducedMotion ? { opacity: [1, 0, 1, 0, 1] } : { opacity: 1 }}
            transition={firing && !reducedMotion ? { duration: 1.0, times: [0, 0.2, 0.4, 0.6, 1] } : undefined}
          >
            <circle cx="48" cy="50" r="6" strokeWidth="2" fill="currentColor" />
            <circle cx="48" cy="50" r="1.6" fill="#fafafa" stroke="none" />
            <circle cx="72" cy="50" r="6" strokeWidth="2" fill="currentColor" />
            <circle cx="72" cy="50" r="1.6" fill="#fafafa" stroke="none" />
          </motion.g>
        </g>
      </svg>

      {firing && (
        <motion.div
          className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 font-instrument text-[11px] italic text-foreground/60"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: [0, 1, 1, 0], y: [4, -2, -4, -8] }}
          transition={{ duration: 1.4 }}
        >
          hoo.
        </motion.div>
      )}
    </motion.button>
  );
}
