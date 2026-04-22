'use client';

import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef } from 'react';

interface WoodcutBorderProps {
  /** Accent color for the ink tone — defaults to currentColor (foreground token) */
  accent?: string;
  /** Which mask variant to use */
  variant?: 'organic' | 'torn';
}

/**
 * Scroll-driven woodcut border overlay for media blocks.
 *
 * Renders a colored overlay whose visible region is defined by a
 * mask image (the woodcut border). As the element scrolls into view,
 * the overlay shrinks inward and fades — revealing the image beneath.
 */
export default function WoodcutBorder({ accent, variant = 'torn' }: WoodcutBorderProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.9', 'start 0.3'],
  });

  // Overlay starts fully visible, fades out as user scrolls past
  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.6, 0]);

  // Mask scales from covering the full image to shrinking inward
  const maskScale = useTransform(scrollYProgress, [0, 1], [1.15, 1.5]);

  const maskSrc =
    variant === 'organic'
      ? '/assets/graphics/case-study/border-organic-edge.webp'
      : '/assets/graphics/case-study/border-torn-edge.webp';

  const color = accent ?? 'currentColor';
  const maskSizeValue = useTransformToPercent(maskScale);

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        opacity,
        backgroundColor: color,
        WebkitMaskImage: `url(${maskSrc})`,
        maskImage: `url(${maskSrc})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat' as string,
        WebkitMaskPosition: 'center',
        maskPosition: 'center' as string,
        WebkitMaskSize: maskSizeValue,
        maskSize: maskSizeValue as MotionValue<string>,
      }}
    />
  );
}

/** Maps a numeric MotionValue to a "N% N%" CSS string for mask-size. */
function useTransformToPercent(scale: MotionValue<number>): MotionValue<string> {
  return useTransform(scale, (s: number) => {
    const pct = s * 100;
    return `${pct}% ${pct}%`;
  });
}
