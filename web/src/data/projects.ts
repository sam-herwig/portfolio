export interface ProjectSection {
  heading: string;
  body: string;
}

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
  sections?: ProjectSection[];
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
      body: "Four beer brands — one front-end architecture. I built a shared component system on Optimizely that gives Voodoo Ranger, Fat Tire, Lightstrike, and Kirin USA full visual autonomy without duplicating code across four codebases. One deploy pipeline, four distinct brand identities, and every performance fix ships everywhere at once.",
    },
    sections: [
      {
        heading: 'The Brief',
        body: "New Belgium needed Voodoo Ranger, Fat Tire, Lightstrike, and Kirin USA to each feel like their own brand — a skeleton mascot and a 130-year-old Japanese brewery shouldn't look anything alike. But maintaining four separate codebases was a maintenance nightmare. The bet: a shared component system with SCSS specificity-driven theming that gives each brand full visual autonomy while deploying the same way.",
      },
      {
        heading: 'How I Built It',
        body: "I designed a modular architecture on Optimizely's Episerver where brand-specific SCSS layers control typography, color, animation intensity, and layout density. The same module set handles everything from navigation to product showcases, with each brand's theme swapping the visual layer without touching the markup. Marketing teams get creative freedom within the system without the risk of breaking a sibling brand's build.",
      },
      {
        heading: 'What Shipped',
        body: "Four brands running on one codebase with independent content workflows. The system handled 3× traffic spikes during Voodoo Ranger's Juice Force campaign without flinching — and the same architecture held across all four properties. Every performance fix and accessibility improvement deploys everywhere at once.",
      },
    ],
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
      body: "A Nuxt-powered winery site with GSAP transitions tuned to feel seamless, Sanity CMS the team actually owns, and WCAG 2.1 AA baked in from day one. Zero developer tickets for content updates since launch.",
    },
    sections: [
      {
        heading: 'The Brief',
        body: "Wine websites fail in one of two directions: corporate brochure or lifestyle Pinterest board. Mission Bell needed a third option — something that felt like the vineyard actually made it. Smooth transitions, great photography, and a CMS the team could own without a developer on speed dial.",
      },
      {
        heading: 'How I Built It',
        body: "Nuxt with GSAP-driven page transitions tuned to feel seamless without announcing themselves. Sanity CMS wired up so the team has full editorial control over the wine catalog — no tickets, no deploys. A modular Vue component library keeps landing pages on-brand without starting from scratch each time. WCAG 2.1 AA compliance was baked in from the start, not retrofitted.",
      },
      {
        heading: 'What Shipped',
        body: "Seamless page transitions, a CMS the winery team uses daily, and full accessibility compliance. The client's exact words after launch: \"It finally feels like us.\" Zero developer tickets for content updates since go-live.",
      },
    ],
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
      body: "An agency site rebuild in Nuxt that had to sell the work while proving the technical credibility. High-90s Lighthouse scores with animations fully intact, Contentful CMS the team runs without developer tickets, and the agency's most consistent new business driver for over a year.",
    },
    sections: [
      {
        heading: 'The Brief',
        body: "Building for clients is easier than building for your own team — everyone's a critic and the standards are impossibly high. Consume & Create's agency site had to sell the work while also demonstrating the technical credibility to win the exact clients looking at it. The internal pressure was real.",
      },
      {
        heading: 'How I Built It',
        body: "Nuxt with Contentful CMS handling content updates without developer involvement. Interactive project showcases with hover-state previews and a contact form that doesn't feel like a DMV visit. The hard part was hitting Lighthouse scores in the high 90s while keeping the animation work intact — that tension usually forces a compromise, but the performance optimization pass made both possible.",
      },
      {
        heading: 'What Shipped',
        body: "High-90s Lighthouse scores with full animation fidelity. A CMS the team updates without filing tickets. The agency's most consistent new business driver for over a year — the site pays for itself.",
      },
    ],
    featured: true,
    order: 3,
  },
  {
    title: 'CraftedKit',
    subtitle: 'A Solo-Built Studio Powered by AI Agent Pipelines.',
    slug: 'craftedkit',
    tags: ['Three.js / R3F', 'GLSL Shaders', 'Multi-Agent AI', 'Next.js', 'TypeScript', 'WebGL', 'Pipeline Architecture'],
    projectUrl: 'https://craftedkit.io',
    thumbnail: '/images/diagrams/agent-pipeline.png',
    gallery: [
      '/images/diagrams/agent-pipeline.png',
      '/images/diagrams/methodology.png',
    ],
    overview: {
      headline: '46 Premium WebGL Heroes Built by One Developer and a 4-Agent AI Pipeline',
      body: "CraftedKit is a premium interactive web studio I built from scratch — the site, the products, and the production system that manufactures them. The catalog features 46 WebGL hero experiences ranging from ferrofluid typography to volumetric god rays, each one a production-grade R3F component with proper resource management, responsive fallbacks, and scroll-driven interactivity.\n\nThe real story is how they got built. I designed a 4-agent AI pipeline — Kyle (code), Brad (QA gate), Chad (design), Jackson (strategy) — that runs nightly build-review-gate cycles. Chad proposes new hero concepts, Kyle implements them in Three.js/R3F with custom GLSL shaders, Brad runs automated smoke tests and issues a SHIP/NEEDS_WORK verdict, and I wake up to candidates that were built, tested, and gated while I slept. Every failure gets logged and promoted into permanent system rules — the pipeline literally improves itself. The result: a solo developer shipping at a pace that would normally require a small team.",
    },
    sections: [
      {
        heading: 'The Brief',
        body: "I wanted to build a studio that sells what I actually do best — immersive, interactive web experiences using Three.js, custom shaders, and motion systems. But building 40+ premium WebGL products as a solo developer is a volume problem. The question wasn't whether AI could write shader code — it's whether I could orchestrate multiple agents into a reliable production system that ships real work without me babysitting every line.",
      },
      {
        heading: 'How I Built It',
        body: "The site runs on Next.js 14 with a monorepo architecture — a shared catalog system, a custom Tailwind design system (Atelier), and 46 hero components each with their own shaders, textures, and scroll-driven behaviors. The AI pipeline orchestrates four specialized agents through deterministic workflows: preflight tokens gate every dispatch, Git hooks enforce quality, and Brad's QA verdict is mandatory before anything merges. A nightly cron loop generates new hero concepts, implements them, runs Puppeteer smoke tests, and stages candidates for my morning review.",
      },
      {
        heading: 'What Shipped',
        body: "46 production-grade WebGL hero experiences. A services funnel that converts visitors into $3.5k–$15k+ custom engagements. An AI pipeline that runs autonomous build-review-gate cycles nightly. Every hero properly disposes Three.js resources, supports reduced motion, and handles WebGL fallbacks. The studio launched as a one-person operation producing at team-scale velocity.",
      },
    ],
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
