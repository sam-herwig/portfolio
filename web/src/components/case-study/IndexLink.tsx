'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

export default function IndexLink() {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    let sameOriginReferrer = false;
    if (document.referrer) {
      try {
        sameOriginReferrer = new URL(document.referrer).origin === window.location.origin;
      } catch {
        sameOriginReferrer = false;
      }
    }
    if (sameOriginReferrer && window.history.length > 1) {
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
        ← Index
      </Link>
    </nav>
  );
}
