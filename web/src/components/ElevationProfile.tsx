'use client';

import { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { ContentBlock } from '@/data/projects';

/* ── Types ────────────────────────────────────────────────── */

interface Waypoint {
  label: string;
  y: number;
}

interface ElevationData {
  /** Full SVG path (d attribute) */
  path: string;
  /** Chapter waypoints with label and position */
  waypoints: Waypoint[];
  /** Total path length for stroke-dasharray clipping */
  totalPoints: number;
}

interface ElevationProfileProps {
  blocks: ContentBlock[];
  /** Reference to the scrollable article container */
  containerRef: React.RefObject<HTMLElement | null>;
}

/* ── Constants ────────────────────────────────────────────── */

const SVG_WIDTH = 40;
const SVG_HEIGHT = 300;
const PADDING_Y = 16;
const CENTER_X = SVG_WIDTH / 2;
const MIN_DEFLECTION = 3;
const MAX_DEFLECTION = 14;

/* ── Build elevation path from blocks array ───────────────── */

function buildElevation(blocks: ContentBlock[]): ElevationData {
  if (blocks.length === 0) {
    return { path: '', waypoints: [], totalPoints: 0 };
  }

  // Identify chapter indices and segment sizes
  const chapterIndices: number[] = [];

  blocks.forEach((b, i) => {
    if (b.type === 'chapter-break') {
      chapterIndices.push(i);
    }
  });

  // If no chapters, just draw a straight line
  if (chapterIndices.length === 0) {
    const startY = PADDING_Y;
    const endY = SVG_HEIGHT - PADDING_Y;
    return {
      path: `M ${CENTER_X} ${startY} L ${CENTER_X} ${endY}`,
      waypoints: [],
      totalPoints: blocks.length,
    };
  }

  // Calculate block counts between chapters to determine density
  const segments: number[] = [];
  for (let i = 0; i < chapterIndices.length; i++) {
    const start = chapterIndices[i];
    const end = i < chapterIndices.length - 1 ? chapterIndices[i + 1] : blocks.length;
    segments.push(end - start - 1); // blocks in this chapter (minus the break itself)
  }

  // Include blocks before first chapter
  const preChapterBlocks = chapterIndices[0];

  const maxSegment = Math.max(...segments, 1);

  // Build points along the path
  const usableHeight = SVG_HEIGHT - PADDING_Y * 2;
  const totalBlocks = blocks.length;
  const points: { x: number; y: number }[] = [];
  const waypoints: Waypoint[] = [];

  // Determine which chapter each block belongs to for deflection
  let currentSegmentDensity = preChapterBlocks > 0 ? preChapterBlocks / Math.max(maxSegment, 1) : 0;
  let chapterCursor = 0;

  for (let i = 0; i < totalBlocks; i++) {
    const block = blocks[i];
    const t = i / (totalBlocks - 1);
    const y = PADDING_Y + t * usableHeight;

    // Update density when we hit a chapter break
    if (block.type === 'chapter-break') {
      currentSegmentDensity = (segments[chapterCursor] ?? 0) / Math.max(maxSegment, 1);
      const deflection = MIN_DEFLECTION + currentSegmentDensity * (MAX_DEFLECTION - MIN_DEFLECTION);
      // Alternate left/right by chapter index
      const direction = chapterCursor % 2 === 0 ? -1 : 1;
      const x = CENTER_X + direction * deflection;

      waypoints.push({ label: block.title, y });
      points.push({ x, y });
      chapterCursor++;
    } else {
      // Content block: deflect based on current segment density
      const deflection = MIN_DEFLECTION + currentSegmentDensity * (MAX_DEFLECTION - MIN_DEFLECTION);
      const direction = (chapterCursor - 1) % 2 === 0 ? -1 : 1;
      // Add slight per-block variation
      const variation = Math.sin(i * 0.7) * 2;
      const x = CENTER_X + direction * deflection + variation;
      points.push({ x, y });
    }
  }

  // Build smooth SVG path using cubic bezier curves
  if (points.length < 2) {
    return { path: '', waypoints, totalPoints: totalBlocks };
  }

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    // Vertical control points for smooth curves
    const midY = (prev.y + curr.y) / 2;
    path += ` C ${prev.x.toFixed(1)} ${midY.toFixed(1)}, ${curr.x.toFixed(1)} ${midY.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }

  return { path, waypoints, totalPoints: totalBlocks };
}

/* ── Animated dot component ───────────────────────────────── */

function GlowDot({ path, progress }: { path: string; progress: MotionValue<number> }) {
  const pathRef = useRef<SVGPathElement>(null);

  const cx = useTransform(progress, (p) => {
    if (!pathRef.current) return CENTER_X;
    const len = pathRef.current.getTotalLength();
    const pt = pathRef.current.getPointAtLength(p * len);
    return pt.x;
  });

  const cy = useTransform(progress, (p) => {
    if (!pathRef.current) return PADDING_Y;
    const len = pathRef.current.getTotalLength();
    const pt = pathRef.current.getPointAtLength(p * len);
    return pt.y;
  });

  return (
    <>
      {/* Hidden path for point-at-length calculations */}
      <path ref={pathRef} d={path} fill="none" stroke="none" />
      {/* Glow */}
      <motion.circle cx={cx} cy={cy} r={5} fill="var(--cs-accent, currentColor)" opacity={0.3} />
      {/* Dot */}
      <motion.circle cx={cx} cy={cy} r={2.5} fill="var(--cs-accent, currentColor)" />
    </>
  );
}

/* ── Main component ───────────────────────────────────────── */

export default function ElevationProfile({ blocks, containerRef }: ElevationProfileProps) {
  const { path, waypoints } = useMemo(() => buildElevation(blocks), [blocks]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Stroke dashoffset for the active portion
  const activePathRef = useRef<SVGPathElement>(null);

  const dashOffset = useTransform(scrollYProgress, (p) => {
    if (!activePathRef.current) return 1000;
    const totalLen = activePathRef.current.getTotalLength();
    return totalLen * (1 - p);
  });

  const dashArray = useTransform(scrollYProgress, () => {
    if (!activePathRef.current) return '1000';
    return `${activePathRef.current.getTotalLength()}`;
  });

  if (!path || waypoints.length === 0) return null;

  return (
    <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col items-center">
      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="overflow-visible"
      >
        {/* Inactive trail (full path, muted) */}
        <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.15} />

        {/* Active trail (accent color, clipped by scroll) */}
        <motion.path
          ref={activePathRef}
          d={path}
          fill="none"
          stroke="var(--cs-accent, currentColor)"
          strokeWidth={1.5}
          strokeLinecap="round"
          style={{
            strokeDasharray: dashArray,
            strokeDashoffset: dashOffset,
          }}
        />

        {/* Waypoint markers + labels */}
        {waypoints.map((wp) => (
          <g key={wp.label}>
            {/* Small tick mark */}
            <line
              x1={SVG_WIDTH - 8}
              y1={wp.y}
              x2={SVG_WIDTH}
              y2={wp.y}
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.2}
            />
            {/* Chapter label */}
            <text
              x={SVG_WIDTH + 4}
              y={wp.y}
              dy="0.35em"
              className="fill-current text-[7px] font-mono uppercase tracking-wider"
              opacity={0.4}
            >
              {wp.label}
            </text>
          </g>
        ))}

        {/* Tracking dot */}
        <GlowDot path={path} progress={scrollYProgress} />
      </svg>
    </div>
  );
}
