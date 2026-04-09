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
      className="fixed top-6 left-6 z-50"
    >
      <Link
        href="/"
        onClick={handleClick}
        className="group inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors"
      >
        <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">←</span>
        Back to Trail
      </Link>
    </motion.div>
  );
}
