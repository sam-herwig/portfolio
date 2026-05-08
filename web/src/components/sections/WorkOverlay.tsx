'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import PixelTitle from '@/components/sections/PixelTitle';
import { getFeaturedProjects, getProjectFeaturedVideo, type Project } from '@/data/projects';
import { MODULE_WINDOWS, sceneOpacity } from '@/lib/moduleTimeline';

function FrameHoldCard({ project, index, videoSrc }: { project: Project; index: number; videoSrc: string | null }) {
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
      aria-label={`Visit ${project.title} case study`}
      className="work-card group/card relative block h-full w-full overflow-hidden bg-foreground/5"
    >
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={project.thumbnail}
          aria-hidden="true"
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
      {/* Scanline texture, fades on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-65 transition-opacity duration-500 group-hover/card:opacity-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 3px)',
          mixBlendMode: 'multiply',
        }}
      />
      {/* Chromatic aberration borders, fade on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-500 group-hover/card:opacity-0"
        style={{
          boxShadow: 'inset 2px 0 0 rgba(255,32,96,0.55), inset -2px 0 0 rgba(48,160,255,0.55)',
          mixBlendMode: 'screen',
        }}
      />
      {/* Bottom gradient for text legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
      />
      {/* Title + meta overlay */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3 md:gap-1.5 md:p-4 lg:p-5">
        <span
          className="text-[10px] uppercase tracking-[0.4em] text-white/65 md:text-xs"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {String(index + 1).padStart(2, '0')} · {project.year ?? '—'}
        </span>
        <h3
          className="text-balance text-base font-medium leading-tight tracking-tight text-white md:text-lg lg:text-xl xl:text-2xl"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0',
          }}
        >
          {project.title}{' '}
          <span
            aria-hidden
            className="inline-block translate-y-[-2px] text-white/55 transition-all duration-300 group-hover/card:translate-x-1 group-hover/card:translate-y-[-4px] group-hover/card:text-white"
          >
            ↗
          </span>
        </h3>
      </div>
      {/* Timecode badge stays as a video-player tell, moved to top-right so it doesn't fight the title */}
      <span
        aria-hidden
        className="absolute right-2 top-2 rounded-[2px] bg-foreground/85 px-1.5 py-0.5 text-[9px] font-medium tracking-[0.18em] text-background"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        00:00 / 00:04
      </span>
    </Link>
  );
}

function WorkInner({ progress }: { progress?: MotionValue<number> }) {
  const projects = getFeaturedProjects().slice(0, 4);
  const top = projects.slice(0, 2);
  const bottom = projects.slice(2, 4);

  return (
    <>
      <div className="flex items-center justify-center py-2 md:row-start-2 md:py-4">
        <PixelTitle
          text="Work"
          as="h2"
          mount={!progress}
          progress={progress}
          window={MODULE_WINDOWS.work}
          className="text-4xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 md:contents md:gap-3">
        <div className="grid flex-1 grid-cols-2 gap-2 md:row-start-1 md:gap-3">
          {top.map((p, i) => (
            <FrameHoldCard key={p.slug} project={p} index={i} videoSrc={getProjectFeaturedVideo(p)} />
          ))}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 md:row-start-3 md:gap-3">
          {bottom.map((p, i) => (
            <FrameHoldCard key={p.slug} project={p} index={i + 2} videoSrc={getProjectFeaturedVideo(p)} />
          ))}
        </div>
      </div>
    </>
  );
}

export default function WorkOverlay({ progress }: { progress?: MotionValue<number> }) {
  if (!progress) {
    return (
      <section className="relative flex min-h-[80svh] w-full flex-col gap-3 p-3 md:grid md:grid-rows-[1fr_auto_1fr] md:p-6">
        <WorkInner />
      </section>
    );
  }

  return <WorkOverlayMotion progress={progress} />;
}

function WorkOverlayMotion({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (v) => sceneOpacity(v, MODULE_WINDOWS.work));
  const pointerEvents = useTransform(opacity, (v) => (v > 0.5 ? 'auto' : 'none'));

  return (
    <motion.div
      style={{ opacity, pointerEvents }}
      className="work-card-grid absolute bottom-0 left-0 top-1/2 z-10 flex w-full flex-col gap-2 p-3 md:top-0 md:grid md:w-1/2 md:grid-rows-[1fr_auto_1fr] md:gap-3 md:p-6"
    >
      <WorkInner progress={progress} />
    </motion.div>
  );
}
