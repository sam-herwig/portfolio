'use client';

import dynamic from 'next/dynamic';

const LevaPanel = dynamic(() => import('leva').then((m) => ({ default: m.Leva })), { ssr: false });

export default function DevLeva({ enableCanvas }: { enableCanvas: boolean }) {
  if (process.env.NODE_ENV === 'production') return null;
  return <LevaPanel collapsed hidden={!enableCanvas} />;
}
