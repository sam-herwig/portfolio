import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Off Trail · 404 — Sam Herwig',
  description: 'The trail ended a few miles back. Backtrack to the trailhead.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-background px-6 py-24 text-foreground">
      {/* Faint paper grain backdrop — radial gradients echo the hero atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 12%, rgba(24,24,27,0.04), transparent 55%),' +
            'radial-gradient(circle at 82% 88%, rgba(24,24,27,0.05), transparent 60%),' +
            'repeating-linear-gradient(135deg, transparent 0 14px, rgba(24,24,27,0.022) 14px 15px)',
        }}
      />

      {/* Eyebrow — mono small caps in field-journal voice */}
      <p className="mb-8 flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.35em] text-foreground/60">
        <span aria-hidden className="block h-px w-10 bg-foreground/30" />
        Error · 404 · Off Trail
        <span aria-hidden className="block h-px w-10 bg-foreground/30" />
      </p>

      {/* Display heading */}
      <h1 className="font-instrument text-7xl italic leading-[0.95] tracking-tight md:text-9xl lg:text-[10rem]">
        Off Trail.
      </h1>

      {/* Tilted signpost + topographic dotted line that ends abruptly */}
      <div className="relative mt-12 flex w-full max-w-2xl items-center justify-center" aria-hidden>
        <svg
          width="100%"
          height="48"
          viewBox="0 0 800 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-foreground/35"
          preserveAspectRatio="none"
        >
          {/* Trailing line — the trail you walked */}
          <path
            d="M 0 24 Q 100 16, 200 24 T 400 24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 6"
            fill="none"
          />
          {/* Final waypoint dot, then nothing */}
          <circle cx="400" cy="24" r="3" fill="currentColor" />
          {/* Faint ghost continuation that fades to nothing */}
          <path
            d="M 410 24 L 480 24"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="1 5"
            opacity="0.25"
            fill="none"
          />
        </svg>

        {/* Tilted signpost sprite, planted at the end of the trail */}
        <Image
          src="/assets/graphics/case-study/trail-marker-signpost.webp"
          alt=""
          width={120}
          height={120}
          className="relative h-28 w-28 -rotate-[8deg] opacity-90 md:h-32 md:w-32"
          unoptimized
        />
      </div>

      {/* Field-journal dispatch copy */}
      <p className="mt-12 max-w-[34ch] text-balance text-center text-base leading-relaxed text-foreground/75 md:text-lg">
        You&rsquo;ve wandered past the last waypoint. The trail ended a few miles back &mdash;{' '}
        <span className="italic">backtrack to the trailhead</span> and pick up the route from there.
      </p>

      {/* CTA — mirrors the Summit "Pitch Me Your Mountain" button language */}
      <div className="mt-12">
        <Link
          href="/"
          aria-label="Return to the trailhead — go back to the homepage"
          className="group relative overflow-hidden rounded-sm border-2 border-foreground bg-foreground px-8 py-4 text-background shadow-2xl transition-colors duration-500 hover:text-foreground md:px-12 md:py-6"
        >
          <span className="relative z-10 font-space-mono text-sm font-bold uppercase tracking-widest">
            ← Return to Trailhead
          </span>
          <div className="absolute -inset-px origin-right scale-x-0 transform bg-background transition-transform duration-500 ease-out group-hover:scale-x-[1.02]" />
        </Link>
      </div>

      {/* Footer mark — Fig. style, matches case-study marginalia */}
      <p className="mt-20 font-mono text-[0.65rem] uppercase tracking-[0.4em] text-foreground/40">
        Fig. 404 &mdash; Lost waypoint
      </p>
    </main>
  );
}
