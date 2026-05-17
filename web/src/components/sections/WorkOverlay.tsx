'use client';

import { m, useTransform, type MotionValue } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import PixelTitle from '@/components/sections/PixelTitle';
import { getFeaturedProjects, getProjectFeaturedVideo, type Project } from '@/data/projects';
import { overlayOpacity, useTimeline } from '@/lib/moduleTimeline';

// Map homepage scroll progress (0..1 across the full timeline) to 0..1
// across the Work module's IDLE beat. Mobile uses this to drive the Work
// reel's per-card crossfade; desktop reads the same value but doesn't
// currently animate against it (5-up grid is static during IDLE).
function useWorkIdleU(progress: MotionValue<number>): MotionValue<number> {
  const { modules } = useTimeline();
  const start = modules.about.exitEnd;
  const end = modules.work.exitStart;
  return useTransform(progress, (v) => Math.max(0, Math.min(1, (v - start) / (end - start))));
}

// Mobile Work reel — 5 cards stacked at the same position, opacity-
// crossfade based on `workIdleU`. ~10 svh / 340 svh ≈ 0.03 normalized
// crossfade width centered on each card boundary.
const REEL_CARD_COUNT = 5;
const REEL_CROSSFADE = 0.03;

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function reelCardOpacity(u: number, index: number, total: number, crossfade: number): number {
  const half = crossfade / 2;
  const enterCenter = index / total;
  const exitCenter = (index + 1) / total;
  // First card holds opacity 1 from u=0; last card holds opacity 1 through u=1.
  // Interior boundaries crossfade across `crossfade` width.
  const fadeIn = index === 0 ? 1 : smoothstep(enterCenter - half, enterCenter + half, u);
  const fadeOut = index === total - 1 ? 0 : smoothstep(exitCenter - half, exitCenter + half, u);
  return Math.max(0, fadeIn - fadeOut);
}

function WorkCard({ project, index, videoSrc }: { project: Project; index: number; videoSrc: string | null }) {
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
  // at a static poster and never see the video tell.
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
      />
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
            {'↗︎'}
          </span>
        </h3>
      </div>
    </Link>
  );
}

function ReelCard({
  project,
  index,
  videoSrc,
  workIdleU,
}: {
  project: Project;
  index: number;
  videoSrc: string | null;
  workIdleU: MotionValue<number>;
}) {
  const opacity = useTransform(workIdleU, (u) => reelCardOpacity(u, index, REEL_CARD_COUNT, REEL_CROSSFADE));
  // Only the currently-revealed card accepts taps — stacked cards underneath
  // would otherwise swallow the click via z-ordering.
  const pointerEvents = useTransform(opacity, (v) => (v > 0.5 ? 'auto' : 'none'));
  return (
    <m.div style={{ opacity, pointerEvents }} className="absolute inset-0">
      <WorkCard project={project} index={index} videoSrc={videoSrc} />
    </m.div>
  );
}

// Desktop: title sits in a top band; the body below is a 3+2 grid with all
// cards the same size. Row 2 is centered, leaving the shader visible in the
// margins on either side. No cycling — cards arrive together via the
// surrounding overlay opacity transform and sit static for the 100svh IDLE.
function DesktopWorkLayout({ projects, progress }: { projects: Project[]; progress?: MotionValue<number> }) {
  const { modules } = useTimeline();
  const topRow = projects.slice(0, 3);
  const bottomRow = projects.slice(3, 5);

  return (
    <div className="hidden h-full w-full flex-col gap-[2vh] px-[6vw] py-[6vh] md:flex">
      <div className="flex items-center justify-center">
        <PixelTitle
          text="Work"
          as="h2"
          mount={!progress}
          progress={progress}
          window={modules.work}
          className="text-5xl font-medium leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-7xl xl:text-8xl"
        />
      </div>
      <div className="flex flex-1 flex-col gap-[2vh]">
        <div className="grid flex-1 grid-cols-3 gap-[2vw]">
          {topRow.map((project, i) => (
            <WorkCard key={project.slug} project={project} index={i} videoSrc={getProjectFeaturedVideo(project)} />
          ))}
        </div>
        <div className="mx-auto grid w-[calc((100%-2vw)*2/3)] flex-1 grid-cols-2 gap-[2vw]">
          {bottomRow.map((project, i) => (
            <WorkCard key={project.slug} project={project} index={i + 3} videoSrc={getProjectFeaturedVideo(project)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Mobile Work reel — shader renders in the top half via MODULE_CANVAS_SLOT_
// MOBILE.work; this overlay fills the bottom half with the 5 cards stacked
// at the same position. Each card crossfades in/out around card-boundary
// thresholds in workIdleU space (~60svh dwell + ~10svh crossfade).
// No PixelTitle on mobile per ADR 0007.
function MobileWorkReel({ projects, workIdleU }: { projects: Project[]; workIdleU: MotionValue<number> }) {
  return (
    <div className="absolute inset-0 md:hidden">
      <div className="absolute bottom-0 left-0 right-0 h-1/2 px-4 pb-4">
        {projects.map((project, i) => (
          <ReelCard
            key={project.slug}
            project={project}
            index={i}
            videoSrc={getProjectFeaturedVideo(project)}
            workIdleU={workIdleU}
          />
        ))}
      </div>
    </div>
  );
}

// Reduced-motion / no-progress fallback: same layout shape as the live
// overlay, but mobile renders the full stack without translate (the user
// scrolls naturally past it). Desktop is already static.
function StaticWorkLayout({ projects }: { projects: Project[] }) {
  const { modules } = useTimeline();
  return (
    <section className="relative flex w-full flex-col gap-4 p-3 md:p-6">
      <PixelTitle
        text="Work"
        as="h2"
        mount
        window={modules.work}
        className="text-4xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-5xl md:text-6xl"
      />
      <div className="flex flex-col gap-4">
        {projects.map((p, i) => (
          <div key={p.slug} className="aspect-video w-full">
            <WorkCard project={p} index={i} videoSrc={getProjectFeaturedVideo(p)} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function WorkOverlay({ progress }: { progress?: MotionValue<number> }) {
  const projects = getFeaturedProjects();

  if (!progress) {
    return <StaticWorkLayout projects={projects} />;
  }

  return <WorkOverlayMotion projects={projects} progress={progress} />;
}

function WorkOverlayMotion({ projects, progress }: { projects: Project[]; progress: MotionValue<number> }) {
  const { modules } = useTimeline();
  const opacity = useTransform(progress, (v) => overlayOpacity(v, modules.work));
  const pointerEvents = useTransform(opacity, (v) => (v > 0.5 ? 'auto' : 'none'));
  const workIdleU = useWorkIdleU(progress);

  return (
    <m.div style={{ opacity, pointerEvents }} className="work-card-grid absolute inset-0 z-10">
      <MobileWorkReel projects={projects} workIdleU={workIdleU} />
      <DesktopWorkLayout projects={projects} progress={progress} />
    </m.div>
  );
}
