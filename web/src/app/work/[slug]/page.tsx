import type { Metadata } from 'next';
import { getProjectBySlug, getAllSlugs, getAdjacentProjects } from '@/data/projects';
import CaseStudyContent from '@/components/CaseStudyContent';
import CaseStudyScene from '@/components/CaseStudyScene';
import { notFound } from 'next/navigation';
import BackToTrail from '@/components/BackToTrail';

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
    alternates: {
      canonical: `/work/${slug}`,
    },
    openGraph: {
      title: `${project.title} — Sam Herwig`,
      description: project.overview.headline,
      url: `/work/${slug}`,
      type: 'article',
      // Image auto-injected by src/app/work/[slug]/opengraph-image.tsx (1200×630)
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

  const { prev, next } = getAdjacentProjects(slug);

  return (
    <main className="min-h-screen text-foreground">
      <CaseStudyScene slug={slug} />
      <div className="relative z-10">
        <BackToTrail />
        <CaseStudyContent project={project} prev={prev} next={next} />
      </div>
    </main>
  );
}
