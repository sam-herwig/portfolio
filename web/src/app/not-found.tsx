import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-[0.65rem] font-mono uppercase tracking-[0.35em] text-foreground/60">
        Trail Not Found
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
        404
      </h1>
      <p className="mt-4 max-w-[30ch] text-base leading-8 text-foreground/70">
        This path doesn&apos;t lead anywhere. Let&apos;s get you back to basecamp.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-mono uppercase tracking-[0.2em] text-background transition-transform duration-300 hover:-translate-y-0.5"
      >
        Back to Basecamp
      </Link>
    </main>
  );
}
