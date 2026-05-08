'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import PixelTitle from '@/components/sections/PixelTitle';
import { MODULE_WINDOWS, sceneOpacity } from '@/lib/moduleTimeline';

function AboutBody({ progress }: { progress?: MotionValue<number> }) {
  return (
    <>
      <p
        className="text-[11px] uppercase tracking-[0.4em] text-foreground/55"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        Section 02
      </p>

      <div className="flex flex-col items-start gap-6 md:max-w-[60ch]">
        <PixelTitle
          text="About"
          as="h2"
          mount={!progress}
          progress={progress}
          window={MODULE_WINDOWS.about}
          className="text-5xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-7xl"
        />
        <p
          className="text-balance text-2xl italic leading-snug text-foreground/85 md:text-4xl lg:text-5xl"
          style={{ fontFamily: 'var(--font-instrument)' }}
        >
          Creative engineer in Denver. Builds interactive 3D web, shader-based interfaces, and AI agent pipelines for
          studios, product teams, and direct clients.
        </p>
        <p
          className="text-[10px] uppercase tracking-[0.4em] text-foreground/45"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Denver, CO · 2021–
        </p>
      </div>

      <div />
    </>
  );
}

export default function AboutOverlay({ progress }: { progress?: MotionValue<number> }) {
  if (!progress) {
    return (
      <section className="relative flex min-h-[60svh] w-full flex-col justify-between gap-12 p-6 md:p-16">
        <AboutBody />
      </section>
    );
  }

  return <AboutOverlayMotion progress={progress} />;
}

function AboutOverlayMotion({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (v) => sceneOpacity(v, MODULE_WINDOWS.about));
  return (
    <motion.div
      style={{ opacity }}
      className="pointer-events-none absolute bottom-1/2 right-0 top-0 z-10 flex w-full flex-col justify-between p-6 md:inset-y-0 md:bottom-0 md:w-1/2 md:p-16"
    >
      <AboutBody progress={progress} />
    </motion.div>
  );
}
