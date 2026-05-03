import type { Project } from '@/data/projects';

export default function CaseStudyHero({ project }: { project: Project }) {
  const meta = [project.year, project.role, project.client].filter(Boolean) as string[];

  return (
    <header className="relative flex min-h-[90vh] w-full flex-col justify-end px-8 pb-16 pt-32 md:px-16 md:pb-24 md:pt-40">
      <p
        className="mb-8 text-xs uppercase tracking-[0.4em] text-foreground/45"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        {meta.join('  ·  ')}
      </p>
      <h1
        className="text-balance text-6xl font-medium leading-[0.95] tracking-tight md:text-8xl lg:text-[10rem]"
        style={{ fontFamily: 'var(--font-fraunces)', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0' }}
      >
        {project.title}
      </h1>
      <p
        className="mt-8 max-w-[60ch] text-xl leading-relaxed text-foreground/70 md:text-2xl"
        style={{ fontFamily: 'var(--font-instrument)' }}
      >
        {project.overview.headline}
      </p>
      <p className="mt-8 max-w-[60ch] text-base leading-relaxed text-foreground/55 md:text-lg">
        {project.overview.body}
      </p>
      {project.tags && project.tags.length > 0 && (
        <ul className="mt-12 flex max-w-3xl flex-wrap gap-2">
          {project.tags.map((tag) => (
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
          className="mt-10 inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.3em] text-foreground/60 underline-offset-4 hover:text-foreground hover:underline"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Visit live ↗
        </a>
      )}
    </header>
  );
}
