import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectBySlug, getAllSlugs } from '@/data/projects';
import { getLabBySlug, hasLab } from '@/data/labs';

export function generateStaticParams() {
  return getAllSlugs()
    .filter((slug) => hasLab(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.title} · Lab — Sam Herwig`,
    description: `Backstage shader and pipeline notes for ${project.title}.`,
    robots: { index: false, follow: true },
  };
}

export default async function CaseStudyLabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  const lab = getLabBySlug(slug);
  if (!lab) notFound();

  return (
    <main className="min-h-screen w-full px-8 py-24 md:px-16">
      <nav className="mb-16 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-foreground/55">
        <Link href={`/work/${slug}`} className="hover:text-foreground" style={{ fontFamily: 'var(--font-geist-mono)' }}>
          ← {project.title}
        </Link>
        <span style={{ fontFamily: 'var(--font-geist-mono)' }}>Backstage</span>
      </nav>

      <header className="max-w-4xl">
        <p
          className="text-xs uppercase tracking-[0.4em] text-foreground/40"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {project.title} · Lab
        </p>
        <h1
          className="mt-6 text-balance text-5xl font-medium leading-[0.95] tracking-tight md:text-7xl lg:text-8xl"
          style={{ fontFamily: 'var(--font-fraunces)', fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0' }}
        >
          {lab.headline}
        </h1>
        <p
          className="mt-8 max-w-[60ch] text-xl leading-relaxed text-foreground/70 md:text-2xl"
          style={{ fontFamily: 'var(--font-instrument)' }}
        >
          {lab.intro}
        </p>
      </header>

      <section className="mt-24 max-w-4xl">
        <ul className="flex flex-col gap-16">
          {lab.notes.map((note, i) => (
            <li key={note.title}>
              <p
                className="text-[11px] uppercase tracking-[0.35em] text-foreground/45"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                Note · {String(i + 1).padStart(2, '0')}
              </p>
              <h2
                className="mt-3 text-3xl font-medium leading-tight tracking-tight md:text-4xl"
                style={{ fontFamily: 'var(--font-fraunces)' }}
              >
                {note.title}
              </h2>
              {note.body.split('\n\n').map((p) => (
                <p key={p} className="mt-5 max-w-[62ch] text-base leading-relaxed text-foreground/70 md:text-lg">
                  {p}
                </p>
              ))}
              {note.code && (
                <pre
                  className="mt-6 max-w-full overflow-x-auto rounded-sm border border-foreground/10 bg-foreground/[0.03] p-5 text-sm leading-relaxed text-foreground/75"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  <code>{note.code}</code>
                </pre>
              )}
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-32 border-t border-foreground/10 pt-12">
        <Link
          href={`/work/${slug}`}
          className="text-xs uppercase tracking-[0.3em] text-foreground/55 hover:text-foreground"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          ← Back to case study
        </Link>
      </footer>
    </main>
  );
}
