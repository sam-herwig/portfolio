'use client';

import { m, useTransform, type MotionValue } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import PixelTitle from '@/components/sections/PixelTitle';
import { getFeaturedProjects, getProjectFeaturedVideo, type Project } from '@/data/projects';
import { MODULE_WINDOWS, overlayOpacity } from '@/lib/moduleTimeline';

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
  // Touch devices never fire onMouseEnter — without this, mobile users stare
  // at a static poster + scanline frame and never see the video tell.
  const handleTouch = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
  };

  return (
    <Link
      href={`/work/${project.slug}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchStart={handleTouch}
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

// Mobile layout: 2x2 grid with title between rows. Unchanged from original.
function MobileWorkLayout({ projects, progress }: { projects: Project[]; progress?: MotionValue<number> }) {
  const top = projects.slice(0, 2);
  const bottom = projects.slice(2, 4);
  return (
    <div className="flex flex-1 flex-col gap-2 md:hidden">
      <div className="grid flex-1 grid-cols-2 gap-2">
        {top.map((p, i) => (
          <FrameHoldCard key={p.slug} project={p} index={i} videoSrc={getProjectFeaturedVideo(p)} />
        ))}
      </div>
      <div className="flex items-center justify-center py-2">
        <PixelTitle
          text="Work"
          as="h2"
          mount={!progress}
          progress={progress}
          window={MODULE_WINDOWS.work}
          className="text-4xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-5xl"
        />
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2">
        {bottom.map((p, i) => (
          <FrameHoldCard key={p.slug} project={p} index={i + 2} videoSrc={getProjectFeaturedVideo(p)} />
        ))}
      </div>
    </div>
  );
}

// Desktop layout: 4 cards at viewport corners, "Work" title floating dead-center.
// Cards sized at 24vw × 28vh — large enough to read at 1280px viewport without
// crowding the title, balanced enough to leave the shader visible in the middle.
function DesktopWorkLayout({ projects, progress }: { projects: Project[]; progress?: MotionValue<number> }) {
  const cornerCard = (index: number, position: string) => {
    const project = projects[index];
    if (!project) return null;
    return (
      <div className={`absolute h-[28vh] w-[24vw] ${position}`}>
        <FrameHoldCard project={project} index={index} videoSrc={getProjectFeaturedVideo(project)} />
      </div>
    );
  };

  return (
    <div className="hidden md:block">
      {cornerCard(0, 'left-6 top-6 lg:left-10 lg:top-10')}
      {cornerCard(1, 'right-6 top-6 lg:right-10 lg:top-10')}
      {cornerCard(2, 'bottom-6 left-6 lg:bottom-10 lg:left-10')}
      {cornerCard(3, 'bottom-6 right-6 lg:bottom-10 lg:right-10')}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <PixelTitle
          text="Work"
          as="h2"
          mount={!progress}
          progress={progress}
          window={MODULE_WINDOWS.work}
          className="text-5xl font-medium leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-7xl xl:text-8xl"
        />
      </div>
    </div>
  );
}

function WorkInner({ progress }: { progress?: MotionValue<number> }) {
  const projects = getFeaturedProjects().slice(0, 4);
  return (
    <>
      <MobileWorkLayout projects={projects} progress={progress} />
      <DesktopWorkLayout projects={projects} progress={progress} />
    </>
  );
}

export default function WorkOverlay({ progress }: { progress?: MotionValue<number> }) {
  if (!progress) {
    return (
      <section className="relative flex min-h-[80svh] w-full flex-col gap-3 p-3 md:block md:min-h-[100svh] md:p-0">
        <WorkInner />
      </section>
    );
  }

  return <WorkOverlayMotion progress={progress} />;
}

function WorkOverlayMotion({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (v) => overlayOpacity(v, MODULE_WINDOWS.work));
  const pointerEvents = useTransform(opacity, (v) => (v > 0.5 ? 'auto' : 'none'));

  return (
    <m.div
      style={{ opacity, pointerEvents }}
      className="work-card-grid absolute bottom-0 left-0 top-1/2 z-10 flex w-full flex-col gap-2 p-3 md:bottom-0 md:left-0 md:right-0 md:top-0 md:block md:w-full md:p-0"
    >
      <WorkInner progress={progress} />
    </m.div>
  );
}
