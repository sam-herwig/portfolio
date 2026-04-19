'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

/**
 * Page transition that paints a single diagonal brushstroke across the viewport.
 *
 * Mechanic: a rotated container holds a fill masked by ink-wash-horizontal.webp.
 * On enter, a clip-path reveals the stroke from its start (top-left) toward its
 * end (bottom-right) — the brush "draws itself" on. On exit, the same clip-path
 * continues forward, sweeping the stroke off the right edge so the destination
 * page is revealed in one continuous gesture. Click position is ignored — the
 * sweep is a fixed signature stroke.
 */
export default function InkWashTransition() {
  const router = useRouter();
  const { transitionState, transitionColor, transitionHref, setTransitionExiting, endTransition } = useAppStore();
  const reducedMotion = useReducedMotion();

  const hasNavigated = useRef(false);

  const handleEnterComplete = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    const pushOpts = transitionHref === '/' ? { scroll: false } : undefined;
    Promise.resolve(router.push(transitionHref, pushOpts)).catch(() => {
      endTransition();
      hasNavigated.current = false;
    });
    setTimeout(() => {
      setTransitionExiting();
    }, 300);
  }, [router, transitionHref, setTransitionExiting, endTransition]);

  const handleExitComplete = useCallback(() => {
    endTransition();
    hasNavigated.current = false;
  }, [endTransition]);

  useEffect(() => {
    if (transitionState === 'idle') {
      hasNavigated.current = false;
    }
  }, [transitionState]);

  useEffect(() => {
    if (reducedMotion && transitionState === 'entering' && !hasNavigated.current) {
      hasNavigated.current = true;
      router.push(transitionHref);
      setTimeout(() => endTransition(), 50);
    }
  }, [reducedMotion, transitionState, transitionHref, router, endTransition]);

  const isActive = transitionState !== 'idle' && !reducedMotion;

  // Brushstroke geometry — sized to fully cover the viewport at 45°.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const diagonal = Math.sqrt(vw * vw + vh * vh);
  const strokeLength = diagonal * 1.4;
  const strokeThickness = diagonal * 1.4;

  const enteringDuration = 0.75;
  const exitingDuration = 0.65;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="ink-wash-overlay"
          className="pointer-events-auto fixed inset-0 z-[9999] overflow-hidden"
          initial={false}
        >
          {/* Solid backdrop — insurance against the brush texture's soft edges.
              Fades in late on enter, out early on exit so the stroke leads. */}
          <motion.div
            style={{ backgroundColor: transitionColor }}
            className="absolute inset-0"
            initial={transitionState === 'entering' ? { opacity: 0 } : { opacity: 1 }}
            animate={transitionState === 'entering' ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
              delay: transitionState === 'entering' ? 0.35 : 0.1,
            }}
          />

          {/* Rotation wrapper — pivots around viewport center. */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: strokeLength,
              height: strokeThickness,
              transform: 'translate(-50%, -50%) rotate(45deg)',
              transformOrigin: 'center',
            }}
          >
            {/* The painted stroke. Clip-path animates along the rotated X axis,
                which after 45° maps to top-left → bottom-right in screen space. */}
            <motion.div
              initial={
                transitionState === 'entering' ? { clipPath: 'inset(0 100% 0 0)' } : { clipPath: 'inset(0 0% 0 0)' }
              }
              animate={
                transitionState === 'entering' ? { clipPath: 'inset(0 0% 0 0)' } : { clipPath: 'inset(0 0 0 100%)' }
              }
              transition={{
                duration: transitionState === 'entering' ? enteringDuration : exitingDuration,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: transitionColor,
                maskImage: 'url(/assets/graphics/case-study/ink-wash-horizontal.webp)',
                WebkitMaskImage: 'url(/assets/graphics/case-study/ink-wash-horizontal.webp)',
                maskSize: '100% 100%',
                WebkitMaskSize: '100% 100%',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
              }}
              onAnimationComplete={() => {
                if (transitionState === 'entering') handleEnterComplete();
                else if (transitionState === 'exiting') handleExitComplete();
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
