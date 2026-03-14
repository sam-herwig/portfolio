'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

interface CustomCursorProps {
  scrollProgress: MotionValue<number>;
}

export default function CustomCursor({ scrollProgress }: CustomCursorProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isInCampZone, setIsInCampZone] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  // Detect touch device on mount
  useEffect(() => {
    if ('ontouchstart' in window) {
      setIsTouchDevice(true);
    }
  }, []);

  // Zone detection via scrollProgress
  const zone = useTransform(scrollProgress, (p) => {
    if (p < 0.2) return 'hero';
    if (p < 0.45) return 'forest';
    if (p < 0.65) return 'camp';
    if (p < 0.85) return 'alpine';
    return 'summit';
  });

  // Subscribe to zone changes to update campZone state
  useEffect(() => {
    const unsubscribe = zone.on('change', (v) => {
      setIsInCampZone(v === 'camp');
    });
    return unsubscribe;
  }, [zone]);

  // Mouse tracking + inertia loop
  useEffect(() => {
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let rafId: number;

    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [isTouchDevice]);

  // Hover detection for linkable elements
  useEffect(() => {
    if (isTouchDevice) return;

    const handleHoverIn = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest('a, button, [role="button"]');
      setIsHovering(!!t);
    };

    document.addEventListener('mouseover', handleHoverIn, { passive: true });
    return () => document.removeEventListener('mouseover', handleHoverIn);
  }, [isTouchDevice]);

  if (isTouchDevice) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 z-[100] pointer-events-none"
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      <motion.div
        className="rounded-full mix-blend-difference"
        animate={{
          width: isHovering ? 48 : 12,
          height: isHovering ? 48 : 12,
          borderWidth: isHovering ? 1 : 1.5,
          borderColor: isInCampZone
            ? 'rgba(251, 191, 36, 0.5)'   // amber-400/50
            : 'rgba(255, 255, 255, 0.5)',  // foreground/50 (works in difference mode)
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{
          borderStyle: 'solid',
        }}
      />
    </div>
  );
}
