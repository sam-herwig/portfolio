/* eslint-disable */
'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, useFBO, Text, useVideoTexture, Points, PointMaterial } from '@react-three/drei';
import { useRef, useEffect, Suspense, useMemo, useState } from 'react';
import React from 'react';
import { MotionValue } from 'framer-motion';
import * as THREE from 'three';
import PostProcessingStack from './PostProcessingStack';
import './shaders/RefractionMaterial';
import './shaders/WoodcutMaterial';
import DeepForest from './DeepForest';

const WoodcutShader = 'woodcutShaderMaterial' as any;
const RefractionShader = 'refractionShaderMaterial' as any;

declare global {
    namespace JSX {
        interface IntrinsicElements {
            woodcutShaderMaterial: any;
            refractionShaderMaterial: any;
        }
    }
}

// =============================================================================
// UNIFIED CAMERA
// Single camera controller blending all 5 zone behaviours.
// Replaces HeroCamera, ForestCamera, CampCamera, AlpineCamera, SummitCamera.
// =============================================================================

function UnifiedCamera({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const { camera } = useThree();
    const lerpedProgress = useRef(0);

    useFrame((state, delta) => {
        lerpedProgress.current = THREE.MathUtils.damp(
            lerpedProgress.current, scrollProgress.get(), 4, delta
        );
        const p = lerpedProgress.current;

        // Hero zone (0.0-0.25): z 20->-28, y 0->4, rotX 0->0.15 over [0.0,0.20]
        const heroP  = Math.min(1, Math.max(0, p / 0.20));
        const heroX  = 0;
        const heroY  = THREE.MathUtils.lerp(0, 4, heroP);
        const heroZ  = THREE.MathUtils.lerp(20, -28, heroP);
        const heroRX = THREE.MathUtils.lerp(0, 0.15, heroP);

        // Forest zone (0.2-0.5): z 20->-90, walk sway on X/Y, rotX=0.1
        const forestP  = Math.min(1, Math.max(0, (p - 0.2) / 0.3));
        const forestX  = Math.sin(forestP * Math.PI * 10) * 0.5;
        const forestY  = Math.abs(Math.sin(forestP * Math.PI * 10)) * 0.5;
        const forestZ  = THREE.MathUtils.lerp(20, -90, forestP);
        const forestRX = 0.1;

        // Camp zone (0.45-0.70): sway on X (clock), y -10->15, z 30->-10
        const campP  = Math.min(1, Math.max(0, (p - 0.45) / 0.25));
        const campX  = Math.sin(state.clock.elapsedTime * 0.5) * 1.5;
        const campY  = THREE.MathUtils.lerp(-10, 15, campP);
        const campZ  = THREE.MathUtils.lerp(30, -10, campP);
        const campRX = 0;

        // Alpine zone (0.65-0.90): z=15 fixed, y 0->120, climb sway, rotX=0.15
        const alpineP  = Math.min(1, Math.max(0, (p - 0.65) / 0.25));
        const alpineX  = Math.sin(alpineP * Math.PI * 6) * 1.5;
        const alpineY  = THREE.MathUtils.lerp(0, 120, alpineP);
        const alpineZ  = 15;
        const alpineRX = 0.15;

        // Summit zone (0.85-1.0): static (0,0,20), rotX=0
        const summitX  = 0;
        const summitY  = 0;
        const summitZ  = 20;
        const summitRX = 0;

        // Blend weights — each zone fades in/out at overlap boundaries
        const hw = Math.max(0, p < 0.20 ? 1.0 : 1.0 - (p - 0.20) / 0.10);
        const fw = Math.max(0, Math.min(1,
            p < 0.20 ? 0 : p < 0.30 ? (p-0.20)/0.10 : p < 0.45 ? 1 : 1-(p-0.45)/0.10));
        const cw = Math.max(0, Math.min(1,
            p < 0.45 ? 0 : p < 0.55 ? (p-0.45)/0.10 : p < 0.65 ? 1 : 1-(p-0.65)/0.10));
        const aw = Math.max(0, Math.min(1,
            p < 0.65 ? 0 : p < 0.75 ? (p-0.65)/0.10 : p < 0.85 ? 1 : 1-(p-0.85)/0.07));
        const sw = Math.max(0, Math.min(1,
            p < 0.85 ? 0 : (p-0.85)/0.10));

        const tot = hw + fw + cw + aw + sw || 1;
        const inv = 1 / tot;

        camera.position.x = (heroX*hw + forestX*fw + campX*cw + alpineX*aw + summitX*sw) * inv;
        camera.position.y = (heroY*hw + forestY*fw + campY*cw + alpineY*aw + summitY*sw) * inv;
        camera.position.z = (heroZ*hw + forestZ*fw + campZ*cw + alpineZ*aw + summitZ*sw) * inv;
        camera.rotation.x = (heroRX*hw + forestRX*fw + campRX*cw + alpineRX*aw + summitRX*sw) * inv;
    });

    return null;
}

// =============================================================================
// UNIFIED POST PROCESSING
// Single PostProcessingStack — bloom driven by camp zone.
// =============================================================================

function UnifiedPostProcessing({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const [bloomIntensity, setBloomIntensity] = useState(0);
    const lerpedP     = useRef(0);
    const lerpedBloom = useRef(0);
    const lastSnap    = useRef(0);

    useFrame((state, delta) => {
        lerpedP.current = THREE.MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
        const p = lerpedP.current;
        const targetBloom = (p > 0.45 && p < 0.70) ? 1.5 : 0;
        lerpedBloom.current = THREE.MathUtils.damp(lerpedBloom.current, targetBloom, 3, delta);
        // Only trigger React re-render when value changes meaningfully
        if (Math.abs(lerpedBloom.current - lastSnap.current) > 0.1) {
            lastSnap.current = lerpedBloom.current;
            setBloomIntensity(lerpedBloom.current);
        }
    });

    return <PostProcessingStack bloomIntensity={bloomIntensity} />;
}

// =============================================================================
// HERO SCENE GROUP
// Extracted from InteractiveHero -> Scene. Camera control removed.
// =============================================================================

function ParallaxLayer({ textureUrl, z, baseY = 0, speed = 1 }: {
    textureUrl: string; z: number; baseY?: number; speed?: number;
}) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    const { viewport, camera } = useThree();

    const cv   = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, z));
    const maxD = Math.max(cv.width, cv.height);
    const s    = maxD * 1.5;

    const materialRef = useRef<any>(null);
    const meshRef     = useRef<THREE.Mesh>(null);
    const scrollYRef  = useRef(0);
    const mousePos    = useRef(new THREE.Vector2(0, 0));

    useEffect(() => { return () => { tex.dispose(); }; }, [tex]);

    useEffect(() => {
        const onScroll = () => { scrollYRef.current = window.scrollY; };
        const onMouse  = (e: MouseEvent) => {
            mousePos.current.x =  (e.clientX / window.innerWidth)  * 2 - 1;
            mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('scroll',    onScroll, { passive: true });
        window.addEventListener('mousemove', onMouse,  { passive: true });
        return () => {
            window.removeEventListener('scroll',    onScroll);
            window.removeEventListener('mousemove', onMouse);
        };
    }, []);

    useFrame((state, delta) => {
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
            materialRef.current.uMouse.lerp(mousePos.current, 0.1);
        }
        if (meshRef.current) {
            const targetY = baseY + scrollYRef.current * 0.005 * speed;
            meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, targetY, 5, delta);
            meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, mousePos.current.y * 0.05, 0.05);
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, mousePos.current.x * 0.05, 0.05);
        }
    });

    return (
        <mesh ref={meshRef} position={[0, baseY, z]}>
            <planeGeometry args={[s * 1.5, s * 1.5, 64, 64]} />
            <WoodcutShader ref={materialRef} transparent depthWrite={false} uTexture={tex} />
        </mesh>
    );
}

function HeroSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const { gl, scene, camera, viewport } = useThree();
    const groupRef   = useRef<THREE.Group>(null);
    const textRef    = useRef<THREE.Mesh>(null);
    const textMatRef = useRef<any>(null);
    const lerpedP    = useRef(0);
    const fontSize   = Math.min(8, viewport.width * 0.6);

    const mainRenderTarget = useFBO({ samples: 4, type: THREE.HalfFloatType });

    useFrame((state, delta) => {
        lerpedP.current = THREE.MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
        const p = lerpedP.current;

        if (groupRef.current) {
            groupRef.current.visible = p < 0.25;
        }

        if (groupRef.current?.visible && textRef.current && textMatRef.current) {
            textRef.current.visible = false;
            gl.setRenderTarget(mainRenderTarget);
            gl.render(scene, camera);
            gl.setRenderTarget(null);
            textRef.current.visible = true;
            textMatRef.current.uTexture = mainRenderTarget.texture;
            textMatRef.current.uWinSize.set(window.innerWidth, window.innerHeight);
        }
    });

    return (
        <group ref={groupRef} position={[0, -2, -5]}>
            <Text
                ref={textRef}
                position={[0, 0, 5]}
                fontSize={fontSize}
                letterSpacing={-0.05}
                anchorX="center"
                anchorY="middle"
                font="/fonts/InstrumentSerif-Regular.ttf"
            >
                {"Let's Go On A Journey."}
                <RefractionShader ref={textMatRef} uRefraction={0.06} />
            </Text>
            <ParallaxLayer textureUrl="/bg_layer.webp" z={-80} baseY={20}  speed={0.1} />
            <ParallaxLayer textureUrl="/mg_layer.webp" z={-30} baseY={5}   speed={0.5} />
            <ParallaxLayer textureUrl="/fg_layer.webp" z={10}  baseY={-8}  speed={1.0} />
        </group>
    );
}

