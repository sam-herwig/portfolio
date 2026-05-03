'use client';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MotionValue } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';
import { FrontSide, MathUtils, Mesh, Texture } from 'three';

import { configureSpriteSheetTexture, setSpriteSheetFrame } from '@/lib/spriteSheetTexture';

type Vec2 = [number, number];
type Vec3 = [number, number, number];

type EndBehavior = 'loop' | 'hold-last' | 'reset';

type ScrollLinkedSpriteProps = {
  textureUrl: string;
  startPosition: Vec3;
  endPosition?: Vec3;
  scale: Vec2;
  rotationZ?: number;
  frames: number;
  cols: number;
  rows: number;
  frameInsetPx?: number;
  scrollStart: number;
  scrollEnd: number;
  cycles?: number;
  endBehavior?: EndBehavior;
  scrollProgress: MotionValue<number>;
  opacity?: number;
  depthWrite?: boolean;
  depthTest?: boolean;
  alphaTest?: number;
  renderOrder?: number;
};

function frameForProgress(progress: number, frames: number, cycles: number, endBehavior: EndBehavior): number {
  if (progress <= 0) return 0;
  if (progress >= 1) {
    if (endBehavior === 'hold-last') return frames - 1;
    if (endBehavior === 'reset') return 0;
  }

  return Math.floor(progress * cycles * frames) % frames;
}

export default function ScrollLinkedSprite({
  textureUrl,
  startPosition,
  endPosition = startPosition,
  scale,
  rotationZ = 0,
  frames,
  cols,
  rows,
  frameInsetPx = 4,
  scrollStart,
  scrollEnd,
  cycles = 1,
  endBehavior = 'loop',
  scrollProgress,
  opacity = 1,
  depthWrite = false,
  depthTest = true,
  alphaTest = 0.5,
  renderOrder,
}: ScrollLinkedSpriteProps) {
  const sourceTexture = useTexture(textureUrl) as Texture;
  const meshRef = useRef<Mesh>(null);
  const lerpedProgress = useRef(0);

  const spriteTexture = useMemo(() => {
    const clone = configureSpriteSheetTexture(sourceTexture.clone());
    setSpriteSheetFrame(clone, { frame: 0, cols, rows, frames, insetPx: frameInsetPx });
    return clone;
  }, [sourceTexture, cols, rows, frames, frameInsetPx]);

  useEffect(() => {
    return () => {
      spriteTexture.dispose();
    };
  }, [spriteTexture]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    lerpedProgress.current = MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
    const span = Math.max(0.0001, scrollEnd - scrollStart);
    const progress = MathUtils.clamp((lerpedProgress.current - scrollStart) / span, 0, 1);

    meshRef.current.position.set(
      MathUtils.lerp(startPosition[0], endPosition[0], progress),
      MathUtils.lerp(startPosition[1], endPosition[1], progress),
      MathUtils.lerp(startPosition[2], endPosition[2], progress),
    );

    const frame = frameForProgress(progress, frames, cycles, endBehavior);
    setSpriteSheetFrame(spriteTexture, { frame, cols, rows, frames, insetPx: frameInsetPx });
  });

  return (
    <mesh ref={meshRef} position={startPosition} rotation-z={rotationZ} renderOrder={renderOrder}>
      <planeGeometry args={scale} />
      <meshBasicMaterial
        map={spriteTexture}
        transparent
        depthWrite={depthWrite}
        depthTest={depthTest}
        alphaTest={alphaTest}
        opacity={opacity}
        side={FrontSide}
      />
    </mesh>
  );
}
