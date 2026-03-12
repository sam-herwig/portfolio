'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, useVideoTexture } from '@react-three/drei';
import { Suspense, useRef, useMemo } from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';
import * as THREE from 'three';

function AnimatedSprite({ textureUrl, startX, endX, y, z, scale, rotation = 0, frames = 8, scrollStart, scrollEnd, cycles = 6, scrollProgress }: any) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    const meshRef = useRef<THREE.Mesh>(null);

    const clonedTex = useMemo(() => {
        const clone = tex.clone();
        clone.wrapS = THREE.RepeatWrapping;
        clone.wrapT = THREE.RepeatWrapping;
        clone.repeat.set(1 / frames, 1);
        return clone;
    }, [tex, frames]);

    useFrame(() => {
        if (meshRef.current) {
            const progress = scrollProgress.get();
            // Map strictly to this module's local scroll range constraint
            const clamped = Math.min(1, Math.max(0, (progress - scrollStart) / (scrollEnd - scrollStart)));

            // 1. Physical Translation: Move linearly from startX to endX
            meshRef.current.position.x = THREE.MathUtils.lerp(startX, endX, clamped);

            // 2. Sprite Animation: Tie current frame to scroll directly, looping it 'cycles' times
            const totalFrames = clamped * cycles * frames;
            const currentFrame = Math.floor(totalFrames) % frames;
            clonedTex.offset.x = currentFrame / frames;
        }
    });

    return (
        <mesh ref={meshRef} position={[startX, y, z]} rotation-z={rotation}>
            <planeGeometry args={scale} />
            <meshBasicMaterial
                map={clonedTex}
                transparent
                depthWrite={true}
                alphaTest={0.5}
            />
        </mesh>
    );
}

function RockLedge({ textureUrl, position, scale, rotation = 0 }: any) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    const meshRef = useRef<THREE.Mesh>(null);

    return (
        <mesh ref={meshRef} position={position} rotation-z={rotation}>
            <planeGeometry args={scale} />
            <meshBasicMaterial
                map={tex}
                transparent
                depthWrite={true}
                alphaTest={0.5}
            />
        </mesh>
    );
}

function FogLedge({ textureUrl, position, scale }: any) {
    const tex = useTexture(textureUrl) as THREE.Texture;

    const clonedTex = useMemo(() => {
        const clone = tex.clone();
        clone.wrapS = THREE.MirroredRepeatWrapping;
        clone.wrapT = THREE.MirroredRepeatWrapping;
        return clone;
    }, [tex]);

    useFrame((state, delta) => {
        // Slowly drift the fog texture endlessly to create a rolling weather effect
        clonedTex.offset.x -= delta * 0.03;
    });

    return (
        <mesh position={position}>
            <planeGeometry args={scale} />
            <meshBasicMaterial
                map={clonedTex}
                transparent
                depthWrite={true}
                alphaTest={0.5}
            />
        </mesh>
    );
}

function BirdFlock({ textureUrl, position, scale, rotation = 0 }: any) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            // The flock physically circles overhead
            meshRef.current.rotation.z -= delta * 0.15;
        }
    });

    return (
        <mesh ref={meshRef} position={position} rotation-z={rotation}>
            <planeGeometry args={scale} />
            <meshBasicMaterial
                map={tex}
                transparent
                depthWrite={true}
                alphaTest={0.5}
            />
        </mesh>
    );
}

function AlpineWall({ textureUrl, position, scale }: any) {
    const tex = useTexture(textureUrl) as THREE.Texture;

    const clonedTex = useMemo(() => {
        const clone = tex.clone();
        clone.wrapS = THREE.MirroredRepeatWrapping;
        clone.wrapT = THREE.MirroredRepeatWrapping;
        return clone;
    }, [tex]);

    useFrame((state, delta) => {
        // Slowly drift the background wall to create deep parallax
        clonedTex.offset.x -= delta * 0.05;
    });

    return (
        <mesh position={position}>
            <planeGeometry args={scale} />
            <meshBasicMaterial
                map={clonedTex}
                transparent
                depthWrite={false} // Ensure it stays behind the rocks and fog
                alphaTest={0.5}
            />
        </mesh>
    );
}

