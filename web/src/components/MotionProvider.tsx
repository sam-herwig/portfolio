'use client';

import { LazyMotion, domAnimation } from 'framer-motion';
import type { ReactNode } from 'react';

// Wraps the app in LazyMotion + the dom-animation feature bundle so every
// `m.*` component in the tree resolves its animation features lazily. Saves
// roughly 30kb gzipped vs importing `motion` directly across each overlay.
// `domAnimation` is the smaller bundle and covers everything the site uses
// (no drag / pan). Switch to `domMax` only if a future feature needs gestures.
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
