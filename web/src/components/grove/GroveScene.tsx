'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { ShaderMaterial } from 'three';
import { WaterShaderMaterial, MAX_RIPPLES } from '@/components/shaders/WaterMaterial';

// Drei `extend` is called inside the WaterMaterial module — registers <waterShaderMaterial />.

interface RippleSlot {
  x: number;
  y: number;
  t0: number;
  strength: number;
}

/**
 * The water plane — full-bleed, ortho-projected, with ambient flow + mouse ripples.
 */
function WaterPlane() {
  const matRef = useRef<ShaderMaterial | null>(null);
  const { viewport, gl } = useThree();
  const ripples = useRef<RippleSlot[]>([]);
  const ripplesBuf = useRef<Float32Array | null>(null);
  const mouseUv = useRef<[number, number]>([2, 2]);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    startedAt.current = performance.now();
    ripplesBuf.current = new Float32Array(MAX_RIPPLES * 4);
  }, []);

  useEffect(() => {
    const dom = gl.domElement;
    const onMove = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseUv.current = [x, y];
    };
    const onLeave = () => {
      mouseUv.current = [2, 2];
    };
    const onClick = (e: PointerEvent) => {
      if (startedAt.current === null) return;
      const rect = dom.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      const now = (performance.now() - startedAt.current) / 1000;
      ripples.current.push({ x, y, t0: now, strength: 1.0 });
      if (ripples.current.length > MAX_RIPPLES) {
        ripples.current = ripples.current.slice(-MAX_RIPPLES);
      }
    };
    dom.addEventListener('pointermove', onMove);
    dom.addEventListener('pointerleave', onLeave);
    dom.addEventListener('pointerdown', onClick);
    return () => {
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerleave', onLeave);
      dom.removeEventListener('pointerdown', onClick);
    };
  }, [gl]);

  useFrame(() => {
    if (!matRef.current || startedAt.current === null || !ripplesBuf.current) return;
    const buf = ripplesBuf.current;
    const now = (performance.now() - startedAt.current) / 1000;
    matRef.current.uniforms.uTime.value = now;
    matRef.current.uniforms.uMouse.value.set(mouseUv.current[0], mouseUv.current[1]);

    ripples.current = ripples.current.filter((r) => now - r.t0 < 2.0);

    buf.fill(0);
    for (let i = 0; i < ripples.current.length && i < MAX_RIPPLES; i++) {
      const r = ripples.current[i];
      buf[i * 4 + 0] = r.x;
      buf[i * 4 + 1] = r.y;
      buf[i * 4 + 2] = r.t0;
      buf[i * 4 + 3] = r.strength;
    }
    matRef.current.uniforms.uRipples.value = buf;
  });

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height, 1, 1]} />
      {/* @ts-expect-error — drei extend registers this intrinsic at runtime */}
      <waterShaderMaterial ref={matRef} key={WaterShaderMaterial.key} transparent />
    </mesh>
  );
}

export default function GroveScene() {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 5], zoom: 100, near: 0.1, far: 1000 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#f9fafb' }}
    >
      <WaterPlane />
    </Canvas>
  );
}
