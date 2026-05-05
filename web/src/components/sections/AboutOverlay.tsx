'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import PixelTitle from '@/components/sections/PixelTitle';
import { MODULE_WINDOWS, sceneOpacity } from '@/lib/moduleTimeline';

export default function AboutOverlay({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (v) => sceneOpacity(v, MODULE_WINDOWS.about));

  return (
    <motion.div
      style={{ opacity }}
      className="pointer-events-none absolute bottom-1/2 right-0 top-0 z-10 flex w-full flex-col justify-between p-6 md:inset-y-0 md:bottom-0 md:w-1/2 md:p-16"
    >
      <p
        className="text-[11px] uppercase tracking-[0.4em] text-foreground/55"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        Section 02
      </p>

      <div className="flex flex-col items-start gap-6 md:max-w-[60ch]">
        <PixelTitle
          text="About"
          anim="typewriter"
          progress={progress}
          window={MODULE_WINDOWS.about}
          className="text-5xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-7xl"
        />
        <p
          className="text-balance text-2xl italic leading-snug text-foreground/85 md:text-4xl lg:text-5xl"
          style={{ fontFamily: 'var(--font-instrument)' }}
        >
          Creative engineer in Denver. Builds interactive 3D web experiences, scroll-driven marketing sites, and
          shader-based interfaces for studios and direct clients.
        </p>
        <p
          className="text-[10px] uppercase tracking-[0.4em] text-foreground/45"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Denver, CO · 2021–
        </p>
      </div>

      <div />
    </motion.div>
  );
}
