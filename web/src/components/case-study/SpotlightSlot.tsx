'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { SpotlightBlock } from '@/data/projects';

interface SpotlightProps {
  caption?: string;
}

const REGISTRY: Record<string, ComponentType<SpotlightProps>> = {
  'craftedkit-pipeline': dynamic(() => import('@/components/spotlights/CraftedKitPipelineSpotlight'), { ssr: false }),
  'new-belgium-theme-switcher': dynamic(() => import('@/components/spotlights/NewBelgiumSpotlight'), { ssr: false }),
};

export default function SpotlightSlot({ spotlightId, caption }: Omit<SpotlightBlock, 'type'>) {
  const Component = REGISTRY[spotlightId];
  if (!Component) {
    return (
      <div className="mx-auto my-16 max-w-[1400px] px-8 md:px-16">
        <p
          className="text-xs uppercase tracking-[0.3em] text-foreground/40"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Missing spotlight: {spotlightId}
        </p>
      </div>
    );
  }
  return <Component caption={caption} />;
}
