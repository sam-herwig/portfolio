'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DefaultLoadingManager } from 'three';
import { useAppStore } from '@/store/useAppStore';

const milestones = [
  { label: 'Base Camp', altitude: '0m', progress: 0 },
  { label: 'Tree Line', altitude: '2,400m', progress: 0.3 },
  { label: 'Alpine', altitude: '3,600m', progress: 0.6 },
  { label: 'Summit', altitude: '4,200m', progress: 0.9 },
];

export default function Preloader() {
  const hasLoaded = useAppStore((s) => s.hasLoaded);
  const [loadProgress, setLoadProgress] = useState(0);
  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);

  // Measure path length on mount
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  // Wire DefaultLoadingManager for real asset progress
  useEffect(() => {
    const manager = DefaultLoadingManager;

    manager.onStart = () => {
      // total tracked via onProgress
    };

    manager.onProgress = (_url: string, itemsLoaded: number, itemsTotal: number) => {
      if (itemsTotal > 0) {
        setLoadProgress(itemsLoaded / itemsTotal);
      }
    };

    manager.onLoad = () => {
      setLoadProgress(1);
      setTimeout(() => {
        useAppStore.getState().setHasLoaded(true);
      }, 800);
    };

    // Safety timeout: if loading takes >15s, force complete
    const timeout = setTimeout(() => {
      useAppStore.getState().setHasLoaded(true);
    }, 15000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <AnimatePresence>
      {!hasLoaded && (
        <motion.div
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-8"
        >
          {/* Topographic SVG contour */}
          <svg viewBox="0 0 400 200" className="w-full max-w-md" aria-hidden="true">
            <path
              ref={pathRef}
              d="M 0,180 L 40,160 L 80,140 L 100,120 L 130,100 L 150,110 L 170,80 L 200,60 L 220,70 L 250,40 L 280,30 L 310,20 L 340,25 L 370,15 L 400,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-foreground/30"
              style={
                pathLength > 0
                  ? {
                      strokeDasharray: pathLength,
                      strokeDashoffset: pathLength * (1 - loadProgress),
                      transition: 'stroke-dashoffset 0.3s ease-out',
                    }
                  : undefined
              }
            />
          </svg>

          {/* Altitude milestone markers */}
          <div className="flex flex-col gap-2 items-start min-w-[180px]">
            {milestones.map((m) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 10 }}
                animate={loadProgress >= m.progress ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex items-baseline gap-2"
              >
                <span className="text-xs font-mono text-foreground/40">{m.altitude}</span>
                <span className="text-sm font-mono text-foreground/70">{m.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Progress percentage */}
          <span className="text-xs font-mono text-foreground/30 tracking-widest">
            {Math.round(loadProgress * 100)}%
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
