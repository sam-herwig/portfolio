'use client';

import Image from 'next/image';
import { View } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import useWebGLSupport from '@/lib/useWebGLSupport';
import DitheredPlane from './DitheredPlane';

interface Props {
  src: string;
  alt: string;
  slug: string;
  className?: string;
}

export default function DitheredImage({ src, alt, slug, className }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  // SSR returns null → assume WebGL available so the underlying <Image> stays
  // invisible and the shader paints over it on hydration. Only flip to visible
  // when we've confirmed WebGL is unsupported, so case studies still read.
  const webgl = useWebGLSupport();
  const showImageFallback = webgl === false;

  return (
    <div ref={trackRef} className={`relative h-full w-full ${className ?? ''}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 1400px"
        className={`object-cover ${showImageFallback ? 'opacity-100' : 'opacity-0'}`}
      />
      {!showImageFallback && (
        <View track={trackRef as React.RefObject<HTMLElement>} className="absolute inset-0">
          <Suspense fallback={null}>
            <DitheredPlane src={src} slug={slug} />
          </Suspense>
        </View>
      )}
    </div>
  );
}
