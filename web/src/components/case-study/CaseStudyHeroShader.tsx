'use client';

import { View } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import MissionBellHero from './heroShaders/MissionBellHero';
import NewBelgiumHero from './heroShaders/NewBelgiumHero';
import ConsumeCreateHero from './heroShaders/ConsumeCreateHero';
import CraftedkitHero from './heroShaders/CraftedkitHero';

interface Props {
  slug: string;
  thumbnail: string;
}

export default function CaseStudyHeroShader({ slug, thumbnail }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  let scene: React.ReactNode = null;
  if (slug === 'mission-bell') scene = <MissionBellHero thumbnail={thumbnail} trackRef={trackRef} />;
  else if (slug === 'new-belgium') scene = <NewBelgiumHero trackRef={trackRef} />;
  else if (slug === 'consume-and-create') scene = <ConsumeCreateHero trackRef={trackRef} />;
  else if (slug === 'craftedkit') scene = <CraftedkitHero trackRef={trackRef} />;

  return (
    <div ref={trackRef} className="absolute inset-0">
      <View track={trackRef as React.RefObject<HTMLElement>} className="absolute inset-0">
        <Suspense fallback={null}>{scene}</Suspense>
      </View>
    </div>
  );
}
