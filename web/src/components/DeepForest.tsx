/* eslint-disable */
import { useTexture, Html } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useMemo, useEffect, forwardRef } from 'react';
import { MotionValue } from 'framer-motion';

const WoodcutShader = 'woodcutShaderMaterial' as any;

function AnimatedSprite({ textureUrl, startX, endX, y, z, scale, rotation = 0, frames = 8, scrollStart, scrollEnd, cycles = 6, scrollProgress }: { textureUrl: string, startX: number, endX: number, y: number, z: number, scale: [number, number], rotation?: number, frames?: number, scrollStart: number, scrollEnd: number, cycles?: number, scrollProgress: MotionValue<number> }) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<any>(null);
    const lerpedProgress = useRef(0);
    const playhead = useRef(0); // Added to accumulate velocity independently

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

            // 2. Sprite Animation: Tie current frame to velocity
            // velocity is usually small (e.g. 0.1 to 2.0 progress/sec)
            const vel = Math.abs(scrollProgress.getVelocity());
            const animationSpeed = vel > 0.01 ? 10 + (vel * 150) : 0; // Walk very fast when scrolling, freeze when stopped

            // Only animate if the sprite is currently "visible" and active in the sequence
            if (clamped > 0 && clamped < 1) {
                playhead.current += animationSpeed * delta;
            }
            
            const currentFrame = Math.floor(playhead.current) % frames;
            clonedTex.offset.x = currentFrame / frames;
        }
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
            materialRef.current.uWind = state.clock.elapsedTime * 1.5;
            // The stag doesn't really need mouse tracking, but the material requires it to prevent throwing errors
            materialRef.current.uMouse.lerp(state.pointer, 0.1);
        }
    });

    return (
        <mesh ref={meshRef} position={[startX, y, z]} rotation-z={rotation}>
            <planeGeometry args={scale} />
            <WoodcutShader
                ref={materialRef}
                uTexture={clonedTex}
                transparent={true}
                depthWrite={true}
                alphaTest={0.5}
            />
        </mesh>
    );
}

const ForestTree = forwardRef(({ textureUrl, position, scale, rotation = 0 }: any, externalRef: any) => {
    const tex = useTexture(textureUrl) as THREE.Texture;
    // Internal ref for animations, assign to external if requested
    const meshRef = useRef<THREE.Mesh>(null);
    useEffect(() => {
        if (externalRef) externalRef.current = meshRef.current;
    }, [externalRef]);

    const materialRef = useRef<any>(null);
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
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
            materialRef.current.uWind = state.clock.elapsedTime * 1.5;
            // Smoothly track mouse pointer for the repulsion effect in WoodcutMaterial
            materialRef.current.uMouse.lerp(state.pointer, 0.1);
        }
    });

    return (
        // Start perfectly offset horizontally
        <mesh ref={meshRef} position={[offscreenX, position[1], position[2]]} rotation-z={rotation}>
            <planeGeometry args={scale} />
            <WoodcutShader
                ref={materialRef}
                uTexture={tex}
                transparent={true}
                depthWrite={true}
                alphaTest={0.5}
            />
        </mesh>
    );
});

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

