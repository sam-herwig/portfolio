'use client';

import type { ChapterShaderId } from '@/data/projects';
import NBIdentityPrism from './NBIdentityPrism';
import CCPerformanceBraid from './CCPerformanceBraid';
import CKPipelineFlow from './CKPipelineFlow';
import CKSilhouette from './CKSilhouette';
import CKHeroGrid from './CKHeroGrid';
import CKNodeReceding from './CKNodeReceding';

interface ResolveProps {
  shaderId: ChapterShaderId;
  trackRef: React.RefObject<HTMLElement | null>;
  mode?: 'reveal' | 'pinned';
}

export function ChapterScene({ shaderId, trackRef, mode }: ResolveProps) {
  switch (shaderId) {
    case 'nb-prism':
      return <NBIdentityPrism trackRef={trackRef} mode={mode} />;
    case 'cc-braid':
      return <CCPerformanceBraid trackRef={trackRef} mode={mode} />;
    case 'ck-pipeline':
      return <CKPipelineFlow trackRef={trackRef} mode={mode} />;
    case 'ck-silhouette':
      return <CKSilhouette trackRef={trackRef} mode={mode} />;
    case 'ck-grid':
      return <CKHeroGrid trackRef={trackRef} mode={mode} />;
    case 'ck-node-receding':
      return <CKNodeReceding trackRef={trackRef} mode={mode} />;
    default:
      return null;
  }
}
