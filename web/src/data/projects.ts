export interface ProjectSection {
  heading: string;
  body: string;
}

/* ── Block-based content model ────────────────────────────── */

export interface TextBlock {
  type: 'text-block';
  heading: string;
  body: string;
}

export interface MediaBlock {
  type: 'media-block';
  src: string;
  alt: string;
  aspect?: '16/9' | '21/9' | '4/3' | '1/1';
  fullBleed?: boolean;
}

export interface VideoBlock {
  type: 'video-block';
  src: string;
  poster?: string;
  alt: string;
  aspect?: '16/9' | '21/9';
}

export interface SpotlightBlock {
  type: 'spotlight-block';
  spotlightId: string;
}

export interface ChapterBreak {
  type: 'chapter-break';
  title: string;
  index: number;
}

export type ContentBlock = TextBlock | MediaBlock | VideoBlock | SpotlightBlock | ChapterBreak;

/** Trail chapter labels used in chapter-break blocks and progress indicator */
export const TRAIL_CHAPTERS = ['Discovery', 'Approach', 'Build', 'Outcome'] as const;
export type TrailChapter = (typeof TRAIL_CHAPTERS)[number];

/* ── Project color palette per case study ─────────────────── */

export interface ProjectPalette {
  accent: string;
  accentMuted: string;
  bg: string;
}

/* ── Project interface ────────────────────────────────────── */

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
  palette?: ProjectPalette;
  blocks?: ContentBlock[];
  featured: boolean;
  order: number;
}