function SpatialText({ position, title, subtitle, scrollProgress, trees }: { position: [number, number, number], title: string, subtitle: string, scrollProgress: MotionValue<number>, trees: React.MutableRefObject<THREE.Mesh | null>[] }) {
    const { camera } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const textRef = useRef<HTMLHeadingElement>(null);
    const htmlRef = useRef<HTMLDivElement>(null);
    const shieldMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const lerpedScroll = useRef(0);

    // Filter out null tree refs for occlusion
    const occludeArray = trees.filter(t => t.current !== null) as any;

    useFrame((state, delta) => {
        lerpedScroll.current = THREE.MathUtils.damp(lerpedScroll.current, scrollProgress.get(), 4, delta);
        const progress = lerpedScroll.current;

        // 1. Fog Logic: Calculate distance from camera to text Z. Fade to 0 if deeper than -60 units away.
        const dist = camera.position.z - position[2];
        // At 10 units away, full opacity. At 60 units away, zero opacity.
        const targetOpacity = 1.0 - Math.min(1, Math.max(0, (dist - 10) / 50));

        if (htmlRef.current) {
            htmlRef.current.style.opacity = targetOpacity.toFixed(3);
        }

        // 2. Kinetic Kineticism (Letter Spacing) based on scroll velocity
        if (textRef.current) {
            const vel = Math.abs(scrollProgress.getVelocity()); // px/sec roughly
            // Map 0 -> 1000 velocity to 0em -> 0.15em letter-spacing
            const mappedSpacing = Math.min(0.15, vel * 0.00015);
            
            // Dampen the letter-spacing directly into the DOM node to prevent React layout thrashing
            const currentSpacing = parseFloat(textRef.current.style.letterSpacing || '0');
            const dampedSpacing = THREE.MathUtils.damp(currentSpacing, mappedSpacing, 4, delta);
            textRef.current.style.letterSpacing = `${dampedSpacing.toFixed(4)}em`;
        }

        // 3. Readability Shield (meshBasicMaterial) 
        // Fade in a dark radial backdrop if we enter the dense focal zone of the forest [0.4 -> 0.6]
        if (shieldMatRef.current) {
            let shieldOpacity = 0;
            if (progress > 0.4 && progress < 0.6) {
                // Peak opacity of 0.8 at exactly 0.5
                const distFromCenter = Math.abs(0.5 - progress); // 0 at center, 0.1 at edges
                shieldOpacity = 0.8 * (1.0 - (distFromCenter / 0.1));
            }
            shieldMatRef.current.opacity = Math.min(0.8, Math.max(0, shieldOpacity));
        }
    });

    return (
        <group ref={groupRef} position={position}>
            <Html 
                ref={htmlRef} 
                transform 
                occlude={occludeArray} 
                zIndexRange={[100, 0]} 
                scale={2}
                distanceFactor={15} // Maintain proportional size 
            >
                <div className="w-[90vw] max-w-[800px] text-center pointer-events-none flex flex-col items-center select-none font-inter text-balance">
                    <h2 ref={textRef} className="text-5xl md:text-8xl font-bold mb-4 font-instrument text-foreground" style={{ transition: 'none' }}>
                        {title}
                    </h2>
                    <p className="text-xl md:text-3xl text-foreground/80 max-w-[30ch]">
                        {subtitle}
                    </p>
                </div>
            </Html>
            
            {/* Readability Guard Shield placed physically behind the HTML text (Z = -0.5) */}
            <mesh position={[0, 0, -0.5]}>
                <planeGeometry args={[60, 40]} />
                <meshBasicMaterial 
                    ref={shieldMatRef} 
                    color="#000000" 
                    transparent 
                    opacity={0} 
                    depthWrite={false} 
                />
            </mesh>
        </group>
    );
}

export default function DeepForest({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const tree1Ref = useRef<THREE.Mesh>(null);
    const tree2Ref = useRef<THREE.Mesh>(null);
    const tree3Ref = useRef<THREE.Mesh>(null);
    const tree4Ref = useRef<THREE.Mesh>(null);
    const treeArray = [tree1Ref, tree2Ref, tree3Ref, tree4Ref];

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
                ref={tree4Ref}
                textureUrl="/tree_sequoia.png"
                position={[-28, 2, -85]}
                scale={[65, 65]}
            />

            {/* Tree 3: Mid-distance - The sharp Spruce (Right) */}
            <ForestTree
                ref={tree3Ref}
                textureUrl="/tree_spruce.png"
                position={[25, 5, -55]}
                scale={[50, 50]}
                rotation={-0.05}
            />

            {/* Tree 2: Mid-foreground - The twisted Cherry Blossom (Left) */}
            <ForestTree
                ref={tree2Ref}
                textureUrl="/tree_cherry.png"
                position={[-25, 5, -25]}
                scale={[60, 60]}
                rotation={0.05}
            />

            {/* Tree 1: Extreme foreground, framing the entrance - The stark Aspen (Right) */}
            <ForestTree
                ref={tree1Ref}
                textureUrl="/tree_aspen.png"
                position={[25, -2, 0]}
                scale={[45, 45]}
            />

            {/* SPATIAL TYPOGRAPHY NODES */}
            <SpatialText 
                title="Hello, I'm Sam." 
                subtitle="I build digital realities rooted in analog aesthetics." 
                position={[0, 5, -12]} 
                scrollProgress={scrollProgress} 
                trees={treeArray} 
            />
            <SpatialText 
                title="Creative Technologist." 
                subtitle="Bridging the gap between front-end engineering, immersive WebGL, and high-end design." 
                position={[0, 5, -40]} 
                scrollProgress={scrollProgress} 
                trees={treeArray} 
            />
            <SpatialText 
                title="Crafting The Future." 
                subtitle="Using raw materials and massive architectures to tell stories in the browser." 
                position={[0, 5, -70]} 
                scrollProgress={scrollProgress} 
                trees={treeArray} 
            />
            <SpatialText 
                title="Keep Climbing." 
                subtitle="Below is a collection of my favorite spatial experiments and digital expeditions." 
                position={[0, 5, -110]} 
                scrollProgress={scrollProgress} 
                trees={treeArray} 
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
