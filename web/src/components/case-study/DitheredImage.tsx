'use client';

import Image from 'next/image';
import { View } from '@react-three/drei';
import { Component, type ReactNode, Suspense, useRef } from 'react';
import useWebGLSupport from '@/lib/useWebGLSupport';
import DitheredPlane from './DitheredPlane';

interface Props {
  src: string;
  alt: string;
  slug: string;
  className?: string;
}

class DitheredErrorBoundary extends Component<
  { onError: (err: unknown) => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

export default function DitheredImage({ src, alt, slug, className }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  // The <Image> always renders at full opacity. DitheredPlane's shader writes
  // fully opaque pixels (alpha=1.0, transparent={false}) and the <View> sits
  // on top via `absolute inset-0`, so when the shader runs it completely
  // covers the underlying image. When the shader silently hangs (texture
  // suspends without throwing, GPU stall, etc.) the image stays visible
  // instead of leaving a blank box with an orphaned caption.
  const webgl = useWebGLSupport();
  const shouldMountShader = webgl !== false;

  return (
    <div ref={trackRef} className={`relative h-full w-full ${className ?? ''}`}>
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 1400px" className="object-cover" />
      {shouldMountShader && (
        <View track={trackRef as React.RefObject<HTMLElement>} className="absolute inset-0">
          <DitheredErrorBoundary onError={(err) => console.warn('[DitheredImage] texture failed', { src, error: err })}>
            <Suspense fallback={null}>
              <DitheredPlane src={src} slug={slug} />
            </Suspense>
          </DitheredErrorBoundary>
        </View>
      )}
    </div>
  );
}
