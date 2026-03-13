// @ts-nocheck
'use client';import { useFrame } from '@react-three/fiber';
import { EffectComposer, Noise, ChromaticAberration, Vignette, DepthOfField, Bloom } from '@react-three/postprocessing';
import { useState, useRef } from 'react';
import * as THREE from 'three';

const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.navigator.maxTouchPoints > 0);

export default function PostProcessingStack({ bloomIntensity = 0 }: { bloomIntensity?: number }) {
    const [performanceOk, setPerformanceOk] = useState(true);
    const fpsTracker = useRef({ frames: 0, lastTime: 0 });

    // Performance Monitor: Disable DepthOfField if FPS drops below ~55 to protect the experience
    useFrame((state) => {
        const time = state.clock.elapsedTime;
        fpsTracker.current.frames++;

        if (time - fpsTracker.current.lastTime >= 1.0) {
            const fps = fpsTracker.current.frames;
            if (fps < 50 && performanceOk) {
                console.warn('PostProcessingStack: Dropping DepthOfField to maintain 120Hz target.');
                setPerformanceOk(false);
            }
            fpsTracker.current.frames = 0;
            fpsTracker.current.lastTime = time;
        }
    });

    return (
        // @ts-expect-error - React 18 strict children mismatch with postprocessing types
        <EffectComposer disableNormalPass multisampling={isMobile ? 0 : 4}>
            {/* 1. Cinematic Grain: Binds the transparent PNGs and vectors together to feel like physical medium */}
            <Noise opacity={0.06} />

            {/* 2. Lens Distortion: Creates a subtle analog camera imperfection at the edges */}
            {!isMobile && (
                <ChromaticAberration
                    offset={new THREE.Vector2(0.0008, 0.0008)}
                    radialModulation={true}
                    modulationOffset={0.5}
                />
            )}

            {/* 3. Vignette: Focuses the user's eye towards the center of the viewport naturally */}
            <Vignette eskil={false} offset={0.1} darkness={0.8} />

            {/* 4. Cinematic Depth of Field: Only on desktop and if the machine can handle it */}
            {!isMobile && performanceOk && (
                <DepthOfField
                    focusDistance={0.0} // Focus on the immediate screen plane
                    focalLength={0.02}
                    bokehScale={2}
                    height={480}
                />
            )}

            {/* 5. Dynamic Bloom (Optional for CampModule) */}
            {bloomIntensity > 0.01 && (
                <Bloom 
                    intensity={bloomIntensity} 
                    luminanceThreshold={0.5} 
                    luminanceSmoothing={0.9} 
                    mipmapBlur 
                />
            )}
        </EffectComposer>
    );
}
