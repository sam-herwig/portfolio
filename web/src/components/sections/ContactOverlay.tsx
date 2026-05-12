'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import PixelTitle from '@/components/sections/PixelTitle';
import { MODULE_WINDOWS, overlayOpacity } from '@/lib/moduleTimeline';

function ContactInner({
  progress,
  pointerEvents,
}: {
  progress?: MotionValue<number>;
  pointerEvents?: MotionValue<'auto' | 'none'>;
}) {
  const innerContent = (
    <>
      <PixelTitle
        text="Contact"
        as="h2"
        mount={!progress}
        progress={progress}
        window={MODULE_WINDOWS.contact}
        className="text-5xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-7xl"
      />
      <p
        className="text-balance text-2xl italic leading-snug text-foreground/85 md:text-4xl"
        style={{ fontFamily: 'var(--font-instrument)' }}
      >
        Got a project, role, or collaboration that needs WebGL, motion, or AI pipelines —
      </p>
      <a
        href="mailto:sam@samherwig.dev"
        className="text-balance text-3xl font-medium tracking-tight text-foreground transition-opacity hover:opacity-70 md:text-5xl lg:text-6xl"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0',
        }}
      >
        sam@samherwig.dev ↗
      </a>
      <p className="text-base text-foreground/55 md:text-lg" style={{ fontFamily: 'var(--font-instrument)' }}>
        Or run the studio:&nbsp;
        <a
          href="https://craftedkit.io"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground/80"
        >
          craftedkit.io
        </a>
        .
      </p>
    </>
  );

  return (
    <>
      <p
        className="text-[11px] uppercase tracking-[0.4em] text-foreground/55"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        Contact · Available for projects + roles · Q3 / Q4 2026
      </p>

      {pointerEvents ? (
        <motion.div style={{ pointerEvents }} className="flex flex-col items-start gap-6 md:max-w-[60ch]">
          {innerContent}
        </motion.div>
      ) : (
        <div className="flex flex-col items-start gap-6 md:max-w-[60ch]">{innerContent}</div>
      )}

      <div
        className="flex flex-col items-start justify-between gap-4 border-t border-foreground/10 pt-6 text-[10px] uppercase tracking-[0.3em] text-foreground/40 md:flex-row md:items-center"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        <span>© Sam Herwig · 2026</span>
        <span>Denver, CO · Available worldwide</span>
      </div>
    </>
  );
}

export default function ContactOverlay({ progress }: { progress?: MotionValue<number> }) {
  if (!progress) {
    return (
      <section className="relative flex min-h-[60svh] w-full flex-col justify-between gap-12 p-6 md:p-16">
        <ContactInner />
      </section>
    );
  }

  return <ContactOverlayMotion progress={progress} />;
}

function ContactOverlayMotion({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (v) => overlayOpacity(v, MODULE_WINDOWS.contact));
  const pointerEvents = useTransform(opacity, (v) => (v > 0.5 ? 'auto' : 'none'));

  return (
    <motion.div
      style={{ opacity }}
      className="pointer-events-none absolute bottom-1/2 right-0 top-0 z-10 flex w-full flex-col justify-between p-6 md:inset-y-0 md:bottom-0 md:w-1/2 md:p-16"
    >
      <ContactInner progress={progress} pointerEvents={pointerEvents} />
    </motion.div>
  );
}
