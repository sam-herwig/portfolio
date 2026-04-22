'use client';

import { useRef, useState, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
  MotionValue,
} from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/store/useAppStore';
import { useViewportHeight } from '@/lib/useViewportHeight';

interface CaseStudyCardProps {
  title: string;
  subtitle: string;
  slug: string;
  thumbnail?: string;
  side: 'left' | 'right';
  linkable?: boolean;
  scrollProgress?: MotionValue<number>;
  range?: readonly [number, number, number, number];
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function CaseStudyCard({
  title,
  subtitle,
  slug,
  thumbnail,
  side,
  linkable = true,
  scrollProgress,
  range,
}: CaseStudyCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch] = useState(() => typeof window !== 'undefined' && 'ontouchstart' in window);
  const reducedMotion = useReducedMotion() ?? false;
  const suppressTilt = isTouch || reducedMotion;
  const vh = useViewportHeight();

  const rotateXMV = useMotionValue(0);
  const rotateYMV = useMotionValue(0);
  const rotateX = useSpring(rotateXMV, { stiffness: 200, damping: 20, mass: 0.6 });
  const rotateY = useSpring(rotateYMV, { stiffness: 200, damping: 20, mass: 0.6 });
  const setSavedScrollY = useAppStore((s) => s.setSavedScrollY);
  const startTransition = useAppStore((s) => s.startTransition);
  const handleLinkClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setSavedScrollY(window.scrollY);
      // Always use foreground token — strict monochrome, no per-project accent
      startTransition({ x: e.clientX, y: e.clientY }, '#18181b', `/work/${slug}`);
    },
    [setSavedScrollY, startTransition, slug],
  );

  // Use global timeline range when provided, fall back to local scroll tracking
  const { scrollYProgress: localProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const isOverlay = !!scrollProgress && !!range;
  const driver = scrollProgress && range ? scrollProgress : localProgress;
  const progressRange = range ? [...range] : [0.3, 0.5, 0.7, 0.9];

  const opacity = useTransform(driver, progressRange, [0, 1, 1, 0]);
  const pointerEvents = useTransform(opacity, (v: number) => (v > 0.15 ? ('auto' as const) : ('none' as const)));
  const yRange: [number, number, number] = reducedMotion
    ? [0, 0, 0]
    : isOverlay
      ? [vh * 1.0, 0, -vh * 0.4]
      : [100, 0, -100];
  const y = useTransform(driver, [progressRange[0], progressRange[1], progressRange[3]], yRange);

  const alignmentClass =
    side === 'left'
      ? 'items-center md:items-start text-center md:text-left'
      : 'items-center md:items-end text-center md:text-right';

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const ny = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    rotateYMV.set(nx * 4);
    rotateXMV.set(-ny * 4);
  };

  const resetTilt = () => {
    rotateXMV.set(0);
    rotateYMV.set(0);
  };

  const placeholderStyle = {
    backgroundImage: `
      radial-gradient(circle at ${(hash(slug) % 40) + 30}% ${(hash(slug) % 30) + 35}%, rgba(255,255,255,0.05) 0%, transparent 50%),
      radial-gradient(circle at ${((hash(slug) * 7) % 40) + 30}% ${((hash(slug) * 3) % 30) + 35}%, rgba(255,255,255,0.03) 0%, transparent 60%)
    `,
  };

  const cardInner = (
    <motion.div
      ref={cardRef}
      onMouseMove={suppressTilt ? undefined : handleMouseMove}
      onMouseEnter={suppressTilt ? undefined : () => setIsHovered(true)}
      onMouseLeave={
        suppressTilt
          ? undefined
          : () => {
              setIsHovered(false);
              resetTilt();
            }
      }
      style={{
        rotateX: suppressTilt ? 0 : rotateX,
        rotateY: suppressTilt ? 0 : rotateY,
        transformPerspective: 1200,
        boxShadow: isHovered && !isTouch ? '0 28px 60px -12px rgba(0,0,0,0.45)' : '0 20px 40px -10px rgba(0,0,0,0.3)',
        transition: 'box-shadow 0.3s ease-out',
      }}
      className="relative p-6 md:p-12 bg-background backdrop-blur-[48px] rounded-3xl border border-foreground/10 shadow-2xl group cursor-pointer overflow-hidden will-change-transform"
    >
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Thumbnail */}
        <div className="aspect-[4/3] w-full bg-foreground/10 rounded-xl mb-6 overflow-hidden relative">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover"
              loading="lazy"
              style={{
                transition: 'transform 0.5s ease-out',
                transform: isHovered && !isTouch ? 'scale(1.04)' : 'scale(1)',
              }}
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-foreground/5" />
              <div className="absolute inset-0" style={placeholderStyle} />
            </>
          )}
        </div>

        <div
          className={`flex items-baseline justify-between gap-4 mt-2 ${side === 'right' ? 'md:flex-row-reverse' : ''}`}
        >
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-instrument">{title}</h3>
          <motion.span
            aria-hidden
            initial={false}
            animate={{
              x: isHovered && !isTouch ? 0 : side === 'left' ? -6 : 6,
              opacity: isHovered && !isTouch ? 1 : 0.35,
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 font-mono text-sm uppercase tracking-[0.25em] text-foreground/70"
          >
            {side === 'left' ? '→' : '←'}
          </motion.span>
        </div>
        <p className={`text-foreground/80 font-medium mt-2 font-inter ${side === 'right' ? 'text-right' : ''}`}>
          {subtitle}
        </p>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      ref={ref}
      data-case-card={slug}
      style={{ opacity, y }}
      className={
        isOverlay
          ? `absolute inset-0 flex w-full items-center pointer-events-none transform-gpu ${side === 'left' ? 'justify-start' : 'justify-end'}`
          : `w-full min-h-[30vh] md:min-h-[40vh] flex flex-col justify-center px-4 md:px-12 lg:px-24 my-[5vh] md:my-[10vh] transform-gpu ${alignmentClass}`
      }
    >
      {linkable ? (
        <motion.div style={{ pointerEvents: isOverlay ? pointerEvents : 'auto' }} className="w-full md:w-[60%] block">
          <Link
            href={`/work/${slug}`}
            aria-label={`View ${title} case study`}
            onClick={handleLinkClick}
            className="block rounded-3xl outline-offset-[6px] focus-visible:outline-2 focus-visible:outline-foreground"
          >
            {cardInner}
          </Link>
        </motion.div>
      ) : (
        <div className="w-full md:w-[60%] block">{cardInner}</div>
      )}
    </motion.div>
  );
}
