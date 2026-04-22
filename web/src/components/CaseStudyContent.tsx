'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';
import { useRef } from 'react';
import { Project, ContentBlock, StationBreak, getFeaturedProjects } from '@/data/projects';
import WoodcutBorder from '@/components/WoodcutBorder';
import TrailSpine from '@/components/TrailSpine';
import TrailCounter from '@/components/TrailCounter';
import NewBelgiumSpotlight from '@/components/spotlights/NewBelgiumSpotlight';
import CraftedKitPipelineSpotlight from '@/components/spotlights/CraftedKitPipelineSpotlight';
import { INK_WASH_HORIZONTAL_SRC } from '@/lib/specimenCatalog';

interface AdjacentStudy {
  title: string;
  slug: string;
}

interface CaseStudyProps {
  project: Project;
  prev?: AdjacentStudy | null;
  next?: AdjacentStudy | null;
}

/* ── The 5 trail stations rendered on the spine ─────────── */
const TRAIL_STATIONS = [
  { roman: 'I', title: 'Trailhead' },
  { roman: 'II', title: 'The Ascent' },
  { roman: 'III', title: 'The Ridge' },
  { roman: 'IV', title: 'The Summit' },
  { roman: 'V', title: 'The Descent' },
];

/* ── Scroll-driven reveal wrapper ────────────────────────── */

function ScrollReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.9', 'start 0.55'],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [32, 0]);
  return (
    <motion.div ref={ref} style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Masthead ─────────────────────────────────────────────── */

function MastheadBlockRenderer({ project }: { project: Project }) {
  const { title, subtitle, tags, projectUrl, openingQuote, client, year, role, deliverables } = project;
  const metaParts = [client, year, role, deliverables?.join(' · ')].filter(Boolean) as string[];
  return (
    <ScrollReveal>
      <div className="py-16 md:py-24">
        {openingQuote && (
          <p className="mb-12 max-w-3xl font-instrument text-2xl md:text-3xl italic text-foreground/70 leading-[1.3]">
            {openingQuote}
          </p>
        )}
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">
          Field Journal — Case Study
        </p>
        <h1 className="font-instrument text-6xl md:text-8xl lg:text-[8rem] font-bold leading-[0.92] tracking-tight">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl font-instrument text-2xl md:text-3xl italic text-foreground/60 leading-tight">
          {subtitle}
        </p>
        {metaParts.length > 0 && (
          <dl className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/55">
            {client && (
              <div className="flex items-baseline gap-2">
                <dt className="text-foreground/35">Client</dt>
                <dd>{client}</dd>
              </div>
            )}
            {year && (
              <div className="flex items-baseline gap-2">
                <dt className="text-foreground/35">Year</dt>
                <dd>{year}</dd>
              </div>
            )}
            {role && (
              <div className="flex items-baseline gap-2">
                <dt className="text-foreground/35">Role</dt>
                <dd>{role}</dd>
              </div>
            )}
            {deliverables && deliverables.length > 0 && (
              <div className="flex items-baseline gap-2">
                <dt className="text-foreground/35">Scope</dt>
                <dd>{deliverables.join(' · ')}</dd>
              </div>
            )}
          </dl>
        )}
        {tags && tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="border border-foreground/15 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {projectUrl && (
          <a
            href={projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-foreground/70 transition-colors hover:text-foreground"
          >
            View Live Site →
          </a>
        )}
      </div>
    </ScrollReveal>
  );
}

/* ── Station break ───────────────────────────────────────── */

/**
 * Per-station atmosphere watermark. Station III uses the project's
 * signatureLandmark; the others map to a shared terrain/weather sprite so
 * each station feels like a different place in the climb.
 */
const STATION_ATMOSPHERE: Record<StationBreak['roman'], string | null> = {
  I: '/assets/graphics/case-study/terrain-rolling-hillside.webp',
  II: '/assets/graphics/case-study/terrain-rocky-trail.webp',
  III: null, // uses project.signatureLandmark
  IV: '/assets/graphics/case-study/cloud-cumulus-cluster.webp',
  V: '/assets/graphics/case-study/wildflower-meadow-strip.webp',
};

const SUMMIT_DRIFT_SRC = '/assets/graphics/case-study/cloud-wispy-stratus.webp';

function StationBreakBlockRenderer({ block, signatureLandmark }: { block: StationBreak; signatureLandmark?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const watermark = block.roman === 'III' ? signatureLandmark : STATION_ATMOSPHERE[block.roman];
  const isSummit = block.roman === 'IV';

  // Typography-as-transition. The page-turn is: rule draws → label fades → title rises →
  // Roman numeral stamps. No overlays. Fires one-shot when the station enters view.
  const baseT = prefersReducedMotion ? 0 : 1;
  const ruleVariant = {
    hidden: { scaleX: 0 },
    visible: { scaleX: 1, transition: { duration: 0.7 * baseT, ease: [0.22, 1, 0.36, 1] as const } },
  };
  const labelVariant = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 * baseT, delay: 0.25 * baseT, ease: 'easeOut' as const } },
  };
  const titleVariant = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55 * baseT, delay: 0.4 * baseT, ease: [0.22, 1, 0.36, 1] as const },
    },
  };
  const subtitleVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 * baseT, delay: 0.6 * baseT, ease: 'easeOut' as const } },
  };
  const numeralVariant = {
    hidden: { opacity: 0, scale: 0.94 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8 * baseT, delay: 0.15 * baseT, ease: [0.22, 1, 0.36, 1] as const },
    },
  };
  // Empty orchestrator variants so the parent propagates "hidden"/"visible"
  // state to children even when its own styles don't change. Without this,
  // tall station blocks (esp. Summit) can fail to resolve child variants
  // because Framer Motion only inherits through a parent that has variants.
  const containerVariants = { hidden: {}, visible: {} };

  return (
    <div className="relative py-20 md:py-32">
      {watermark && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.07]">
          <Image src={watermark} alt="" fill className="object-contain object-center" sizes="100vw" />
        </div>
      )}
      {isSummit && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.06]"
          initial={{ x: '-8%' }}
          animate={prefersReducedMotion ? { x: 0 } : { x: ['-8%', '8%', '-8%'] }}
          transition={
            prefersReducedMotion ? undefined : { duration: 60, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' }
          }
        >
          <Image src={SUMMIT_DRIFT_SRC} alt="" fill className="object-contain object-top" sizes="100vw" />
        </motion.div>
      )}
      <motion.div
        className="relative"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {/* Ink-wash sweep — subtle horizontal brush stroke that washes across
            the station header as it crosses into view. Foreground-token ink
            at low opacity, gated by reduced-motion. */}
        {!prefersReducedMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 left-0 right-0 h-16 md:h-20 origin-left"
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: [0, 0.3, 0] }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.4, times: [0, 0.55, 1], ease: [0.22, 1, 0.36, 1] }}
            style={{
              backgroundColor: '#18181b',
              maskImage: 'url(/assets/graphics/case-study/ink-wash-horizontal.webp)',
              WebkitMaskImage: 'url(/assets/graphics/case-study/ink-wash-horizontal.webp)',
              maskSize: '100% 100%',
              WebkitMaskSize: '100% 100%',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
            }}
          />
        )}
        {/* Outline Roman numeral anchored to the outer margin — stamps in.
            On mobile we drop size + opacity so it reads as a watermark instead
            of colliding with the station label. */}
        <motion.span
          variants={numeralVariant}
          className="pointer-events-none absolute -top-2 -left-2 select-none font-instrument text-[6rem] font-bold leading-none text-foreground/[0.05] md:-top-4 md:-left-8 md:text-[14rem] md:text-foreground/[0.08]"
          aria-hidden="true"
          style={{ transformOrigin: 'left top' }}
        >
          {block.roman}
        </motion.span>
        <div className="relative ml-2 md:ml-20">
          {/* Horizontal rule — draws left to right as the page-break gesture */}
          <motion.div variants={ruleVariant} className="mb-8 h-px w-full origin-left bg-foreground/25" />
          <motion.p
            variants={labelVariant}
            className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40"
          >
            Station {block.roman}
          </motion.p>
          <motion.h2
            variants={titleVariant}
            className="font-instrument text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight"
          >
            {block.title}
          </motion.h2>
          {block.subtitle && (
            <motion.p
              variants={subtitleVariant}
              className="mt-4 max-w-xl font-instrument text-xl md:text-2xl italic text-foreground/60 leading-snug"
            >
              {block.subtitle}
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Text ─────────────────────────────────────────────────── */

function TextBlockRenderer({ heading, body, dropCap }: { heading: string; body: string; dropCap?: boolean }) {
  return (
    <ScrollReveal>
      <div>
        {heading && (
          <h3 className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/50">{heading}</h3>
        )}
        <div className="space-y-5 font-instrument text-xl md:text-[1.55rem] leading-[1.45] text-foreground/85">
          {body.split('\n\n').map((para, i) => (
            <p key={i} className={dropCap && i === 0 ? 'drop-cap-5' : undefined}>
              {para}
            </p>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ── Media ────────────────────────────────────────────────── */

function MediaBlockRenderer({
  src,
  alt,
  aspect = '16/9',
  caption,
  figNumber,
  borderVariant = 'torn',
}: {
  src: string;
  alt: string;
  aspect?: string;
  caption?: string;
  figNumber?: string;
  borderVariant?: 'torn' | 'organic';
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
    <ScrollReveal className="flex flex-col">
      {figNumber && (
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/40">{figNumber}</span>
        </div>
      )}
      <div className={`group relative ${aspectClass} overflow-hidden bg-foreground/5`}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 80vw"
        />
        <WoodcutBorder variant={borderVariant} />
      </div>
      {caption && (
        <p className="mt-3 px-6 text-right font-instrument text-base italic text-foreground/55 md:px-0">{caption}</p>
      )}
    </ScrollReveal>
  );
}

/* ── Video ────────────────────────────────────────────────── */

function VideoBlockRenderer({
  src,
  poster,
  alt,
  aspect = '16/9',
  caption,
  figNumber,
}: {
  src: string;
  poster?: string;
  alt: string;
  aspect?: string;
  caption?: string;
  figNumber?: string;
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
    <ScrollReveal className="flex flex-col">
      {figNumber && (
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/40">{figNumber}</span>
        </div>
      )}
      <div ref={containerRef} className={`relative ${aspectClass} overflow-hidden bg-foreground/5`}>
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      {caption && (
        <p className="mt-3 px-6 text-right font-instrument text-base italic text-foreground/55 md:px-0">{caption}</p>
      )}
    </ScrollReveal>
  );
}

/* ── Spotlight — routes to the bespoke component per project ─ */

function SpotlightBlockRenderer({ spotlightId, caption }: { spotlightId: string; caption?: string }) {
  if (spotlightId === 'new-belgium-theme-switcher') {
    return (
      <ScrollReveal>
        <NewBelgiumSpotlight caption={caption} />
      </ScrollReveal>
    );
  }
  if (spotlightId === 'craftedkit-pipeline') {
    return (
      <ScrollReveal>
        <CraftedKitPipelineSpotlight caption={caption} />
      </ScrollReveal>
    );
  }
  // Fallback placeholder (should not render in prod — MB + CC slots stripped)
  return null;
}

/* ── Specimen (marginalia sprite) ────────────────────────── */

function SpecimenBlockRenderer({ src, figNumber, label }: { src: string; figNumber: string; label: string }) {
  return (
    <ScrollReveal>
      <figure className="flex flex-col items-center gap-3 py-4">
        <div className="relative aspect-square w-full max-w-[9rem] opacity-80">
          <Image src={src} alt={label} fill className="object-contain" sizes="144px" />
        </div>
        <figcaption className="text-center">
          <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/40">{figNumber}</div>
          <div className="mt-1 max-w-[14ch] font-instrument text-xs italic leading-tight text-foreground/60">
            {label}
          </div>
        </figcaption>
      </figure>
    </ScrollReveal>
  );
}

/* ── Frieze (horizontal scroll-driven specimen strip) ────── */

function FriezeBlockRenderer({ specimens, title }: { specimens: string[]; title?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Total horizontal travel — scale with number of tiles
  const travelEnd = `-${Math.max(0, (specimens.length - 1) * 30)}%`;
  const x = useTransform(scrollYProgress, [0.1, 0.9], ['0%', travelEnd]);

  return (
    <div ref={containerRef} className="my-20 md:my-28">
      {title && (
        <div className="mb-8 ml-6 mr-6 md:ml-20 md:mr-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">
            Specimens collected along the ascent
          </p>
          <p className="mt-2 font-instrument text-2xl italic text-foreground/70 md:text-3xl">{title}</p>
        </div>
      )}
      <div className="overflow-hidden">
        <motion.div className="flex gap-6 pl-6 pr-6 md:pl-20 md:pr-20" style={{ x }}>
          {specimens.map((src, i) => (
            <FriezeTile key={`${src}-${i}`} src={src} index={i} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function FriezeTile({ src, index }: { src: string; index: number }) {
  const isVideo = src.endsWith('.mp4') || src.endsWith('.webm');
  return (
    <figure className="relative aspect-[4/3] w-[70vw] shrink-0 overflow-hidden border border-foreground/15 bg-foreground/[0.04] md:w-[42vw]">
      {isVideo ? (
        <video
          src={src}
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <Image src={src} alt="" fill sizes="(min-width: 768px) 42vw, 70vw" className="object-contain" />
      )}
      <figcaption className="absolute bottom-3 left-3 bg-background/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/60">
        Specimen {String(index + 1).padStart(2, '0')}
      </figcaption>
    </figure>
  );
}

/* ── Metric (sticky count-up) ─────────────────────────────── */

function MetricBlockRenderer({ value, unit, label }: { value: string; unit?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'start 0.3'],
  });

  const numeric = parseFloat(value.replace(/[^0-9.]/g, ''));
  const isPureNumber = !Number.isNaN(numeric) && `${numeric}` === value.replace(/[^0-9.]/g, '');
  const counter = useTransform(scrollYProgress, [0, 1], [0, numeric || 0]);
  const rounded = useRoundedMotionValue(counter);

  return (
    <div ref={ref} className="relative my-24 flex flex-col items-center md:my-32">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]">
        <Image
          src="/assets/graphics/case-study/wildflower-meadow-strip.webp"
          alt=""
          fill
          className="object-contain object-bottom"
          sizes="100vw"
        />
      </div>
      <ScrollReveal>
        <div className="flex flex-col items-center">
          {isPureNumber ? (
            <motion.span className="font-instrument text-[10rem] font-bold leading-none tabular-nums md:text-[16rem]">
              {rounded}
            </motion.span>
          ) : (
            <span className="font-instrument text-[10rem] font-bold leading-none tabular-nums md:text-[16rem]">
              {value}
            </span>
          )}
          {unit && <span className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-foreground/50">{unit}</span>}
          <p className="mt-6 max-w-md text-center font-instrument text-lg italic text-foreground/60">{label}</p>
        </div>
      </ScrollReveal>
    </div>
  );
}

/** Round a number MotionValue to an integer string */
function useRoundedMotionValue(v: MotionValue<number>): MotionValue<string> {
  return useTransform(v, (n) => {
    if (Number.isNaN(n)) return '0';
    return Math.round(n).toString();
  });
}

/* ── Block dispatcher ─────────────────────────────────────── */

function BlockRenderer({
  block,
  project,
  dropCap,
  mediaBlockIdx,
}: {
  block: ContentBlock;
  project: Project;
  dropCap: boolean;
  mediaBlockIdx: number;
}) {
  switch (block.type) {
    case 'masthead':
      return <MastheadBlockRenderer project={project} />;
    case 'station':
      return <StationBreakBlockRenderer block={block} signatureLandmark={project.signatureLandmark} />;
    case 'text-block':
      return <TextBlockRenderer heading={block.heading} body={block.body} dropCap={dropCap} />;
    case 'media-block':
      return (
        <MediaBlockRenderer
          src={block.src}
          alt={block.alt}
          aspect={block.aspect}
          caption={block.caption}
          figNumber={block.figNumber}
          borderVariant={mediaBlockIdx % 2 === 0 ? 'torn' : 'organic'}
        />
      );
    case 'video-block':
      return (
        <VideoBlockRenderer
          src={block.src}
          poster={block.poster}
          alt={block.alt}
          aspect={block.aspect}
          caption={block.caption}
          figNumber={block.figNumber}
        />
      );
    case 'spotlight-block':
      return <SpotlightBlockRenderer spotlightId={block.spotlightId} caption={block.caption} />;
    case 'specimen':
      return <SpecimenBlockRenderer src={block.src} figNumber={block.figNumber} label={block.label} />;
    case 'frieze':
      return <FriezeBlockRenderer specimens={block.specimens} title={block.title} />;
    case 'metric':
      return <MetricBlockRenderer value={block.value} unit={block.unit} label={block.label} />;
    default:
      return null;
  }
}

/* ── Grid placement helper ────────────────────────────────── */

function gridClassFor(block: ContentBlock, textBlockIdx: number): string {
  const base = 'col-span-12';
  switch (block.type) {
    case 'masthead':
      return `${base} lg:col-start-2 lg:col-span-10`;
    case 'station':
      return `${base}`; // full-width station head
    case 'text-block':
      return textBlockIdx % 2 === 0 ? `${base} lg:col-start-2 lg:col-span-6` : `${base} lg:col-start-7 lg:col-span-6`;
    case 'media-block':
      if (block.fullBleed) return `${base} -mx-6 md:-mx-16`;
      return `${base} lg:col-start-3 lg:col-span-9`;
    case 'video-block':
      return `${base} lg:col-start-3 lg:col-span-9`;
    case 'spotlight-block':
      return `${base} lg:col-start-3 lg:col-span-8`;
    case 'specimen':
      if (block.side === 'left') {
        return `hidden lg:block lg:col-start-1 lg:col-span-2 lg:self-center`;
      }
      return `hidden lg:block lg:col-start-11 lg:col-span-2 lg:self-center`;
    case 'frieze':
      return `${base} -mx-6 md:-mx-16`;
    case 'metric':
      return `${base}`;
    default:
      return base;
  }
}

/* ── Main component ───────────────────────────────────────── */

export default function CaseStudyContent({ project, prev, next }: CaseStudyProps) {
  const { blocks } = project;
  const hasBlocks = blocks && blocks.length > 0;
  const articleRef = useRef<HTMLElement>(null);

  const featured = getFeaturedProjects();
  const totalFeatured = featured.length;
  const projectIndex = featured.findIndex((p) => p.slug === project.slug) + 1;

  // Pre-compute text/media block indices + drop-cap eligibility per block
  const enrichedBlocks = (blocks ?? []).map((block, i) => {
    const textBlockIdx =
      block.type === 'text-block'
        ? (blocks ?? []).slice(0, i + 1).filter((b) => b.type === 'text-block').length - 1
        : 0;
    const mediaBlockIdx =
      block.type === 'media-block'
        ? (blocks ?? []).slice(0, i + 1).filter((b) => b.type === 'media-block').length - 1
        : 0;
    const prevBlock = i > 0 ? (blocks ?? [])[i - 1] : null;
    const dropCap = block.type === 'text-block' && !!prevBlock && prevBlock.type === 'station';
    return { block, textBlockIdx, mediaBlockIdx, dropCap };
  });

  return (
    <article ref={articleRef} className="w-full">
      {/* Hero spacer — CaseStudyScene owns the actual hero moment */}
      <div className="h-screen" aria-hidden="true" />

      {hasBlocks ? (
        <>
          <TrailSpine containerRef={articleRef} stations={TRAIL_STATIONS} />
          <TrailCounter index={projectIndex > 0 ? projectIndex : 1} total={totalFeatured} />

          <div className="mx-auto grid max-w-[92rem] grid-cols-12 gap-x-6 gap-y-4 px-6 md:px-16 pb-16">
            {enrichedBlocks.map(({ block, textBlockIdx, mediaBlockIdx, dropCap }, i) => (
              <div key={`${block.type}-${i}`} className={gridClassFor(block, textBlockIdx)}>
                <BlockRenderer block={block} project={project} dropCap={dropCap} mediaBlockIdx={mediaBlockIdx} />
              </div>
            ))}
          </div>

          {/* Ink-wash divider before summit ending */}
          <div className="relative mx-auto my-8 h-24 max-w-[80rem] opacity-30">
            <Image src={INK_WASH_HORIZONTAL_SRC} alt="" fill className="object-contain" sizes="100vw" />
          </div>

          <SummitEnding project={project} />
        </>
      ) : (
        <LegacyContent project={project} />
      )}

      {/* Trail-fork navigation */}
      <nav className="flex items-center justify-between border-t border-foreground/10 px-6 md:px-16 pt-8 pb-16">
        {prev ? (
          <Link href={`/work/${prev.slug}`} className="group flex flex-col items-start">
            <span className="mb-1 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-foreground/60">
              <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">←</span>{' '}
              Previous Trail
            </span>
            <span className="font-instrument text-2xl font-bold transition-colors group-hover:text-foreground/80">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link href={`/work/${next.slug}`} className="group flex flex-col items-end">
            <span className="mb-1 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-foreground/60">
              Next Trail{' '}
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
            <span className="font-instrument text-2xl font-bold transition-colors group-hover:text-foreground/80">
              {next.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  );
}

/* ── Summit ending ────────────────────────────────────────── */

function SummitEnding({ project }: { project: Project }) {
  const sites = project.relatedSites;
  return (
    <ScrollReveal className="py-16 md:py-24 text-center">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">Summit Reached</p>
      <h3 className="font-instrument text-3xl md:text-5xl font-bold">{project.title}</h3>
      <p className="mx-auto mt-3 max-w-md font-instrument text-lg italic text-foreground/60">
        {project.overview.headline}
      </p>
      {sites && sites.length > 0 ? (
        <div className="mx-auto mt-10 max-w-3xl">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">
            Live Sites — Same Codebase
          </p>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
            {sites.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-baseline justify-between gap-3 border-b border-foreground/10 py-2 text-left transition-colors hover:border-foreground/40"
                >
                  <span className="font-instrument text-lg italic text-foreground/85 transition-colors group-hover:text-foreground">
                    {s.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/40">
                    {s.tag} →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        project.projectUrl && (
          <a
            href={project.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-foreground/60 transition-colors hover:text-foreground"
          >
            View Live Site →
          </a>
        )
      )}
    </ScrollReveal>
  );
}

/* ── Legacy fallback (kept for projects without blocks[]) ── */

function LegacyContent({ project }: { project: Project }) {
  const { title, overview, sections, gallery } = project;
  const remainingImages = gallery && gallery.length > 1 ? gallery.slice(1) : [];

  return (
    <div className="space-y-10 px-4 py-8 md:space-y-16 md:px-16 md:py-12">
      {sections && sections.length > 0 ? (
        <div className="space-y-12">
          {sections.map((section, i) => (
            <ScrollReveal key={i}>
              <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-foreground/60">
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
          {overview.headline && <h2 className="mb-4 text-2xl font-bold">{overview.headline}</h2>}
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
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-foreground/60">The Work</h2>
          <div className="space-y-4">
            {remainingImages.map((src, i) => (
              <ScrollReveal key={i}>
                <div className="group relative aspect-video overflow-hidden rounded-lg bg-foreground/5">
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
