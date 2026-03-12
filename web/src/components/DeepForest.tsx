import { useTexture } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useMemo, useEffect } from 'react';
import { MotionValue } from 'framer-motion';

function AnimatedSprite({ textureUrl, startX, endX, y, z, scale, rotation = 0, frames = 8, scrollStart, scrollEnd, cycles = 6, scrollProgress }: { textureUrl: string, startX: number, endX: number, y: number, z: number, scale: [number, number], rotation?: number, frames?: number, scrollStart: number, scrollEnd: number, cycles?: number, scrollProgress: MotionValue<number> }) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    const meshRef = useRef<THREE.Mesh>(null);
    const lerpedProgress = useRef(0);

    const clonedTex = useMemo(() => {
        const clone = tex.clone();
        clone.wrapS = THREE.RepeatWrapping;
        clone.wrapT = THREE.RepeatWrapping;
        clone.repeat.set(1 / frames, 1);
        return clone;
    }, [tex, frames]);
    useEffect(() => {
        return () => {
            tex.dispose();
            clonedTex.dispose();
        };
    }, [tex, clonedTex]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            lerpedProgress.current = THREE.MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
            const progress = lerpedProgress.current;
            // Map the global scroll progress strictly to this module's local scroll range constraint
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

function ForestTree({ textureUrl, position, scale, rotation = 0 }: any) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    const meshRef = useRef<THREE.Mesh>(null);
    const { camera } = useThree();

    const targetX = position[0];
    const sideDir = position[0] > 0 ? 1 : -1;
    // Pushed 40 units offscreen relative to target
    const offscreenX = targetX + (40 * sideDir);

    useEffect(() => {
        return () => {
            tex.dispose();
        };
    }, [tex]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Sway physics
            meshRef.current.rotation.z = rotation + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.02;

            // Distance from camera to this tree
            const dist = camera.position.z - position[2];

            // Slide in logic: Between distance of 50 and 10, animate progress from 0 to 1
            let progress = 0;
            if (dist < 50) {
                progress = 1.0 - Math.max(0, (dist - 10) / 40);
            }
            progress = Math.min(1, Math.max(0, progress));

            // Ease Out Quart for dramatic snap
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentX = THREE.MathUtils.lerp(offscreenX, targetX, easeOutQuart);

            meshRef.current.position.x = currentX;
        }
    });

    return (
        // Start perfectly offset horizontally
        <mesh ref={meshRef} position={[offscreenX, position[1], position[2]]} rotation-z={rotation}>
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

function ForestWall({ textureUrl, position, scale }: any) {
    const tex = useTexture(textureUrl) as THREE.Texture;

    const clonedTex = useMemo(() => {
        const clone = tex.clone();
        clone.wrapS = THREE.MirroredRepeatWrapping;
        clone.wrapT = THREE.MirroredRepeatWrapping;
        return clone;
    }, [tex]);

    useEffect(() => {
        return () => {
            tex.dispose();
            clonedTex.dispose();
        };
    }, [tex, clonedTex]);

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
                depthWrite={false} // Ensure it stays behind the trees
                alphaTest={0.5}
            />
        </mesh>
    );
}

export default function DeepForest({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    return (
        <group>
            {/* The Endless Background Wall of Trees */}
            <ForestWall
                textureUrl="/forest_wall.png"
                position={[0, 10, -180]}
                scale={[300, 300]}
            />

            {/* The Gauntlet of Trees - Staggered Left / Right */}

            {/* Tree 4: Deep distance - The massive Sequoia anchoring the path (Left) */}
            <ForestTree
                textureUrl="/tree_sequoia.png"
                position={[-28, 2, -85]}
                scale={[65, 65]}
            />

            {/* Tree 3: Mid-distance - The sharp Spruce (Right) */}
            <ForestTree
                textureUrl="/tree_spruce.png"
                position={[25, 5, -55]}
                scale={[50, 50]}
                rotation={-0.05}
            />

            {/* Tree 2: Mid-foreground - The twisted Cherry Blossom (Left) */}
            <ForestTree
                textureUrl="/tree_cherry.png"
                position={[-25, 5, -25]}
                scale={[60, 60]}
                rotation={0.05}
            />

            {/* Tree 1: Extreme foreground, framing the entrance - The stark Aspen (Right) */}
            <ForestTree
                textureUrl="/tree_aspen.png"
                position={[25, -2, 0]}
                scale={[45, 45]}
            />

            {/* The Animated Stag (Walking subtly in the midground, tied directly to scroll) */}
            <AnimatedSprite
                textureUrl="/stag_sprite.png"
                startX={-50}
                endX={50}
                y={-5}
                z={-40}
                scrollStart={0.15}
                scrollEnd={0.35}
                scale={[18, 18]}
                frames={8}
                cycles={8}
                scrollProgress={scrollProgress}
            />
        </group>
    );
}
