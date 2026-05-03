import type { ChapterBlock } from '@/data/projects';

export default function ChapterMark({ number, title, eyebrow }: Omit<ChapterBlock, 'type'>) {
  return (
    <section className="relative flex min-h-[60vh] w-full items-center px-8 pt-32 md:px-16">
      <div className="max-w-5xl">
        {eyebrow && (
          <p
            className="mb-6 text-[11px] uppercase tracking-[0.4em] text-foreground/40"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            {eyebrow}
          </p>
        )}
        <p
          className="text-xs uppercase tracking-[0.4em] text-foreground/40"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Chapter {number}
        </p>
        <h2
          className="mt-6 text-balance text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl lg:text-[5.5rem]"
          style={{ fontFamily: 'var(--font-fraunces)', fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0' }}
        >
          {title}
        </h2>
      </div>
    </section>
  );
}
