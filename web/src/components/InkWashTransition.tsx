'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

/**
 * Ink wash page transition overlay.
 *
 * Mounted once in the root layout. When `transitionState` flips to 'entering',
 * a full-screen ink wash scales up from the click origin, navigates after the
 * animation completes, then plays the reverse on the destination page.
 *
 * The ink-wash-horizontal.webp texture is used as a CSS mask so the organic
 * brush-stroke edge is visible during the reveal/conceal.
 */
export default function InkWashTransition() {
  const router = useRouter();
  const { transitionState, transitionOrigin, transitionColor, transitionHref, setTransitionExiting, endTransition } =
    useAppStore();

  const hasNavigated = useRef(false);

  // After the enter animation completes, navigate and flip to exiting
  const handleEnterComplete = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    router.push(transitionHref);
    // Delay to let Next.js render the destination page before revealing it
    setTimeout(() => {
      setTransitionExiting();
    }, 300);
  }, [router, transitionHref, setTransitionExiting]);

  const handleExitComplete = useCallback(() => {
    endTransition();
    hasNavigated.current = false;
  }, [endTransition]);

  // Reset the navigation guard when we go idle
  useEffect(() => {
    if (transitionState === 'idle') {
      hasNavigated.current = false;
    }
  }, [transitionState]);

  const isActive = transitionState !== 'idle';

  // Compute the scale needed to cover the entire viewport from the origin point.
  // We need the circle (or ellipse) centered at origin to reach the farthest corner.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const ox = transitionOrigin.x;
  const oy = transitionOrigin.y;
  const maxDist = Math.sqrt(Math.max(ox, vw - ox) ** 2 + Math.max(oy, vh - oy) ** 2);
  // The mask image is roughly 800x450. We scale a container whose base size is
  // 100px so that when fully scaled it covers the viewport plus bleed.
  const baseSize = 100;
  const targetScale = (maxDist * 2.4) / baseSize;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="ink-wash-overlay"
          className="fixed inset-0 z-[9999] pointer-events-auto"
          initial={false}
          style={{ backgroundColor: 'transparent' }}
        >
          {/* Solid backdrop that fades in behind the ink to ensure full coverage */}
          <motion.div
            style={{ backgroundColor: transitionColor }}
            className="absolute inset-0"
            initial={transitionState === 'entering' ? { opacity: 0 } : { opacity: 1 }}
            animate={transitionState === 'entering' ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              duration: transitionState === 'entering' ? 0.7 : 0.6,
              ease: [0.22, 1, 0.36, 1],
              // Backdrop lags slightly behind the ink wash
              delay: transitionState === 'entering' ? 0.15 : 0,
            }}
          />

          {/* Ink wash shape — scales from origin, sits above the backdrop */}
          <motion.div
            style={{
              position: 'absolute',
              left: ox - baseSize / 2,
              top: oy - baseSize / 2,
              width: baseSize,
              height: baseSize,
              backgroundColor: transitionColor,
              maskImage: 'url(/assets/graphics/case-study/ink-wash-horizontal.webp)',
              WebkitMaskImage: 'url(/assets/graphics/case-study/ink-wash-horizontal.webp)',
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
            }}
            initial={transitionState === 'entering' ? { scale: 0, opacity: 0.8 } : { scale: targetScale, opacity: 1 }}
            animate={transitionState === 'entering' ? { scale: targetScale, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{
              duration: transitionState === 'entering' ? 0.7 : 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => {
              if (transitionState === 'entering') {
                handleEnterComplete();
              } else if (transitionState === 'exiting') {
                handleExitComplete();
              }
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
