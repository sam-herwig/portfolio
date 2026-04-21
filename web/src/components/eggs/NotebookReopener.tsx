'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';

/**
 * Keyboard reopener for the Ranger's Notebook.
 * Press `]` on any page — once the first 7 eggs are found — to jump to /notebook.
 * Inactive until the hunt is mostly complete so it isn't stumbled upon early.
 */
export default function NotebookReopener() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== ']') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const found = useFoundEggs.getState().foundIds;
      const ready = (['trailhead', 'owl', 'ember', 'pennant', 'station-stamp', 'margin-note', 'cairn'] as const).every(
        (id) => found.includes(id),
      );
      if (!ready) return;
      router.push('/notebook');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  return null;
}
