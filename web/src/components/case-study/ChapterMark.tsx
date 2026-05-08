'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChapterBlock } from '@/data/projects';
import PixelTitle from '@/components/sections/PixelTitle';

type Props = Omit<ChapterBlock, 'type'>;

export default function ChapterMark({ number, title, eyebrow }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !triggered) setTriggered(true);
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
