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
  aspect?: '16/9' | '21/9';
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

export const projects: Project[] = [
  {
    title: 'New Belgium & Friends',
    subtitle: 'One Engine. Four Brands. Zero Redundancy.',
    slug: 'new-belgium',
    year: '2022',
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
      { name: 'Lightstrike', tag: 'Lemon Lime', url: 'https://www.lightstrikebeer.com/' },
      { name: 'Kirin Ichiban', tag: 'Partnership', url: 'https://www.kirinichibanusa.com/' },
    ],
    thumbnail: '/work/voodoo-ranger.webp',
    gallery: ['/work/voodoo-ranger.webp', '/work/fat-tire.webp', '/work/lightstrike.webp', '/work/kirin.webp'],
    overview: {
      headline: "A Shared Module System Powering New Belgium's Entire Brand Portfolio",
      body: 'Four beer brands — one front-end architecture. I built a shared component system on Optimizely that gives Voodoo Ranger, Fat Tire, Lightstrike, and Kirin USA full visual autonomy without duplicating code across four codebases.',
    },
    blocks: [
      { type: 'chapter', number: '01', title: 'The Brief' },
      {
        type: 'text-block',
        heading: 'Five brands, one repo',
        body: 'A skeleton mascot and a 130-year-old Japanese brewery have no business looking alike, but they all ship from the same repo. The pitch was counterintuitive: stop running four teams, four build pipelines, four QA cycles. Collapse everything into one engine and let SCSS specificity do the brand work.',
      },
      { type: 'chapter', number: '02', title: 'Mapping five identities onto one architecture' },
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
      { type: 'chapter', number: '04', title: 'Try the theme switch yourself' },
      { type: 'spotlight-block', spotlightId: 'new-belgium-theme-switcher' },
      {
        type: 'text-block',
        heading: 'The switcher',
        body: 'Same component tree. Different theme file. Watch every pixel repaint without a single markup change.',
      },
      { type: 'chapter', number: '05', title: 'What shipped' },
      {
        type: 'text-block',
        heading: 'Five brands, one deploy pipeline',
        body: "Five brands run from one pipeline. When Voodoo Ranger's Juice Force campaign tripled traffic, the performance fix shipped to all five properties at once.",
      },
    ],
    featured: true,
    order: 1,
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
    order: 2,
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
      { type: 'chapter', number: '03', title: 'Performance and motion, together' },
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
        body: "High 90s Lighthouse, animations fully intact, CMS the team runs on their own. Ended up being the agency's best new business driver for over a year.",
      },
      {
        type: 'media-block',
        src: '/work/cc-404-cat.webp',
        alt: 'Custom 404 page featuring my cat',
        aspect: '16/9',
        caption: "I also put my cat on the 404 page. She's the best one.",
      },
    ],
    featured: true,
    order: 3,
  },
  {
    title: 'CraftedKit',
    subtitle: 'A Solo-Built Studio Powered by AI Agent Pipelines',
    slug: 'craftedkit',
    year: '2026',
    role: 'Founder · Solo Production',
    client: 'CraftedKit (own studio)',
    deliverables: ['Studio Site', 'Production Pipeline', 'WebGL Catalog'],
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
      headline: '15+ WebGL Heroes Shipped Through a Four-Gate AI Pipeline I Run by Hand',
      body: 'CraftedKit is an interactive web studio I built from scratch — the site, the products, and the production system that manufactures them. A four-agent pipeline with four human gates: specialists do the work, I decide what ships.',
    },
    blocks: [
      { type: 'chapter', number: '01', title: 'The Brief' },
      {
        type: 'text-block',
        heading: 'A studio that sells what I do best',
        body: "I wanted to build a studio that sells what I do best — interactive web experiences using Three.js, custom shaders, and motion systems. Doing that solo is a volume problem. The question wasn't whether AI could write shader code. It was whether I could design a production system where specialist agents do the building and I stay in charge of the taste — a real gated pipeline, not a lights-out factory.",
      },
      { type: 'chapter', number: '02', title: 'Building the pipeline that builds the work' },
      {
        type: 'text-block',
        heading: 'Four specialists and an orchestrator',
        body: 'Four specialist Claude agents — Jackson (research), Chad (design), Kyle (build), Brad (QA) — coordinated by Todd, an orchestrator. Each mission passes through four human-in-the-loop gates I sit at personally: Mission Approval, Creative Review A, Creative Review B, and Ship.',
      },
      {
        type: 'text-block',
        heading: 'Human in the loop',
        body: 'Agents cannot skip a gate. At each one I choose the direction, score the references, set the motion budget, and approve the build on desktop and phone. The pipeline protects the craft; I protect the taste.',
      },
      { type: 'chapter', number: '03', title: '15+ heroes, one production system' },
      {
        type: 'video-block',
        src: '/work/videos/craftedkit-organic-living.mp4',
        alt: 'Organic Living Material shader hero',
        aspect: '21/9',
        caption: 'Organic Living Material — one of 15+ WebGL heroes in the catalog',
      },
      {
        type: 'text-block',
        heading: 'The output',
        body: '15+ WebGL hero experiences live in the catalog, with more in the pipeline. Ferrofluid typography. Volumetric god rays. Particle fields. Each one is a real R3F component with proper resource disposal and responsive fallbacks.',
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
      { type: 'chapter', number: '04', title: 'The pipeline, drawn out' },
      { type: 'spotlight-block', spotlightId: 'craftedkit-pipeline' },
      {
        type: 'text-block',
        heading: 'The diagram',
        body: 'Jackson → Gate → Chad → Gate → Kyle → Gate → Brad → Gate. Todd routes every mission; I sit at every gate. Every failure becomes a permanent rule the system carries forward.',
      },
      { type: 'chapter', number: '05', title: 'One person, full production output' },
      {
        type: 'text-block',
        heading: 'What shipped',
        body: 'I run the whole studio solo. Specialist agents do the building; I review each mission at every gate, on desktop and phone, before anything ships.',
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