// =============================================================================
// FOREST SCENE GROUP
// Extracted from ForestModule -> ForestScene. Camera control removed.
// =============================================================================

function ForestSceneGroup({ scrollProgress, scrollVelocity }: {
    scrollProgress: MotionValue<number>;
    scrollVelocity: React.MutableRefObject<number>;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const lerpedP  = useRef(0);

    useFrame((state, delta) => {
        if (groupRef.current) {
            lerpedP.current = THREE.MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
            groupRef.current.visible = lerpedP.current > 0.19 && lerpedP.current < 0.51;

            if (groupRef.current.visible) {
                const vel = Math.min(scrollVelocity.current * 30, 1.5);
                const wind = Math.sin(state.clock.elapsedTime * 2) * vel * 0.02;
                groupRef.current.rotation.x = THREE.MathUtils.damp(
                    groupRef.current.rotation.x, wind, 4, delta
                );
            }
        }
    });

    return (
        <group ref={groupRef}>
            <DeepForest scrollProgress={scrollProgress} />
        </group>
    );
}

// =============================================================================
// CAMP SCENE GROUP
// Extracted from CampModule -> NightCampScene. Camera control removed.
// =============================================================================

function Starfield({ scrollVelocity }: { scrollVelocity: React.MutableRefObject<number> }) {
    const ref      = useRef<any>(null);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count    = isMobile ? 800 : 2000;

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3]     = (Math.random() - 0.5) * 400;
            pos[i * 3 + 1] = Math.random() * 200;
            pos[i * 3 + 2] = -50 - Math.random() * 200;
        }
        return pos;
    }, [count]);

    useFrame((state, delta) => {
        if (ref.current) {
            const vel = Math.min(scrollVelocity.current * 50, 3);
            ref.current.rotation.y = state.clock.elapsedTime * (0.01 + vel * 0.05);
            (ref.current.material as THREE.PointsMaterial).size = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
            const targetScale = 1 + vel * 0.3;
            ref.current.scale.setScalar(
                THREE.MathUtils.damp(ref.current.scale.x, targetScale, 4, delta)
            );
        }
    });

    return (
        <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
            <PointMaterial transparent color="#ffffff" size={0.8} sizeAttenuation={true} depthWrite={false} />
        </Points>
    );
}

