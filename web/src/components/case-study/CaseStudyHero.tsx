import Image from 'next/image';
import type { Project } from '@/data/projects';

export default function CaseStudyHero({ project }: { project: Project }) {
  return (
    <header className="relative w-full">
      {/* Visual anchor — full-bleed banner with project thumbnail. The
          dark gradient at the bottom seats the title into the image so the
          hero reads as a single typographic poster, not a stack of two
          unrelated blocks. */}
      <div className="relative h-[78vh] w-full overflow-hidden md:h-[88vh]">
        <Image src={project.thumbnail} alt={project.title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/15 to-background" />

        <div className="absolute inset-0 flex items-end px-8 pb-16 md:px-16 md:pb-20">
          <div>
            <ul
              className="mb-8 flex flex-wrap gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.4em] text-foreground/60"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              {project.year && <li>{project.year}</li>}
              {project.role && <li>{project.role}</li>}
              {project.client && <li>{project.client}</li>}
            </ul>
            <h1
              className="text-balance text-6xl font-medium leading-[0.95] tracking-tight md:text-8xl lg:text-[10rem]"
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0',
              }}
            >
              {project.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Below-the-fold lede — sits flush against the banner, leans
          editorial with Instrument Serif italic for the headline. */}
      <div className="px-8 pb-16 pt-20 md:px-16 md:pb-24 md:pt-28">
        <div className="grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <p
              className="text-[11px] uppercase tracking-[0.35em] text-foreground/50"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              Overview
            </p>
          </div>
          <div className="md:col-span-8">
            <p
              className="max-w-[28ch] text-balance text-3xl italic leading-[1.15] text-foreground md:text-5xl lg:text-6xl"
              style={{ fontFamily: 'var(--font-instrument)' }}
            >
              {project.overview.headline}
            </p>
            <p className="mt-10 max-w-[58ch] text-lg leading-relaxed text-foreground/70 md:text-xl md:leading-[1.55]">
              {project.overview.body}
            </p>

            <div className="mt-12 flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              {project.tags && project.tags.length > 0 && (
                <ul className="flex max-w-3xl flex-wrap gap-2">
                  {project.tags.slice(0, 6).map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-foreground/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/55"
                      style={{ fontFamily: 'var(--font-geist-mono)' }}
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
              {project.projectUrl && (
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 text-xs uppercase tracking-[0.3em] text-foreground/60 underline-offset-4 hover:text-foreground hover:underline"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  Visit live ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
