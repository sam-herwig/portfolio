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
  caption?: string;
  figNumber?: string;
}

export interface VideoBlock {
  type: 'video-block';
  src: string;
  poster?: string;
  alt: string;
  aspect?: '16/9' | '21/9' | '4/3' | '1/1' | '9/16';
  caption?: string;
  figNumber?: string;
}

export interface SpotlightBlock {
  type: 'spotlight-block';
  spotlightId: string;
  caption?: string;
}

/** Numbered chapter break — agency-tier rhythm device, 3–5 per case */
export interface ChapterBlock {
  type: 'chapter';
  number: string;
  title: string;
  eyebrow?: string;
}

export type ContentBlock = TextBlock | MediaBlock | VideoBlock | SpotlightBlock | ChapterBlock;

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
  blocks?: ContentBlock[];
  /** Optional — additional live sites that shipped on the same codebase/system */
  relatedSites?: { name: string; tag: string; url: string }[];
  /** Client or studio the work was done for */
  client?: string;
  /** Year the work shipped */
  year?: string;
  /** Role Sam played */
  role?: string;
  /** Deliverables shipped (e.g., ["Web", "Brand", "Motion"]) */
  deliverables?: string[];
  featured: boolean;
  order: number;
}

const projects: Project[] = [
  {
    title: 'New Belgium & Friends',
    subtitle: 'One Engine. Five Brands. Zero Redundancy.',
    slug: 'new-belgium',
    year: '2021–present',
    role: 'Lead Front-End Engineer',
    client: 'New Belgium Brewing',
    deliverables: ['Web', 'Component System', 'Brand Theming'],
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
    relatedSites: [
      { name: 'New Belgium', tag: 'Flagship', url: 'https://www.newbelgium.com/' },
      { name: 'Fat Tire', tag: 'Amber Ale', url: 'https://www.fattire.com/' },
      { name: 'Voodoo Ranger', tag: 'Imperial IPA', url: 'https://www.voodooranger.com/' },
      { name: 'Lightstrike', tag: 'Hard Refresher', url: 'https://www.drinklightstrike.com/' },
      { name: 'Kirin Ichiban', tag: 'Partnership', url: 'https://www.kirinichibanusa.com/' },
    ],
    thumbnail: '/work/voodoo-ranger.webp',
    gallery: ['/work/voodoo-ranger.webp', '/work/fat-tire.webp', '/work/lightstrike.webp', '/work/kirin.webp'],
    overview: {
      headline: "A Shared Module System Powering New Belgium's Entire Brand Portfolio",
      body: 'Five beer brands — one front-end architecture. I built a shared component system on Optimizely that gives New Belgium, Voodoo Ranger, Fat Tire, Lightstrike, and Kirin USA full visual autonomy without duplicating code across five codebases.',
    },
    blocks: [
      { type: 'chapter', number: '01', title: 'The Brief' },
      {
        type: 'text-block',
        heading: 'Five brands, one repo',
        body: 'A skeleton mascot and a 130-year-old Japanese brewery have no business looking alike, but they all ship from the same repo. The pitch was counterintuitive: stop running four teams, four build pipelines, four QA cycles. Collapse everything into one engine and let SCSS specificity do the brand work.',
      },
      {
        type: 'chapter',
        number: '02',
        title: 'Mapping five identities onto one architecture',
        eyebrow: 'Identity Prism',
      },
      {
        type: 'text-block',
        heading: 'The architecture',
        body: "Optimizely's Episerver handles content. On top of it, SCSS specificity layers control typography, color, animation intensity, and layout density per brand. Nothing touches shared markup. Marketing updates content without accidentally breaking a sibling brand.",
      },
      {
        type: 'text-block',
        heading: 'The theme system',
        body: 'One deploy pipeline. Five theme files. Every performance fix and accessibility improvement ships to every brand at once, which is the real reason this architecture is worth the tradeoffs.',
      },
      { type: 'chapter', number: '03', title: 'Each brand finds its own voice' },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-voodoo.mp4',
        alt: 'Voodoo Ranger homepage interaction',
        aspect: '16/9',
        caption: 'Voodoo Ranger — loud, neon, skeletons everywhere',
      },
      {
        type: 'text-block',
        heading: 'Voodoo Ranger',
        body: "Voodoo Ranger is the loud one. Neon everything, skeleton mascots, animations that don't know when to quit. One theme file controls all of it.",
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-fat-tire.mp4',
        alt: 'Fat Tire homepage interaction',
        aspect: '16/9',
        caption: 'Fat Tire — heritage craft, warm tones, editorial calm',
      },
      {
        type: 'text-block',
        heading: 'Fat Tire',
        body: 'Fat Tire is heritage craft, warm tones, editorial calm. Same components underneath, totally different vibe.',
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-lightstrike.mp4',
        alt: 'Lightstrike homepage interaction',
        aspect: '16/9',
        caption: 'Lightstrike — brutalist, high-contrast, sharp',
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
        caption: 'Kirin USA — Japanese-influenced design on the same architecture',
      },
      {
        type: 'text-block',
        heading: 'Kirin USA',
        body: 'Kirin USA pulls Japanese-influenced design into the same system. Completely different cultural DNA, same architecture.',
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-nbb.mp4',
        alt: 'New Belgium flagship homepage interaction',
        aspect: '16/9',
        caption: 'New Belgium — heritage craft, the parent that ties the family together',
      },
      {
        type: 'text-block',
        heading: 'New Belgium',
        body: 'New Belgium is the parent — warm, considered, craft-first. The sub-brands borrow from its DNA without flattening into it.',
      },
      { type: 'chapter', number: '04', title: 'Try the theme switch yourself' },
      { type: 'spotlight-block', spotlightId: 'new-belgium-theme-switcher' },
      {
        type: 'text-block',
        heading: 'The switcher',
        body: 'Same component tree. Different theme file. Watch every pixel repaint without a single markup change.',
      },
      { type: 'chapter', number: '05', title: 'Campaigns on the engine', eyebrow: 'Production Output' },
      {
        type: 'text-block',
        heading: 'Real campaigns, shipped on the same architecture',
        body: "The engine doesn't just power five brand homepages — it ships campaign landing pages, launch microsites, and seasonal pushes. Same component tree. Different theme. Marketing requests turn around in days, not weeks.",
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-campaign-1.mp4',
        alt: 'New Belgium campaign landing page interaction',
        aspect: '16/9',
        caption: 'Campaign landing — engine-built, theme-driven',
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-campaign-2.mp4',
        alt: 'New Belgium campaign interaction',
        aspect: '16/9',
        caption: 'Campaign interaction — built fast on the shared system',
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-campaign-3.mp4',
        alt: 'New Belgium campaign rollout',
        aspect: '16/9',
        caption: 'Campaign rollout — the engine handles seasonal launches at scale',
      },
      {
        type: 'text-block',
        heading: 'Same engine, mobile too',
        body: 'The responsive variants ship from the same component tree. No separate mobile codebase, no mobile-specific QA cycle. The engine handles every breakpoint from one source of truth.',
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-campaign-mobile-1.mp4',
        alt: 'New Belgium campaign on mobile',
        aspect: '9/16',
        caption: 'Mobile responsive — same components, different breakpoints',
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-campaign-mobile-2.mp4',
        alt: 'New Belgium campaign on mobile',
        aspect: '9/16',
        caption: 'Mobile responsive — engine-driven from desktop to phone',
      },
      { type: 'chapter', number: '06', title: 'What shipped' },
      {
        type: 'text-block',
        heading: 'Five brands, one deploy pipeline',
        body: "{{Five}} brands run from one pipeline. When Voodoo Ranger's Juice Force campaign tripled traffic, the performance fix shipped to all five properties at once.",
      },
    ],
    featured: true,
    order: 1,
  },
  {
    title: 'Phantom Labs',
    subtitle: "A Studio Site That Never Shipped — and the Strongest Engineering I've Built",
    slug: 'phantom-labs',
    year: '2023',
    role: 'Lead Front-End Engineer',
    client: 'Phantom Labs (studio)',
    deliverables: ['Web', 'WebGL', 'Motion', 'Interaction'],
    tags: [
      'Three.js',
      'GLSL',
      'Custom Shaders',
      'WebGL',
      'Motion Systems',
      'Interaction Design',
      'Front End Engineering',
    ],
    projectUrl: '',
    thumbnail: '/work/phantom-1.webp',
    gallery: [
      '/work/phantom-1.webp',
      '/work/phantom-2.webp',
      '/work/phantom-3.webp',
      '/work/phantom-4.webp',
      '/work/phantom-5.webp',
      '/work/phantom-6.webp',
    ],
    overview: {
      headline: 'A Studio Site That Pushed The Boundary, Then Never Went Public',
      body: "Built for Phantom Labs in 2023. The studio later pivoted and the site never shipped — preserved here because it's the strongest engineering I've built. Custom shaders, hand-tuned interactions, motion systems that still hold up.",
    },
    blocks: [
      { type: 'chapter', number: '01', title: 'The Brief' },
      {
        type: 'text-block',
        heading: 'A studio site, swung at peak craft',
        body: 'Phantom Labs commissioned a portfolio site that had to look like the work — not a frame around the work. The brief gave room for custom shaders, custom interactions, and a motion language built from scratch. No drei drop-ins, no off-the-shelf scroll libraries. Every primitive was authored to fit.',
      },
      {
        type: 'text-block',
        heading: 'And then the studio pivoted',
        body: 'Mid-build, Phantom changed direction. The site never went public. Preserved here because the engineering deserves the daylight — and because shipping is not the only definition of done.',
      },
      { type: 'chapter', number: '02', title: 'The build', eyebrow: 'Hand-Authored Primitives' },
      {
        type: 'text-block',
        heading: 'Custom shaders, custom motion',
        body: 'Every visual primitive was hand-authored. No off-the-shelf materials. No drei post-processing stack. GLSL written to the visual brief, not adapted from a library.',
      },
      {
        type: 'video-block',
        src: '/work/videos/phantom-1.mp4',
        alt: 'Phantom Labs hero interaction',
        aspect: '16/9',
        caption: 'Hero — custom shader, hand-tuned motion',
      },
      {
        type: 'text-block',
        heading: 'The motion language',
        body: 'Every spring, every easing, every interaction beat tuned by hand. The whole site reads as one coherent motion sculpture rather than a stack of borrowed parts.',
      },
      { type: 'chapter', number: '03', title: 'In motion' },
      {
        type: 'video-block',
        src: '/work/videos/phantom-2.mp4',
        alt: 'Phantom Labs section transition',
        aspect: '16/9',
        caption: 'Section transition — typography meets material',
      },
      {
        type: 'video-block',
        src: '/work/videos/phantom-3.mp4',
        alt: 'Phantom Labs interaction detail',
        aspect: '16/9',
        caption: 'Detail interaction — engineered, not synthesized',
      },
      { type: 'chapter', number: '04', title: 'In stills' },
      {
        type: 'media-block',
        src: '/work/phantom-1.webp',
        alt: 'Phantom Labs hero state',
        aspect: '16/9',
        caption: 'Hero state — design and material as one',
      },
      {
        type: 'media-block',
        src: '/work/phantom-2.webp',
        alt: 'Phantom Labs work section',
        aspect: '16/9',
      },
      {
        type: 'media-block',
        src: '/work/phantom-3.webp',
        alt: 'Phantom Labs work section',
        aspect: '16/9',
      },
      {
        type: 'media-block',
        src: '/work/phantom-4.webp',
        alt: 'Phantom Labs case study layout',
        aspect: '16/9',
      },
      {
        type: 'media-block',
        src: '/work/phantom-5.webp',
        alt: 'Phantom Labs case study layout',
        aspect: '16/9',
      },
      {
        type: 'media-block',
        src: '/work/phantom-6.webp',
        alt: 'Phantom Labs case study layout',
        aspect: '16/9',
      },
      { type: 'chapter', number: '05', title: 'Almost shipped, still mine' },
      {
        type: 'text-block',
        heading: 'What the work proved',
        body: 'The site never went live, but the build proved out a way of working: custom shaders to taste, motion language hand-authored, no synthesis. That engineering still lives in everything I ship today.',
      },
    ],
    featured: true,
    order: 2,
  },
  {
    title: 'Mission Bell',
    subtitle: 'A Craft-First Portfolio for a Craft-First Shop',
    slug: 'mission-bell',
    year: '2023',
    role: 'Lead Front-End Engineer',
    client: 'Mission Bell',
    deliverables: ['Web', 'CMS', 'Motion'],
    tags: ['Nuxt', 'Vue', 'GSAP', 'Sanity CMS', 'WCAG 2.1 AA', 'Component Library', 'Front End Engineering'],
    projectUrl: 'https://www.missionbell.com/',
    thumbnail: '/work/mission-bell.webp',
    gallery: ['/work/mission-bell.webp', '/work/mission-bell-2.webp', '/work/mission-bell-3.webp'],
    overview: {
      headline: 'GSAP Page Transitions and a CMS the Shop Actually Owns',
      body: 'A Nuxt-powered portfolio site for a commercial architectural millwork firm based in San Jose and Seattle. GSAP transitions tuned to feel seamless, Sanity CMS the team owns, and WCAG 2.1 AA baked in from day one.',
    },
    blocks: [
      { type: 'chapter', number: '01', title: 'The Brief' },
      {
        type: 'text-block',
        heading: 'Catalogs stapled to spec sheets',
        body: "Mission Bell builds the millwork inside spaces like UCSF's Weill Institute for Neurosciences, the Nvidia Treehouse, and the Ameswell Hotel. Everyone else in the commercial millwork category has a website that looks like a product catalog stapled to a PDF portfolio. They wanted smooth transitions, photography of the built work, and a CMS the team could own without a developer on speed dial.",
      },
      { type: 'chapter', number: '02', title: 'Matching the craft to the site' },
      {
        type: 'text-block',
        heading: 'The frame',
        body: 'Nuxt handles routing and rendering. GSAP drives page transitions tuned to feel seamless without announcing themselves. A Vue component library keeps every project case study on-brand without starting from scratch each time.',
      },
      {
        type: 'text-block',
        heading: 'The content layer',
        body: 'Sanity CMS wired up so the shop manages the project portfolio directly — no tickets, no deploys. WCAG 2.1 AA compliance was part of the build from day one, not retrofitted on the last sprint.',
      },
      { type: 'chapter', number: '03', title: "The site takes on the shop's voice" },
      {
        type: 'video-block',
        src: '/work/videos/mission-bell-homepage.mp4',
        alt: 'Mission Bell homepage scroll',
        aspect: '21/9',
        caption: 'Homepage — GSAP transitions in motion',
      },
      {
        type: 'text-block',
        heading: 'The transitions',
        body: 'GSAP page transitions tuned to feel invisible — they announce themselves only when you look for them. Everything else is the built work.',
      },
      {
        type: 'video-block',
        src: '/work/videos/mission-bell-services.mp4',
        alt: 'Mission Bell capabilities page interaction',
        aspect: '16/9',
        caption: 'Capabilities page interaction',
      },
      {
        type: 'media-block',
        src: '/work/mission-bell-2.webp',
        alt: 'Mission Bell project portfolio',
        aspect: '16/9',
        caption: 'Project portfolio — managed entirely via Sanity',
      },
      {
        type: 'media-block',
        src: '/work/mission-bell-3.webp',
        alt: 'Mission Bell project detail page',
        aspect: '16/9',
        caption: 'Project detail view',
      },
      { type: 'chapter', number: '04', title: 'Zero dev tickets since launch' },
      {
        type: 'text-block',
        heading: 'It finally feels like us',
        body: 'Client\'s exact words after launch: "It finally feels like us." Zero developer tickets for content updates since go-live — the shop runs the site the same way they run the floor.',
      },
    ],
    featured: true,
    order: 3,
  },
  {
    title: 'Consume & Create',
    subtitle: 'Building for the Hardest Client',
    slug: 'consume-and-create',
    year: '2021',
    role: 'Lead Front-End Engineer',
    client: 'Consume and Create',
    deliverables: ['Web', 'CMS', 'Performance'],
    tags: ['Nuxt', 'Contentful CMS', 'Vue', 'Performance Optimization', 'Animation', 'Lighthouse', 'Agency'],
    projectUrl: 'https://www.consumeandcreate.co/',
    thumbnail: '/work/consume-and-create.webp',
    gallery: ['/work/consume-and-create.webp', '/work/cc-2.webp', '/work/cc-3.webp'],
    overview: {
      headline: 'High-90s Lighthouse Scores Without Sacrificing the Animation Budget',
      body: 'An agency site rebuild in Nuxt that had to sell the work while proving the technical credibility. High-90s Lighthouse scores with animations fully intact.',
    },
    blocks: [
      { type: 'chapter', number: '01', title: 'The Brief' },
      {
        type: 'text-block',
        heading: 'Building for your own agency',
        body: "Building for your own agency is harder than client work. Everyone's a critic, standards are unreasonable, and the site has to sell the work while proving you can actually build. The internal pressure was real. The external audience was everyone in the industry we wanted to hire.",
      },
      { type: 'chapter', number: '02', title: 'The performance / animation tension' },
      {
        type: 'text-block',
        heading: 'The fight',
        body: 'The hard part was hitting Lighthouse scores in the high 90s while keeping the animation work intact. That tension usually forces a compromise. Performance-first sites feel dead. Animation-first sites feel slow.',
      },
      {
        type: 'text-block',
        heading: 'The toolkit',
        body: "Nuxt for the shell. Contentful CMS handling content updates without developer involvement. Custom project galleries with hover-state previews. A contact form that doesn't feel like a DMV visit.",
      },
      {
        type: 'chapter',
        number: '03',
        title: 'Performance and motion, together',
        eyebrow: 'Perf-Motion Braid',
      },
      {
        type: 'video-block',
        src: '/work/videos/cc-hero.mp4',
        alt: 'Consume & Create homepage hero animation',
        aspect: '21/9',
        caption: 'Homepage hero — animation-heavy, still scoring 98 on Lighthouse',
      },
      {
        type: 'text-block',
        heading: 'The optimization pass',
        body: 'Lazy hydration, image sequencing, priority hints on everything above the fold, aggressive code splitting. Every animation measured against its cost. High-priority animations stayed on scroll; low-priority ones traded for main-thread headroom.',
      },
      {
        type: 'video-block',
        src: '/work/videos/cc-optimal-wrapper.mp4',
        alt: 'Consume & Create optimal wrapper interaction',
        aspect: '16/9',
        caption: 'Project detail interaction',
      },
      {
        type: 'media-block',
        src: '/work/cc-2.webp',
        alt: 'Consume & Create project gallery',
        aspect: '16/9',
        caption: 'Project gallery — hover-state previews',
      },
      { type: 'chapter', number: '04', title: 'A 98 Lighthouse score, animations fully intact' },
      {
        type: 'text-block',
        heading: 'What shipped',
        body: "{{High 90s}} Lighthouse, animations fully intact, CMS the team runs on their own. Ended up being the agency's best new business driver for over a year.",
      },
      {
        type: 'media-block',
        src: '/work/cc-404-cat.webp',
        alt: 'Custom 404 page featuring my cat',
        aspect: '16/9',
        caption: 'I also put my cat on the 404 page',
      },
    ],
    featured: true,
    order: 4,
  },
  {
    title: 'CraftedKit',
    subtitle: 'An Interactive Web Studio Shipping High-Craft WebGL',
    slug: 'craftedkit',
    year: '2026',
    role: 'Founder · Solo Production',
    client: 'CraftedKit (own studio)',
    deliverables: ['Studio Site', 'WebGL Catalog', 'Hero Components'],
    tags: ['Three.js / R3F', 'GLSL Shaders', 'Custom Materials', 'Next.js', 'TypeScript', 'WebGL', 'Motion Systems'],
    projectUrl: 'https://craftedkit.io',
    thumbnail: '/work/craftedkit-organic-living.webp',
    gallery: ['/work/craftedkit-organic-living.webp'],
    overview: {
      headline: '15+ Hero-Grade WebGL Experiences for an Interactive Web Studio',
      body: 'CraftedKit is the interactive web studio I run — shipping production-ready WebGL hero experiences for brands, studios, and product teams. The catalog spans Three.js scenes, custom GLSL shaders, and motion systems, every piece scoped to drop straight into a real codebase.',
    },
    blocks: [
      { type: 'chapter', number: '01', title: 'The Brief' },
      {
        type: 'text-block',
        heading: 'A studio for high-craft web',
        body: "I wanted a studio that ships the kind of work I'd want to make myself — interactive web experiences with real depth: Three.js, custom shaders, motion systems, and the engineering underneath that makes them production-ready. The output is the proof. Brands, studios, and product teams pick from a catalog that's already built to ship.",
      },
      {
        type: 'chapter',
        number: '02',
        title: 'The catalog',
        eyebrow: 'Hero Showcase',
      },
      {
        type: 'video-block',
        src: '/work/videos/craftedkit-organic-living.mp4',
        alt: 'Organic Living Material shader hero',
        aspect: '21/9',
        caption: 'Organic Living Material',
      },
      {
        type: 'text-block',
        heading: 'The output',
        body: '{{15+}} WebGL hero experiences live in the catalog, with more in production. Ferrofluid typography. Volumetric god rays. Particle fields. Reaction-diffusion. Each one is a real R3F component with proper resource disposal and responsive fallbacks.',
      },
      {
        type: 'video-block',
        src: '/work/videos/craftedkit-mechanical-heart.mp4',
        alt: 'Mechanical Heart shader hero',
        aspect: '16/9',
        caption: 'Mechanical Heart',
      },
      {
        type: 'video-block',
        src: '/work/videos/craftedkit-mycelium.mp4',
        alt: 'Mycelium shader hero',
        aspect: '16/9',
        caption: 'Mycelium network',
      },
      {
        type: 'video-block',
        src: '/work/videos/craftedkit-reaction-diffusion.mp4',
        alt: 'Reaction Diffusion Field shader hero',
        aspect: '16/9',
        caption: 'Reaction-diffusion field',
      },
      {
        type: 'chapter',
        number: '03',
        title: 'Built to ship',
        eyebrow: 'Engineering Rigor',
      },
      {
        type: 'text-block',
        heading: 'Production-ready by default',
        body: 'Every hero in the catalog is a real R3F component, not a demo. Resource disposal, responsive fallbacks, motion budgets, and a defined perf envelope. They drop into a Next.js codebase the same way any other component does. Built solo, AI-augmented production where it speeds the craft — never replaces it.',
      },
      { type: 'chapter', number: '04', title: 'What shipped' },
      {
        type: 'text-block',
        heading: 'The studio in one line',
        body: 'A live studio site, a growing hero catalog, and a real production rhythm — solo, end to end. Hire the studio for a hero, hire me for the engineering.',
      },
    ],
    featured: true,
    order: 5,
  },
];

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured).sort((a, b) => a.order - b.order);
}

// First video-block src in a project's content, used as the inline preview on
// the homepage Work cards. Returns null if the project has no video blocks.
export function getProjectFeaturedVideo(project: Project): string | null {
  if (!project.blocks) return null;
  for (const block of project.blocks) {
    if (block.type === 'video-block') return block.src;
  }
  return null;
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
