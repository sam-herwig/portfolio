import { getFeaturedProjects } from '@/data/projects';
import HomeClient from '@/components/HomeClient';

export default function Home() {
  const projects = getFeaturedProjects();
  return <HomeClient caseStudies={projects} />;
}
