'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useEffect } from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';

import * as THREE from 'three';
import './shaders/WoodcutMaterial';
import DeepForest from './DeepForest';
import PostProcessingStack from './PostProcessingStack';

const WoodcutShader = 'woodcutShaderMaterial' as any;

function ForestCamera({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const { camera } = useThree();
    const lerpedProgress = useRef(0);

    // The Forest Walk Camera (Only active between 0.0 and 1.0)
    useFrame((state, delta) => {
        lerpedProgress.current = THREE.MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
        const progress = lerpedProgress.current;

        // Delay the start of the deep walk to frame [0.2] and end it at [0.5]
        const forestProgress = Math.min(Math.max(0, (progress - 0.2) / 0.3), 1.0);

        // Z Travel: We start outside the forest at Z=20, and walk deep through it to Z=-90
        const targetZ = THREE.MathUtils.lerp(20, -90, forestProgress);
        camera.position.z = targetZ;

        // Simulate walking footsteps (head bobbing side to side and up and down)
        const walkSwayX = Math.sin(forestProgress * Math.PI * 10) * 0.5;
        const walkSwayY = Math.abs(Math.sin(forestProgress * Math.PI * 10)) * 0.5;

        camera.position.x = walkSwayX;
        camera.position.y = walkSwayY;

        // Look slightly up into the massive trees
        camera.rotation.x = 0.1;
    });

    return null;
}


function ForestScene({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const groupRef = useRef<THREE.Group>(null);
    const lerpedProgress = useRef(0);

    // Frustum Culling Logic
    useFrame((state, delta) => {
        if (groupRef.current) {
            lerpedProgress.current = THREE.MathUtils.damp(lerpedProgress.current, scrollProgress.get(), 4, delta);
            // Strictly bound the rendering load to the active Phase window [0.2 -> 0.5] with a tiny buffer
            groupRef.current.visible = lerpedProgress.current > 0.19 && lerpedProgress.current < 0.51;
        }
    });

    return (
        <group ref={groupRef}>
            {/* The Camera Controller */}
            <ForestCamera scrollProgress={scrollProgress} />

            {/* The 3D Assets placed deep on the Z-Axis */}
            <DeepForest scrollProgress={scrollProgress} />
        </group>
    );
}

const isMobileForest = typeof window !== 'undefined' && window.innerWidth < 768;

export default function ForestModule({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    // Fade IN smoothly during the overlap with the Hero climb [0.2 -> 0.3]
    // Fade OUT completely as we approach the dark Night Camp [0.45 -> 0.5]
    const canvasOpacity = useTransform(scrollProgress, [0.2, 0.3, 0.45, 0.5], [0, 1, 1, 0]);
    const canvasScale = useTransform(scrollProgress, [0.2, 0.3], [0.9, 1.0]);

    return (
        <motion.div
            style={{ opacity: canvasOpacity, scale: canvasScale }}
            className="fixed inset-0 z-0 pointer-events-none transform-gpu mix-blend-multiply origin-center"
        >
            <Canvas camera={{ position: [0, 0, 20], fov: 50 }} dpr={isMobileForest ? [1, 1] : [1, 1.5]}>
                <Suspense fallback={null}>
                    <ForestScene scrollProgress={scrollProgress} />
                    <PostProcessingStack />
                </Suspense>
            </Canvas>
        </motion.div>
    );
}
