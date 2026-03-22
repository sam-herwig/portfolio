'use client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-semibold tracking-tight">Something went wrong.</h2>
      <p className="mt-3 text-foreground/60">An unexpected error occurred.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-full border border-foreground/20 px-6 py-3 text-sm font-mono uppercase tracking-widest transition-colors hover:bg-foreground/5"
      >
        Try Again
      </button>
    </div>
  );
}
