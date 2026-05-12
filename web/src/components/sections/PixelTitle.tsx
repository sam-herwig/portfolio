'use client';

import { m, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { ModuleWindow } from '@/lib/moduleTimeline';

export type PixelVariant = 'square' | 'grid';
type PixelTag = 'h1' | 'h2' | 'h3' | 'div' | 'span';

interface Props {
  text: string;
  variant?: PixelVariant;
  className?: string;
  // Drive intro progress from scroll within a scene window…
  progress?: MotionValue<number>;
  window?: ModuleWindow;
  // …or run a one-shot mount animation (hero).
  mount?: boolean;
  as?: PixelTag;
}

const TAG_MAP = {
  h1: m.h1,
  h2: m.h2,
  h3: m.h3,
  div: m.div,
  span: m.span,
} as const;

function fontVar(variant: PixelVariant) {
  return variant === 'grid' ? 'var(--font-geist-pixel-grid)' : 'var(--font-geist-pixel-square)';
}

export default function PixelTitle({
  text,
  variant = 'square',
  className,
  progress,
  window: win,
  mount,
  as = 'h1',
}: Props) {
  const intro = useTransform(progress ?? makeStaticMV(0), (v) => {
    if (mount || !win) return 1;
    const start = win.enterStart === win.enterEnd ? 0 : win.enterStart;
    const end = win.enterEnd === win.enterStart ? Math.min(1, win.enterStart + 0.16) : win.enterEnd;
    if (v <= start) return 0;
    if (v >= end) return 1;
    return (v - start) / (end - start);
  });

  const Component = TAG_MAP[as];

  return (
    <Component className={className} style={{ fontFamily: fontVar(variant), fontFeatureSettings: '"liga" 0' }}>
      <WipeText text={text} intro={intro} mount={!!mount} />
    </Component>
  );
}

function makeStaticMV(v: number): MotionValue<number> {
  return { get: () => v, on: () => () => {}, set: () => {} } as unknown as MotionValue<number>;
}

function useIntroT(intro: MotionValue<number>, mount: boolean, durationMs: number) {
  const [t, setT] = useState(() => (mount ? 0 : intro.get()));
  useMotionValueEvent(intro, 'change', (v) => {
    if (!mount) setT(v);
  });
  useEffect(() => {
    if (!mount) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const u = Math.min(1, (now - start) / durationMs);
      setT(u);
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mount, durationMs]);
  return t;
}

function WipeText({ text, intro, mount }: { text: string; intro: MotionValue<number>; mount: boolean }) {
  const t = useIntroT(intro, mount, 900);
  const eased = t * t * (3 - 2 * t);
  return (
    <span
      style={{
        display: 'inline-block',
        clipPath: `inset(0 ${(1 - eased) * 100}% 0 0)`,
      }}
    >
      {text}
    </span>
  );
}
