import { getFeaturedProjects } from '@/data/projects';
import Link from 'next/link';

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
          className="text-7xl font-medium leading-[0.95] tracking-tight md:text-8xl lg:text-[10rem]"
          style={{ fontFamily: 'var(--font-fraunces)', fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0' }}
        >
          Sam Herwig.
        </h1>
        <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-foreground/70 md:text-xl">
          3D web, motion, marketing builds. Currently shipping things at the limit of WebGL and taste.
        </p>
      </section>

      <section className="px-8 py-32 md:px-16">
        <p
          className="mb-12 text-xs uppercase tracking-[0.35em] text-foreground/50"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Selected Work / {String(projects.length).padStart(2, '0')}
        </p>
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {projects.map((p, i) => (
            <li key={p.slug}>
              <Link
                href={`/work/${p.slug}`}
                className="group block border-t border-foreground/10 pt-8 transition-colors hover:border-foreground/30"
              >
                <span
                  className="text-xs uppercase tracking-[0.3em] text-foreground/40"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="mt-2 text-3xl font-medium md:text-4xl" style={{ fontFamily: 'var(--font-fraunces)' }}>
                  {p.title}
                </h2>
                <p className="mt-2 text-sm text-foreground/60 md:text-base">{p.subtitle}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex min-h-[60vh] flex-col items-start justify-center px-8 md:px-16">
        <p
          className="mb-6 text-xs uppercase tracking-[0.35em] text-foreground/50"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          Contact
        </p>
        <a
          href="mailto:sam@samherwig.dev"
          className="text-5xl font-medium tracking-tight text-foreground md:text-7xl"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          sam@samherwig.dev
        </a>
      </section>
    </main>
  );
}
