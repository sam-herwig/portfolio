import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Sam Herwig',
  description: 'Page not found.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-start justify-center px-8 md:px-16">
      <p
        className="mb-6 text-xs uppercase tracking-[0.3em] text-foreground/50"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        404
      </p>
      <h1
        className="text-7xl font-medium leading-[0.95] tracking-tight md:text-9xl"
        style={{ fontFamily: 'var(--font-fraunces)' }}
      >
        Not here.
      </h1>
      <Link
        href="/"
        className="mt-12 text-xs uppercase tracking-[0.3em] text-foreground/60 hover:text-foreground"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        ← Back
      </Link>
    </main>
  );
}