export const projects: Project[] = [
  {
    title: 'New Belgium & Friends',
    subtitle: 'One Engine. Four Brands. Zero Redundancy.',
    slug: 'new-belgium',
    tags: [
      'Optimizely / Episerver',
      'SCSS Theming Architecture',
      'Component Systems',
      'Multi-Brand Platform',
      'Handlebars',
      'Performance',
      'Front End Engineering',
    ],
    projectUrl: 'https://www.voodooranger.com/',
    thumbnail: '/work/voodoo-ranger.webp',
    gallery: ['/work/voodoo-ranger.webp', '/work/fat-tire.webp', '/work/lightstrike.webp', '/work/kirin.webp'],
    overview: {
      headline: "A Shared Module System Powering New Belgium's Entire Brand Portfolio",
      body: 'Four beer brands — one front-end architecture. I built a shared component system on Optimizely that gives Voodoo Ranger, Fat Tire, Lightstrike, and Kirin USA full visual autonomy without duplicating code across four codebases. One deploy pipeline, four distinct brand identities, and every performance fix ships everywhere at once.',
    },
    sections: [
      {
        heading: 'The Brief',
        body: "New Belgium needed Voodoo Ranger, Fat Tire, Lightstrike, and Kirin USA to each feel like their own brand — a skeleton mascot and a 130-year-old Japanese brewery shouldn't look anything alike. But maintaining four separate codebases was a maintenance nightmare. The bet: a shared component system with SCSS specificity-driven theming that gives each brand full visual autonomy while deploying the same way.",
      },
      {
        heading: 'How I Built It',
        body: "I designed the architecture on Optimizely's Episerver so brand-specific SCSS layers control typography, color, animation intensity, and layout density. The same module set handles everything from navigation to product pages, with each brand's theme swapping the visual layer without touching the markup. Marketing teams update content within the system without the risk of breaking a sibling brand's build.",
      },
      {
        heading: 'What Shipped',
        body: "Four brands running on one codebase with independent content workflows. The system handled 3× traffic spikes during Voodoo Ranger's Juice Force campaign without flinching — and the same architecture held across all four properties. Every performance fix and accessibility improvement deploys everywhere at once.",
      },
    ],
    palette: { accent: '#f59e0b', accentMuted: '#fbbf24', bg: '#fffbeb' },
    blocks: [
      { type: 'chapter-break', title: 'Discovery', index: 0 },
      {
        type: 'text-block',
        heading: 'The Brief',
        body: 'Five beer brands. One codebase. A skeleton mascot and a 130-year-old Japanese brewery have no business looking alike, but they all ship from the same repo.',
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-voodoo.mp4',
        alt: 'Voodoo Ranger homepage interaction',
        aspect: '16/9',
      },
      {
        type: 'text-block',
        heading: 'Voodoo Ranger',
        body: "Voodoo Ranger is the loud one. Neon everything, skeleton mascots, animations that don't know when to quit.",
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-fat-tire.mp4',
        alt: 'Fat Tire homepage interaction',
        aspect: '16/9',
      },
      {
        type: 'text-block',
        heading: 'Fat Tire',
        body: "Then there's Fat Tire. Heritage craft, warm tones, editorial calm. Same components underneath, totally different vibe.",
      },
      { type: 'chapter-break', title: 'Approach', index: 1 },
      {
        type: 'text-block',
        heading: 'The Architecture',
        body: "SCSS specificity layers on Optimizely's Episerver. Each brand controls its own typography, color, animation intensity, layout density. None of them touch shared markup. Marketing updates content without accidentally breaking a sibling brand.",
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-nbb.mp4',
        alt: 'New Belgium Brewing homepage',
        aspect: '16/9',
      },
      {
        type: 'text-block',
        heading: 'New Belgium Brewing',
        body: 'The parent brand just stays out of the way. Clean, confident, lets the sub-brands be the loud ones.',
      },
      { type: 'media-block', src: '/work/nbb-header.webp', alt: 'New Belgium Brewing header', aspect: '16/9' },
      { type: 'media-block', src: '/work/voodoo-header.webp', alt: 'Voodoo Ranger header', aspect: '16/9' },
      { type: 'media-block', src: '/work/fat-tire-header.webp', alt: 'Fat Tire header', aspect: '16/9' },
      { type: 'media-block', src: '/work/lightstrike-header.webp', alt: 'Lightstrike header', aspect: '16/9' },
      { type: 'media-block', src: '/work/kirin-header.webp', alt: 'Kirin USA header', aspect: '16/9' },
      { type: 'spotlight-block', spotlightId: 'new-belgium-theme-switcher' },
      { type: 'chapter-break', title: 'Build', index: 2 },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-lightstrike.mp4',
        alt: 'Lightstrike homepage interaction',
        aspect: '16/9',
      },
      {
        type: 'text-block',
        heading: 'Lightstrike',
        body: 'Lightstrike goes almost brutalist. High contrast, sharp type. One theme file swap gets you there.',
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-kirin.mp4',
        alt: 'Kirin USA homepage interaction',
        aspect: '16/9',
      },
      {
        type: 'text-block',
        heading: 'Kirin USA',
        body: 'And then Kirin USA pulls Japanese-influenced design into the same system. Completely different cultural DNA, same architecture.',
      },
      { type: 'chapter-break', title: 'Outcome', index: 3 },
      {
        type: 'text-block',
        heading: 'What Shipped',
        body: "Five brands, one deploy pipeline. When Voodoo Ranger's Juice Force campaign tripled traffic, the performance fix shipped to all five properties at once.",
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
    gallery: ['/work/mission-bell.webp', '/work/mission-bell-2.webp', '/work/mission-bell-3.webp'],
    overview: {
      headline: 'GSAP Page Transitions and a CMS a Winery Team Can Actually Use',
      body: 'A Nuxt-powered winery site with GSAP transitions tuned to feel seamless, Sanity CMS the team actually owns, and WCAG 2.1 AA baked in from day one. Zero developer tickets for content updates since launch.',
    },
    sections: [
      {
        heading: 'The Brief',
        body: 'Wine websites fail in one of two directions: corporate brochure or lifestyle Pinterest board. Mission Bell needed a third option — something that felt like the vineyard actually made it. Smooth transitions, great photography, and a CMS the team could own without a developer on speed dial.',
      },
      {
        heading: 'How I Built It',
        body: 'Nuxt with GSAP-driven page transitions tuned to feel seamless without announcing themselves. Sanity CMS wired up so the team manages the wine catalog directly — no tickets, no deploys. A Vue component library keeps landing pages on-brand without starting from scratch each time. WCAG 2.1 AA compliance was part of the build from the start, not retrofitted.',
      },
      {
        heading: 'What Shipped',
        body: 'GSAP page transitions that feel invisible, a CMS the winery team uses daily, and WCAG 2.1 AA across every page. The client\'s exact words after launch: "It finally feels like us." Zero developer tickets for content updates since go-live.',
      },
    ],
    palette: { accent: '#7c2d12', accentMuted: '#a16207', bg: '#fef3c7' },
    blocks: [
      { type: 'chapter-break', title: 'Discovery', index: 0 },
      {
        type: 'text-block',
        heading: 'The Brief',
        body: 'Wine websites go wrong in two directions: corporate brochure or lifestyle Pinterest board. Mission Bell needed something that felt like the vineyard actually made it.',
      },
      {
        type: 'video-block',
        src: '/work/videos/mission-bell-homepage.mp4',
        alt: 'Mission Bell homepage scroll',
        aspect: '16/9',
      },
      { type: 'chapter-break', title: 'Approach', index: 1 },
      {
        type: 'text-block',
        heading: 'How I Built It',
        body: 'Nuxt with GSAP page transitions tuned to feel invisible. Sanity CMS the team runs without calling a developer. WCAG 2.1 AA baked in from the start.',
      },
      {
        type: 'video-block',
        src: '/work/videos/mission-bell-services.mp4',
        alt: 'Mission Bell services page interaction',
        aspect: '16/9',
      },
      { type: 'chapter-break', title: 'Build', index: 2 },
      { type: 'media-block', src: '/work/mission-bell-2.webp', alt: 'Mission Bell wine catalog', aspect: '16/9' },
      { type: 'media-block', src: '/work/mission-bell-3.webp', alt: 'Mission Bell detail page', aspect: '16/9' },
      { type: 'chapter-break', title: 'Outcome', index: 3 },
      {
        type: 'text-block',
        heading: 'What Shipped',
        body: "Client's words after launch: 'It finally feels like us.' They haven't filed a single developer ticket for content updates since.",
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
    gallery: ['/work/consume-and-create.webp', '/work/cc-2.webp', '/work/cc-3.webp'],
    overview: {
      headline: 'High-90s Lighthouse Scores Without Sacrificing the Animation Budget',
      body: "An agency site rebuild in Nuxt that had to sell the work while proving the technical credibility. High-90s Lighthouse scores with animations fully intact, Contentful CMS the team runs without developer tickets, and the agency's most consistent new business driver for over a year.",
    },
    sections: [
      {
        heading: 'The Brief',
        body: "Building for clients is easier than building for your own team — everyone's a critic and the standards are impossibly high. Consume & Create's agency site had to sell the work while also demonstrating the technical credibility to win the exact clients looking at it. The internal pressure was real.",
      },
      {
        heading: 'How I Built It',
        body: "Nuxt with Contentful CMS handling content updates without developer involvement. Project galleries with hover-state previews and a contact form that doesn't feel like a DMV visit. The hard part was hitting Lighthouse scores in the high 90s while keeping the animation work intact — that tension usually forces a compromise, but the performance optimization pass got us there on both.",
      },
      {
        heading: 'What Shipped',
        body: "High-90s Lighthouse scores with full animation fidelity. A CMS the team updates without filing tickets. The agency's most consistent new business driver for over a year — the site pays for itself.",
      },
    ],
    palette: { accent: '#2563eb', accentMuted: '#60a5fa', bg: '#eff6ff' },
    blocks: [
      { type: 'chapter-break', title: 'Discovery', index: 0 },
      {
        type: 'text-block',
        heading: 'The Brief',
        body: "Building for your own agency is harder than client work. Everyone's a critic, standards are unreasonable, and the site has to sell the work while proving you can actually build.",
      },
      {
        type: 'video-block',
        src: '/work/videos/cc-hero.mp4',
        alt: 'Consume & Create homepage hero animation',
        aspect: '16/9',
      },
      { type: 'chapter-break', title: 'Approach', index: 1 },
      {
        type: 'text-block',
        heading: 'How I Built It',
        body: 'Nuxt with Contentful CMS. The whole fight was getting Lighthouse into the high 90s without gutting the animations. Usually you sacrifice one for the other.',
      },
      {
        type: 'video-block',
        src: '/work/videos/cc-optimal-wrapper.mp4',
        alt: 'Consume & Create optimal wrapper interaction',
        aspect: '16/9',
      },
      { type: 'chapter-break', title: 'Build', index: 2 },
      { type: 'media-block', src: '/work/cc-2.webp', alt: 'Consume & Create project gallery', aspect: '16/9' },
      { type: 'media-block', src: '/work/cc-3.webp', alt: 'Consume & Create detail view', aspect: '16/9' },
      { type: 'chapter-break', title: 'Outcome', index: 3 },
      {
        type: 'text-block',
        heading: 'What Shipped',
        body: "High 90s Lighthouse, animations fully intact, CMS the team runs on their own. Ended up being the agency's best new business driver for over a year.",
      },
      { type: 'media-block', src: '/work/cc-404-cat.webp', alt: 'Custom 404 page featuring my cat', aspect: '16/9' },
      {
        type: 'text-block',
        heading: '',
        body: 'I also put my cat on the 404 page.',
      },
    ],
    featured: true,
    order: 3,
  },
  {
    title: 'CraftedKit',
    subtitle: 'A Solo-Built Studio Powered by AI Agent Pipelines',
    slug: 'craftedkit',
    tags: [
      'Three.js / R3F',
      'GLSL Shaders',
      'Multi-Agent AI',
      'Next.js',
      'TypeScript',
      'WebGL',
      'Pipeline Architecture',
    ],
    projectUrl: 'https://craftedkit.io',
    thumbnail: '/images/diagrams/agent-pipeline.png',
    gallery: ['/images/diagrams/agent-pipeline.png', '/images/diagrams/methodology.png'],
    overview: {
      headline: '46 WebGL Heroes Built by One Developer and a 4-Agent AI Pipeline',
      body: 'CraftedKit is an interactive web studio I built from scratch — the site, the products, and the production system that manufactures them. The catalog has 46 WebGL hero experiences ranging from ferrofluid typography to volumetric god rays, each one an R3F component with proper resource management, responsive fallbacks, and scroll-driven interactivity.\n\nWhat makes it work is how they get built. I designed a 4-agent AI pipeline — Kyle (code), Brad (QA gate), Chad (design), Jackson (strategy) — that runs nightly build-review-gate cycles. Chad proposes new hero concepts, Kyle implements them in Three.js/R3F with custom GLSL shaders, Brad runs automated smoke tests and issues a SHIP/NEEDS_WORK verdict, and I wake up to candidates that were built, tested, and gated while I slept. Every failure gets logged and promoted into permanent system rules — the pipeline improves itself with each cycle.',
    },
    sections: [
      {
        heading: 'The Brief',
        body: "I wanted to build a studio that sells what I actually do best — interactive web experiences using Three.js, custom shaders, and motion systems. But building 40+ WebGL products as a solo developer is a volume problem. The question wasn't whether AI could write shader code — it's whether I could orchestrate multiple agents into a reliable production system that ships real work without me babysitting every line.",
      },
      {
        heading: 'How I Built It',
        body: "The site runs on Next.js 14 with a monorepo architecture — a shared catalog system, a custom Tailwind design system (Atelier), and 46 hero components each with their own shaders, textures, and scroll-driven behaviors. The AI pipeline orchestrates four specialized agents through deterministic workflows: preflight tokens gate every dispatch, Git hooks enforce quality, and Brad's QA verdict is mandatory before anything merges. A nightly cron loop generates new hero concepts, implements them, runs Puppeteer smoke tests, and stages candidates for my morning review.",
      },
      {
        heading: 'What Shipped',
        body: '46 WebGL hero experiences, each with proper Three.js resource disposal, reduced-motion support, and WebGL fallbacks. A services funnel that converts visitors into $3.5k-$15k+ custom engagements. The AI pipeline runs nightly build-review-gate cycles and stages candidates for my morning review — one person, full production output.',
      },
    ],
    palette: { accent: '#10b981', accentMuted: '#34d399', bg: '#ecfdf5' },
    blocks: [
      {
        type: 'video-block',
        src: '/work/videos/craftedkit-organic-living.mp4',
        alt: 'Organic Living Material shader hero',
        aspect: '16/9',
      },
      { type: 'chapter-break', title: 'Discovery', index: 0 },
      {
        type: 'text-block',
        heading: 'The Brief',
        body: 'I built a studio around what I actually do: interactive web stuff with Three.js, custom shaders, motion systems. 40+ WebGL products solo is a volume problem though, so I built a multi-agent AI pipeline to keep up.',
      },
      { type: 'chapter-break', title: 'Approach', index: 1 },
      {
        type: 'text-block',
        heading: 'The Pipeline',
        body: 'Four Claude agents run nightly build-review-gate cycles. One proposes concepts, one writes R3F with custom GLSL, one runs automated QA. I wake up to candidates that were built and tested while I slept.',
      },
      {
        type: 'text-block',
        heading: 'Self-Improving',
        body: "Failures get logged and promoted into permanent system rules. Same mistake doesn't happen twice.",
      },
      { type: 'chapter-break', title: 'Build', index: 2 },
      {
        type: 'text-block',
        heading: 'The Output',
        body: '46 WebGL hero experiences. Ferrofluid typography, volumetric god rays, particle fields. Each one is a real R3F component with proper resource disposal and responsive fallbacks.',
      },
      {
        type: 'video-block',
        src: '/work/videos/craftedkit-mechanical-heart.mp4',
        alt: 'Mechanical Heart shader hero',
        aspect: '16/9',
      },
      { type: 'video-block', src: '/work/videos/craftedkit-mycelium.mp4', alt: 'Mycelium shader hero', aspect: '16/9' },
      {
        type: 'video-block',
        src: '/work/videos/craftedkit-reaction-diffusion.mp4',
        alt: 'Reaction Diffusion Field shader hero',
        aspect: '16/9',
      },
      { type: 'chapter-break', title: 'Outcome', index: 3 },
      {
        type: 'text-block',
        heading: 'What Shipped',
        body: 'I run the whole thing solo. Pipeline builds overnight, I review candidates in the morning.',
      },
    ],
    featured: true,
    order: 4,
  },
];

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured).sort((a, b) => a.order - b.order);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return projects.map((p) => p.slug);
}

export function getAdjacentProjects(slug: string): { prev: Project | null; next: Project | null } {
  const featured = getFeaturedProjects();
  const idx = featured.findIndex((p) => p.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? featured[idx - 1] : null,
    next: idx < featured.length - 1 ? featured[idx + 1] : null,
  };
}
