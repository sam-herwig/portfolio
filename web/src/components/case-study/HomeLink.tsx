'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

export default function HomeLink() {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    // history.length > 1 means there's an entry to step back to — same gate
    // the browser back button uses. document.referrer is unreliable here
    // because Next's client-side <Link> navigation doesn't update it, so a
    // visit from /  →  /work/foo arrives with referrer === '' and any
    // same-origin check fails.
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <nav className="fixed left-8 top-8 z-40 md:left-16">
      <Link
        href="/"
        onClick={handleClick}
        className="text-xs uppercase tracking-[0.3em] text-foreground/55 hover:text-foreground"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        ← Home
      </Link>
    </nav>
  );
}
