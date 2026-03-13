import { getCaseStudy } from '@/sanity/queries';
import CaseStudyContent from '@/components/CaseStudyContent';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caseStudy = await getCaseStudy(slug);
  if (!caseStudy) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="fixed top-6 left-6 z-50">
        <Link href="/" className="text-sm font-mono uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors">
          ← Back
        </Link>
      </div>
      <CaseStudyContent caseStudy={caseStudy} />
    </main>
  );
}
