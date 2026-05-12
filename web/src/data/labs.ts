/**
 * Backstage shader / pipeline notes for case studies.
 * Each lab is opt-in — only projects with technical depth get a /lab sub-route.
 */

interface LabNote {
  title: string;
  body: string;
  code?: string;
}

export interface Lab {
  headline: string;
  intro: string;
  notes: LabNote[];
}

const LABS: Record<string, Lab> = {
  craftedkit: {
    headline: 'How a four-agent pipeline ships shader work without losing taste',
    intro:
      'The public case study shows the output. This page is the wiring underneath — how four specialist Claude agents coordinate, where the human gates sit, and what the failure modes look like in practice.',
    notes: [
      {
        title: 'The roster',
        body: "Jackson, Chad, Kyle, Brad — four specialist agents, each with a single job. Jackson does research and reference compilation; Chad designs concept frames; Kyle builds the React Three Fiber component; Brad runs QA across desktop and mobile breakpoints. Todd is the orchestrator — he doesn't write code, he routes missions.\n\nKeeping each agent narrow turned out to matter more than I expected. A generalist agent would have been faster for the first week. By the third hero, scope creep had everyone doing everyone else's job. The roles only stay legible if the prompts stay narrow.",
      },
      {
        title: 'Four gates, one human',
        body: "Mission Approval. Creative Review A (after Chad's frames). Creative Review B (after Kyle's prototype). Ship. I sit at all four — agents cannot skip a gate. Each gate has a checklist, and the checklist is what the agents are actually trained against; the prompts are second.\n\nThe gates are also where motion budget gets locked. If a hero exceeds 16ms per frame on a Pixel 7, it doesn't ship. If the GPU memory exceeds 80MB, it doesn't ship. Hard caps, not aspirations.",
      },
      {
        title: 'Failure → permanent rule',
        body: 'Every failure becomes a rule the system carries forward. Bad shader compiles, mobile flicker, broken disposal — once it happens, it goes into a permanent rule file the agents read at the start of every mission. The pipeline gets slightly stricter every week.\n\nAfter six months of this, the rule file is doing more work than the prompts. New heroes ship faster than the first ones because the failure modes have all been seen and codified.',
      },
      {
        title: 'Dispersion shader that ships in CK heroes',
        body: 'A trimmed-down version of the per-channel IOR refraction used on this site’s landing type. Each hero in the catalog gets a tuned variant — different IOR offsets, different breath frequency, different absorption tint. The shader code below is the inner loop that runs in every CK hero variant.',
        code: `vec3 dispersion(vec2 uv, vec3 viewDir, vec3 normal, float power) {
  vec3 rR = refract(viewDir, normal, 1.0 / uIorR);
  vec3 rG = refract(viewDir, normal, 1.0 / uIorG);
  vec3 rB = refract(viewDir, normal, 1.0 / uIorB);
  vec3 col;
  col.r = texture2D(uScene, uv + rR.xy * power).r;
  col.g = texture2D(uScene, uv + rG.xy * power).g;
  col.b = texture2D(uScene, uv + rB.xy * power).b;
  return col;
}`,
      },
    ],
  },
  'new-belgium': {
    headline: 'How SCSS specificity does the brand work — five themes, one repo',
    intro:
      'The case study shows the four brands. This page shows how the theming layer works — why specificity-driven CSS held up at scale, where it broke, and what we changed when it did.',
    notes: [
      {
        title: 'Theme-as-class, not variant prop',
        body: 'Every brand has a single root class on <body> — body.theme-voodoo, body.theme-fat-tire, etc. Component markup never changes. SCSS specificity layered on top of a shared component stylesheet wins every time.\n\nThe alternative would have been to thread theme props through every component. We tried that for the first two brands and it polluted the API surface. Falling back to class-based theming gave us five brand voices for the cost of five SCSS files.',
      },
      {
        title: 'What broke first',
        body: "Animation timing. Each brand had different motion personalities — Voodoo hits hard, Fat Tire breathes slow. We were tempted to centralize timing tokens. We didn't. Each theme owns its own keyframe durations because the moment we tried to share them, every brand started feeling the same.\n\nThe rule: tokens that *should* differ between brands belong in the theme file. Tokens that should never differ (spacing, type scale ratios) live in shared.",
      },
      {
        title: 'The deploy ratchet',
        body: "One pipeline. One npm publish. When Voodoo Ranger's Juice Force campaign tripled traffic and we found a hydration regression, the fix shipped to all five properties at once — that is the entire pitch of this architecture, and the only reason the up-front complexity is justified.",
      },
    ],
  },
};

export function hasLab(slug: string): boolean {
  return slug in LABS;
}

export function getLabBySlug(slug: string): Lab | null {
  return LABS[slug] ?? null;
}
