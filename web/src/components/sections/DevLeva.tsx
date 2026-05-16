'use client';

import dynamic from 'next/dynamic';

const LevaPanel = dynamic(() => import('leva').then((m) => ({ default: m.Leva })), { ssr: false });

// Always mount a Leva root — even in production with `hidden`. If we return
// null, Leva's useControls() calls in BackgroundField / CaseStudyHeroLayer
// trigger Leva's auto-mount fallback, which injects a default panel into the
// DOM with low-contrast text + unlabeled inputs (Lighthouse a11y failures).
export default function DevLeva({ enableCanvas }: { enableCanvas: boolean }) {
  const isProduction = process.env.NODE_ENV === 'production';
  return <LevaPanel collapsed hidden={isProduction || !enableCanvas} />;
}
