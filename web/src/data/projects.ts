export interface Project {
  title: string;
  subtitle: string;
  slug: string;
  tags: string[];
  projectUrl: string;
  thumbnail: string;
  overview: {
    headline: string;
    body: string; // plain text, not Portable Text
  };
  caseStudy?: {
    problem: string;
    approach: string;
    results: string;
  };
  featured: boolean;
  order: number;
}

export const projects: Project[] = [
  {
    title: 'Voodoo Ranger',
    subtitle: "Let's get Voodoo",
    slug: 'voodoo-ranger',
    tags: ['Optimizely', 'Episerver', 'Handlebars', 'Accessibility', 'Responsive Design'],
    projectUrl: 'https://www.voodooranger.com/',
    thumbnail: '/work/voodoo-ranger.webp',
    overview: {
      headline: 'Bringing the Chaos Energy to Life',
      body: "New Belgium's Voodoo Ranger isn't just a beer—it's a personality. The brand needed a digital experience that matched the irreverent, slightly-unhinged energy of their skeleton mascot without sacrificing usability or performance.\n\nWorking with Consume & Create, I led front-end development on a complete site overhaul built on Optimizely's Episerver platform. The challenge? Make it weird (in a good way) while working within an enterprise CMS architecture that isn't exactly known for flexibility.",
    },
    featured: true,
    order: 1,
  },
  {
    title: 'Mission Bell',
    subtitle: 'Clean and Fun!',
    slug: 'mission-bell',
    tags: ['Vue.js', 'Nuxt', 'Sanity CMS', 'GSAP', 'Interactive'],
    projectUrl: 'https://www.missionbell.com/',
    thumbnail: '/work/mission-bell.webp',
    overview: {
      headline: 'Sophisticated Without Being Stuffy',
      body: "Wine websites have a tendency to feel either too corporate or too \"live, laugh, love.\" Mission Bell wanted something different—elevated but approachable, the kind of site that makes you want to book a tasting even if you can't tell a Cabernet from a Merlot.\n\nI handled the front-end development in Nuxt with Sanity as the CMS, focusing on smooth page transitions and letting the vineyard photography do the talking. My job was really to build a frame that showcased stunning imagery without competing for attention.",
    },
    featured: true,
    order: 2,
  },
  {
    title: 'Consume & Create',
    subtitle: 'Is that a notebook??',
    slug: 'consume-and-create',
    tags: ['Vue.js', 'Three.js', 'Responsive Design', 'CMS Integration'],
    projectUrl: 'https://www.consumeandcreate.co/',
    thumbnail: '/work/consume-and-create.webp',
    overview: {
      headline: 'Building Our Own Playground',
      body: "You know what's harder than building for clients? Building for your own team. Everyone has opinions, the scope creeps because \"we can just add that,\" and there's no external deadline keeping you honest.\n\nAs the front-end developer at Consume & Create, I rebuilt our agency site from scratch. The goal was to create something that showcases our personality while actually being useful for prospective clients trying to figure out if we're the right fit.",
    },
    featured: true,
    order: 3,
  },
  {
    title: 'AI Agent Pipeline',
    subtitle: 'Multi-agent orchestration system',
    slug: 'ai-agent-pipeline',
    tags: ['TypeScript', 'AI Agents', 'OpenClaw', 'Automation', 'DevOps'],
    projectUrl: '',
    thumbnail: '', // No image yet — use placeholder pattern
    overview: {
      headline: 'Shipping Code While I Sleep',
      body: "I built a 4-agent production pipeline that shapes work, writes code, runs QA, and deploys — autonomously, every night. Not a demo. Not a proof of concept. A system that ships real production code to real users.\n\nThe orchestrator dispatches specialized agents (code engineer, QA gate, design lead, strategy researcher) through deterministic pipelines with mechanical enforcement at every step. The failures taught more than the successes.",
    },
    featured: true,
    order: 4,
  },
];

export function getFeaturedProjects(): Project[] {
  return projects.filter(p => p.featured).sort((a, b) => a.order - b.order);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find(p => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return projects.map(p => p.slug);
}

export function getAdjacentProjects(slug: string): { prev: Project | null; next: Project | null } {
  const featured = getFeaturedProjects();
  const idx = featured.findIndex(p => p.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? featured[idx - 1] : null,
    next: idx < featured.length - 1 ? featured[idx + 1] : null,
  };
}
