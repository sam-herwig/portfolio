'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';

// R3F scene loaded client-only — avoids SSR WebGL crash
const GroveScene = dynamic(() => import('@/components/grove/GroveScene'), { ssr: false });

export default function ShhhhPage() {
  const router = useRouter();

  useEffect(() => {
    useFoundEggs.getState().markFound('grove');
  }, []);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    useAppStore.getState().startTransition({ x: e.clientX, y: e.clientY }, '#18181b', '/');
    window.setTimeout(() => router.push('/'), 500);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Live-rendered scene (R3F) */}
      <div className="absolute inset-0 z-0">
        <GroveScene />
      </div>

      {/* Back to trail */}
      <div className="absolute top-6 left-6 z-20 md:top-10 md:left-10">
        <Link
          href="/"
          onClick={handleBack}
          className="group inline-flex items-center gap-3 rounded-full border border-foreground/20 bg-background/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/70 backdrop-blur-md transition-colors hover:text-foreground"
        >
          <span className="relative block h-5 w-7">
            <Image src="/cairn/back-to-trail-marker.svg" alt="" fill className="object-contain" />
          </span>
          Return to trail
        </Link>
      </div>

      {/* Quiet wordmark — bottom-right whisper */}
      <p className="absolute bottom-6 right-6 z-20 font-instrument text-sm italic text-foreground/40 md:bottom-10 md:right-10">
        shhhh.
      </p>
    </main>
  );
}
