import { getProjectBySlug } from '@/data/projects';
import CaseStudyModal from '@/components/CaseStudyModal';

export default async function InterceptedCaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return null;
  return <CaseStudyModal project={project} />;
}
