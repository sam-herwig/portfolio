'use client';

import { m, useTransform, type MotionValue } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import PixelTitle from '@/components/sections/PixelTitle';
import { getFeaturedProjects, getProjectFeaturedVideo, type Project } from '@/data/projects';
import { MODULE_WINDOWS, overlayOpacity } from '@/lib/moduleTimeline';

// Map homepage scroll progress (0..1 across the full timeline) to 0..1
// across the Work module's IDLE beat. Mobile uses this to translate-Y a
// vertical stack so each of the 5 cards gets prime time as the user
// scrolls through the (now static-on-desktop) Work module.
function useWorkIdleU(progress: MotionValue<number>): MotionValue<number> {
  const start = MODULE_WINDOWS.about.exitEnd;
  const end = MODULE_WINDOWS.work.exitStart;
  return useTransform(progress, (v) => Math.max(0, Math.min(1, (v - start) / (end - start))));
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
            ↗
          </span>
        </h3>
      </div>
    </Link>
  );
}

// Desktop: title sits in a top band; the body below is a 3+2 grid with all
// cards the same size. Row 2 is centered, leaving the shader visible in the
// margins on either side. No cycling — cards arrive together via the
// surrounding overlay opacity transform and sit static for the 100svh IDLE.
function DesktopWorkLayout({ projects, progress }: { projects: Project[]; progress?: MotionValue<number> }) {
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
          window={MODULE_WINDOWS.work}
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

// Mobile: title pinned at the top of the overlay; the 5 cards stack
// vertically below, full-width. The stack translate-Y's across the Work
// IDLE beat so each card gets prime screen time as the user scrolls.
function MobileWorkLayout({
  projects,
  progress,
  workIdleU,
}: {
  projects: Project[];
  progress?: MotionValue<number>;
  workIdleU: MotionValue<number>;
}) {
  // Card 40vh + 3vh gap × 4 = 212vh total stack. Viewport ~92vh usable.
  // Translate from 0 to -(212 - 92) = -120vh across IDLE u 0→1.
  const translateY = useTransform(workIdleU, (u) => `-${(u * 120).toFixed(2)}vh`);

  return (
    <div className="flex h-full w-full flex-col md:hidden">
      <div className="flex flex-shrink-0 items-center justify-center px-4 py-4">
        <PixelTitle
          text="Work"
          as="h2"
          mount={!progress}
          progress={progress}
          window={MODULE_WINDOWS.work}
          className="text-4xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-5xl"
        />
      </div>
      <div className="relative flex-1 overflow-hidden">
        <m.div className="flex flex-col gap-[3vh] px-4" style={{ y: translateY }}>
          {projects.map((project, i) => (
            <div key={project.slug} className="h-[40vh] w-full flex-shrink-0">
              <WorkCard project={project} index={i} videoSrc={getProjectFeaturedVideo(project)} />
            </div>
          ))}
        </m.div>
      </div>
    </div>
  );
}

// Reduced-motion / no-progress fallback: same layout shape as the live
// overlay, but mobile renders the full stack without translate (the user
// scrolls naturally past it). Desktop is already static.
function StaticWorkLayout({ projects }: { projects: Project[] }) {
  return (
    <section className="relative flex w-full flex-col gap-4 p-3 md:p-6">
      <PixelTitle
        text="Work"
        as="h2"
        mount
        window={MODULE_WINDOWS.work}
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
  const opacity = useTransform(progress, (v) => overlayOpacity(v, MODULE_WINDOWS.work));
  const pointerEvents = useTransform(opacity, (v) => (v > 0.5 ? 'auto' : 'none'));
  const workIdleU = useWorkIdleU(progress);

  return (
    <m.div style={{ opacity, pointerEvents }} className="work-card-grid absolute inset-0 z-10">
      <MobileWorkLayout projects={projects} progress={progress} workIdleU={workIdleU} />
      <DesktopWorkLayout projects={projects} progress={progress} />
    </m.div>
  );
}
