'use client';

import Image from 'next/image';
import { STATION_MARKER_SRC } from '@/lib/specimenCatalog';

interface TrailCounterProps {
  /** 1-based index of this project in the featured set */
  index: number;
  /** Total number of featured projects */
  total: number;
}

/**
 * Running case-study index fixed to the bottom-right of the viewport —
 * "07 / 24" style marker that unifies the case studies as a numbered set.
 * Uses the trail-marker-signpost sprite as the icon.
 */
export default function TrailCounter({ index, total }: TrailCounterProps) {
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-30 hidden items-end gap-3 md:flex">
      <div className="relative h-9 w-9 opacity-70">
        <Image src={STATION_MARKER_SRC} alt="" fill sizes="36px" className="object-contain" />
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span className="font-mono text-[9px] tracking-[0.25em] text-foreground/50 uppercase">Trail</span>
        <span className="font-mono text-sm font-bold text-foreground/80">
          {pad(index)} <span className="text-foreground/40">/</span> {pad(total)}
        </span>
      </div>
    </div>
  );
}
