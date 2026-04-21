'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { MODULE_TIMELINE, type ModuleName } from '@/lib/moduleTimeline';
import { EGG_REGISTRY, type EggId } from '@/lib/eggs/eggRegistry';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';

const ZONE_TO_EGGS: Record<ModuleName, EggId[]> = {
  hero: ['trailhead'],
  forest: ['owl'],
  camp: ['ember'],
  alpine: ['cairn'],
  summit: ['pennant'],
};

const GLOW_MS = 1200;

interface GlowRect {
  id: EggId;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface GlowBatch {
  key: number;
  rects: GlowRect[];
}

export default function ZoneEntryGlow({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const isTouch = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches, []);
  const [batch, setBatch] = useState<GlowBatch>({ key: 0, rects: [] });

  const zoneSignal = useTransform(scrollProgress, (v) => {
    const zones = Object.keys(MODULE_TIMELINE) as ModuleName[];
    for (const z of zones) {
      const w = MODULE_TIMELINE[z];
      if (v >= w.enterEnd && v < w.exitStart) return z;
    }
    return null;
  });

  useEffect(() => {
    if (!isTouch) return;
    let lastZone: ModuleName | null = null;
    let clearTimer: number | null = null;

    const unsub = zoneSignal.on('change', (z) => {
      if (!z || z === lastZone) return;
      lastZone = z;
      const foundIds = useFoundEggs.getState().foundIds;
      const ids = (ZONE_TO_EGGS[z] ?? []).filter((id) => !foundIds.includes(id));
      const rects: GlowRect[] = [];
      for (const id of ids) {
        const egg = EGG_REGISTRY.find((e) => e.id === id);
        if (!egg) continue;
        const el = document.querySelector(egg.selector) as HTMLElement | null;
        if (!el) continue;
        const r = el.getBoundingClientRect();
        rects.push({ id, left: r.left, top: r.top, width: r.width, height: r.height });
      }
      if (rects.length === 0) return;
      setBatch({ key: Date.now(), rects });
      if (clearTimer !== null) window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(
        () => setBatch((prev) => (prev.rects.length > 0 ? { key: prev.key, rects: [] } : prev)),
        GLOW_MS,
      );
    });

    return () => {
      unsub();
      if (clearTimer !== null) window.clearTimeout(clearTimer);
    };
  }, [isTouch, zoneSignal]);

  if (!isTouch || batch.rects.length === 0) return null;

  return (
    <>
      {batch.rects.map((r) => (
        <Glow key={`${batch.key}-${r.id}`} rect={r} />
      ))}
    </>
  );
}

function Glow({ rect }: { rect: GlowRect }) {
  return (
    <motion.div
      className="pointer-events-none fixed z-[60] rounded-full"
      style={{
        left: rect.left - 16,
        top: rect.top - 16,
        width: rect.width + 32,
        height: rect.height + 32,
      }}
      initial={{ boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)' }}
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(245, 158, 11, 0.0)',
          '0 0 32px 8px rgba(245, 158, 11, 0.35)',
          '0 0 0 0 rgba(245, 158, 11, 0.0)',
        ],
      }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    />
  );
}
