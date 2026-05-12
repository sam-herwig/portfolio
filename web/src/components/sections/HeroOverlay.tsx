'use client';

import { m, useTransform, type MotionValue } from 'framer-motion';
import PixelTitle from '@/components/sections/PixelTitle';
import { MODULE_WINDOWS, overlayOpacity } from '@/lib/moduleTimeline';

function HeroBody() {
  return (
    <>
      <div className="flex items-baseline justify-between">
        <p
          className="text-[11px] uppercase tracking-[0.4em] text-foreground/55"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Sam Herwig
        </p>
        <p
          className="text-[11px] uppercase tracking-[0.4em] text-foreground/55"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Creative Engineer · Denver
        </p>
      </div>

      <div className="flex flex-1 items-center justify-start px-2">
        <PixelTitle
          text="Sam Herwig"
          mount
          className="text-4xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
        />
      </div>

      <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
        <p
          className="max-w-[40ch] text-lg italic leading-relaxed text-foreground/75 md:text-xl"
          style={{ fontFamily: 'var(--font-instrument)' }}
        >
          3D web, motion systems, AI agent pipelines. Currently shipping things at the limit of WebGL and taste.
        </p>
        <p
          className="text-[10px] uppercase tracking-[0.4em] text-foreground/45"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Scroll ↓
        </p>
      </div>
    </>
  );
}

export default function HeroOverlay({ progress }: { progress?: MotionValue<number> }) {
  if (!progress) {
    return (
      <section className="relative flex min-h-[60svh] w-full flex-col justify-between gap-12 p-6 md:p-16">
        <HeroBody />
      </section>
    );
  }

  return <HeroOverlayMotion progress={progress} />;
}

function HeroOverlayMotion({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (v) => overlayOpacity(v, MODULE_WINDOWS.hero));
  return (
    <m.div
      style={{ opacity }}
      className="pointer-events-none absolute bottom-0 left-0 top-1/2 z-10 flex w-full flex-col justify-between p-6 md:inset-y-0 md:top-0 md:w-1/2 md:p-16"
    >
      <HeroBody />
    </m.div>
  );
}
