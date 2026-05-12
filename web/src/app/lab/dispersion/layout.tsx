import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// metadata must be exported from a server component — the dispersion page
// itself is 'use client' for the R3F canvas, so the route's metadata lives in
// this segment layout instead of the page.
export const metadata: Metadata = {
  title: 'Dispersion Lab — Sam Herwig',
  description:
    'Per-channel IOR transmission material lab — RYGCBV 6-channel spectral split and drei MeshTransmissionMaterial reference.',
  robots: { index: false, follow: false },
};

export default function DispersionLabLayout({ children }: { children: ReactNode }) {
  return children;
}
