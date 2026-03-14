import { getCaseStudy, getAllCaseStudySlugs } from '@/sanity/queries';
import CaseStudyContent from '@/components/CaseStudyContent';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const fallbackOrder = [
  { title: 'Google DeepMind', slug: 'deepmind' },
  { title: 'Apple Vision Pro', slug: 'vision-pro' },
  { title: 'Taste & Skill', slug: 'taste-and-skill' },
  { title: 'Oura Ring', slug: 'oura-ring' },
];

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caseStudy = await getCaseStudy(slug);
  if (!caseStudy) notFound();

  let allStudies: { title: string; slug: string }[] = [];
  try {
    const fetched = await getAllCaseStudySlugs();
    allStudies = fetched && fetched.length > 0 ? fetched : fallbackOrder;
  } catch {
    allStudies = fallbackOrder;
  }

  const currentIndex = allStudies.findIndex(s => s.slug === slug);
  const prev = currentIndex > 0 ? allStudies[currentIndex - 1] : null;
  const next = currentIndex < allStudies.length - 1 ? allStudies[currentIndex + 1] : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="fixed top-6 left-6 z-50">
        <Link href="/" className="text-sm font-mono uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors">
          ← Back
        </Link>
      </div>
      <CaseStudyContent caseStudy={caseStudy} prev={prev} next={next} />
    </main>
  );
}
