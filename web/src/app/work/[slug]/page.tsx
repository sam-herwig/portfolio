import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectBySlug, getAllSlugs, getAdjacentProjects } from '@/data/projects';

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.title} — Sam Herwig`,
    description: project.overview.headline,
    alternates: { canonical: `/work/${slug}` },
    openGraph: {
      title: `${project.title} — Sam Herwig`,
      description: project.overview.headline,
      url: `/work/${slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} — Sam Herwig`,
      description: project.overview.headline,
      creator: '@samherwig',
    },
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { next } = getAdjacentProjects(slug);

  return (
    <main className="min-h-screen w-full px-8 py-24 md:px-16">
      <Link
        href="/"
        className="text-xs uppercase tracking-[0.3em] text-foreground/50 hover:text-foreground"
        style={{ fontFamily: 'var(--font-geist-mono)' }}
      >
        ← Index
      </Link>

      <header className="mt-16 max-w-4xl">
        <p
          className="text-xs uppercase tracking-[0.3em] text-foreground/40"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          {[project.year, project.role, project.client].filter(Boolean).join(' · ')}
        </p>
        <h1
          className="mt-6 text-6xl font-medium leading-[0.95] tracking-tight md:text-8xl"
          style={{ fontFamily: 'var(--font-fraunces)' }}
        >
          {project.title}
        </h1>
        <p className="mt-6 max-w-[60ch] text-xl text-foreground/70 md:text-2xl">{project.overview.headline}</p>
        <p className="mt-6 max-w-[68ch] text-base leading-relaxed text-foreground/60">{project.overview.body}</p>
      </header>

      {next && (
        <footer className="mt-32 border-t border-foreground/10 pt-12">
          <p
            className="text-xs uppercase tracking-[0.3em] text-foreground/40"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            Next
          </p>
          <Link href={`/work/${next.slug}`} className="mt-4 inline-block">
            <h2 className="text-4xl font-medium md:text-5xl" style={{ fontFamily: 'var(--font-fraunces)' }}>
              {next.title}
            </h2>
          </Link>
        </footer>
      )}
    </main>
  );
}