function CampfireEmbers({ scrollVelocity }: { scrollVelocity: React.MutableRefObject<number> }) {
    const count   = 60;
    const meshRef = useRef<THREE.Points>(null);

    const [positions, velocities] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const vel = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3]     = (Math.random() - 0.5) * 2;
            pos[i * 3 + 1] = -3 + Math.random() * 0.5;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
            vel[i * 3]     = (Math.random() - 0.5) * 0.3;
            vel[i * 3 + 1] = 0.5 + Math.random() * 1.5;
            vel[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
        }
        return [pos, vel];
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const geo     = meshRef.current.geometry;
        const posAttr = geo.attributes.position as THREE.BufferAttribute;
        const vel2    = Math.min(scrollVelocity.current * 30, 2);
        const emissionRate = 1 + vel2 * 2;

        for (let i = 0; i < count; i++) {
            (posAttr.array as Float32Array)[i * 3]     += velocities[i * 3]     * delta * emissionRate;
            (posAttr.array as Float32Array)[i * 3 + 1] += velocities[i * 3 + 1] * delta * emissionRate;
            (posAttr.array as Float32Array)[i * 3 + 2] += velocities[i * 3 + 2] * delta * emissionRate;

            if ((posAttr.array as Float32Array)[i * 3 + 1] > 10) {
                (posAttr.array as Float32Array)[i * 3]     = (Math.random() - 0.5) * 2;
                (posAttr.array as Float32Array)[i * 3 + 1] = -3;
                (posAttr.array as Float32Array)[i * 3 + 2] = (Math.random() - 0.5) * 2;
            }
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.08} color="#f59e0b" transparent opacity={0.6} sizeAttenuation />
        </points>
    );
}

