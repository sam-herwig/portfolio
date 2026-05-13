'use client';

import { Leva } from 'leva';
import { useState } from 'react';

export default function CaseStudyDebugPanel() {
  const [show] = useState(() => {
    if (process.env.NODE_ENV === 'production') return false;
    if (typeof window === 'undefined') return false;
    return window.location.search.includes('leva');
  });
  if (!show) return null;
  return <Leva collapsed={false} />;
}
