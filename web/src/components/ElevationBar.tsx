'use client';

import { useMemo, useRef, useState } from 'react';
import { motion, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion';

/**
 * ElevationBar — horizontal elevation profile pinned to the bottom edge.
 *
 * Five zone altitudes (Basecamp → Summit) are plotted as a smooth terrain
 * silhouette. The portion you've scrolled past renders as an inked fill with
 * a soft brush-stroke leading edge; the path ahead is a ghosted outline. A
 * dotted guide line marks your current x with a live altitude readout below.
 * Desktop only.
 */

interface Zone {
  label: string;
  progress: number;
  altitude: number;
}

const ZONES: Zone[] = [
  { label: 'Basecamp', progress: 0.0, altitude: 8400 },
  { label: 'Forest', progress: 0.22, altitude: 9200 },
  { label: 'Camp', progress: 0.44, altitude: 10800 },
  { label: 'Alpine', progress: 0.64, altitude: 12600 },
  { label: 'Summit', progress: 0.84, altitude: 14430 },
];

const MIN_ALT = 8000;
const MAX_ALT = 14800;
const VB_WIDTH = 800;
const PROFILE_TOP = 10;
const PROFILE_BOTTOM = 72;
const VB_HEIGHT = PROFILE_BOTTOM + 29; // extra below baseline for labels
const PAD_X = 28;
const MAX_PROGRESS = ZONES[ZONES.length - 1].progress; // 0.84 — summit anchor

function altToY(alt: number) {
  const t = (alt - MIN_ALT) / (MAX_ALT - MIN_ALT);
  return PROFILE_BOTTOM - t * (PROFILE_BOTTOM - PROFILE_TOP);
}

function progressToX(p: number) {
  const clamped = Math.max(0, Math.min(MAX_PROGRESS, p));
  return PAD_X + (clamped / MAX_PROGRESS) * (VB_WIDTH - PAD_X * 2);
}

/** Build cardinal-spline cubic-bezier path through the five zone points */
function buildCurvePath(): string {
  const pts = ZONES.map((z) => ({ x: progressToX(z.progress), y: altToY(z.altitude) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function buildTerrainPath(curve: string): string {
  const firstX = progressToX(ZONES[0].progress);
  const lastX = progressToX(ZONES[ZONES.length - 1].progress);
  return `M ${firstX} ${PROFILE_BOTTOM} L ${firstX} ${altToY(ZONES[0].altitude)} ${curve.slice(1)} L ${lastX} ${PROFILE_BOTTOM} Z`;
}

/** Altitude at a given scroll position, linearly interpolated between zones */
function altitudeAt(p: number): number {
  const cp = Math.max(0, Math.min(MAX_PROGRESS, p));
  for (let i = 0; i < ZONES.length - 1; i++) {
    if (cp >= ZONES[i].progress && cp <= ZONES[i + 1].progress) {
      const t = (cp - ZONES[i].progress) / (ZONES[i + 1].progress - ZONES[i].progress);
      const smoothT = t * t * (3 - 2 * t);
      return Math.round(ZONES[i].altitude + smoothT * (ZONES[i + 1].altitude - ZONES[i].altitude));
    }
  }
  return ZONES[ZONES.length - 1].altitude;
}

interface ElevationBarProps {
  scrollProgress: MotionValue<number>;
}

export default function ElevationBar({ scrollProgress }: ElevationBarProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedAlt, setDisplayedAlt] = useState(ZONES[0].altitude);
  const lastAlt = useRef(ZONES[0].altitude);

  const curve = useMemo(() => buildCurvePath(), []);
  const terrain = useMemo(() => buildTerrainPath(curve), [curve]);

  useMotionValueEvent(scrollProgress, 'change', (p) => {
    // Active zone: closest by progress
    let closest = 0;
    let minDist = Infinity;
    ZONES.forEach((z, i) => {
      const dist = Math.abs(p - z.progress);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    if (closest !== activeIndex) setActiveIndex(closest);

    // Altitude readout — throttle to ~10 ft granularity
    const alt = altitudeAt(p);
    const rounded = Math.round(alt / 10) * 10;
    if (rounded !== lastAlt.current) {
      lastAlt.current = rounded;
      setDisplayedAlt(rounded);
    }
  });

  // Guide x-coord (SVG space)
  const signpostX = useTransform(scrollProgress, (p) => progressToX(p));

  // Leading-edge gradient stops — soft brush fade over ~32 SVG units
  const fadeStart = useTransform(signpostX, (v) => v - 32);
  const fadeEnd = signpostX;

  // Bar fade in/out based on scroll
  const shellOpacity = useTransform(scrollProgress, [0.04, 0.08, 0.96, 1.0], [0, 1, 1, 0]);

  const handleJump = (p: number) => {
    const doc = document.documentElement;
    const target = p * (doc.scrollHeight - window.innerHeight);
    window.scrollTo({ top: target, behavior: 'smooth' });
  };

  return (
    <motion.div
      style={{ opacity: shellOpacity }}
      className="pointer-events-none fixed bottom-6 left-1/2 z-30 hidden w-[min(70vw,440px)] -translate-x-1/2 md:block"
    >
      <div className="pointer-events-auto relative rounded-2xl border border-foreground/15 bg-background/85 px-5 pb-3 pt-4 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.2)] backdrop-blur-md">
        <svg
          viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
          className="block w-full overflow-visible text-foreground"
          preserveAspectRatio="none"
          role="img"
          aria-label="Elevation profile — click a station to jump"
        >
          <defs>
            {/* Gradient for the soft ink-wash leading edge. Fixed 32-unit width
                in user space so it doesn't stretch with scroll. */}
            <motion.linearGradient
              id="elev-leading-fade"
              gradientUnits="userSpaceOnUse"
              x1={fadeStart}
              x2={fadeEnd}
              y1={0}
              y2={0}
            >
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </motion.linearGradient>
            <mask id="elev-past-mask">
              <rect x={0} y={0} width={VB_WIDTH} height={VB_HEIGHT} fill="url(#elev-leading-fade)" />
            </mask>
          </defs>

          {/* Axis baseline */}
          <line
            x1={PAD_X}
            y1={PROFILE_BOTTOM}
            x2={VB_WIDTH - PAD_X}
            y2={PROFILE_BOTTOM}
            stroke="currentColor"
            strokeOpacity={0.18}
            strokeWidth={1}
          />

          {/* Future outline — the ghosted curve ahead */}
          <path d={curve} stroke="currentColor" strokeOpacity={0.32} strokeWidth={1.5} fill="none" />

          {/* Past terrain — inked fill, masked at the leading edge */}
          <path d={terrain} fill="currentColor" fillOpacity={0.55} mask="url(#elev-past-mask)" />

          {/* Past terrain — darker ridge line on top of fill for crispness */}
          <path
            d={curve}
            stroke="currentColor"
            strokeOpacity={0.85}
            strokeWidth={1.5}
            fill="none"
            mask="url(#elev-past-mask)"
          />

          {/* Station markers on the curve */}
          {ZONES.map((z, i) => {
            const isActive = i === activeIndex;
            return (
              <circle
                key={`marker-${z.label}`}
                cx={progressToX(z.progress)}
                cy={altToY(z.altitude)}
                r={isActive ? 4.5 : 3.5}
                fill="var(--color-background)"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeOpacity={isActive ? 0.9 : 0.45}
              />
            );
          })}

          {/* Zone labels below baseline */}
          {ZONES.map((z, i) => {
            const isActive = i === activeIndex;
            return (
              <text
                key={`label-${z.label}`}
                x={progressToX(z.progress)}
                y={PROFILE_BOTTOM + 21}
                textAnchor="middle"
                className="fill-current font-mono uppercase tracking-[0.2em]"
                style={{ fontSize: '16px' }}
                opacity={isActive ? 0.85 : 0.4}
              >
                {z.label}
              </text>
            );
          })}

          {/* Current-position dotted guide line */}
          <motion.line
            x1={signpostX}
            x2={signpostX}
            y1={PROFILE_TOP - 4}
            y2={PROFILE_BOTTOM}
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        </svg>

        {/* Altitude readout row */}
        <div className="mt-2 flex items-center justify-center font-mono text-[9px] uppercase tracking-[0.25em]">
          <span className="text-foreground">
            <span className="font-serif italic normal-case text-[11px] text-foreground/80">
              {ZONES[activeIndex].label}
            </span>
            <span className="mx-2 text-foreground/30">·</span>
            {displayedAlt.toLocaleString()} ft
          </span>
        </div>

        {/* Click-to-jump overlay — invisible buttons aligned to each station */}
        <div className="pointer-events-none absolute inset-x-5 top-4" style={{ height: `${PROFILE_BOTTOM + 24}px` }}>
          {ZONES.map((z) => (
            <button
              key={`hit-${z.label}`}
              aria-label={`Jump to ${z.label} section`}
              onClick={() => handleJump(z.progress)}
              className="pointer-events-auto absolute top-0 h-full w-14 -translate-x-1/2 cursor-pointer border-0 bg-transparent p-0"
              style={{ left: `${(progressToX(z.progress) / VB_WIDTH) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
