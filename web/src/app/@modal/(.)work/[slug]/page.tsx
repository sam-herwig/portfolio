import { getCaseStudy } from '@/sanity/queries';
import CaseStudyModal from '@/components/CaseStudyModal';

export default async function InterceptedCaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caseStudy = await getCaseStudy(slug);
  if (!caseStudy) return null;
  return <CaseStudyModal caseStudy={caseStudy} />;
}
