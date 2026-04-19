'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

export default function BackToTrail() {
  const startTransition = useAppStore((s) => s.startTransition);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startTransition({ x: e.clientX, y: e.clientY }, '#09090b', '/');
    },
    [startTransition],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed top-4 left-4 z-50 md:top-6 md:left-6"
    >
      <Link
        href="/"
        onClick={handleClick}
        className="group inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/80 px-4 py-2 text-xs font-mono uppercase tracking-widest text-foreground/60 shadow-[0_6px_20px_-8px_rgba(0,0,0,0.25)] backdrop-blur-md transition-colors hover:text-foreground md:px-5 md:py-2.5 md:text-sm"
      >
        <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">←</span>
        Back to Trail
      </Link>
    </motion.div>
  );
}
