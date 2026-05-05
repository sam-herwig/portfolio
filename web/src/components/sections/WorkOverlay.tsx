'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import PixelTitle from '@/components/sections/PixelTitle';
import { getFeaturedProjects, getProjectFeaturedVideo, type Project } from '@/data/projects';
import { MODULE_WINDOWS, sceneOpacity } from '@/lib/moduleTimeline';

const CORNER_POSITIONS = [
  'md:top-16 md:left-16',
  'md:top-16 md:right-16',
  'md:bottom-16 md:left-16',
  'md:bottom-16 md:right-16',
] as const;

function FrameHoldCard({
  project,
  index,
  position,
  videoSrc,
}: {
  project: Project;
  index: number;
  position: string;
  videoSrc: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEnter = () => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  };
  const handleLeave = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  return (
    <Link
      href={`/work/${project.slug}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`work-card group/card relative z-10 flex flex-col gap-1.5 md:absolute md:max-w-[16rem] md:gap-2.5 ${position}`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-foreground/5 md:w-[16rem]">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={project.thumbnail}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover saturate-0 transition-[filter] duration-500 group-hover/card:saturate-100"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center saturate-0 transition-[filter] duration-500 group-hover/card:saturate-100"
            style={{ backgroundImage: `url(${project.thumbnail})` }}
          />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-65 transition-opacity duration-500 group-hover/card:opacity-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 3px)',
            mixBlendMode: 'multiply',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-500 group-hover/card:opacity-0"
          style={{
            boxShadow: 'inset 2px 0 0 rgba(255,32,96,0.55), inset -2px 0 0 rgba(48,160,255,0.55)',
            mixBlendMode: 'screen',
          }}
        />
        <span
          className="absolute bottom-2 right-2 rounded-[2px] bg-foreground/85 px-1.5 py-0.5 text-[9px] font-medium tracking-[0.18em] text-background"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          00:00 / 00:04
        </span>
      </div>
      <span
        className="text-[10px] uppercase tracking-[0.4em] text-foreground/45"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        {String(index + 1).padStart(2, '0')} · {project.year ?? '—'}
      </span>
      <h3
        className="text-balance text-sm font-medium leading-tight tracking-tight md:text-2xl"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0',
        }}
      >
        {project.title}{' '}
        <span className="inline-block translate-y-[-2px] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
          ↗
        </span>
      </h3>
    </Link>
  );
}

export default function WorkOverlay({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (v) => sceneOpacity(v, MODULE_WINDOWS.work));
  const pointerEvents = useTransform(opacity, (v) => (v > 0.5 ? 'auto' : 'none'));
  const projects = getFeaturedProjects().slice(0, 4);

  return (
    <motion.div
      style={{ opacity, pointerEvents }}
      className="work-card-grid absolute bottom-0 left-0 top-1/2 z-10 grid w-full grid-cols-2 grid-rows-2 gap-3 p-4 md:inset-y-0 md:top-0 md:block md:w-1/2 md:p-0"
    >
      <div className="hidden md:absolute md:left-16 md:top-1/2 md:block md:-translate-y-1/2">
        <PixelTitle
          text="Work"
          anim="drop"
          progress={progress}
          window={MODULE_WINDOWS.work}
          className="text-5xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-7xl"
        />
      </div>
      {projects.map((p, i) => (
        <FrameHoldCard
          key={p.slug}
          project={p}
          index={i}
          position={CORNER_POSITIONS[i]}
          videoSrc={getProjectFeaturedVideo(p)}
        />
      ))}
    </motion.div>
  );
}
