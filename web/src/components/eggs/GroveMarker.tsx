'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { MODULE_TIMELINE } from '@/lib/moduleTimeline';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';
import { useAppStore } from '@/store/useAppStore';

const FOREST = MODULE_TIMELINE.forest;

/**
 * Hidden Forest egg — clicking it transitions to /off-trail.
 * Placeholder visual until the commissioned WebP arrives.
 */
export default function GroveMarker({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const router = useRouter();
  const found = useFoundEggs((s) => s.foundIds.includes('grove'));
  const navigatingRef = useRef(false);

  // Visible only while Forest module owns the scroll, fades out if found.
  const opacity = useTransform(
    scrollProgress,
    [FOREST.enterStart, FOREST.enterEnd, FOREST.exitStart, FOREST.exitEnd],
    [0, 0.85, 0.85, 0],
  );

  const handleClick = (e: React.MouseEvent) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    useFoundEggs.getState().markFound('grove');
    window.sessionStorage.setItem('sh-return-anchor', 'selected-work');
    useAppStore.getState().startTransition({ x: e.clientX, y: e.clientY }, '#18181b', '/off-trail');
    window.setTimeout(() => router.push('/off-trail'), 500);
  };

  if (found) return null;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label="Off-trail marker"
      data-egg="grove"
      className="fixed bottom-[18vh] right-[7vw] z-30 h-12 w-12 cursor-none focus:outline-none"
      style={{ opacity }}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full text-foreground/70" fill="none" aria-hidden="true">
        <ellipse cx="32" cy="50" rx="22" ry="6" fill="currentColor" opacity="0.18" />
        <path
          d="M16 46 Q14 32 24 28 Q26 18 36 18 Q48 18 50 30 Q56 32 54 42 Q52 50 42 50 L20 50 Q16 50 16 46 Z"
          fill="currentColor"
          opacity="0.6"
        />
        <path d="M28 36 L40 36 M36 32 L40 36 L36 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </motion.button>
  );
}
