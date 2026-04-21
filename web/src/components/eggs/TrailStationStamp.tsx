'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';

type Slug = 'new-belgium' | 'craftedkit' | 'mission-bell' | 'consume-and-create';

const STAMP_BY_SLUG: Record<Slug, { src: string; label: string }> = {
  'new-belgium': { src: '/stamps/trail-station-nb.webp', label: 'New Belgium — Trail Station' },
  craftedkit: { src: '/stamps/trail-station-ck.webp', label: 'CraftedKit — Trail Station' },
  'mission-bell': { src: '/stamps/trail-station-mb.webp', label: 'Mission Bell — Trail Station' },
  'consume-and-create': { src: '/stamps/trail-station-cc.webp', label: 'Consume & Create — Trail Station' },
};

const SLUG_LABEL: Record<Slug, string> = {
  'new-belgium': 'NEW BELGIUM',
  craftedkit: 'CRAFTEDKIT',
  'mission-bell': 'MISSION BELL',
  'consume-and-create': 'CONSUME & CREATE',
};

export default function TrailStationStamp({ slug }: { slug: string }) {
  const [firing, setFiring] = useState(false);
  const reducedMotion = useReducedMotion();
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const entry = STAMP_BY_SLUG[slug as Slug];
  if (!entry) return null;

  const handleClick = () => {
    useFoundEggs.getState().markFound('station-stamp');
    setFiring(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setFiring(false), reducedMotion ? 800 : 1600);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`${entry.label} — easter egg`}
        data-egg="station-stamp"
        className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-foreground/15 bg-background/70 text-foreground/60 backdrop-blur-md transition-all duration-300 hover:border-foreground/40 hover:text-foreground md:bottom-24"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
        <span className="sr-only">{entry.label}</span>
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
              initial={reducedMotion ? { opacity: 0 } : { scale: 0.2, rotate: -12, opacity: 0 }}
              animate={
                reducedMotion
                  ? { opacity: [0, 1, 1, 0] }
                  : { scale: [0.2, 1.1, 1], rotate: [-12, 4, -1], opacity: [0, 1, 1, 0] }
              }
              transition={
                reducedMotion
                  ? { duration: 0.7, times: [0, 0.2, 0.7, 1] }
                  : { duration: 1.5, times: [0, 0.2, 0.4, 1], ease: [0.22, 1, 0.36, 1] }
              }
              className="relative h-[42vmin] w-[42vmin] max-h-[480px] max-w-[480px]"
            >
              <Image
                src={entry.src}
                alt=""
                fill
                className="object-contain mix-blend-multiply"
                sizes="42vmin"
                priority
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/70">
                  {SLUG_LABEL[slug as Slug]}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
