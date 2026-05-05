'use client';

import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { ModuleWindow } from '@/lib/moduleTimeline';

export type PixelAnim = 'scramble' | 'typewriter' | 'drop' | 'wipe';
export type PixelVariant = 'square' | 'grid';
export type PixelTag = 'h1' | 'h2' | 'h3' | 'div' | 'span';

interface Props {
  text: string;
  anim: PixelAnim;
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
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  div: motion.div,
  span: motion.span,
} as const;

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789▓▒░#@%&*';

function fontVar(variant: PixelVariant) {
  return variant === 'grid' ? 'var(--font-geist-pixel-grid)' : 'var(--font-geist-pixel-square)';
}

export default function PixelTitle({
  text,
  anim,
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
    <Component
      className={className}
      style={{ fontFamily: fontVar(variant), fontFeatureSettings: '"liga" 0' }}
      aria-label={text}
    >
      {anim === 'scramble' && <ScrambleText text={text} mount={!!mount} intro={intro} />}
      {anim === 'typewriter' && <TypewriterText text={text} intro={intro} mount={!!mount} />}
      {anim === 'drop' && <DropText text={text} intro={intro} mount={!!mount} />}
      {anim === 'wipe' && <WipeText text={text} intro={intro} mount={!!mount} />}
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

function ScrambleText({ text, mount, intro }: { text: string; mount: boolean; intro: MotionValue<number> }) {
  const t = useIntroT(intro, mount, 1400);
  const chars = useMemo(() => text.split(''), [text]);
  return (
    <span aria-hidden>
      {chars.map((c, i) => {
        const charT = Math.max(0, Math.min(1, (t - (i / chars.length) * 0.5) / 0.5));
        const settled = charT >= 1;
        const display =
          c === ' ' ? ' ' : settled ? c : SCRAMBLE_CHARS[(i * 9 + Math.floor(t * 60)) % SCRAMBLE_CHARS.length];
        return (
          <span key={i} style={{ opacity: charT < 0.05 ? 0 : 1 }}>
            {display}
          </span>
        );
      })}
    </span>
  );
}

function TypewriterText({ text, intro, mount }: { text: string; intro: MotionValue<number>; mount: boolean }) {
  const t = useIntroT(intro, mount, 900);
  const visible = Math.round(t * text.length);
  return (
    <span aria-hidden>
      <span>{text.slice(0, visible)}</span>
      <span style={{ opacity: t > 0 && t < 1 ? 1 : 0 }}>▌</span>
    </span>
  );
}

function DropText({ text, intro, mount }: { text: string; intro: MotionValue<number>; mount: boolean }) {
  const t = useIntroT(intro, mount, 900);
  const chars = useMemo(() => text.split(''), [text]);
  return (
    <span aria-hidden style={{ display: 'inline-flex' }}>
      {chars.map((c, i) => {
        const u = Math.max(0, Math.min(1, (t - (i / chars.length) * 0.5) / 0.5));
        const eased = 1 - Math.pow(1 - u, 3);
        const ty = (1 - eased) * -40;
        return (
          <span key={i} style={{ display: 'inline-block', transform: `translateY(${ty}px)`, opacity: eased }}>
            {c === ' ' ? ' ' : c}
          </span>
        );
      })}
    </span>
  );
}

function WipeText({ text, intro, mount }: { text: string; intro: MotionValue<number>; mount: boolean }) {
  const t = useIntroT(intro, mount, 900);
  const eased = t * t * (3 - 2 * t);
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        clipPath: `inset(0 ${(1 - eased) * 100}% 0 0)`,
      }}
    >
      {text}
    </span>
  );
}
