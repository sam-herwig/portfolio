'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Center, Environment, Text3D, useFBO } from '@react-three/drei';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { BackSide, Group, Mesh, MeshDepthMaterial, type PerspectiveCamera, RGBADepthPacking } from 'three';
import DispersionMaterial, { makeDispersionUniforms } from '@/components/lab/DispersionMaterial';
import { useMouseVelocity } from '@/lib/useMouseVelocity';
import HeroBackdrop from './HeroBackdrop';

// Hero owns its own uniforms — kept module-scoped so we can mutate without
// React immutability complaints. Tuned softer than the lab defaults so the
// title reads as "name brand" rather than "demo specimen".
const uniforms = makeDispersionUniforms();
uniforms.uIorR.value = 1.13;
uniforms.uIorG.value = 1.16;
uniforms.uIorB.value = 1.2;
uniforms.uRefractPower.value = 0.32;
uniforms.uFresnelPower.value = 5.0;
uniforms.uSaturation.value = 1.05;
uniforms.uAbsorption.value = 1.2;
uniforms.uAbsorptionColor.value.set(0.45, 0.32, 0.22);
uniforms.uBreath.value = 0.01;
uniforms.uMode.value = 1; // rygcbv

function HeroText({ backdropRef }: { backdropRef: React.RefObject<Group | null> }) {
  const meshRef = useRef<Mesh>(null);
  const sceneFbo = useFBO();
  const backDepthFbo = useFBO();
  const velocity = useMouseVelocity();
  const { gl, scene, camera, size, viewport } = useThree();

  const backDepthMat = useMemo(
    () =>
      new MeshDepthMaterial({
        depthPacking: RGBADepthPacking,
        side: BackSide,
      }),
    [],
  );

  useFrame((state) => {
    uniforms.uVelocity.value = velocity.current.magnitude;
    uniforms.uTime.value = state.clock.elapsedTime;

    if (!meshRef.current) return;

    meshRef.current.visible = false;
    gl.setRenderTarget(sceneFbo);
    gl.clear();
    gl.render(scene, camera);

    meshRef.current.visible = true;
    const original = meshRef.current.material;
    meshRef.current.material = backDepthMat;
    if (backdropRef.current) backdropRef.current.visible = false;
    gl.setRenderTarget(backDepthFbo);
    gl.clear();
    gl.render(scene, camera);
    meshRef.current.material = original;
    if (backdropRef.current) backdropRef.current.visible = true;
    gl.setRenderTarget(null);

    const persp = camera as PerspectiveCamera;
    uniforms.uScene.value = sceneFbo.texture;
    uniforms.uBackDepth.value = backDepthFbo.texture;
    uniforms.uCameraNear.value = persp.near;
    uniforms.uCameraFar.value = persp.far;
    uniforms.uResolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
  });

  return (
    <Center>
      <Text3D
        ref={meshRef}
        font="/fonts/Fraunces.json"
        size={1.0}
        height={0.3}
        bevelEnabled
        bevelThickness={0.035}
        bevelSize={0.022}
        bevelOffset={0}
        bevelSegments={3}
        curveSegments={10}
        letterSpacing={-0.04}
      >
        Sam Herwig
        <DispersionMaterial uniforms={uniforms} />
      </Text3D>
    </Center>
  );
}

function StaticHeroTitle() {
  // Reduced-motion / mobile fallback. Static Fraunces title — same composition
  // as the Canvas hero but no WebGL. The dispersion is the brand, but on
  // reduced-motion or small screens we'd rather ship a fast, beautiful page
  // than a janky 30fps showpiece.
  return (
    <div className="absolute inset-0 flex items-center justify-center px-8">
      <h1
        className="text-balance text-center text-6xl font-medium leading-[0.95] tracking-tight text-foreground sm:text-7xl md:text-8xl lg:text-[10rem]"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0',
        }}
      >
        Sam Herwig
      </h1>
    </div>
  );
}

// Gate the WebGL hero behind prefers-reduced-motion and a viewport-width
// floor. SSR always serves the static fallback; the canvas hydrates in only
// when the device can actually carry it. Using useSyncExternalStore avoids
// the react-hooks/set-state-in-effect rule and gives a clean SSR snapshot.
function subscribeMediaQueries(cb: () => void) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduced.addEventListener('change', cb);
  window.addEventListener('resize', cb);
  return () => {
    reduced.removeEventListener('change', cb);
    window.removeEventListener('resize', cb);
  };
}

function getCanvasEnabledSnapshot(): boolean {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return !reduced && window.innerWidth >= 768;
}

function getCanvasEnabledServerSnapshot(): boolean {
  return false;
}

export default function HomeHero() {
  const backdropRef = useRef<Group>(null);
  const enableCanvas = useSyncExternalStore(
    subscribeMediaQueries,
    getCanvasEnabledSnapshot,
    getCanvasEnabledServerSnapshot,
  );

  // Idle drift on the cursor velocity uniform so the dispersion never reads
  // as totally frozen on first paint — gives the type a faint living quality
  // before the user moves the mouse.
  useEffect(() => {
    if (!enableCanvas) return;
    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 1 / 60;
      uniforms.uVelocity.value = Math.max(uniforms.uVelocity.value, 0.05 + Math.sin(t * 0.6) * 0.04);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enableCanvas]);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {enableCanvas ? (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 32 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          className="absolute inset-0"
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[5, 5, 5]} intensity={1.1} />
          <Environment preset="studio" />
          <HeroBackdrop ref={backdropRef} />
          <HeroText backdropRef={backdropRef} />
        </Canvas>
      ) : (
        <StaticHeroTitle />
      )}

      {/* HTML overlay — positions copy at the four corners, like an editorial
          spread. The 3D type handles the "brand". */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-8 md:p-16">
        <div className="flex items-baseline justify-between">
          <p
            className="text-[11px] uppercase tracking-[0.4em] text-foreground/55"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            Sam Herwig
          </p>
          <p
            className="text-[11px] uppercase tracking-[0.4em] text-foreground/55"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            Creative Engineer · Denver
          </p>
        </div>

        <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <p
            className="max-w-[40ch] text-lg italic leading-relaxed text-foreground/75 md:text-xl"
            style={{ fontFamily: 'var(--font-instrument)' }}
          >
            3D web, motion, marketing builds. Currently shipping things at the limit of WebGL and taste.
          </p>
          <p
            className="text-[10px] uppercase tracking-[0.4em] text-foreground/45"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            Scroll →
          </p>
        </div>
      </div>
    </section>
  );
}
