import Image from 'next/image';
import Link from 'next/link';
import { getFeaturedProjects } from '@/data/projects';

export default function Home() {
  const projects = getFeaturedProjects();

  return (
    <main id="main-content" className="min-h-screen w-full">
      <section className="flex min-h-screen flex-col items-start justify-center px-8 md:px-16">
        <p
          className="mb-6 text-xs uppercase tracking-[0.35em] text-foreground/50"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Sam Herwig — Creative Engineer
        </p>
        <h1
          className="text-balance text-7xl font-medium leading-[0.95] tracking-tight md:text-8xl lg:text-[10rem]"
          style={{ fontFamily: 'var(--font-fraunces)', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0' }}
        >
          Sam Herwig.
        </h1>
        <p
          className="mt-8 max-w-[55ch] text-xl leading-relaxed text-foreground/75 md:text-2xl"
          style={{ fontFamily: 'var(--font-instrument)' }}
        >
          3D web, motion, marketing builds. Currently shipping things at the limit of WebGL and taste.
        </p>
      </section>

      <section className="px-8 py-32 md:px-16">
        <div className="mb-16 flex items-baseline justify-between">
          <p
            className="text-xs uppercase tracking-[0.35em] text-foreground/50"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            Selected Work
          </p>
          <p
            className="text-xs uppercase tracking-[0.35em] text-foreground/35"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            {String(projects.length).padStart(2, '0')} · 2021–2026
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-y-20 md:grid-cols-2 md:gap-x-12 md:gap-y-32">
          {projects.map((p, i) => (
            <li key={p.slug} className={i % 2 === 1 ? 'md:mt-32' : ''}>
              <Link href={`/work/${p.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-foreground/5">
                  <Image
                    src={p.thumbnail}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-6 flex items-baseline justify-between">
                  <span
                    className="text-[11px] uppercase tracking-[0.3em] text-foreground/40"
                    style={{ fontFamily: 'var(--font-geist-mono)' }}
                  >
                    {String(i + 1).padStart(2, '0')} · {p.year ?? '—'}
                  </span>
                  <span
                    className="text-[11px] uppercase tracking-[0.3em] text-foreground/40"
                    style={{ fontFamily: 'var(--font-geist-mono)' }}
                  >
                    {p.client ?? p.role ?? ''}
                  </span>
                </div>
                <h2
                  className="mt-3 text-balance text-3xl font-medium leading-[1.05] tracking-tight md:text-4xl lg:text-5xl"
                  style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0',
                  }}
                >
                  {p.title}
                </h2>
                <p
                  className="mt-3 max-w-[50ch] text-base leading-relaxed text-foreground/65 md:text-lg"
                  style={{ fontFamily: 'var(--font-instrument)' }}
                >
                  {p.subtitle}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex min-h-[70vh] flex-col items-start justify-center px-8 md:px-16">
        <p
          className="mb-6 text-xs uppercase tracking-[0.35em] text-foreground/50"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Contact
        </p>
        <a
          href="mailto:sam@samherwig.dev"
          className="text-balance text-5xl font-medium tracking-tight text-foreground transition-opacity hover:opacity-70 md:text-7xl lg:text-8xl"
          style={{ fontFamily: 'var(--font-fraunces)', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0' }}
        >
          sam@samherwig.dev
        </a>
        <p
          className="mt-6 max-w-[50ch] text-lg text-foreground/55 md:text-xl"
          style={{ fontFamily: 'var(--font-instrument)' }}
        >
          Currently taking on agency-tier marketing builds — Three.js, custom shaders, motion systems.
        </p>
      </section>

      <footer className="px-8 py-16 md:px-16">
        <div
          className="flex flex-col items-start justify-between gap-4 border-t border-foreground/10 pt-8 text-[10px] uppercase tracking-[0.3em] text-foreground/40 md:flex-row md:items-center"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          <span>© Sam Herwig · 2026</span>
          <span>Denver, CO · Available worldwide</span>
        </div>
      </footer>
    </main>
  );
}
