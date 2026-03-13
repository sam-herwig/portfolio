'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import CaseStudyContent from './CaseStudyContent';

interface CaseStudyModalProps {
  caseStudy: any;
}

export default function CaseStudyModal({ caseStudy }: CaseStudyModalProps) {
  const router = useRouter();

  // Lock body scroll on mount
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleClose = useCallback(() => {
    router.back();
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
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-5xl mx-2 my-4 md:mx-4 md:my-8 max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto bg-background rounded-xl md:rounded-2xl shadow-2xl border border-foreground/10">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="sticky top-2 float-right mr-2 mt-2 md:top-4 md:mr-4 md:mt-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors text-foreground"
          aria-label="Close"
        >
          ✕
        </button>
        <CaseStudyContent caseStudy={caseStudy} />
      </div>
    </div>
  );
}
