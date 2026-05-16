'use client';

import { Leva } from 'leva';
import { useState } from 'react';

// Leva must be mounted somewhere or its useControls() calls trigger an
// auto-mount fallback that injects a default panel into <body>. When hidden,
// we wrap in display:none so axe-core skips the (unlabeled, low-contrast)
// inputs entirely — `hidden` alone keeps them in the layout tree.
export default function CaseStudyDebugPanel() {
  const [show] = useState(() => {
    if (process.env.NODE_ENV === 'production') return false;
    if (typeof window === 'undefined') return false;
    return window.location.search.includes('leva');
  });
  if (!show) {
    return (
      <div style={{ display: 'none' }} aria-hidden>
        <Leva hidden />
      </div>
    );
  }
  return <Leva collapsed={false} />;
}
