import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjectBySlug, getAllSlugs, getAdjacentProjects, splitBlocks } from '@/data/projects';
import BlockRenderer from '@/components/case-study/BlockRenderer';
import CaseStudyBrief from '@/components/case-study/CaseStudyBrief';
import CaseStudyDebugPanel from '@/components/case-study/CaseStudyDebugPanel';
import CaseStudyHero from '@/components/case-study/CaseStudyHero';
import IndexLink from '@/components/case-study/IndexLink';
import NextProject from '@/components/case-study/NextProject';
import ScrollProgress from '@/components/case-study/ScrollProgress';
import { SITE_URL } from '@/lib/siteUrl';

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  const ogImage = `${SITE_URL}/work/${slug}/opengraph-image`;
  return {
    title: `${project.title} — Sam Herwig`,
    description: project.overview.headline,
    alternates: { canonical: `/work/${slug}` },
    openGraph: {
      title: `${project.title} — Sam Herwig`,
      description: project.overview.headline,
      url: `/work/${slug}`,
      type: 'article',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} — Sam Herwig`,
      description: project.overview.headline,
      creator: '@samherwig',
      images: [ogImage],
    },
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { next } = getAdjacentProjects(slug);
  const { brief, body } = splitBlocks(project);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    headline: project.overview.headline,
    description: project.overview.body,
    url: `${SITE_URL}/work/${slug}`,
    image: `${SITE_URL}/work/${slug}/opengraph-image`,
    author: { '@type': 'Person', name: 'Sam Herwig', url: SITE_URL },
    ...(project.year && { datePublished: project.year.split(/[–-]/)[0].trim() }),
    ...(project.client && { sourceOrganization: { '@type': 'Organization', name: project.client } }),
  };

  return (
    <main id="main-content" className="min-h-screen w-full">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <ScrollProgress />
      <CaseStudyDebugPanel />
      <IndexLink />

      {/* Hero band — ~200svh pinned scroll runway. Desktop 2-col grid reserves
          the left half for the position:fixed canvas (shader pins via SceneCanvas);
          right column splits into Hero slot (CaseStudyHero, min-h-[100svh]) and
          Brief slot (CaseStudyBrief, min-h-[100svh], chapter-01 content). See
          ADR 0005. Mobile stacks the same components sequentially beneath the
          pinned 1:1 strip overlay. */}
      <section className="md:grid md:min-h-[200svh] md:grid-cols-2">
        <div className="hidden md:block" aria-hidden />
        <div className="min-w-0">
          <CaseStudyHero project={project} />
          <CaseStudyBrief blocks={brief} slug={slug} />
        </div>
      </section>

      {/* Body column — centered, full-width host. Each block manages its own
          max-width: text blocks (~58ch reading column), media blocks (~1200px
          centered, full-bleed escapes), chapter marks (~max-w-5xl). */}
      <div>
        {body.map((block, i) => (
          <BlockRenderer key={`${block.type}-${i}`} block={block} slug={slug} />
        ))}

        {project.deliverables && project.deliverables.length > 0 && (
          <footer className="px-8 py-24 md:px-16">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
              <div className="md:col-span-4">
                <p
                  className="text-[14px] tracking-[0.18em] text-foreground/50"
                  style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
                >
                  Credits
                </p>
              </div>
              <div className="md:col-span-8">
                <p
                  className="text-lg leading-relaxed text-foreground/70 md:text-xl"
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
                            className="text-[10px] uppercase tracking-[0.3em] text-foreground/55"
                            style={{ fontFamily: 'var(--font-geist-mono)' }}
                          >
                            {site.tag}
                          </span>
                          {site.name} {'↗︎'}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </footer>
        )}

        {next && <NextProject next={next} />}
      </div>
    </main>
  );
}
