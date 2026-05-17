'use client';

import { m, useTransform, type MotionValue } from 'framer-motion';
import Link from 'next/link';
import PixelTitle from '@/components/sections/PixelTitle';
import { overlayOpacity, useTimeline } from '@/lib/moduleTimeline';

function AboutBody({ progress }: { progress?: MotionValue<number> }) {
  const { modules } = useTimeline();
  return (
    <>
      {/* Top edge — eyebrow row.
          Mobile: just the section label.
          Desktop: section label left, location right (breaks the L/R rhythm visually). */}
      <div className="flex items-baseline justify-between">
        <p
          className="text-[11px] uppercase tracking-[0.4em] text-foreground/55"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Section 02
        </p>
        <p
          className="hidden text-[11px] uppercase tracking-[0.4em] text-foreground/55 md:block"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Denver, CO · 2021–
        </p>
      </div>

      {/* Main row.
          Mobile: vertical stack (title above bio).
          Desktop letterbox: horizontal split — title left, bio right. */}
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between md:gap-16">
        <PixelTitle
          text="About"
          as="h2"
          mount={!progress}
          progress={progress}
          window={modules.about}
          className="flex-shrink-0 text-4xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        />
        <p
          className="text-balance text-lg italic leading-snug text-foreground/85 sm:text-2xl md:max-w-[55ch] md:text-2xl lg:text-3xl"
          style={{ fontFamily: 'var(--font-instrument)' }}
        >
          Creative engineer in Denver. Builds interactive 3D web, shader-based interfaces, and{' '}
          <Link
            href="/process"
            className="pointer-events-auto underline decoration-foreground/30 underline-offset-[6px] transition-colors hover:decoration-foreground/85"
          >
            AI agent pipelines
          </Link>{' '}
          for studios, product teams, and direct clients.
        </p>
      </div>

      {/* Mobile-only location line. Desktop moves it to the eyebrow row above. */}
      <p
        className="text-[10px] uppercase tracking-[0.4em] text-foreground/55 md:hidden"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        Denver, CO · 2021–
      </p>
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
  const { modules } = useTimeline();
  const opacity = useTransform(progress, (v) => overlayOpacity(v, modules.about));
  return (
    <m.div
      style={{ opacity }}
      className="pointer-events-none absolute bottom-1/2 right-0 top-0 z-10 flex w-full flex-col justify-between gap-6 p-6 md:bottom-0 md:left-0 md:right-0 md:top-auto md:h-[42svh] md:w-full md:p-12 lg:p-16"
    >
      <AboutBody progress={progress} />
    </m.div>
  );
}
