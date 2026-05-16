import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/data/projects';

export default function NextProject({ next }: { next: Project }) {
  return (
    <section className="relative mt-24 w-full">
      <Link
        href={`/work/${next.slug}`}
        className="group relative block h-[80vh] w-full overflow-hidden"
        aria-label={`${next.title} — next project`}
      >
        <Image
          src={next.thumbnail}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-50 transition-all duration-700 group-hover:scale-[1.02] group-hover:opacity-70"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
        <div className="absolute inset-0 flex flex-col items-start justify-end px-8 pb-20 md:px-16 md:pb-32">
          <p
            className="mb-6 text-[11px] uppercase tracking-[0.4em] text-foreground/55"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            Next Project
          </p>
          <h2
            className="text-balance text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl lg:text-9xl"
            style={{ fontFamily: 'var(--font-fraunces)', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0' }}
          >
            {next.title}
          </h2>
          <p
            className="mt-6 max-w-[55ch] text-lg text-foreground/65 md:text-xl"
            style={{ fontFamily: 'var(--font-instrument)' }}
          >
            {next.overview.headline}
          </p>
          <span
            className="mt-10 inline-flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-foreground/55 transition-all group-hover:gap-5 group-hover:text-foreground"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            Continue →
          </span>
        </div>
      </Link>
    </section>
  );
}
