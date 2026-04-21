'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';

const NOTES: Record<string, string> = {
  'new-belgium': 'we shipped this at 4am — the theme switcher was the third draft. the first two were boring.',
  craftedkit: 'built the pipeline on a weekend. by monday it had written three pages of copy without me.',
  'mission-bell': "the client wanted 'calm but alive'. turns out bells & fog do most of the work.",
  'consume-and-create': 'chemex fade was a happy accident. I was debugging steam physics at 2am.',
};

export default function MarginNote({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const note = NOTES[slug] ?? 'a little note from the field.';

  const handleClick = () => {
    useFoundEggs.getState().markFound('margin-note');
    setOpen(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(false), 5000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Margin note from Sam"
        data-egg="margin-note"
        className="relative block h-16 w-16 transition-transform duration-300 hover:scale-105"
      >
        <Image
          src="/eggs/margin-note-folded.webp"
          alt=""
          fill
          className="object-contain mix-blend-multiply"
          sizes="64px"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[88px] left-0 w-[min(78vw,360px)]"
          >
            <div className="relative h-[220px]">
              <Image
                src="/eggs/margin-note-unfolded.webp"
                alt=""
                fill
                className="object-contain mix-blend-multiply"
                sizes="360px"
              />
              <p className="absolute inset-0 flex items-center justify-center px-10 text-center font-instrument text-[13px] italic leading-snug text-foreground/85">
                {note}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
