'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useMemo } from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';
import * as THREE from 'three';
import { useTexture, useVideoTexture, PointMaterial, Points } from '@react-three/drei';

// Generates procedural twinkling stars
function Starfield() {
    const ref = useRef(null) as any;
    const count = 2000;
    const positions = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            // Spread them in a large dome behind the camp
            positions[i * 3] = (Math.random() - 0.5) * 400; // x
            positions[i * 3 + 1] = Math.random() * 200; // y (only above ground)
            positions[i * 3 + 2] = -50 - Math.random() * 200; // z (deep behind)
        }
        return positions;
    }, [count]);

    useFrame((state) => {
        if (ref.current) {
            // Very slow celestial rotation
            ref.current.rotation.z = state.clock.elapsedTime * 0.01;
            // Twinkling effect
            (ref.current.material as THREE.PointsMaterial).size = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });

    return (
        <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
            <PointMaterial
                transparent
                color="#ffffff"
                size={0.8}
                sizeAttenuation={true}
                depthWrite={false}
            />
        </Points>
    );
}

function VideoCampLedge({ videoUrl, position, scale, scrollProgress }: { videoUrl: string, position: any, scale: any, scrollProgress: MotionValue<number> }) {
    const tex = useVideoTexture(videoUrl, { start: false, muted: true, crossOrigin: 'Anonymous' });
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current && tex.image) {
            const progress = scrollProgress.get();
            const videoElem = tex.image as HTMLVideoElement;

            // Map local layout scroll [0.0, 0.5] to a fadeIn progress 0.0 -> 1.0
            const animProgress = Math.min(1, Math.max(0, progress * 2));
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = animProgress;

            // Autoplay the video once the section enters the screen
            if (progress > 0.0 && progress < 1.0) {
                if (videoElem.paused) videoElem.play();
            } else {
                if (!videoElem.paused) videoElem.pause();
            }
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            {/* The video texture needs to be perfectly mapped, use 16:9 scale relative sizing */}
            <planeGeometry args={scale} />
            <meshBasicMaterial
                map={tex}
                transparent
                depthWrite={true}
                alphaTest={0.5}
                opacity={0} // Start invisible until the sequence triggers
            />
        </mesh>
    );
}

function NightCampScene({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const { camera } = useThree();

    useFrame((state, delta) => {
        const animProgress = scrollProgress.get(); // Ranges exactly 0.0 to 1.0 over the Night Camp container

        // Subtly sway the camera on X to keep it feeling alive
        const swayX = Math.sin(state.clock.elapsedTime * 0.5) * 1.5;

        // True scroll Parallax: 
        // As we scroll, the camera pushes forward (Z) and slightly up (Y)
        // This forces the foreground tent and background moon to shift against each other.
        const targetY = THREE.MathUtils.lerp(-10, 15, animProgress);
        const targetZ = THREE.MathUtils.lerp(30, -10, animProgress);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, swayX, 2, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 2, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2, delta);
    });

    return (
        <group>
            {/* The Procedural Night Sky */}
            <Starfield />

            {/* Inverted Stylized Campfire Video Background */}
            <VideoCampLedge
                videoUrl="/assets/videos/campfire.mp4"
                position={[0, 0, -250]}
                scale={[400, 225]} // 16:9 Massive plane pushed deep in Z-space
                scrollProgress={scrollProgress}
            />
        </group>
    );
}

export default function CampModule({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    // Fade IN right as we enter (0.0 -> 0.1)
    // Fade OUT completely as we leave (0.6 -> 0.75) to avoid overlapping the Alpine module
    const canvasOpacity = useTransform(scrollProgress, [0.0, 0.1, 0.6, 0.75], [0, 1, 1, 0]);

    return (
        <motion.div
            style={{ opacity: canvasOpacity }}
            className="fixed inset-0 z-0 pointer-events-none transform-gpu mix-blend-screen"
        >
            <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={[1, 2]}>
                <Suspense fallback={null}>
                    <NightCampScene scrollProgress={scrollProgress} />
                </Suspense>
            </Canvas>
        </motion.div>
    );
}
