'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CaseStudyContent from './CaseStudyContent';
import { Project } from '@/data/projects';

interface CaseStudyModalProps {
  project: Project;
}

export default function CaseStudyModal({ project }: CaseStudyModalProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  // Lock body scroll on mount
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => router.back(), 350);
  }, [router]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-40">
      <AnimatePresence>
        {!isClosing && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/80"
              onClick={handleClose}
            />

            {/* Content panel */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 top-12 z-50 bg-background rounded-t-3xl overflow-y-auto"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="sticky top-2 float-right mr-2 mt-2 md:top-4 md:mr-4 md:mt-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors text-foreground"
                aria-label="Close"
              >
                ✕
              </button>

              <CaseStudyContent project={project} />

              {/* Continue the Climb */}
              <div className="text-center py-12">
                <button
                  onClick={handleClose}
                  className="group text-sm font-mono uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors"
                >
                  Continue the Climb
                  <span className="inline-block ml-2 group-hover:-translate-y-1 transition-transform">↑</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