function VideoCampLedge({ videoUrl, position, scale, scrollProgress }: {
    videoUrl: string; position: [number, number, number];
    scale: [number, number]; scrollProgress: MotionValue<number>;
}) {
    const tex     = useVideoTexture(videoUrl, { start: false, muted: true, crossOrigin: 'Anonymous' });
    const meshRef = useRef<THREE.Mesh>(null);
    const lerpedP = useRef(0);

    useEffect(() => {
        if (!tex?.image) return;
        const vid = tex.image as HTMLVideoElement;
        const unsub = scrollProgress.on('change', (v: number) => {
            if (v > 0.44 && v < 0.71) {
                if (vid.paused) vid.play().catch(() => {});
            } else {
                if (!vid.paused) { vid.pause(); vid.currentTime = 0; }
            }
        });
        return () => { unsub(); tex.dispose(); };
    }, [tex, scrollProgress]);

    useFrame((state, delta) => {
        if (meshRef.current && tex.image) {
            lerpedP.current = THREE.MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
            const animP = Math.min(1, Math.max(0, (lerpedP.current - 0.45) / 0.10));
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = animP;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <planeGeometry args={scale} />
            <meshBasicMaterial map={tex} transparent depthWrite={true} alphaTest={0.5} opacity={0} />
        </mesh>
    );
}

function CampSceneGroup({ scrollProgress, scrollVelocity }: {
    scrollProgress: MotionValue<number>;
    scrollVelocity: React.MutableRefObject<number>;
}) {
    const groupRef   = useRef<THREE.Group>(null);
    const lightRef   = useRef<THREE.AmbientLight>(null);
    const lerpedP    = useRef(0);
    const colorNight = useMemo(() => new THREE.Color('#020617'), []);
    const colorFire  = useMemo(() => new THREE.Color('#ea580c'), []);

    useFrame((state, delta) => {
        lerpedP.current = THREE.MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
        const p = lerpedP.current;
        if (groupRef.current) groupRef.current.visible = p > 0.44 && p < 0.71;
        if (lightRef.current) {
            const mix = Math.min(1, Math.max(0, (p - 0.45) / 0.1));
            lightRef.current.color.lerpColors(colorNight, colorFire, mix);
            lightRef.current.intensity = 0.2 + mix * 1.5;
        }
    });

    return (
        <group ref={groupRef}>
            <ambientLight ref={lightRef} intensity={0.2} color="#020617" />
            <Starfield scrollVelocity={scrollVelocity} />
            <CampfireEmbers scrollVelocity={scrollVelocity} />
            <VideoCampLedge
                videoUrl="/assets/videos/campfire.mp4"
                position={[0, 0, -250]}
                scale={[400, 225]}
                scrollProgress={scrollProgress}
            />
        </group>
    );
}

// =============================================================================
// ALPINE SCENE GROUP
// Extracted from AlpineModule -> AlpineScene. Camera control removed.
// =============================================================================

function AlpineAnimatedSprite({ textureUrl, startX, endX, y, z, scale, rotation = 0,
    frames = 8, scrollStart, scrollEnd, cycles = 6, scrollProgress }: {
    textureUrl: string; startX: number; endX: number; y: number; z: number;
    scale: [number, number]; rotation?: number; frames?: number;
    scrollStart: number; scrollEnd: number; cycles?: number;
    scrollProgress: MotionValue<number>;
}) {
    const tex      = useTexture(textureUrl) as THREE.Texture;
    const meshRef  = useRef<THREE.Mesh>(null);
    const matRef   = useRef<any>(null);
    const lerpedP  = useRef(0);
    const playhead = useRef(0);

    const clonedTex = useMemo(() => {
        const c = tex.clone();
        c.wrapS = THREE.RepeatWrapping;
        c.wrapT = THREE.RepeatWrapping;
        c.repeat.set(1 / frames, 1);
        return c;
    }, [tex, frames]);

    useEffect(() => { return () => { tex.dispose(); clonedTex.dispose(); }; }, [tex, clonedTex]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            lerpedP.current = THREE.MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
            const clamped = Math.min(1, Math.max(0, (lerpedP.current - scrollStart) / (scrollEnd - scrollStart)));
            meshRef.current.position.x = THREE.MathUtils.lerp(startX, endX, clamped);
            const vel   = Math.abs(scrollProgress.getVelocity());
            const speed = vel > 0.01 ? 8 + vel * 120 : 0;
            if (clamped > 0 && clamped < 1) playhead.current += speed * delta;
            clonedTex.offset.x = (Math.floor(playhead.current) % frames) / frames;
        }
        if (matRef.current) {
            matRef.current.uTime = state.clock.elapsedTime;
            matRef.current.uWind = state.clock.elapsedTime * 1.5;
            matRef.current.uMouse.lerp(state.pointer, 0.1);
        }
    });

    return (
        <mesh ref={meshRef} position={[startX, y, z]} rotation-z={rotation}>
            <planeGeometry args={scale} />
            <WoodcutShader ref={matRef} uTexture={clonedTex} transparent={true} depthWrite={true} alphaTest={0.5} />
        </mesh>
    );
}

function RockLedge({ textureUrl, position, scale, rotation = 0 }: {
    textureUrl: string; position: [number, number, number]; scale: [number, number]; rotation?: number;
}) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    useEffect(() => { return () => { tex.dispose(); }; }, [tex]);
    return (
        <mesh position={position} rotation-z={rotation}>
            <planeGeometry args={scale} />
            <meshBasicMaterial map={tex} transparent depthWrite={true} alphaTest={0.5} />
        </mesh>
    );
}

function AlpineWall({ textureUrl, position, scale }: {
    textureUrl: string; position: [number, number, number]; scale: [number, number];
}) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    const clonedTex = useMemo(() => {
        const c = tex.clone();
        c.wrapS = THREE.MirroredRepeatWrapping;
        c.wrapT = THREE.MirroredRepeatWrapping;
        return c;
    }, [tex]);
    useEffect(() => { return () => { tex.dispose(); clonedTex.dispose(); }; }, [tex, clonedTex]);
    useFrame((state, delta) => { clonedTex.offset.x -= delta * 0.05; });
    return (
        <mesh position={position}>
            <planeGeometry args={scale} />
            <meshBasicMaterial map={clonedTex} transparent depthWrite={false} alphaTest={0.5} />
        </mesh>
    );
}

function AlpineSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const groupRef = useRef<THREE.Group>(null);
    const lerpedP  = useRef(0);

    useFrame((state, delta) => {
        if (groupRef.current) {
            lerpedP.current = THREE.MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
            groupRef.current.visible = lerpedP.current > 0.64 && lerpedP.current < 0.91;
        }
    });

    return (
        <group ref={groupRef}>
            <AlpineWall textureUrl="/alpine_wall.webp" position={[0, 80, -500]} scale={[1200, 1200]} />
            <group>
                <RockLedge textureUrl="/alpine_ledge_left.webp"           position={[-12,  0, -5]}  scale={[25, 25]} />
                <RockLedge textureUrl="/alpine_ledge_right.webp"          position={[12,  30, -10]} scale={[25, 25]} />
                <RockLedge textureUrl="/alpine_ledge_left_variant_2.webp"  position={[-12, 60, -15]} scale={[25, 25]} />
                <RockLedge textureUrl="/alpine_ledge_right_variant_2.webp" position={[12,  90, -20]} scale={[25, 25]} />
                <AlpineAnimatedSprite
                    textureUrl="/bird_sprite.webp"
                    startX={-45} endX={45} y={105} z={-30}
                    scrollStart={0.80} scrollEnd={0.875}
                    scale={[15, 15]}
                    scrollProgress={scrollProgress}
                    frames={8} cycles={10}
                />
            </group>
        </group>
    );
}

// =============================================================================
// SUMMIT SCENE GROUP
// Extracted from SummitModule -> SummitScene. Camera control removed.
// =============================================================================

function PanoramaLedge({ textureUrl, position, scale, parallaxX = 0, scrollProgress }: {
    textureUrl: string; position: [number, number, number];
    scale: [number, number]; parallaxX?: number; scrollProgress: MotionValue<number>;
}) {
    const tex     = useTexture(textureUrl) as THREE.Texture;
    const meshRef = useRef<THREE.Mesh>(null);
    const lerpedP = useRef(0);

    useEffect(() => { return () => { tex.dispose(); }; }, [tex]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            lerpedP.current = THREE.MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
            const p     = lerpedP.current;
            const animP = Math.min(1, Math.max(0, (p - 0.85) / 0.15));
            const panP  = Math.min(1, Math.max(0, (animP - 0.66) / 0.34));
            meshRef.current.position.x = position[0] - panP * parallaxX;
            let opacity = 0;
            if (animP < 0.83) {
                opacity = Math.min(1, Math.max(0, (animP - 0.50) / 0.16));
            } else {
                opacity = 1 - Math.min(1, Math.max(0, (animP - 0.83) / 0.17));
            }
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <planeGeometry args={scale} />
            <meshBasicMaterial map={tex} transparent depthWrite={true} alphaTest={0.5} opacity={0} />
        </mesh>
    );
}

