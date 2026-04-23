'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';
import { useAppStore } from '@/store/useAppStore';

// Full 3D scene — illustration planes at depth + water shader plane.
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
    <main
      className="relative h-screen w-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #b8bfc6 0%, #c0c5c5 14%, #c7ccc9 24%, #c9ccc7 32%, #c9ccc7 100%)',
      }}
    >
      {/* Full-bleed 3D scene (sky gradient shows through transparent Canvas bg) */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <GroveScene />
      </div>

      {/* Back to trail — icon only */}
      <Link
        href="/"
        onClick={handleBack}
        aria-label="Return to trail"
        className="group absolute top-6 left-6 inline-flex items-center justify-center rounded-full border border-foreground/20 bg-background/70 p-3 backdrop-blur-md transition-colors hover:bg-background/90 md:top-10 md:left-10"
        style={{ zIndex: 20 }}
      >
        <span className="relative block h-5 w-7">
          <Image src="/cairn/back-to-trail-marker.svg" alt="" fill className="object-contain" />
        </span>
      </Link>
    </main>
  );
}
