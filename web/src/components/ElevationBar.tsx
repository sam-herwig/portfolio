'use client';

import { motion, useTransform, MotionValue } from 'framer-motion';
import { useState, useEffect } from 'react';

const waypoints = [
  { label: 'Basecamp', progress: 0.0 },
  { label: 'Forest', progress: 0.22 },
  { label: 'Camp', progress: 0.44 },
  { label: 'Alpine', progress: 0.64 },
  { label: 'Summit', progress: 0.84 },
];

interface ElevationBarProps {
  scrollProgress: MotionValue<number>;
}

export default function ElevationBar({ scrollProgress }: ElevationBarProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Track active waypoint via scroll progress
  useEffect(() => {
    const unsubscribe = scrollProgress.on('change', (p) => {
      let closest = 0;
      let minDist = Infinity;
      waypoints.forEach((wp, i) => {
        const dist = Math.abs(p - wp.progress);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setActiveIndex(closest);
    });
    return unsubscribe;
  }, [scrollProgress]);

  // Opacity: fades in at ~8% scroll, fades out near bottom
  const fadeInOpacity = useTransform(scrollProgress, [0.05, 0.1], [0, 1]);
  const fadeOutOpacity = useTransform(scrollProgress, [0.95, 1.0], [1, 0]);

  // Combined opacity (product of both transforms — use whichever is smaller)
  // We stack two motion.divs to combine them cleanly
  const fillTop = useTransform(scrollProgress, [0, 1], ['100%', '0%']);

  return (
    <motion.div
      style={{ opacity: fadeInOpacity }}
      className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 z-30 flex-col items-end"
    >
      <motion.div style={{ opacity: fadeOutOpacity }} className="flex flex-col items-end">
        {/* Outer container: positions dots along the rail */}
        <div className="relative flex flex-col items-center" style={{ height: `${(waypoints.length - 1) * 36}px`, width: '1px' }}>

          {/* Background rail line */}
          <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-[2px] bg-foreground/15 rounded-full" />

          {/* Fill line (fills top-to-bottom as scroll increases, clipped from top) */}
          <div className="absolute left-1/2 -translate-x-1/2 w-[2px] rounded-full overflow-hidden" style={{ top: 0, bottom: 0 }}>
            <motion.div
              className="absolute left-0 right-0 bottom-0 bg-foreground/60 rounded-full"
              style={{ top: fillTop }}
            />
          </div>

          {/* Waypoint dots */}
          {waypoints.map((wp, i) => {
            const isActive = activeIndex === i;
            return (
              <button
                key={wp.label}
                aria-label={`Jump to ${wp.label} section`}
                className="absolute flex items-center gap-2 cursor-pointer group bg-transparent border-0 p-[17px] -m-[17px]"
                style={{ top: `${i * 36}px`, transform: 'translateY(-50%)' }}
                onClick={() => {
                  const scrollTarget = wp.progress * (document.documentElement.scrollHeight - window.innerHeight);
                  window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
                }}
              >
                {/* Label (left of dot, desktop only) */}
                <span
                  className={[
                    'hidden md:block text-[10px] font-mono uppercase tracking-widest transition-opacity duration-300',
                    isActive ? 'text-foreground/70' : 'text-foreground/50 group-hover:text-foreground/60',
                  ].join(' ')}
                >
                  {wp.label}
                </span>

                {/* Dot */}
                <div
                  className={[
                    'w-[10px] h-[10px] rounded-full border transition-all duration-300',
                    isActive
                      ? 'bg-foreground border-foreground/60 shadow-[0_0_6px_2px_rgba(0,0,0,0.15)] animate-pulse-dot'
                      : 'bg-transparent border-foreground/20 group-hover:border-foreground/50',
                  ].join(' ')}
                />
              </button>
            );
          })}
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(var(--foreground-rgb, 0,0,0), 0.3); }
          50% { box-shadow: 0 0 0 4px rgba(var(--foreground-rgb, 0,0,0), 0); }
        }
        .animate-pulse-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-dot {
            animation: none;
          }
        }
      `}</style>
    </motion.div>
  );
}
