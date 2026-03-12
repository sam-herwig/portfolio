'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useEffect } from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';
import { useVideoTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import './shaders/WoodcutMaterial';
import DeepForest from './DeepForest';

const WoodcutShader = 'woodcutShaderMaterial' as any;

function ForestCamera({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const { camera } = useThree();

    // The Forest Walk Camera (Only active between 0.0 and 1.0)
    useFrame((state, delta) => {
        const progress = scrollProgress.get();

        // Delay the start of the deep walk to give the Intro Video time to breathe
        const forestProgress = Math.max(0, (progress - 0.2) / 0.8);

        // Z Travel: We start outside the forest at Z=20, and walk deep through it to Z=-90
        const targetZ = THREE.MathUtils.lerp(20, -90, forestProgress);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 4, delta);

        // Simulate walking footsteps (head bobbing side to side and up and down)
        const walkSwayX = Math.sin(forestProgress * Math.PI * 10) * 0.5;
        const walkSwayY = Math.abs(Math.sin(forestProgress * Math.PI * 10)) * 0.5;

        camera.position.x = THREE.MathUtils.damp(camera.position.x, walkSwayX, 4, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, walkSwayY, 4, delta);

        // Look slightly up into the massive trees
        const targetRotX = 0.1;
        camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, targetRotX, 4, delta);
    });

    return null;
}

function VideoForestIntro({ videoUrl, position, scale, scrollProgress }: any) {
    const tex = useVideoTexture(videoUrl, { start: false, muted: true, crossOrigin: 'Anonymous' });
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<any>(null);
    const isAlternateReality = useAppStore((state) => state.isAlternateReality);
    const mousePos = useRef(new THREE.Vector2(0, 0));
    const altTarget = isAlternateReality ? 1.0 : 0.0;

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useFrame((state, delta) => {
        if (meshRef.current && tex.image) {
            const progress = scrollProgress.get();
            const videoElem = tex.image as HTMLVideoElement;

            // Fade out rapidly to reveal the 3D trees as we start walking (0.20 -> 0.25)
            let opacity = 1;
            if (progress > 0.20) {
                opacity = 1 - Math.min(1, Math.max(0, (progress - 0.20) / 0.05));
            }

            if (materialRef.current) {
                materialRef.current.uTime = state.clock.elapsedTime;
                materialRef.current.uMouse.lerp(mousePos.current, 0.1);
                materialRef.current.uAlternateReality = THREE.MathUtils.damp(
                    materialRef.current.uAlternateReality,
                    altTarget,
                    4,
                    delta
                );
                materialRef.current.uOpacity = opacity;
            }

            // Autoplay the video once the user is in the Forest Module entry bounds
            if (progress > 0.0 && progress < 0.25) {
                if (videoElem.paused) videoElem.play();
            } else {
                if (!videoElem.paused) videoElem.pause();
            }
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            {/* 16:9 plane mapping */}
            <planeGeometry args={scale} />
            <WoodcutShader
                ref={materialRef}
                transparent
                depthWrite={false}
                uTexture={tex}
            />
        </mesh>
    );
}

export default function ForestModule({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    // Fade IN right as the module enters view (0.0 -> 0.1)
    // Fade OUT completely as we approach the dark Night Camp (0.9 -> 1.0)
    const canvasOpacity = useTransform(scrollProgress, [0.0, 0.1, 0.9, 1.0], [0, 1, 1, 0]);

    return (
        <motion.div
            style={{ opacity: canvasOpacity }}
            className="fixed inset-0 z-0 pointer-events-none transform-gpu mix-blend-multiply"
        >
            <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={[1, 2]}>
                <Suspense fallback={null}>
                    {/* The Camera Controller */}
                    <ForestCamera scrollProgress={scrollProgress} />

                    {/* Cinematic Intro Video - Fades out as we begin the true walk */}
                    <VideoForestIntro
                        videoUrl="/assets/videos/forrest_intro.mp4"
                        position={[0, 0, 10]} // Camera is at Z 20, so 10 units away at start
                        scale={[64, 36]} // Extremely large 16:9 plane
                        scrollProgress={scrollProgress}
                    />

                    {/* The 3D Assets placed deep on the Z-Axis */}
                    <DeepForest />
                </Suspense>
            </Canvas>
        </motion.div>
    );
}
