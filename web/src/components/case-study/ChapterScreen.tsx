'use client';

import { View } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import type { ChapterScreenBlock } from '@/data/projects';
import PixelTitle from '@/components/sections/PixelTitle';
import { ChapterScene } from './chapterShaders/registry';

export default function ChapterScreen({
  number,
  title,
  eyebrow,
  shaderId,
}: Omit<ChapterScreenBlock, 'type' | 'scrollMode'>) {
  const sectionRef = useRef<HTMLElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (triggered) return;
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setTriggered(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [triggered]);

  return (
    <section ref={sectionRef} className="relative h-[100svh] w-full overflow-hidden">
      <View track={sectionRef as React.RefObject<HTMLElement>} className="absolute inset-0">
        <Suspense fallback={null}>
          <ChapterScene shaderId={shaderId} trackRef={sectionRef} mode="reveal" />
        </Suspense>
      </View>

      <div className="pointer-events-none absolute inset-0 px-8 md:px-16">
        {eyebrow && (
          <p
            className="absolute left-8 top-12 text-[11px] uppercase tracking-[0.4em] text-foreground/70 mix-blend-difference md:left-16 md:top-16"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            {eyebrow}
          </p>
        )}
        <PixelTitle
          text={title}
          variant="grid"
          mount={triggered}
          anim="typewriter"
          as="div"
          className="absolute left-8 top-24 max-w-[26ch] text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.2] tracking-tight text-white mix-blend-difference md:left-16 md:top-32"
        />
        <PixelTitle
          text={number}
          variant="square"
          mount={triggered}
          anim="drop"
          as="div"
          className="absolute bottom-12 left-8 text-[clamp(6rem,12vw,12rem)] leading-[0.85] tracking-tight text-white mix-blend-difference md:bottom-16 md:left-16"
        />
      </div>
    </section>
  );
}
