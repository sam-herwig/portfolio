'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import './shaders/ParticleMaterial';

import { motion, MotionValue } from 'framer-motion';

const ParticleShader = 'particleShaderMaterial' as any;

export default function DigitalParticleSystem({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const isAlternateReality = useAppStore((state) => state.isAlternateReality);
    const materialRef = useRef<any>(null);
    const meshRef = useRef<THREE.Points>(null);
    const mousePos = useRef(new THREE.Vector2(0, 0));

    // Generate Particle Geometry once
    const particlesCount = 2500;

    const [positions, scales] = useMemo(() => {
        const pos = new Float32Array(particlesCount * 3);
        const scales = new Float32Array(particlesCount);

        for (let i = 0; i < particlesCount; i++) {
            // Distribute particles in a sparse 3D sphere radius ~ 15
            const r = 15 * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            pos[i * 3 + 0] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;

            // Randomize sizes
            scales[i] = Math.random();
        }
        return [pos, scales];
    }, [particlesCount]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const altTarget = isAlternateReality ? 1.0 : 0.0;

    useFrame((state, delta) => {
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;

            // Dampen mouse pos
            materialRef.current.uMouse.lerp(mousePos.current, 0.1);

            // Crossfade opacity purely based on state
            materialRef.current.uAlternateReality = THREE.MathUtils.damp(
                materialRef.current.uAlternateReality,
                altTarget,
                3, // fade speed
                delta
            );
        }
    });

    return (
        <points ref={meshRef} position={[0, 0, -5]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particlesCount}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-aScale"
                    count={particlesCount}
                    array={scales}
                    itemSize={1}
                    args={[scales, 1]}
                />
            </bufferGeometry>
            {/* 
              Our custom shader that handles all the physics and rendering.
              It will naturally fade to alpha=0 when uAlternateReality approaches 0
            */}
            <ParticleShader
                ref={materialRef}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}
