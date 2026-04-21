'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { EGG_RANGE_PX, EGG_REGISTRY, type EggId } from '@/lib/eggs/eggRegistry';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';

const COMPASS_SIZE = 40;

function Needle() {
  return (
    <svg
      width={COMPASS_SIZE}
      height={COMPASS_SIZE}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="38" strokeWidth="2" />
      <path d="M50 14 L58 52 L50 46 L42 52 Z" fill="currentColor" stroke="none" />
      <path d="M50 86 L58 52 L50 58 L42 52 Z" fill="currentColor" stroke="none" opacity="0.3" />
      <circle cx="50" cy="50" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Checkmark() {
  return (
    <svg
      width={COMPASS_SIZE}
      height={COMPASS_SIZE}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="38" strokeWidth="2" />
      <path d="M32 52 L46 66 L70 38" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Walk up the ancestor chain until we find a non-transparent background color.
 * Returns luminance in 0..1 (Rec. 709). Defaults to 1 (light) if nothing found.
 */
function luminanceUnderPoint(x: number, y: number): number {
  const el = document.elementFromPoint(x, y);
  let node: Element | null = el;
  while (node) {
    const bg = window.getComputedStyle(node).backgroundColor;
    const m = bg.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
      const [r, g, b, a = 1] = parts;
      if (a > 0.5) {
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      }
    }
    node = node.parentElement;
  }
  return 1;
}

export default function CustomCursor() {
  const [isTouchDevice] = useState(() => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches);
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const [visible, setVisible] = useState(false);
  const [hoveredFound, setHoveredFound] = useState(false);
  const [needleLight, setNeedleLight] = useState(false); // true when bg is dark, so needle goes light

  const cursorRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  const rotateTarget = useMotionValue(0);
  const rotate = useSpring(rotateTarget, { stiffness: 80, damping: 18, mass: 0.5 });

  const pulse = useMotionValue(1);
  const scale = useTransform(pulse, (v) => v);

  // One-shot ?reset query param → clear localStorage-backed store.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.has('reset')) {
      useFoundEggs.getState().reset();
    }
  }, []);

  // Pulse loop — gentle 2s breathing when spotter is visible, flat otherwise.
  useEffect(() => {
    if (isTouchDevice || reducedMotion) return;
    let rafId: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = ((now - start) / 2000) % 1;
      const breathe = visible && !hoveredFound ? 1 + 0.08 * Math.sin(t * Math.PI * 2) : 1;
      pulse.set(breathe);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [visible, hoveredFound, isTouchDevice, reducedMotion, pulse]);

  // Main spotter loop — runs per frame, finds nearest unfound egg in range.
  useEffect(() => {
    if (isTouchDevice) return;

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    let rafId: number;
    let lumSampleTick = 0;
    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.2;
      pos.current.y += (target.current.y - pos.current.y) * 0.2;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${pos.current.x - COMPASS_SIZE / 2}px, ${pos.current.y - COMPASS_SIZE / 2}px)`;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const foundIds = useFoundEggs.getState().foundIds;

      // 1. Check if hovering a found egg surface — show ✓.
      const elAtPoint = document.elementFromPoint(target.current.x, target.current.y);
      const hoveredEggEl = elAtPoint?.closest('[data-egg]');
      const hoveredId = hoveredEggEl?.getAttribute('data-egg') as EggId | undefined;
      const isHoveringFound = !!hoveredId && foundIds.includes(hoveredId);
      setHoveredFound(isHoveringFound);

      // 2. Find nearest unfound egg in viewport.
      let nearest: { dist: number; cx: number; cy: number } | null = null;
      for (const egg of EGG_REGISTRY) {
        if (foundIds.includes(egg.id)) continue;
        const el = document.querySelector(egg.selector);
        if (!el) continue;
        // Skip faded-out eggs (e.g. inactive zone modules).
        const opacity = parseFloat(window.getComputedStyle(el as HTMLElement).opacity || '1');
        if (opacity < 0.3) continue;
        const rect = (el as HTMLElement).getBoundingClientRect();
        if (rect.right < 0 || rect.left > vw || rect.bottom < 0 || rect.top > vh) continue;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - target.current.x;
        const dy = cy - target.current.y;
        const dist = Math.hypot(dx, dy);
        if (!nearest || dist < nearest.dist) nearest = { dist, cx, cy };
      }

      if (isHoveringFound) {
        setVisible(true);
      } else if (nearest && nearest.dist < EGG_RANGE_PX) {
        const angle = (Math.atan2(nearest.cy - target.current.y, nearest.cx - target.current.x) * 180) / Math.PI + 90;
        rotateTarget.set(angle);
        setVisible(true);
      } else {
        setVisible(false);
      }

      // 3. Sample luminance every ~6 frames (~10Hz at 60fps) to flip needle contrast.
      if (lumSampleTick++ % 6 === 0) {
        const lum = luminanceUnderPoint(target.current.x, target.current.y);
        setNeedleLight(lum < 0.5);
      }

      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, [isTouchDevice, rotateTarget]);

  if (isTouchDevice) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 z-[100] pointer-events-none"
      style={{ width: COMPASS_SIZE, height: COMPASS_SIZE, color: needleLight ? '#f9fafb' : '#18181b' }}
    >
      <motion.div
        style={{ rotate: hoveredFound ? 0 : rotate, scale, width: COMPASS_SIZE, height: COMPASS_SIZE }}
        animate={{ opacity: visible ? 0.85 : 0 }}
        transition={{ opacity: { duration: 0.25, ease: 'easeOut' } }}
      >
        {hoveredFound ? <Checkmark /> : <Needle />}
      </motion.div>
    </div>
  );
}
