import { getFeaturedCaseStudies } from '@/sanity/queries';
import HomeClient from '@/components/HomeClient';

export default async function Home() {
  const caseStudies = await getFeaturedCaseStudies();
  return <HomeClient caseStudies={caseStudies || []} />;
}
