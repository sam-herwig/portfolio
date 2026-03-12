'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

const ModelViewer = 'model-viewer' as any;

export default function ARViewer({ src = "https://modelviewer.dev/shared-assets/models/Astronaut.glb", alt = "A 3D model of an astronaut" }) {
    const isAlternateReality = useAppStore((state) => state.isAlternateReality);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Dynamically import model-viewer on client
        import('@google/model-viewer').then(() => {
            setMounted(true);
        });
    }, []);

    if (!mounted) {
        return (
            <div className="w-full h-[500px] flex items-center justify-center rounded-2xl glassmorphism border border-foreground/10 animate-pulse">
                <span className="font-mono text-sm tracking-widest uppercase text-foreground/50">Loading AR Engine...</span>
            </div>
        );
    }

    return (
        <div className={`w-full max-w-4xl mx-auto h-[500px] relative rounded-[2.5rem] overflow-hidden transition-all duration-700 ${isAlternateReality ? 'shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] border-emerald-500/20' : 'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border-foreground/10'} border`}>
            {/* 
        This is a Google model-viewer web component.
        It has built in AR support for iOS via AR Quick Look, and Android via Scene Viewer.
      */}
            <ModelViewer
                src={src}
                alt={alt}
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                touch-action="pan-y"
                disable-zoom
                shadow-intensity="1"
                environment-image={isAlternateReality ? 'legacy' : 'neutral'}
                style={{ width: '100%', height: '100%', backgroundColor: isAlternateReality ? '#050505' : 'transparent' }}
            >
                {/* AR Button customization */}
                <button slot="ar-button" className="absolute bottom-4 right-4 bg-foreground text-background px-6 py-3 rounded-full font-mono text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                    View in Space
                </button>
            </ModelViewer>

            {/* Label indicating Reality Mode */}
            <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
                <div className={`w-2 h-2 rounded-full ${isAlternateReality ? 'bg-emerald-500 animate-pulse' : 'bg-foreground/40'}`} />
                <span className="font-mono text-xs uppercase tracking-widest text-foreground/70">
                    XR Module
                </span>
            </div>
        </div>
    );
}
