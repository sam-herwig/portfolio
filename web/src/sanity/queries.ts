import { client } from './client';

export async function getFeaturedCaseStudies() {
  return client.fetch(`
    *[_type == "project" && caseStudyFeatured == true] | order(caseStudyOrder asc) {
      title,
      subtitle,
      "slug": slug.current,
      tags,
      projectUrl,
      "thumbnail": featuredImage.asset->url + "?w=800&h=600&fit=crop&auto=format",
    }
  `);
}

export async function getAllCaseStudySlugs() {
  return client.fetch(`*[_type == "project" && defined(slug)] | order(caseStudy.order asc) { title, "slug": slug.current }`);
}

export async function getCaseStudy(slug: string) {
  return client.fetch(`
    *[_type == "project" && slug.current == $slug][0] {
      title,
      subtitle,
      "slug": slug.current,
      tags,
      projectUrl,
      overview {
        headline,
        richtext
      },
      "heroImage": caseStudyHeroImage.asset->url + "?w=1920&auto=format",
      caseStudyProblem,
      caseStudyApproach,
      caseStudyResults,
      "gallery": caseStudyGallery[] {
        "url": asset->url + "?w=1200&auto=format",
        "alt": alt,
        "caption": caption
      }
    }
  `, { slug });
}