function VideoPanoramaLedge({ videoUrl, position, parallaxX = 0, playThreshold = 0.33, scrollProgress }: {
    videoUrl: string; position: [number, number, number];
    parallaxX?: number; playThreshold?: number; scrollProgress: MotionValue<number>;
}) {
    const tex     = useVideoTexture(videoUrl, { start: false, muted: true, crossOrigin: 'Anonymous' });
    const meshRef = useRef<THREE.Mesh>(null);
    const { viewport, camera } = useThree();

    const cv           = viewport.getCurrentViewport(camera, new THREE.Vector3(position[0], position[1], position[2]));
    const videoAspect  = 16 / 9;
    const screenAspect = cv.width / cv.height;
    let w = cv.width, h = cv.height;
    if (screenAspect > videoAspect) { h = w / videoAspect; } else { w = h * videoAspect; }
    const dynScale: [number, number, number] = [w * 1.2, h * 1.2, 1];

    const lerpedP = useRef(0);

    useEffect(() => {
        if (!tex?.image) return;
        const vid = tex.image as HTMLVideoElement;
        const unsub = scrollProgress.on('change', (v: number) => {
            const globalPlay = 0.85 + playThreshold * 0.15;
            if (v > globalPlay && v <= 1.0) {
                if (vid.paused) vid.play().catch(() => {});
            } else {
                if (!vid.paused) { vid.pause(); vid.currentTime = 0; }
            }
        });
        return () => { unsub(); tex.dispose(); };
    }, [tex, scrollProgress, playThreshold]);

    useFrame((state, delta) => {
        if (meshRef.current && tex.image) {
            lerpedP.current = THREE.MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
            const p     = lerpedP.current;
            const animP = Math.min(1, Math.max(0, (p - 0.85) / 0.15));
            const panP  = Math.min(1, Math.max(0, (animP - 0.66) / 0.34));
            meshRef.current.position.x = position[0] - panP * parallaxX;
            let opacity = 0;
            if (animP < 0.83) {
                opacity = Math.min(1, Math.max(0, (animP - 0.50) / 0.16));
            } else {
                opacity = 1 - Math.min(1, Math.max(0, (animP - 0.83) / 0.17));
            }
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <planeGeometry args={dynScale} />
            <meshBasicMaterial map={tex} transparent depthWrite={true} alphaTest={0.5} opacity={0} />
        </mesh>
    );
}

function ForegroundLedge({ textureUrl, position, startZ, endZ, startY, endY, scrollProgress }: {
    textureUrl: string; position: [number, number, number];
    startZ: number; endZ: number; startY: number; endY: number;
    scrollProgress: MotionValue<number>;
}) {
    const tex     = useTexture(textureUrl) as THREE.Texture;
    const meshRef = useRef<THREE.Mesh>(null);
    const { viewport, camera } = useThree();

    const cv      = viewport.getCurrentViewport(camera, new THREE.Vector3(position[0], position[1], endZ));
    const maxDim  = Math.max(cv.width, cv.height);
    const dynScale: [number, number, number] = [maxDim * 1.5, maxDim * 1.5, 1];
    const lerpedP = useRef(0);

    useEffect(() => { return () => { tex.dispose(); }; }, [tex]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            lerpedP.current = THREE.MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
            const p         = lerpedP.current;
            const animP     = Math.min(1, Math.max(0, (p - 0.85) / 0.15));
            const flyProgress = Math.min(1, Math.max(0, (animP - 0.0) / 0.25));
            const easeOut   = 1 - Math.pow(1 - flyProgress, 3);
            meshRef.current.position.z = THREE.MathUtils.lerp(startZ, endZ, easeOut);
            meshRef.current.position.y = THREE.MathUtils.lerp(startY, endY, easeOut);
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <planeGeometry args={dynScale} />
            <meshBasicMaterial map={tex} transparent depthWrite={true} alphaTest={0.5} />
        </mesh>
    );
}

function OneShotAnimatedFox({ textureUrl, startX, endX, startYOffset, endYOffset, startZ, endZ,
    scale, rotation = 0, frames = 8, scrollStart, scrollEnd, cycles = 6, scrollProgress }: any) {
    const tex     = useTexture(textureUrl) as THREE.Texture;
    const meshRef = useRef<THREE.Mesh>(null);

    const clonedTex = useMemo(() => {
        const c = tex.clone();
        c.wrapS = THREE.RepeatWrapping;
        c.wrapT = THREE.RepeatWrapping;
        c.repeat.set(1 / frames, 1);
        return c;
    }, [tex, frames]);

    const lerpedP = useRef(0);

    useEffect(() => { return () => { tex.dispose(); clonedTex.dispose(); }; }, [tex, clonedTex]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            lerpedP.current = THREE.MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
            const p         = lerpedP.current;
            const animP     = Math.min(1, Math.max(0, (p - 0.85) / 0.15));
            const clamped   = Math.min(1, Math.max(0, (animP - scrollStart) / (scrollEnd - scrollStart)));
            const walkProgress = Math.min(1, Math.max(0, (animP - 0.25) / 0.25));
            meshRef.current.position.x = THREE.MathUtils.lerp(startX, endX, walkProgress);

            const flyProgress = Math.min(1, Math.max(0, (animP - 0.0) / 0.25));
            const easeOut     = 1 - Math.pow(1 - flyProgress, 3);
            meshRef.current.position.y = THREE.MathUtils.lerp(startYOffset, endYOffset, easeOut);
            meshRef.current.position.z = THREE.MathUtils.lerp(startZ, endZ, easeOut);

            if (walkProgress >= 1.0) {
                clonedTex.offset.x = (frames - 1) / frames;
            } else if (walkProgress > 0) {
                const totalFrames = walkProgress * cycles * frames;
                clonedTex.offset.x = (Math.floor(totalFrames) % frames) / frames;
            } else {
                clonedTex.offset.x = 0;
            }
        }
    });

    return (
        <mesh ref={meshRef} position={[startX, startYOffset, startZ]} rotation-z={rotation}>
            <planeGeometry args={scale} />
            <meshBasicMaterial map={clonedTex} transparent depthWrite={true} alphaTest={0.5} />
        </mesh>
    );
}