function AlpineCamera({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const { camera } = useThree();

    // The Vertical Ascent Camera (Active between 0.0 and 1.0)
    useFrame((state, delta) => {
        const progress = scrollProgress.get();

        // The entire container is our climb surface
        const climbProgress = progress;

        // Simulate body movement/climbing step sway (creates 3 full organic side-to-side sways)
        const climbSwayX = Math.sin(climbProgress * Math.PI * 6) * 1.5;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, climbSwayX, 4, delta);

        // Y Travel: We climb vertically up the extremely tall rock face from Y=0 to Y=120
        const targetY = THREE.MathUtils.lerp(0, 120, climbProgress);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 4, delta);

        // Z Travel: Pull very close to the cliff face for visceral scale and extreme parallax
        const targetZ = 15;
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 4, delta);

        // Look slightly up the wall
        const targetRotX = 0.15;
        camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, targetRotX, 4, delta);
    });

    return null;
}

function VideoAlpineIntro({ videoUrl, position, scale, scrollProgress }: any) {
    const tex = useVideoTexture(videoUrl, { start: false, muted: true, crossOrigin: 'Anonymous' });
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current && tex.image) {
            const progress = scrollProgress.get();
            const videoElem = tex.image as HTMLVideoElement;

            // Fade out completely by the time the vertical climb starts (0.10 -> 0.15)
            let opacity = 1;
            if (progress > 0.10) {
                opacity = 1 - Math.min(1, Math.max(0, (progress - 0.10) / 0.05));
            }
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;

            // Autoplay the video once the user is in the Alpine Module entry bounds
            if (progress > 0.0 && progress < 0.20) {
                if (videoElem.paused) videoElem.play();
            } else {
                if (!videoElem.paused) videoElem.pause();
            }
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            {/* 16:9 relative plane mapping */}
            <planeGeometry args={scale} />
            <meshBasicMaterial
                map={tex}
                transparent
                depthWrite={true}
                alphaTest={0.5}
            />
        </mesh>
    );
}

export default function AlpineModule({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    // Fade IN as the module enters (0.0 -> 0.1)
    // Fade OUT completely as the camera reaches the Summit Module (0.9 -> 1.0)
    const canvasOpacity = useTransform(scrollProgress, [0.0, 0.1, 0.9, 1.0], [0, 1, 1, 0]);

    return (
        <motion.div
            style={{ opacity: canvasOpacity }}
            className="fixed inset-0 z-0 pointer-events-none transform-gpu mix-blend-multiply"
        >
            <Canvas camera={{ position: [0, 0, 40], fov: 50 }} dpr={[1, 2]}>
                <Suspense fallback={null}>
                    {/* The Camera Controller */}
                    <AlpineCamera scrollProgress={scrollProgress} />

                    {/* Cinematic Intro Video - Fades out before the vertical climb begins */}
                    <VideoAlpineIntro
                        videoUrl="/assets/videos/alpine_intro.mp4"
                        position={[0, 0, 5]} // Deep behind the start of the camera move so it fully immerses the climb
                        scale={[64, 36]} // 16:9 plane scale
                        scrollProgress={scrollProgress}
                    />

                    {/* The Deep Ambient Mountain Skyline */}
                    <AlpineWall
                        textureUrl="/alpine_wall.png"
                        position={[0, 80, -500]}
                        scale={[1200, 1200]}
                    />

                    {/* The High Alpine Ledges (Spread out vertically along the Y-axis) */}
                    <group>
                        {/* Ledge 1: Left Monolith (Frames Case Study 1 on right) */}
                        <RockLedge
                            textureUrl="/alpine_ledge_left.png"
                            position={[-12, 0, -5]}
                            scale={[25, 25]}
                        />

                        {/* Ledge 2: Right Cluster (Frames Case Study 2 on left) */}
                        <RockLedge
                            textureUrl="/alpine_ledge_right.png"
                            position={[12, 30, -10]}
                            scale={[25, 25]}
                        />

                        {/* Ledge 3: Left Overhang (Frames Case Study 3 on right) */}
                        <RockLedge
                            textureUrl="/alpine_ledge_left_variant_2.png"
                            position={[-12, 60, -15]}
                            scale={[25, 25]}
                        />

                        {/* Ledge 4: Right Vertical Cliff (Frames Case Study 4 on left) */}
                        <RockLedge
                            textureUrl="/alpine_ledge_right_variant_2.png"
                            position={[12, 90, -20]}
                            scale={[25, 25]}
                        />

                        {/* The Flapping Bird (Flying high in the thin air, tied to scroll) */}
                        <AnimatedSprite
                            textureUrl="/bird_sprite.png"
                            startX={-45}
                            endX={45}
                            y={105}
                            z={-30}
                            scrollStart={0.60}
                            scrollEnd={0.90}
                            scale={[15, 15]}
                            scrollProgress={scrollProgress}
                            frames={8}
                            cycles={10}
                        />
                    </group>
                </Suspense>
            </Canvas>
        </motion.div>
    );
}
