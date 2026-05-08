import type { Project } from '@/data/projects';

export default function CaseStudyHero({ project }: { project: Project }) {
  return (
    <header className="relative w-full md:min-h-[100svh]">
      <div className="flex min-h-[calc(100svh-100vw)] flex-col justify-center gap-12 px-8 pb-20 pt-[100vw] md:min-h-[100svh] md:px-12 md:py-24 md:pt-24 lg:px-16">
        <ul
          className="flex flex-wrap gap-x-8 gap-y-2 text-[14px] tracking-[0.18em] text-foreground/60 md:text-[16px]"
          style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
        >
          {project.year && <li>{project.year}</li>}
          {project.role && <li>{project.role}</li>}
          {project.client && <li>{project.client}</li>}
        </ul>

        <h1
          className="text-balance text-5xl font-medium leading-[0.95] tracking-tight md:text-6xl lg:text-7xl"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0',
          }}
        >
          {project.title}
        </h1>

        <div className="flex flex-col gap-6">
          <p
            className="text-[12px] tracking-[0.18em] text-foreground/50"
            style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
          >
            Overview
          </p>
          <p
            className="text-balance text-2xl italic leading-[1.15] text-foreground md:text-3xl lg:text-4xl"
            style={{ fontFamily: 'var(--font-instrument)' }}
          >
            {project.overview.headline}
          </p>
          <p className="text-base leading-relaxed text-foreground/70 md:text-lg">{project.overview.body}</p>
        </div>

        <div className="flex flex-col items-start gap-6">
          {project.tags && project.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
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
    </header>
  );
}
