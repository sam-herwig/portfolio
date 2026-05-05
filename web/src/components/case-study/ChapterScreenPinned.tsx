'use client';

import { View } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import type { ChapterScreenBlock } from '@/data/projects';
import PixelTitle from '@/components/sections/PixelTitle';
import { ChapterScene } from './chapterShaders/registry';

const STAGE_LABELS = ['Idle', 'Director', 'Designer + Engineer', 'Reviewer', 'Shipper'];

export default function ChapterScreenPinned({
  number,
  title,
  eyebrow,
  shaderId,
}: Omit<ChapterScreenBlock, 'type' | 'scrollMode'>) {
  const outerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (triggered) return;
    const el = outerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setTriggered(true);
          io.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [triggered]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = outerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const progress = total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0;
        const next = Math.min(4, Math.floor(progress * 5));
        setStage((prev) => (prev === next ? prev : next));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section ref={outerRef} className="relative h-[400svh] w-full">
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <View track={stickyRef as React.RefObject<HTMLElement>} className="absolute inset-0">
          <Suspense fallback={null}>
            <ChapterScene shaderId={shaderId} trackRef={outerRef} mode="pinned" />
          </Suspense>
        </View>

        <div className="pointer-events-none absolute inset-0 px-8 md:px-16">
          {eyebrow && (
            <p
              className="absolute left-8 top-12 text-[11px] uppercase tracking-[0.4em] text-white/85 mix-blend-difference md:left-16 md:top-16"
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
          <div
            className="absolute bottom-32 left-8 text-[11px] uppercase tracking-[0.4em] text-white/90 mix-blend-difference md:bottom-40 md:left-16"
            style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
          >
            Stage {stage + 1} / 5 — {STAGE_LABELS[stage]}
          </div>
          <PixelTitle
            text={number}
            variant="square"
            mount={triggered}
            anim="drop"
            as="div"
            className="absolute bottom-12 left-8 text-[clamp(6rem,12vw,12rem)] leading-[0.85] tracking-tight text-white mix-blend-difference md:bottom-16 md:left-16"
          />
        </div>
      </div>
    </section>
  );
}
