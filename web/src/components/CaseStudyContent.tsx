'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Project, ContentBlock } from '@/data/projects';
import WoodcutBorder from '@/components/WoodcutBorder';
import ElevationProfile from '@/components/ElevationProfile';

interface AdjacentStudy {
  title: string;
  slug: string;
}

interface CaseStudyProps {
  project: Project;
  prev?: AdjacentStudy | null;
  next?: AdjacentStudy | null;
}

/* ── Scroll-driven block wrappers ──────────────────────────── */

function ScrollReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'start 0.55'],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <motion.div ref={ref} style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Block renderers ───────────────────────────────────────── */

function ChapterBreakBlock({ title, index }: { title: string; index: number }) {
  return (
    <ScrollReveal className="flex items-center gap-4 py-12 md:py-16">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/20 text-xs font-mono text-foreground/50">
          {index + 1}
        </span>
        <span className="text-xs font-mono uppercase tracking-[0.25em] text-foreground/50">{title}</span>
      </div>
      <div className="flex-1 h-px bg-foreground/10" />
    </ScrollReveal>
  );
}

function TextBlockRenderer({ heading, body }: { heading: string; body: string }) {
  return (
    <ScrollReveal>
      <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/60 mb-4">{heading}</h2>
      <div className="prose prose-lg max-w-none text-foreground/80">
        {body.split('\n\n').map((para, i) => (
          <p key={i} className="mb-4 last:mb-0">
            {para}
          </p>
        ))}
      </div>
    </ScrollReveal>
  );
}

function MediaBlockRenderer({
  src,
  alt,
  aspect = '16/9',
  fullBleed,
}: {
  src: string;
  alt: string;
  aspect?: string;
  fullBleed?: boolean;
}) {
  const aspectClass =
    aspect === '21/9'
      ? 'aspect-[21/9]'
      : aspect === '4/3'
        ? 'aspect-[4/3]'
        : aspect === '1/1'
          ? 'aspect-square'
          : 'aspect-video';

  return (
    <ScrollReveal className={fullBleed ? '-mx-4 md:-mx-16' : ''}>
      <div className={`group relative ${aspectClass} rounded-lg overflow-hidden bg-foreground/5`}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <WoodcutBorder />
      </div>
    </ScrollReveal>
  );
}

function VideoBlockRenderer({
  src,
  poster,
  alt,
  aspect = '16/9',
}: {
  src: string;
  poster?: string;
  alt: string;
  aspect?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Auto-play/pause based on visibility
  useTransform(scrollYProgress, (v: number) => {
    if (!ref.current) return;
    if (v > 0.2 && v < 0.8) {
      ref.current.play().catch(() => {});
    } else {
      ref.current.pause();
    }
  });

  const aspectClass = aspect === '21/9' ? 'aspect-[21/9]' : 'aspect-video';

  return (
    <ScrollReveal>
      <div ref={containerRef} className={`relative ${aspectClass} rounded-lg overflow-hidden bg-foreground/5`}>
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          aria-label={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </ScrollReveal>
  );
}

function SpotlightBlockRenderer({ spotlightId }: { spotlightId: string }) {
  return (
    <ScrollReveal>
      <div className="relative rounded-2xl border border-foreground/10 bg-foreground/5 p-8 md:p-12 min-h-[300px] flex items-center justify-center">
        <p className="text-sm font-mono uppercase tracking-widest text-foreground/30">Interactive: {spotlightId}</p>
      </div>
    </ScrollReveal>
  );
}

/* ── Block dispatcher ──────────────────────────────────────── */

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'chapter-break':
      return <ChapterBreakBlock title={block.title} index={block.index} />;
    case 'text-block':
      return <TextBlockRenderer heading={block.heading} body={block.body} />;
    case 'media-block':
      return <MediaBlockRenderer src={block.src} alt={block.alt} aspect={block.aspect} fullBleed={block.fullBleed} />;
    case 'video-block':
      return <VideoBlockRenderer src={block.src} poster={block.poster} alt={block.alt} aspect={block.aspect} />;
    case 'spotlight-block':
      return <SpotlightBlockRenderer spotlightId={block.spotlightId} />;
    default:
      return null;
  }
}

/* ── Summit ending ─────────────────────────────────────────── */

