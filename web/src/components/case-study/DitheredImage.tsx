'use client';

import Image from 'next/image';
import { View } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import DitheredPlane from './DitheredPlane';

interface Props {
  src: string;
  alt: string;
  slug: string;
  className?: string;
}

export default function DitheredImage({ src, alt, slug, className }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={trackRef} className={`relative h-full w-full ${className ?? ''}`}>
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 1400px" className="object-cover opacity-0" />
      <View track={trackRef as React.RefObject<HTMLElement>} className="absolute inset-0">
        <Suspense fallback={null}>
          <DitheredPlane src={src} slug={slug} />
        </Suspense>
      </View>
    </div>
  );
}
