'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, useVideoTexture } from '@react-three/drei';
import { Suspense, useRef, useMemo, useEffect } from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';
import * as THREE from 'three';
import PostProcessingStack from './PostProcessingStack';

function PanoramaLedge({ textureUrl, position, scale, parallaxX = 0, scrollProgress }: any) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    const meshRef = useRef<THREE.Mesh>(null);
    const lerpedProgress = useRef(0);

    useEffect(() => {
        return () => {
            tex.dispose();
        };
    }, [tex]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            lerpedProgress.current = THREE.MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
            const progress = lerpedProgress.current;
            // Map global scroll [0.85 -> 1.0] to local progress [0.0 -> 1.0]
            const animProgress = Math.min(1, Math.max(0, (progress - 0.85) / 0.15));

            // Start panning background only AFTER it completely fades in at 0.66
            const panProgress = Math.min(1, Math.max(0, (animProgress - 0.66) / 0.34));
            meshRef.current.position.x = position[0] - (panProgress * parallaxX);

            // Fade the massive vista in dramatically AFTER fox settles (0.50 -> 0.66)
            let opacity = 0;
            if (animProgress < 0.83) {
                opacity = Math.min(1, Math.max(0, (animProgress - 0.50) / 0.16));
            } else {
                // Fade out at end
                opacity = 1 - Math.min(1, Math.max(0, (animProgress - 0.83) / 0.17));
            }

            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
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

function VideoPanoramaLedge({ videoUrl, position, parallaxX = 0, playThreshold = 0.33, scrollProgress }: { videoUrl: string, position: any, parallaxX?: number, playThreshold?: number, scrollProgress: MotionValue<number> }) {
    // Start video paused so we can trigger it mathematically with the scroll wheel
    const tex = useVideoTexture(videoUrl, { start: false, muted: true, crossOrigin: 'Anonymous' });
    const meshRef = useRef<THREE.Mesh>(null);
    const { viewport, camera } = useThree();

    // Calculate object-fit: cover scale for 16:9 video at this specific Z-depth
    const currentViewport = viewport.getCurrentViewport(camera, new THREE.Vector3(position[0], position[1], position[2]));
    const videoAspect = 16 / 9;
    const screenAspect = currentViewport.width / currentViewport.height;

    let width = currentViewport.width;
    let height = currentViewport.height;

    if (screenAspect > videoAspect) {
        width = currentViewport.width;
        height = currentViewport.width / videoAspect;
    } else {
        height = currentViewport.height;
        width = currentViewport.height * videoAspect;
    }
    const dynamicScale: [number, number, number] = [width * 1.2, height * 1.2, 1];

    const lerpedProgress = useRef(0);

    // Video Lifecycle Guard (Outside of rendering loop)
    useEffect(() => {
        if (!tex?.image) return;
        const videoElem = tex.image as HTMLVideoElement;

        const unsubscribe = scrollProgress.on("change", (v: number) => {
            // Map global threshold [0.85 + percent] limit
            const globalPlay = 0.85 + (playThreshold * 0.15);
            // Fox lands and video triggers
            if (v > globalPlay && v <= 1.0) {
                if (videoElem.paused) videoElem.play().catch(() => {});
            } else {
                if (!videoElem.paused) {
                    videoElem.pause();
                    videoElem.currentTime = 0; // Hardware memory flush
                }
            }
        });

        return () => {
            unsubscribe();
            // Strict WebGL Garbage Collection
            tex.dispose();
        };
    }, [tex, scrollProgress, playThreshold]);

    useFrame((state, delta) => {
        if (meshRef.current && tex.image) {
            lerpedProgress.current = THREE.MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
            const progress = lerpedProgress.current;

            // Map global scroll [0.85 -> 1.0] to local progress [0.0 -> 1.0]
            const animProgress = Math.min(1, Math.max(0, (progress - 0.85) / 0.15));

            // Start panning background only AFTER it completely fades in at 0.66
            const panProgress = Math.min(1, Math.max(0, (animProgress - 0.66) / 0.34));
            meshRef.current.position.x = position[0] - (panProgress * parallaxX);

            // Fade the massive vista in dramatically AFTER fox settles (0.50 -> 0.66)
            let opacity = 0;
            if (animProgress < 0.83) {
                opacity = Math.min(1, Math.max(0, (animProgress - 0.50) / 0.16));
            } else {
                opacity = 1 - Math.min(1, Math.max(0, (animProgress - 0.83) / 0.17));
            }

            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            {/* The video texture needs to be perfectly mapped, use dynamically calculated object-fit scale */}
            <planeGeometry args={dynamicScale} />
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

function ForegroundLedge({ textureUrl, position, startZ, endZ, startY, endY, scrollProgress }: { textureUrl: string, position: any, startZ: number, endZ: number, startY: number, endY: number, scrollProgress: MotionValue<number> }) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    const meshRef = useRef<THREE.Mesh>(null);
    const { viewport, camera } = useThree();

    // Calculate 1:1 square scale based on the stopping Z-depth so it covers the screen width/height
    const currentViewport = viewport.getCurrentViewport(camera, new THREE.Vector3(position[0], position[1], endZ));
    const maxDim = Math.max(currentViewport.width, currentViewport.height);
    const dynamicScale: [number, number, number] = [maxDim * 1.5, maxDim * 1.5, 1];
    const lerpedProgress = useRef(0);

    useEffect(() => {
        return () => {
            tex.dispose();
        };
    }, [tex]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            lerpedProgress.current = THREE.MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
            const progress = lerpedProgress.current;
            // Map global scroll [0.85 -> 1.0] to local progress [0.0 -> 1.0]
            const animProgress = Math.min(1, Math.max(0, (progress - 0.85) / 0.15));
            // Ledge flies towards the camera from deep Z-space (0.0 to 0.25)
            const flyProgress = Math.min(1, Math.max(0, (animProgress - 0.0) / 0.25));

            // Ease out cubic for a dramatic reveal
            const easeOut = 1 - Math.pow(1 - flyProgress, 3);

            // Move from deep Z towards camera (creates natural perspective scale from 20% to 100%)
            meshRef.current.position.z = THREE.MathUtils.lerp(startZ, endZ, easeOut);

            // Move slightly in Y to land at bottom
            meshRef.current.position.y = THREE.MathUtils.lerp(startY, endY, easeOut);
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <planeGeometry args={dynamicScale} />
            <meshBasicMaterial
                map={tex}
                transparent
                depthWrite={true}
                alphaTest={0.5}
            />
        </mesh>
    );
}

// A one-shot animated sprite that locks to the final frame when its scroll cycle completes
function OneShotAnimatedFox({ textureUrl, startX, endX, startYOffset, endYOffset, startZ, endZ, scale, rotation = 0, frames = 8, scrollStart, scrollEnd, cycles = 6, scrollProgress }: any) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    const meshRef = useRef<THREE.Mesh>(null);

    const clonedTex = useMemo(() => {
        const clone = tex.clone();
        clone.wrapS = THREE.RepeatWrapping;
        clone.wrapT = THREE.RepeatWrapping;
        clone.repeat.set(1 / frames, 1);
        return clone;
    }, [tex, frames]);

    const lerpedProgress = useRef(0);

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
            // Map global scroll [0.85 -> 1.0] to local progress [0.0 -> 1.0]
            const animProgress = Math.min(1, Math.max(0, (progress - 0.85) / 0.15));

            // Wait for the ledge to rise (0.0 - 0.25), then start walking
            const clamped = Math.min(1, Math.max(0, (animProgress - scrollStart) / (scrollEnd - scrollStart)));

            // Move fox horizontally
            // Wait for the ledge to completely finish arriving before walking (0.25 -> 0.50)
            const walkProgress = Math.min(1, Math.max(0, (animProgress - 0.25) / 0.25));
            meshRef.current.position.x = THREE.MathUtils.lerp(startX, endX, walkProgress);

            // Move fox vertically and in Z in tandem with the flying ForegroundLedge so it stays grounded
            // Matches the ledge fly envelope (0.0 -> 0.25)
            const flyProgress = Math.min(1, Math.max(0, (animProgress - 0.0) / 0.25));
            const easeOut = 1 - Math.pow(1 - flyProgress, 3);

            // The fox rides the ledge up and forward
            meshRef.current.position.y = THREE.MathUtils.lerp(startYOffset, endYOffset, easeOut);
            meshRef.current.position.z = THREE.MathUtils.lerp(startZ, endZ, easeOut);

            // Frame Animation Logic
            if (walkProgress >= 1.0) {
                // Lock on the final cuddling pose
                // eslint-disable-next-line react-hooks/immutability
                clonedTex.offset.x = (frames - 1) / frames;
                // Fade out slightly when curled up to blend with the scene
            } else if (walkProgress > 0) {
                // Loop normally while walking
                const totalFrames = walkProgress * cycles * frames;
                const currentFrame = Math.floor(totalFrames) % frames;
                // eslint-disable-next-line react-hooks/immutability
                clonedTex.offset.x = currentFrame / frames;
            } else if (walkProgress === 0) {
                // eslint-disable-next-line react-hooks/immutability
                clonedTex.offset.x = 0;
            }
        }
    });

    return (
        <mesh ref={meshRef} position={[startX, startYOffset, startZ]} rotation-z={rotation}>
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

function SummitCamera() {
    const { camera } = useThree();

    useFrame(() => {
        // Keep camera fixed on the Summit; parallax is handled independently on the meshes
        camera.position.set(0, 0, 20);
        camera.rotation.set(0, 0, 0);
    });

    return null;
}

function SummitScene({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const groupRef = useRef<THREE.Group>(null);
    const lerpedProgress = useRef(0);

    // Frustum Culling Logic
    useFrame((state, delta) => {
        if (groupRef.current) {
            lerpedProgress.current = THREE.MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
            // Hide mesh bounds from Three.js renderer if they are completely off screen
            groupRef.current.visible = lerpedProgress.current > 0.84; // End module, never culls on right bound
        }
    });

    return (
        <group ref={groupRef}>
            {/* The Camera Controller */}
            <SummitCamera />

            {/* The Massive Panoramic Background */}
            <group>
                        <VideoPanoramaLedge
                            videoUrl="/assets/videos/summit_video.mp4"
                            position={[-15, 2, -40]} // Centered on camera X (-15), pushed back
                            parallaxX={5} // Slides slowly left
                            playThreshold={0.33} // Plays exactly when Fox walks in
                            scrollProgress={scrollProgress}
                        />

                        {/* The new foreground cliff edge that we are standing on */}
                        <ForegroundLedge
                            textureUrl="/cliff_edge.png"
                            position={[0, 0, 0]}
                            startZ={-150} // Deep in background (appears ~20% size)
                            endZ={5}     // Extreme foreground right in front of camera
                            startY={-15}
                            endY={-10}   // Rises to frame the bottom 25% of the screen
                            scrollProgress={scrollProgress}
                        />

                        {/* The Fox that walks in and curls up on the ledge */}
                        <OneShotAnimatedFox
                            textureUrl="/fox_sprite.png"
                            startX={-18}
                            endX={2}
                            startYOffset={-12} // Starts relative to deep cliff Y
                            endYOffset={-2}    // Land nicely on top of the big cliff
                            startZ={-150}      // Same flight path as ledge
                            endZ={5}           // Same stop point 
                            scale={[6, 6]}     // Organic Fox scale, not too gigantic
                            frames={7}
                            cycles={6}
                            scrollStart={0.25} // Starts walking exactly as ledge arrives
                            scrollEnd={0.50}   // Finish walking totally before the panorama fades in at 0.50
                            scrollProgress={scrollProgress}
                        />
                    </group>
        </group>
    );
}

export default function SummitModule({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    // Scene fades in quickly as we enter the local box [0.85 -> 0.95]
    const canvasOpacity = useTransform(scrollProgress, [0.85, 0.95], [0, 1]);
    const canvasScale = useTransform(scrollProgress, [0.85, 0.95], [0.9, 1.0]);

    return (
        <motion.div
            style={{ opacity: canvasOpacity, scale: canvasScale }}
            className="fixed inset-0 z-0 pointer-events-none transform-gpu mix-blend-multiply origin-center"
        >
            <Canvas camera={{ position: [-15, 0, 20], fov: 50 }} dpr={[1, 1.5]}>
                <Suspense fallback={null}>
                    <SummitScene scrollProgress={scrollProgress} />
                    <PostProcessingStack />
                </Suspense>
            </Canvas>
        </motion.div>
    );
}
