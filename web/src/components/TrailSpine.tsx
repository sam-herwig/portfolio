'use client';

import { useMemo } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { STATION_MARKER_SRC } from '@/lib/specimenCatalog';

/**
 * TrailSpine — chunky scroll-drawn vertical rail pinned to the right edge.
 *
 * A backdrop-blurred paper pill carries an SVG spine with 36px signpost
 * waypoints, a 3px connecting line that fills as the reader scrolls, and
 * small-caps labels flush to the left of each chip. Desktop only.
 */

interface TrailStation {
  roman: string;
  title: string;
}

interface TrailSpineProps {
  containerRef: React.RefObject<HTMLElement | null>;
  stations: TrailStation[];
}

const SVG_WIDTH = 180;
const SVG_HEIGHT = 560;
const PADDING_Y = 44;
const CENTER_X = 150; // chip column sits on the right
const CHIP_SIZE = 36;

export default function TrailSpine({ containerRef, stations }: TrailSpineProps) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const usableHeight = SVG_HEIGHT - PADDING_Y * 2;

  const waypoints = useMemo(() => {
    if (stations.length === 0) return [];
    return stations.map((s, i) => ({
      ...s,
      y: PADDING_Y + (i / Math.max(stations.length - 1, 1)) * usableHeight,
    }));
  }, [stations, usableHeight]);

  const path = `M ${CENTER_X} ${PADDING_Y} L ${CENTER_X} ${SVG_HEIGHT - PADDING_Y}`;
  const totalLength = usableHeight;
  const dashOffset = useTransform(scrollYProgress, [0, 1], [totalLength, 0]);

  if (waypoints.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
      <div className="rounded-2xl border border-foreground/15 bg-background/85 px-3 py-4 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.2)] backdrop-blur-md">
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="block overflow-visible text-foreground"
          aria-hidden="true"
        >
          {/* Inactive rail — thicker than before so it reads */}
          <path d={path} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" opacity={0.15} />
          {/* Active drawn portion */}
          <motion.path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            style={{
              strokeDasharray: totalLength,
              strokeDashoffset: dashOffset,
            }}
          />
          {waypoints.map((wp, i) => (
            <g key={`${wp.roman}-${i}`} transform={`translate(${CENTER_X}, ${wp.y})`}>
              {/* Solid chip so the signpost never sits on live artwork */}
              <circle r={CHIP_SIZE / 2 + 2} fill="var(--color-background)" stroke="currentColor" strokeOpacity={0.2} />
              <WaypointSignpost index={i} total={waypoints.length} scrollProgress={scrollYProgress} />
              {/* Roman numeral — right-aligned, flush to the chip's left edge */}
              <text
                x={-(CHIP_SIZE / 2) - 10}
                y={-4}
                textAnchor="end"
                className="fill-current font-mono text-[11px] uppercase tracking-[0.25em]"
                opacity={0.75}
              >
                {wp.roman}
              </text>
              {/* Station title */}
              <text
                x={-(CHIP_SIZE / 2) - 10}
                y={11}
                textAnchor="end"
                className="fill-current font-serif text-[11px] italic"
                opacity={0.55}
              >
                {wp.title}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/**
 * Scroll-activated signpost waypoint. Sprite is always visible at low opacity;
 * it lifts to full saturation as the reader crosses the station's threshold.
 */
function WaypointSignpost({
  index,
  total,
  scrollProgress,
}: {
  index: number;
  total: number;
  scrollProgress: MotionValue<number>;
}) {
  const threshold = index / Math.max(total - 1, 1);
  const opacity = useTransform(scrollProgress, [Math.max(0, threshold - 0.04), threshold], [0.4, 1]);
  return (
    <motion.image
      href={STATION_MARKER_SRC}
      x={-CHIP_SIZE / 2}
      y={-CHIP_SIZE / 2}
      width={CHIP_SIZE}
      height={CHIP_SIZE}
      style={{ opacity }}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
