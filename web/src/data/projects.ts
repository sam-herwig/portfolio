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

/** Named chapter mark — one of the 5 expedition stations */
export interface StationBreak {
  type: 'station';
  roman: 'I' | 'II' | 'III' | 'IV' | 'V';
  title: string;
  subtitle?: string;
}

/** Specimen sprite in the outer marginalia rail */
export interface SpecimenBlock {
  type: 'specimen';
  src: string;
  figNumber: string;
  label: string;
  side?: 'left' | 'right';
}

/** Horizontal scroll frieze — "specimens collected along the ascent" */
export interface FriezeBlock {
  type: 'frieze';
  specimens: string[];
  title?: string;
}

/** Sticky full-viewport metric count-up */
export interface MetricBlock {
  type: 'metric';
  value: string;
  unit?: string;
  label: string;
}

export interface MastheadBlock {
  type: 'masthead';
}

export type ContentBlock =
  | TextBlock
  | MediaBlock
  | VideoBlock
  | SpotlightBlock
  | StationBreak
  | SpecimenBlock
  | FriezeBlock
  | MetricBlock
  | MastheadBlock;

/** Canonical 5-station narrative spine for every case study */
export const TRAIL_STATIONS = ['Trailhead', 'The Ascent', 'The Ridge', 'The Summit', 'The Descent'] as const;
export type TrailStation = (typeof TRAIL_STATIONS)[number];

/* ── Project interface ────────────────────────────────────── */

export interface Project {
  title: string;
  subtitle: string;
  slug: string;
  tags: string[];
  projectUrl: string;
  thumbnail: string;
  gallery?: string[];
  /** Italicized opening hook rendered above the masthead title */
  openingQuote?: string;
  /** Path to the project's signature landmark sprite, washed behind Station III */
  signatureLandmark?: string;
  overview: {
    headline: string;
    body: string;
  };
  sections?: ProjectSection[];
  blocks?: ContentBlock[];
  /** Optional — additional live sites that shipped on the same codebase/system */
  relatedSites?: { name: string; tag: string; url: string }[];
  /** Client or studio the work was done for */
  client?: string;
  /** Year the work shipped (e.g., "2024") */
  year?: string;
  /** Role Sam played (e.g., "Lead Front-End", "Creative Engineer") */
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
    openingQuote:
      '"Four skeletons, a 130-year-old Japanese brewery, and one codebase. None of them should look the same. None of them should share a repo. Both of those things turned out to be wrong."',
    signatureLandmark: '/assets/graphics/case-study/nb-rustic-cabin.webp',
    overview: {
      headline: "A Shared Module System Powering New Belgium's Entire Brand Portfolio",
      body: 'Four beer brands — one front-end architecture. I built a shared component system on Optimizely that gives Voodoo Ranger, Fat Tire, Lightstrike, and Kirin USA full visual autonomy without duplicating code across four codebases.',
    },
    blocks: [
      /* ── Station I — Trailhead ───────────────────────── */
      { type: 'masthead' },
      {
        type: 'text-block',
        heading: 'The Brief',
        body: 'Five beer brands. One codebase. A skeleton mascot and a 130-year-old Japanese brewery have no business looking alike, but they all ship from the same repo.\n\nThe pitch was counterintuitive: stop running four teams, four build pipelines, four QA cycles. Collapse everything into one engine and let SCSS specificity do the brand work.',
      },

      /* ── Station II — The Ascent ─────────────────────── */
      {
        type: 'station',
        roman: 'II',
        title: 'The Ascent',
        subtitle: 'Mapping five identities onto one architecture',
      },
      {
        type: 'text-block',
        heading: 'The Architecture',
        body: "Optimizely's Episerver handles content. On top of it, SCSS specificity layers control typography, color, animation intensity, and layout density per brand. Nothing touches shared markup. Marketing updates content without accidentally breaking a sibling brand.",
      },
      {
        type: 'text-block',
        heading: 'The Theme System',
        body: 'One deploy pipeline. Five theme files. Every performance fix and accessibility improvement ships to every brand at once, which is the real reason this architecture is worth the tradeoffs.',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/nb-hop-vine.webp',
        figNumber: 'Fig. 06',
        label: 'Humulus lupulus — cultivated lineage',
        side: 'right',
      },
      {
        type: 'frieze',
        specimens: [
          '/work/voodoo-header.webp',
          '/work/fat-tire-header.webp',
          '/work/lightstrike-header.webp',
          '/work/kirin-header.webp',
        ],
        title: 'Four brand headers, one system',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/rock-boulder-cluster.webp',
        figNumber: 'Fig. 03',
        label: 'Granite boulder cluster, eastern slope',
        side: 'left',
      },

      /* ── Station III — The Ridge ─────────────────────── */
      { type: 'station', roman: 'III', title: 'The Ridge', subtitle: 'Where each brand finds its own voice' },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-voodoo.mp4',
        alt: 'Voodoo Ranger homepage interaction',
        aspect: '16/9',
        figNumber: 'Fig. 08',
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
        figNumber: 'Fig. 09',
        caption: 'Fat Tire — heritage craft, warm tones, editorial calm',
      },
      {
        type: 'text-block',
        heading: 'Fat Tire',
        body: "Then there's Fat Tire. Heritage craft, warm tones, editorial calm. Same components underneath, totally different vibe.",
      },
      {
        type: 'video-block',
        src: '/work/videos/new-belgium-lightstrike.mp4',
        alt: 'Lightstrike homepage interaction',
        aspect: '16/9',
        figNumber: 'Fig. 10',
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
        figNumber: 'Fig. 11',
        caption: 'Kirin USA — Japanese-influenced design on the same architecture',
      },
      {
        type: 'text-block',
        heading: 'Kirin USA',
        body: 'Kirin USA pulls Japanese-influenced design into the same system. Completely different cultural DNA, same architecture.',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/pine-tree-dense.webp',
        figNumber: 'Fig. 01',
        label: 'Pinus ponderosa, collected on approach',
        side: 'left',
      },