function SummitEnding({ project }: { project: Project }) {
  return (
    <ScrollReveal className="py-16 md:py-24 text-center">
      <div className="h-px bg-foreground/10 mb-12" />
      <p className="text-xs font-mono uppercase tracking-[0.25em] text-foreground/40 mb-4">Summit Reached</p>
      <h3 className="text-2xl md:text-3xl font-instrument font-bold mb-2">{project.title}</h3>
      <p className="text-foreground/60 max-w-md mx-auto">{project.overview.headline}</p>
      {project.projectUrl && (
        <a
          href={project.projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-6 text-sm font-mono uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors"
        >
          View Live Site →
        </a>
      )}
    </ScrollReveal>
  );
}

/* ── Main component ────────────────────────────────────────── */

export default function CaseStudyContent({ project, prev, next }: CaseStudyProps) {
  const { title, subtitle, tags, projectUrl, blocks, palette } = project;
  const hasBlocks = blocks && blocks.length > 0;
  const articleRef = useRef<HTMLElement>(null);

  return (
    <article
      ref={articleRef}
      className="w-full"
      style={
        palette
          ? ({ '--cs-accent': palette.accent, '--cs-accent-muted': palette.accentMuted } as React.CSSProperties)
          : undefined
      }
    >
      {/* Scene-setting hero — 130vh tall, title sticks then releases */}
      <header className="relative h-[130vh]">
        <div className="sticky top-[55vh] px-4 md:px-16 pb-12 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <p className="text-xs font-mono uppercase tracking-[0.25em] text-foreground/40 mb-4">Case Study</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-instrument font-bold tracking-tight">{title}</h1>
            <p className="text-xl md:text-2xl text-foreground/60 mt-3 max-w-2xl">{subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-2 mt-6"
          >
            {tags?.map((tag: string, i: number) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.05, ease: 'easeOut' }}
                className="px-3 py-1 text-xs font-mono uppercase tracking-widest bg-foreground/5 rounded-full border border-foreground/10"
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>

          {projectUrl && (
            <motion.a
              href={projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="inline-flex items-center gap-2 mt-6 text-sm font-mono uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors"
            >
              View Live Site →
            </motion.a>
          )}
        </div>
      </header>

      {/* Scrollytelling blocks */}
      {hasBlocks ? (
        <>
          <ElevationProfile blocks={blocks} containerRef={articleRef} />
          <div className="px-4 md:px-16 max-w-4xl space-y-6 md:space-y-8 pb-8">
            {blocks.map((block, i) => (
              <BlockRenderer key={`${block.type}-${i}`} block={block} />
            ))}
          </div>
          <SummitEnding project={project} />
        </>
      ) : (
        /* Legacy fallback: render old sections + gallery */
        <LegacyContent project={project} />
      )}

      {/* Trail-fork navigation */}
      <nav className="flex justify-between items-center border-t border-foreground/10 px-4 md:px-16 pt-8 pb-16">
        {prev ? (
          <Link href={`/work/${prev.slug}`} className="group flex flex-col items-start">
            <span className="text-xs font-mono uppercase tracking-widest text-foreground/60 mb-1 inline-flex items-center gap-1">
              <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">←</span>{' '}
              Previous Trail
            </span>
            <span className="text-lg font-bold group-hover:text-foreground/80 transition-colors">{prev.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link href={`/work/${next.slug}`} className="group flex flex-col items-end">
            <span className="text-xs font-mono uppercase tracking-widest text-foreground/60 mb-1 inline-flex items-center gap-1">
              Next Trail{' '}
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
            <span className="text-lg font-bold group-hover:text-foreground/80 transition-colors">{next.title}</span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  );
}

/* ── Legacy fallback for projects without blocks ───────────── */

function LegacyContent({ project }: { project: Project }) {
  const { title, overview, sections, gallery } = project;
  const remainingImages = gallery && gallery.length > 1 ? gallery.slice(1) : [];

  return (
    <div className="px-4 py-8 md:px-16 md:py-12 space-y-10 md:space-y-16">
      {sections && sections.length > 0 ? (
        <div className="space-y-12">
          {sections.map((section, i) => (
            <ScrollReveal key={i}>
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/60 mb-4">
                {section.heading}
              </h2>
              <div className="prose prose-lg max-w-none text-foreground/80">
                {section.body.split('\n\n').map((para, j) => (
                  <p key={j} className="mb-4 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            </ScrollReveal>
          ))}
        </div>
      ) : overview ? (
        <section>
          {overview.headline && <h2 className="text-2xl font-bold mb-4">{overview.headline}</h2>}
          <div className="prose prose-lg max-w-none text-foreground/80">
            {overview.body.split('\n\n').map((para, i) => (
              <p key={i} className="mb-4 last:mb-0">
                {para}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {remainingImages.length > 0 && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/60 mb-4">The Work</h2>
          <div className="space-y-4">
            {remainingImages.map((src, i) => (
              <ScrollReveal key={i}>
                <div className="group relative aspect-video rounded-lg overflow-hidden bg-foreground/5">
                  <Image
                    src={src}
                    alt={`${title} screenshot ${i + 2}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
