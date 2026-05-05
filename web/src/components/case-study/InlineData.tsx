import type { ReactNode } from 'react';

export default function InlineData({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-geist-pixel-grid)',
        fontFeatureSettings: '"liga" 0, "tnum" 1',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </span>
  );
}
