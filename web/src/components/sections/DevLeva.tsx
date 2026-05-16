'use client';

import dynamic from 'next/dynamic';

const LevaPanel = dynamic(() => import('leva').then((m) => ({ default: m.Leva })), { ssr: false });

// Leva must be mounted somewhere or its useControls() calls trigger an
// auto-mount fallback that injects a default panel into <body>. In production
// we wrap it in display:none so axe-core skips the (unlabeled, low-contrast)
// inputs entirely — `hidden` alone keeps them in the layout tree.
export default function DevLeva({ enableCanvas }: { enableCanvas: boolean }) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return (
      <div style={{ display: 'none' }} aria-hidden>
        <LevaPanel hidden />
      </div>
    );
  }
  return <LevaPanel collapsed hidden={!enableCanvas} />;
}
