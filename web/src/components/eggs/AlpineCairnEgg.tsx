'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { MODULE_TIMELINE } from '@/lib/moduleTimeline';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';
import { useAppStore } from '@/store/useAppStore';

export default function AlpineCairnEgg({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const router = useRouter();
  const [clicks, setClicks] = useState(0);
  const wobbleRef = useRef(0);
  const window_ = MODULE_TIMELINE.alpine;
  const opacity = useTransform(
    scrollProgress,
    [window_.enterStart, window_.enterEnd, window_.exitStart, window_.exitEnd],
    [0, 0.6, 0.6, 0],
  );
  const pointerEvents = useTransform(opacity, (v) => (v > 0.25 ? 'auto' : 'none')) as unknown as MotionValue<string>;

  const handleClick = (e: React.MouseEvent) => {
    const next = clicks + 1;
    setClicks(next);
    wobbleRef.current = next;

    if (next >= 3) {
      useFoundEggs.getState().markFound('cairn');
      // Fire the ink wash transition then navigate.
      useAppStore.getState().startTransition({ x: e.clientX, y: e.clientY }, '#18181b', '/cairn');
      window.setTimeout(() => router.push('/cairn'), 500);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label="Cairn — stack 3 stones"
      data-egg="cairn"
      style={{ opacity, pointerEvents }}
      className="fixed bottom-24 left-8 z-30 h-20 w-16 text-foreground hover:opacity-100 md:h-24 md:w-20"
    >
      <svg viewBox="0 0 80 120" fill="currentColor" stroke="currentColor" aria-hidden="true" className="h-full w-full">
        <motion.ellipse
          id="stone-1"
          cx="40"
          cy="106"
          rx="30"
          ry="10"
          strokeWidth="2"
          fillOpacity="0.15"
          animate={clicks >= 1 ? { y: [0, -2, 0] } : { y: 0 }}
          transition={{ duration: 0.4 }}
        />
        <motion.ellipse
          id="stone-2"
          cx="40"
          cy="86"
          rx="24"
          ry="8"
          strokeWidth="2"
          fillOpacity="0.2"
          animate={clicks >= 2 ? { y: [0, -3, 0] } : { y: 0 }}
          transition={{ duration: 0.4 }}
        />
        <motion.ellipse
          id="stone-3"
          cx="40"
          cy="70"
          rx="18"
          ry="7"
          strokeWidth="2"
          fillOpacity="0.25"
          animate={clicks >= 3 ? { y: [-18, -40], opacity: [1, 0] } : { y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.ellipse
          id="stone-4"
          cx="40"
          cy="56"
          rx="12"
          ry="5"
          strokeWidth="2"
          fillOpacity="0.35"
          animate={clicks >= 3 ? { y: -30, opacity: 0 } : { y: 0 }}
          transition={{ duration: 0.45 }}
        />
      </svg>
      {clicks === 1 && (
        <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/50">
          ·
        </span>
      )}
      {clicks === 2 && (
        <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/70">
          · ·
        </span>
      )}
    </motion.button>
  );
}