function SummitSceneGroup({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const groupRef = useRef<THREE.Group>(null);
    const lerpedP  = useRef(0);

    useFrame((state, delta) => {
        if (groupRef.current) {
            lerpedP.current = THREE.MathUtils.damp(lerpedP.current, scrollProgress.get(), 4, delta);
            groupRef.current.visible = lerpedP.current > 0.84;
        }
    });

    return (
        <group ref={groupRef}>
            <group>
                <VideoPanoramaLedge
                    videoUrl="/assets/videos/summit_video.mp4"
                    position={[-15, 2, -40]}
                    parallaxX={5}
                    playThreshold={0.33}
                    scrollProgress={scrollProgress}
                />
                <ForegroundLedge
                    textureUrl="/cliff_edge.webp"
                    position={[0, 0, 0]}
                    startZ={-150}
                    endZ={5}
                    startY={-15}
                    endY={-10}
                    scrollProgress={scrollProgress}
                />
                <OneShotAnimatedFox
                    textureUrl="/fox_sprite.webp"
                    startX={-18}
                    endX={2}
                    startYOffset={-12}
                    endYOffset={-2}
                    startZ={-150}
                    endZ={5}
                    scale={[6, 6]}
                    frames={7}
                    cycles={6}
                    scrollStart={0.25}
                    scrollEnd={0.50}
                    scrollProgress={scrollProgress}
                />
            </group>
        </group>
    );
}

// =============================================================================
// ROOT EXPORT: UnifiedScene
// One Canvas, all scenes inside. Used by HomeClient via dynamic import.
// =============================================================================

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export default function UnifiedScene({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const scrollVelocity = useRef(0);
    const lastProgress   = useRef(0);

    useEffect(() => {
        const unsubscribe = scrollProgress.on('change', (v) => {
            scrollVelocity.current = Math.abs(v - lastProgress.current) * 60;
            lastProgress.current   = v;
        });
        return unsubscribe;
    }, [scrollProgress]);

    return (
        <Canvas
            camera={{ position: [0, 0, 20], fov: 50 }}
            dpr={isMobile ? [1, 1] : [1, 1.5]}
        >
            <Suspense fallback={null}>
                <ambientLight intensity={0.6} />
                <UnifiedCamera scrollProgress={scrollProgress} />

                <HeroSceneGroup   scrollProgress={scrollProgress} />
                <ForestSceneGroup scrollProgress={scrollProgress} scrollVelocity={scrollVelocity} />
                <CampSceneGroup   scrollProgress={scrollProgress} scrollVelocity={scrollVelocity} />
                <AlpineSceneGroup scrollProgress={scrollProgress} />
                <SummitSceneGroup scrollProgress={scrollProgress} />

                <UnifiedPostProcessing scrollProgress={scrollProgress} />
            </Suspense>
        </Canvas>
    );
}
