import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectBySlug, getAllSlugs, getAdjacentProjects } from '@/data/projects';
import { hasLab } from '@/data/labs';
import BlockRenderer from '@/components/case-study/BlockRenderer';
import CaseStudyHero from '@/components/case-study/CaseStudyHero';
import NextProject from '@/components/case-study/NextProject';

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
    <main className="min-h-screen w-full">
      <nav className="absolute left-8 top-8 z-20 md:left-16">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.3em] text-foreground/55 hover:text-foreground"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          ← Index
        </Link>
      </nav>

      <CaseStudyHero project={project} />

      {project.blocks?.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}

      {project.deliverables && project.deliverables.length > 0 && (
        <footer className="px-8 py-24 md:px-16">
          <div className="grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <p
                className="text-[11px] uppercase tracking-[0.35em] text-foreground/50"
                style={{ fontFamily: 'var(--font-geist-mono)' }}
              >
                Credits
              </p>
            </div>
            <div className="md:col-span-8">
              <p
                className="text-base leading-relaxed text-foreground/70 md:text-lg"
                style={{ fontFamily: 'var(--font-instrument)' }}
              >
                {project.year && <span>{project.year}. </span>}
                {project.role && <span>{project.role} for </span>}
                {project.client && <span>{project.client}. </span>}
                {project.deliverables.length > 0 && <span>Delivered: {project.deliverables.join(', ')}.</span>}
              </p>
              {project.relatedSites && project.relatedSites.length > 0 && (
                <ul className="mt-8 flex flex-col gap-2">
                  {project.relatedSites.map((site) => (
                    <li key={site.url}>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-baseline gap-3 text-sm text-foreground/60 hover:text-foreground"
                      >
                        <span
                          className="text-[10px] uppercase tracking-[0.3em] text-foreground/40"
                          style={{ fontFamily: 'var(--font-geist-mono)' }}
                        >
                          {site.tag}
                        </span>
                        {site.name} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {hasLab(slug) && (
                <div className="mt-12">
                  <Link
                    href={`/work/${slug}/lab`}
                    className="group inline-flex items-baseline gap-3 text-xs uppercase tracking-[0.3em] text-foreground/60 hover:text-foreground"
                    style={{ fontFamily: 'var(--font-geist-mono)' }}
                  >
                    Backstage notes <span className="transition-all group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </footer>
      )}

      {next && <NextProject next={next} />}
    </main>
  );
}
