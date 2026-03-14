export interface Project {
  title: string;
  subtitle: string;
  slug: string;
  tags: string[];
  projectUrl: string;
  thumbnail: string;
  gallery?: string[];
  overview: {
    headline: string;
    body: string;
  };
  featured: boolean;
  order: number;
}

export const projects: Project[] = [
  {
    title: 'New Belgium & Friends',
    subtitle: 'One Engine. Four Brands. Zero Redundancy.',
    slug: 'new-belgium',
    tags: ['Optimizely / Episerver', 'SCSS Theming Architecture', 'Component Systems', 'Multi-Brand Platform', 'Handlebars', 'Performance', 'Front End Engineering'],
    projectUrl: 'https://www.voodooranger.com/',
    thumbnail: '/work/voodoo-ranger.webp',
    gallery: [
      '/work/voodoo-ranger.webp',
      '/work/fat-tire.webp',
      '/work/lightstrike.webp',
      '/work/kirin.webp',
    ],
    overview: {
      headline: "A Shared Module System Powering New Belgium's Entire Brand Portfolio",
      body: "Voodoo Ranger, Fat Tire, Lightstrike, Kirin USA — four wildly different brands, all running on the same modular front-end architecture I built on Optimizely's Episerver. The bet was that a shared component system with SCSS specificity-driven theming could give each brand full visual autonomy without duplicating code across four codebases. A skeleton mascot and a 130-year-old Japanese brewery shouldn't look anything alike — but they should deploy the same way.\n\nThe module set handles everything from navigation patterns to product showcases, with brand-specific SCSS layers controlling typography, color, animation intensity, and layout density. Marketing teams across all four brands get creative freedom within the system without breaking each other's builds. Voodoo Ranger launched during the Juice Force campaign and handled 3× its normal traffic; the same architecture held across all four properties. Maintaining one system instead of four means every performance fix and accessibility improvement ships everywhere at once.",
    },
    featured: true,
    order: 1,
  },
  {
    title: 'Mission Bell',
    subtitle: 'Where the Photography Does the Work',
    slug: 'mission-bell',
    tags: ['Nuxt', 'Vue', 'GSAP', 'Sanity CMS', 'WCAG 2.1 AA', 'Component Library', 'Front End Engineering'],
    projectUrl: 'https://www.missionbell.com/',
    thumbnail: '/work/mission-bell.webp',
    gallery: [
      '/work/mission-bell.webp',
      '/work/mission-bell-2.webp',
      '/work/mission-bell-3.webp',
    ],
    overview: {
      headline: 'GSAP Page Transitions and a CMS a Winery Team Can Actually Use',
      body: "Wine websites fail in one of two directions: corporate brochure or lifestyle Pinterest board. Mission Bell needed a third option — something that felt like the vineyard actually made it. The technical ask was deceptively simple: smooth transitions, great photography, and a CMS the team could own without a developer on speed dial.\n\nI built the site in Nuxt with GSAP-driven page transitions tuned to feel seamless without announcing themselves, and wired up Sanity CMS so the team has full editorial control over the wine catalog and content — no tickets, no deploys. The Vue component library is mix-and-match modular, so landing pages stay on-brand without starting from scratch each time. WCAG 2.1 AA compliance was baked in from the start, not retrofitted. The client's exact words after launch: \"It finally feels like us.\"",
    },
    featured: true,
    order: 2,
  },
  {
    title: 'Consume & Create',
    subtitle: 'Building for the Hardest Client',
    slug: 'consume-and-create',
    tags: ['Nuxt', 'Contentful CMS', 'Vue', 'Performance Optimization', 'Animation', 'Lighthouse', 'Agency'],
    projectUrl: 'https://www.consumeandcreate.co/',
    thumbnail: '/work/consume-and-create.webp',
    gallery: [
      '/work/consume-and-create.webp',
      '/work/cc-2.webp',
      '/work/cc-3.webp',
    ],
    overview: {
      headline: "High-90s Lighthouse Scores Without Sacrificing the Animation Budget",
      body: "Building for clients is easier than building for your own team — everyone's a critic and the standards are impossibly high. Rebuilding Consume & Create's agency site meant making something that could sell work while also demonstrating technical credibility to the exact clients we were trying to win. The internal pressure was real.\n\nI built it in Nuxt with Contentful CMS handling content updates without developer involvement, interactive project showcases with hover-state previews, and a contact form that doesn't feel like a DMV visit. The hard part was hitting Lighthouse scores in the high 90s while keeping the animation work intact — that tension usually forces a compromise, but the performance optimization pass made both possible. It's been live for over a year and has become the agency's most consistent new business driver.",
    },
    featured: true,
    order: 3,
  },
  {
    title: 'AI Agent Pipeline',
    subtitle: 'Four Agents. One Solo Developer. Ships Nightly.',
    slug: 'ai-agent-pipeline',
    tags: ['Multi-Agent Systems', 'OpenClaw', 'LLM Orchestration', 'Claude Opus 4.6', 'Vercel', 'TypeScript', 'Pipeline Architecture'],
    projectUrl: '',
    thumbnail: '',
    overview: {
      headline: 'Orchestrating a 4-Agent AI System That Builds, Reviews, and Deploys Code While I Sleep',
      body: "The real bottleneck in solo AI-assisted development isn't \"can the model write code?\" — it's whether you can coordinate multiple agents without them clobbering each other, deploying unverified work, or producing green signals that mean nothing. I learned this the hard way on February 28th, when five parallel dispatches to the same repo turned into a cascade of bad state. The failures were specific, and so were the fixes.\n\nI built a 4-agent production pipeline — Kyle (code), Brad (QA gate), Chad (design), Jackson (strategy) — orchestrated through OpenClaw with deterministic Lobster workflows enforcing every transition. Preflight tokens, Git hooks, and Brad's mandatory SHIP/NEEDS_WORK verdict mean no code moves without proof. The system tracks three distinct states — Accepted, Spawned, Landed — because most pipelines celebrate the wrong one. A nightly cron loop has Chad implement new product concepts, Kyle review and fix them, and automated QA verify the output; I wake up to candidates that were built, reviewed, and gated while I slept. 29 premium WebGL/animation products shipped this way. Every failure gets logged to ERRORS.md and promoted into permanent system rules — the pipeline literally gets better at preventing its own mistakes.",
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
