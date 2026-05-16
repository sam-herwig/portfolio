'use client';

import { Leva } from 'leva';
import { useState } from 'react';

// Always mount a Leva root; toggle `hidden`. Returning null lets Leva's
// useControls() calls trigger its auto-mount fallback, which renders a
// default panel into the DOM and tanks accessibility scores.
export default function CaseStudyDebugPanel() {
  const [show] = useState(() => {
    if (process.env.NODE_ENV === 'production') return false;
    if (typeof window === 'undefined') return false;
    return window.location.search.includes('leva');
  });
  return <Leva collapsed={false} hidden={!show} />;
}
