'use client';

import { motion, MotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useState } from 'react';
import { getAudioManager } from '@/lib/audio/audioManager';
import { MODULE_TIMELINE } from '@/lib/moduleTimeline';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';

const SEGMENT_COUNT = 5;

export default function SummitEgg({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const [snapping, setSnapping] = useState(0);
  const reducedMotion = useReducedMotion();
  const window_ = MODULE_TIMELINE.summit;
  const opacity = useTransform(
    scrollProgress,
    [window_.enterStart, window_.enterEnd, window_.exitStart, window_.exitEnd],
    [0, 1, 1, 0],
  );
  const pointerEvents = useTransform(opacity, (v) => (v > 0.4 ? 'auto' : 'none')) as unknown as MotionValue<string>;

  const handleClick = () => {
    useFoundEggs.getState().markFound('pennant');
    getAudioManager()?.boostSection('summit');
    setSnapping((n) => n + 1);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label="Summit pennant — easter egg"
      data-egg="pennant"
      style={{ opacity, pointerEvents }}
      className="fixed top-24 left-8 z-30 h-24 w-16 text-foreground md:h-28 md:w-20"
    >
      <svg viewBox="0 0 200 260" fill="none" stroke="currentColor" aria-hidden="true" className="h-full w-full">
        <g id="pole">
          <path d="M46 10 L46 250 M40 250 L58 250" strokeWidth="6" strokeLinecap="round" />
        </g>
        <g>
          {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
            const x0 = 46 + (i * 130) / SEGMENT_COUNT;
            const x1 = 46 + ((i + 1) * 130) / SEGMENT_COUNT;
            // triangle: top edge slopes down, bottom edge slopes up
            const topY = 28 + i * 4;
            const botY = 92 - i * 6;
            const tipY = (topY + botY) / 2;
            return (
              <motion.polygon
                key={i}
                points={`${x0},${topY} ${x1},${tipY} ${x0},${botY}`}
                fill="currentColor"
                fillOpacity="0.85"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ skewX: 0 }}
                animate={snapping && !reducedMotion ? { skewX: [8, -4, 2, 0] } : { skewX: 0 }}
                transition={snapping && !reducedMotion ? { duration: 0.5, delay: i * 0.06 } : undefined}
                style={{ transformOrigin: `${x0}px ${tipY}px` }}
              />
            );
          })}
        </g>
      </svg>
    </motion.button>
  );
}
