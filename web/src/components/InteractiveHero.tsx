/* eslint-disable */
'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, useFBO, Text } from '@react-three/drei';
import { useRef, useEffect, Suspense } from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';
import * as THREE from 'three';
import PostProcessingStack from './PostProcessingStack';
import './shaders/RefractionMaterial';

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

function ParallaxLayer({ textureUrl, z, baseY = 0, speed = 1 }: any) {
    const tex = useTexture(textureUrl) as THREE.Texture;
    const { viewport, camera } = useThree();

    // Scale plane to mathematically cover the viewport at its SPECIFIC Z-depth!
    // Since textures are 1:1 squares, scale both axes to the maximum screen bound to ensure responsive fullscreen ("object-fit: cover")
    const currentViewport = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, z));
    const maxDim = Math.max(currentViewport.width, currentViewport.height);
    const scale = [maxDim * 1.5, maxDim * 1.5, 1];

    const materialRef = useRef<any>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const scrollY = useRef(0);
    const mousePos = useRef(new THREE.Vector2(0, 0));

    useEffect(() => {
        return () => {
            tex.dispose();
        };
    }, [tex]);

    useEffect(() => {
        const handleScroll = () => {
            scrollY.current = window.scrollY;
        };
        const handleMouseMove = (e: MouseEvent) => {
            // Normalize mouse coordinates roughly to World Space
            mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('mousemove', handleMouseMove, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useFrame((state, delta) => {
        // 1. Update Shader Uniforms
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;

            // Smoothly damp mouse position into the shader
            materialRef.current.uMouse.lerp(mousePos.current, 0.1);
        }

        // 2. Parallax sliding based on scroll speed
        if (meshRef.current) {
            const targetY = baseY + (scrollY.current * 0.005 * speed);
            // Translate Y for smooth scroll
            meshRef.current.position.y = THREE.MathUtils.damp(
                meshRef.current.position.y,
                targetY,
                5,
                delta
            );

            // Mouse look-around (Diorama Box effect)
            meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, mousePos.current.y * 0.05, 0.05);
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, mousePos.current.x * 0.05, 0.05);
        }
    });

    return (
        <mesh ref={meshRef} position={[0, baseY, z]}>
            {/* Scaled mathematically to window bounds, subdivided less severely than the extreme 3D version */}
            <planeGeometry args={[scale[0] * 1.5, scale[1] * 1.5, 64, 64]} />
            <WoodcutShader
                ref={materialRef}
                transparent
                depthWrite={false}
                uTexture={tex}
            />
        </mesh>
    );
}

function Scene({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const { camera, gl, scene, viewport } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const textRef = useRef<THREE.Mesh>(null);
    const textMatRef = useRef<any>(null);
    const lerpedProgress = useRef(0);
    
    // Responsive font size — scales with viewport width so it doesn't clip on mobile
    const fontSize = Math.min(8, viewport.width * 0.6);

    // High-fidelity render target to capture the background for the glass lens
    const mainRenderTarget = useFBO({
        samples: 4,
        type: THREE.HalfFloatType
    });

    // The Camera Mountain Climb
    useFrame((state, delta) => {
        lerpedProgress.current = THREE.MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
        const progress = lerpedProgress.current; // 0.0 to 1.0

        if (groupRef.current) {
            // Cull when completely scrolled out of the Hero Phase [0.0, 0.25]
            groupRef.current.visible = progress < 0.25;
        }

        // Target progress: ensure we hit max zoom roughly 80% down the first quarter before fadeout
        // Map [0.0 - 0.20] strictly into [0.0 - 1.0] for the climb
        const Math_val = progress / 0.20;
        const climbProgress = Math.min(Math.max(0, Math_val), 1.0);

        // 1. Z Travel: Start at Basecamp (Z=20), end at the Summit (Z=-28)
        const targetZ = THREE.MathUtils.lerp(20, -28, climbProgress);
        camera.position.z = targetZ;

        // 2. Y Travel: Ascend the mountain visually
        const targetY = THREE.MathUtils.lerp(0, 4, climbProgress);
        camera.position.y = targetY;

        // 3. Look slightly up as we climb
        const targetRotX = THREE.MathUtils.lerp(0, 0.15, climbProgress);
        camera.rotation.x = targetRotX;

        // 4. Custom FBO Refraction Logic for the Hero Text
        if (textRef.current && textMatRef.current) {
            // Hide the text so it doesn't render into its own refraction background
            textRef.current.visible = false;
            
            // Render the isolated environment to the FBO
            gl.setRenderTarget(mainRenderTarget);
            gl.render(scene, camera);
            
            // Restore default render pipeline
            gl.setRenderTarget(null);
            
            // Show the text again and pass the captured texture
            textRef.current.visible = true;
            textMatRef.current.uTexture = mainRenderTarget.texture;
            textMatRef.current.uWinSize.set(window.innerWidth, window.innerHeight);
        }
    });

    return (
        <group ref={groupRef} position={[0, -2, -5]}>
            {/* 0. The 3D Refractive Hero Text */}
            <Text
                ref={textRef}
                position={[0, 0, 5]}
                fontSize={fontSize}
                letterSpacing={-0.05}
                anchorX="center"
                anchorY="middle"
                font="/fonts/InstrumentSerif-Regular.ttf"
            >
                Let's Go On A Journey.
                <RefractionShader ref={textMatRef} uRefraction={0.06} />
            </Text>

            {/* 1. Distant Background / Sky */}
            <ParallaxLayer
                textureUrl="/bg_layer.webp"
                z={-80}
                baseY={20} // push up significantly since it's far away
                speed={0.1}
            />

            {/* 2. Midground Mountains */}
            <ParallaxLayer
                textureUrl="/mg_layer.webp"
                z={-30}
                baseY={5}
                speed={0.5}
            />

            {/* 3. Foreground Peaks and Cabin */}
            <ParallaxLayer
                textureUrl="/fg_layer.webp"
                z={10}
                baseY={-8}
                speed={1.0}
            />
        </group>
    );
}

const isMobileHero = typeof window !== 'undefined' && window.innerWidth < 768;

export default function InteractiveHero({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    // Hero Fade Sequence: 
    // Start solid at Basecamp [0.0] -> Stay solid until climb finish [0.2] -> Fade completely by [0.25]
    const canvasOpacity = useTransform(scrollProgress, [0.0, 0.2, 0.25], [1, 1, 0]);
    // The Hero is the first view, so it doesn't fade in. Instead, we scale it UP slightly as we climb!
    const canvasScale = useTransform(scrollProgress, [0.0, 0.2], [1.0, 1.05]);

    return (
        <motion.div
            style={{ opacity: canvasOpacity, scale: canvasScale }}
            className="absolute inset-0 z-0 pointer-events-none bg-background transform-gpu origin-center"
        >
            <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={isMobileHero ? [1, 1] : [1, 1.5]}>
                <Suspense fallback={null}>
                    {/* Stage 1: The Mountain Climb */}
                    <Scene scrollProgress={scrollProgress} />
                    <PostProcessingStack />
                </Suspense>
            </Canvas>
        </motion.div>
    );
}