      /* ── Station IV — The Summit ─────────────────────── */
      { type: 'station', roman: 'IV', title: 'The Summit', subtitle: 'Try the theme switch yourself' },
      { type: 'spotlight-block', spotlightId: 'new-belgium-theme-switcher' },
      {
        type: 'text-block',
        heading: 'The Switcher',
        body: 'Same component tree. Different theme file. Watch every pixel repaint without a single markup change.',
      },

      /* ── Station V — The Descent ─────────────────────── */
      { type: 'station', roman: 'V', title: 'The Descent', subtitle: 'What shipped, what held' },
      {
        type: 'metric',
        value: '5',
        unit: 'brands',
        label: 'One codebase, one deploy pipeline',
      },
      {
        type: 'text-block',
        heading: 'What Shipped',
        body: "Five brands, one deploy pipeline. When Voodoo Ranger's Juice Force campaign tripled traffic, the performance fix shipped to all five properties at once.",
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/wildflower-meadow-strip.webp',
        figNumber: 'Fig. 05',
        label: 'Alpine meadow, descent route',
        side: 'right',
      },
    ],
    featured: true,
    order: 1,
  },
  {
    title: 'Mission Bell',
    subtitle: 'A Craft-First Portfolio for a Craft-First Shop',
    slug: 'mission-bell',
    tags: ['Nuxt', 'Vue', 'GSAP', 'Sanity CMS', 'WCAG 2.1 AA', 'Component Library', 'Front End Engineering'],
    projectUrl: 'https://www.missionbell.com/',
    thumbnail: '/work/mission-bell.webp',
    gallery: ['/work/mission-bell.webp', '/work/mission-bell-2.webp', '/work/mission-bell-3.webp'],
    openingQuote:
      '"Most architectural millwork shops have websites that look like catalogs stapled to a spec sheet. Mission Bell treats every commercial install like a commission — the site had to feel the same."',
    signatureLandmark: '/assets/graphics/case-study/mb-mission-bell-tower.webp',
    overview: {
      headline: 'GSAP Page Transitions and a CMS the Shop Actually Owns',
      body: 'A Nuxt-powered portfolio site for a commercial architectural millwork firm based in San Jose and Seattle. GSAP transitions tuned to feel seamless, Sanity CMS the team owns, and WCAG 2.1 AA baked in from day one.',
    },
    blocks: [
      /* ── Station I — Trailhead ───────────────────────── */
      { type: 'masthead' },
      {
        type: 'text-block',
        heading: 'The Brief',
        body: "Mission Bell builds the millwork and casework inside spaces like UCSF's Weill Institute for Neurosciences, the Nvidia Treehouse, and the Ameswell Hotel. Everyone else in the commercial millwork category has a website that looks like a product catalog stapled to a PDF portfolio.\n\nSmooth transitions. Photography of the built work, not the spec sheets. A CMS the team could own without a developer on speed dial.",
      },

      /* ── Station II — The Ascent ─────────────────────── */
      { type: 'station', roman: 'II', title: 'The Ascent', subtitle: 'Matching the craft to the site' },
      {
        type: 'text-block',
        heading: 'The Frame',
        body: 'Nuxt handles routing and rendering. GSAP drives page transitions tuned to feel seamless without announcing themselves. A Vue component library keeps every project case study on-brand without starting from scratch each time.',
      },
      {
        type: 'text-block',
        heading: 'The Content Layer',
        body: 'Sanity CMS wired up so the shop manages the project portfolio directly — no tickets, no deploys. WCAG 2.1 AA compliance was part of the build from day one, not retrofitted on the last sprint.',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/mb-desert-mesa.webp',
        figNumber: 'Fig. 06',
        label: 'Sandstone mesa profile, site strata',
        side: 'right',
      },
      {
        type: 'frieze',
        specimens: ['/work/mission-bell.webp', '/work/mission-bell-2.webp', '/work/mission-bell-3.webp'],
        title: 'Built work, a sampling',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/dead-tree-snag.webp',
        figNumber: 'Fig. 02',
        label: 'Populus tremuloides, rough stock',
        side: 'left',
      },

      /* ── Station III — The Ridge ─────────────────────── */
      { type: 'station', roman: 'III', title: 'The Ridge', subtitle: "The site takes on the shop's voice" },
      {
        type: 'video-block',
        src: '/work/videos/mission-bell-homepage.mp4',
        alt: 'Mission Bell homepage scroll',
        aspect: '21/9',
        figNumber: 'Fig. 07',
        caption: 'Mission Bell homepage — GSAP transitions in motion',
      },
      {
        type: 'text-block',
        heading: 'The Transitions',
        body: 'GSAP page transitions tuned to feel invisible — they announce themselves only when you look for them. Everything else is the built work.',
      },
      {
        type: 'video-block',
        src: '/work/videos/mission-bell-services.mp4',
        alt: 'Mission Bell capabilities page interaction',
        aspect: '16/9',
        figNumber: 'Fig. 08',
        caption: 'Capabilities page interaction',
      },
      {
        type: 'media-block',
        src: '/work/mission-bell-2.webp',
        alt: 'Mission Bell project portfolio',
        aspect: '16/9',
        figNumber: 'Fig. 09',
        caption: 'Project portfolio — managed entirely via Sanity',
      },
      {
        type: 'media-block',
        src: '/work/mission-bell-3.webp',
        alt: 'Mission Bell project detail page',
        aspect: '16/9',
        figNumber: 'Fig. 10',
        caption: 'Project detail view',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/pine-tree-dense.webp',
        figNumber: 'Fig. 01',
        label: 'Pinus ponderosa, lumber grade',
        side: 'left',
      },

      /* ── Station IV — The Summit ─────────────────────── */
      { type: 'station', roman: 'IV', title: 'The Summit', subtitle: 'The handoff, in detail' },
      {
        type: 'text-block',
        heading: 'The Transitions',
        body: "Between pages, the reader gets the same pace a shop walk-through gives a client. The transitions aren't decoration — they're the rhythm that makes a project catalog read like a commission.",
      },

      /* ── Station V — The Descent ─────────────────────── */
      { type: 'station', roman: 'V', title: 'The Descent', subtitle: 'Zero dev tickets since launch' },
      {
        type: 'metric',
        value: '0',
        unit: 'tickets',
        label: 'Developer tickets since go-live',
      },
      {
        type: 'text-block',
        heading: 'What Shipped',
        body: 'Client\'s exact words after launch: "It finally feels like us." They haven\'t filed a single developer ticket for content updates since — the shop runs the site the same way they run the floor.',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/wildflower-meadow-strip.webp',
        figNumber: 'Fig. 05',
        label: 'Alpine meadow, installation day',
        side: 'right',
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
    openingQuote:
      '"Building for your own agency is harder than client work. Everyone\'s a critic, standards are unreasonable, and the site has to sell the work while proving you can actually build."',
    signatureLandmark: '/assets/graphics/case-study/cc-lighthouse.webp',
    overview: {
      headline: 'High-90s Lighthouse Scores Without Sacrificing the Animation Budget',
      body: 'An agency site rebuild in Nuxt that had to sell the work while proving the technical credibility. High-90s Lighthouse scores with animations fully intact.',
    },
    blocks: [
      /* ── Station I — Trailhead ───────────────────────── */
      { type: 'masthead' },
      {
        type: 'text-block',
        heading: 'The Brief',
        body: "Building for your own agency is harder than client work. Everyone's a critic, standards are unreasonable, and the site has to sell the work while proving you can actually build.\n\nThe internal pressure was real. The external audience was everyone in the industry we wanted to hire.",
      },

      /* ── Station II — The Ascent ─────────────────────── */
      { type: 'station', roman: 'II', title: 'The Ascent', subtitle: 'The performance / animation tension' },
      {
        type: 'text-block',
        heading: 'The Fight',
        body: 'The hard part was hitting Lighthouse scores in the high 90s while keeping the animation work intact. That tension usually forces a compromise. Performance-first sites feel dead. Animation-first sites feel slow.',
      },
      {
        type: 'text-block',
        heading: 'The Toolkit',
        body: "Nuxt for the shell. Contentful CMS handling content updates without developer involvement. Custom project galleries with hover-state previews. A contact form that doesn't feel like a DMV visit.",
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/cc-coastal-cliff.webp',
        figNumber: 'Fig. 06',
        label: 'Basalt sea cliff, agency coast',
        side: 'right',
      },
      {
        type: 'frieze',
        specimens: ['/work/consume-and-create.webp', '/work/cc-2.webp', '/work/cc-3.webp'],
        title: 'Project gallery studies',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/rock-jagged-outcrop.webp',
        figNumber: 'Fig. 04',
        label: 'Schist outcrop, weathered edge',
        side: 'left',
      },

      /* ── Station III — The Ridge ─────────────────────── */
      { type: 'station', roman: 'III', title: 'The Ridge', subtitle: 'Performance and motion, together' },
      {
        type: 'video-block',
        src: '/work/videos/cc-hero.mp4',
        alt: 'Consume & Create homepage hero animation',
        aspect: '21/9',
        figNumber: 'Fig. 07',
        caption: 'C&C homepage hero — animation-heavy, still scoring 98 on Lighthouse',
      },
      {
        type: 'text-block',
        heading: 'The Optimization Pass',
        body: 'The performance optimization pass got us there on both. Lazy hydration, image sequencing, priority hints on everything above the fold, aggressive code splitting. Every animation measured against its cost.',
      },
      {
        type: 'video-block',
        src: '/work/videos/cc-optimal-wrapper.mp4',
        alt: 'Consume & Create optimal wrapper interaction',
        aspect: '16/9',
        figNumber: 'Fig. 08',
        caption: 'Project detail interaction',
      },
      {
        type: 'media-block',
        src: '/work/cc-2.webp',
        alt: 'Consume & Create project gallery',
        aspect: '16/9',
        figNumber: 'Fig. 09',
        caption: 'Project gallery — hover-state previews',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/pine-tree-dense.webp',
        figNumber: 'Fig. 01',
        label: 'Pinus ponderosa, coastal variant',
        side: 'left',
      },

      /* ── Station IV — The Summit ─────────────────────── */
      { type: 'station', roman: 'IV', title: 'The Summit', subtitle: 'Performance held its ground' },
      {
        type: 'text-block',
        heading: 'The Proof',
        body: 'A 98 Lighthouse score without trading a single keyframe. High-priority animations stayed on scroll; low-priority ones traded for main-thread headroom. The performance budget held through every gesture.',
      },

      /* ── Station V — The Descent ─────────────────────── */
      { type: 'station', roman: 'V', title: 'The Descent', subtitle: "The agency's best new business driver" },
      {
        type: 'metric',
        value: '98',
        unit: 'Lighthouse',
        label: 'Performance score with animations fully intact',
      },
      {
        type: 'text-block',
        heading: 'What Shipped',
        body: "High 90s Lighthouse, animations fully intact, CMS the team runs on their own. Ended up being the agency's best new business driver for over a year.",
      },
      {
        type: 'media-block',
        src: '/work/cc-404-cat.webp',
        alt: 'Custom 404 page featuring my cat',
        aspect: '16/9',
        figNumber: 'Fig. 10',
        caption: "I also put my cat on the 404 page. She's the best one.",
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/wildflower-meadow-strip.webp',
        figNumber: 'Fig. 05',
        label: 'Coastal bloom, spring',
        side: 'right',
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
    openingQuote:
      '"15+ live WebGL heroes. One developer. Four specialist agents and an orchestrator — and I walk every mission through the gates myself."',
    signatureLandmark: '/assets/graphics/case-study/ck-crystalline-formation.webp',
    overview: {
      headline: '15+ WebGL Heroes Shipped Through a Four-Gate AI Pipeline I Run by Hand',
      body: 'CraftedKit is an interactive web studio I built from scratch — the site, the products, and the production system that manufactures them. A four-agent pipeline with four human gates: specialists do the work, I decide what ships.',
    },
    blocks: [
      /* ── Station I — Trailhead ───────────────────────── */
      { type: 'masthead' },
      {
        type: 'text-block',
        heading: 'The Brief',
        body: "I wanted to build a studio that sells what I actually do best — interactive web experiences using Three.js, custom shaders, and motion systems. Doing that solo is a volume problem.\n\nThe question wasn't whether AI could write shader code. It was whether I could design a production system where specialist agents do the building and I stay in charge of the taste — a real gated pipeline, not a lights-out factory.",
      },

      /* ── Station II — The Ascent ─────────────────────── */
      { type: 'station', roman: 'II', title: 'The Ascent', subtitle: 'Building the pipeline that builds the work' },
      {
        type: 'text-block',
        heading: 'The Pipeline',
        body: 'Four specialist Claude agents — Jackson (research), Chad (design), Kyle (build), Brad (QA) — coordinated by Todd, an orchestrator. Each mission passes through four human-in-the-loop gates I sit at personally: Mission Approval, Creative Review A, Creative Review B, and Ship.',
      },
      {
        type: 'text-block',
        heading: 'Human In The Loop',
        body: 'Agents cannot skip a gate. At each one I choose the direction, score the references, set the motion budget, and approve the build on desktop and phone. The pipeline protects the craft; I protect the taste.',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/ck-circuit-fern.webp',
        figNumber: 'Fig. 06',
        label: 'Polystichum acrostichoides, circuit detail',
        side: 'right',
      },
      {
        type: 'frieze',
        specimens: [
          '/work/videos/craftedkit-organic-living.mp4',
          '/work/videos/craftedkit-mechanical-heart.mp4',
          '/work/videos/craftedkit-mycelium.mp4',
          '/work/videos/craftedkit-reaction-diffusion.mp4',
        ],
        title: 'Shader hero concept studies',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/rock-boulder-cluster.webp',
        figNumber: 'Fig. 03',
        label: 'Boulder cluster, foundation stone',
        side: 'left',
      },

      /* ── Station III — The Ridge ─────────────────────── */
      { type: 'station', roman: 'III', title: 'The Ridge', subtitle: '15+ heroes, one production system' },
      {
        type: 'video-block',
        src: '/work/videos/craftedkit-organic-living.mp4',
        alt: 'Organic Living Material shader hero',
        aspect: '21/9',
        figNumber: 'Fig. 07',
        caption: 'Organic Living Material — one of 15+ WebGL heroes in the catalog',
      },
      {
        type: 'text-block',
        heading: 'The Output',
        body: '15+ WebGL hero experiences live in the catalog, with more in the pipeline. Ferrofluid typography. Volumetric god rays. Particle fields. Each one is a real R3F component with proper resource disposal and responsive fallbacks.',
      },
      {
        type: 'video-block',
        src: '/work/videos/craftedkit-mechanical-heart.mp4',
        alt: 'Mechanical Heart shader hero',
        aspect: '16/9',
        figNumber: 'Fig. 08',
        caption: 'Mechanical Heart',
      },
      {
        type: 'video-block',
        src: '/work/videos/craftedkit-mycelium.mp4',
        alt: 'Mycelium shader hero',
        aspect: '16/9',
        figNumber: 'Fig. 09',
        caption: 'Mycelium network',
      },
      {
        type: 'video-block',
        src: '/work/videos/craftedkit-reaction-diffusion.mp4',
        alt: 'Reaction Diffusion Field shader hero',
        aspect: '16/9',
        figNumber: 'Fig. 10',
        caption: 'Reaction-diffusion field',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/pine-tree-dense.webp',
        figNumber: 'Fig. 01',
        label: 'Pinus ponderosa, pipeline sentinel',
        side: 'left',
      },

      /* ── Station IV — The Summit ─────────────────────── */
      { type: 'station', roman: 'IV', title: 'The Summit', subtitle: 'The pipeline, drawn out' },
      { type: 'spotlight-block', spotlightId: 'craftedkit-pipeline' },
      {
        type: 'text-block',
        heading: 'The Diagram',
        body: 'Jackson → Gate → Chad → Gate → Kyle → Gate → Brad → Gate. Todd routes every mission; I sit at every gate.',
      },

      /* ── Station V — The Descent ─────────────────────── */
      { type: 'station', roman: 'V', title: 'The Descent', subtitle: 'One person, full production output' },
      {
        type: 'metric',
        value: '15+',
        unit: 'heroes',
        label: 'WebGL experiences live in the catalog',
      },
      {
        type: 'text-block',
        heading: 'What Shipped',
        body: 'I run the whole studio solo. Specialist agents do the building; I review each mission at every gate, on desktop and phone, before anything ships. Every failure becomes a permanent rule the system carries forward.',
      },
      {
        type: 'specimen',
        src: '/assets/graphics/case-study/wildflower-meadow-strip.webp',
        figNumber: 'Fig. 05',
        label: 'Alpine meadow, mid-bloom',
        side: 'right',
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
