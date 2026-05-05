'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChapterBlock } from '@/data/projects';
import PixelTitle, { type PixelAnim } from '@/components/sections/PixelTitle';

const ANIM_BY_NUMBER: Record<string, PixelAnim> = {
  '01': 'drop',
  '02': 'scramble',
  '03': 'wipe',
  '04': 'typewriter',
  '05': 'scramble',
};

export default function ChapterMark({ number, title, eyebrow }: Omit<ChapterBlock, 'type'>) {
  const ref = useRef<HTMLElement>(null);
  const [triggered, setTriggered] = useState(false);
  const anim = ANIM_BY_NUMBER[number] ?? 'drop';

  useEffect(() => {
    if (triggered) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setTriggered(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [triggered]);

  return (
    <section ref={ref} className="relative flex min-h-[60vh] w-full items-center px-8 pt-32 md:px-16">
      <div className="max-w-5xl">
        {eyebrow && (
          <p
            className="mb-6 text-[11px] uppercase tracking-[0.4em] text-foreground/40"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            {eyebrow}
          </p>
        )}
        <PixelTitle
          text={number}
          anim={anim}
          variant="square"
          mount={triggered}
          as="div"
          className="block text-[clamp(5rem,12vw,12rem)] leading-[0.85] tracking-tight text-foreground/85"
        />
        <h2
          className="mt-8 text-balance text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl lg:text-[5.5rem]"
          style={{ fontFamily: 'var(--font-fraunces)', fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0' }}
        >
          {title}
        </h2>
      </div>
    </section>
  );
}
