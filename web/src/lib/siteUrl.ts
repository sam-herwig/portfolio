// Resolve the canonical origin for this build. On Netlify, `CONTEXT` is
// `production` for prod, `branch-deploy` for branches, `deploy-preview` for
// PRs. For anything other than production we point canonicals/OG/JSON-LD at
// the actual deploy host so staging never canonicalizes to samherwig.dev
// (which would create cross-domain canonical / duplicate-content noise if
// the staging URL is ever crawled).
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.CONTEXT === 'production') return 'https://samherwig.dev';
  const deployUrl = process.env.DEPLOY_PRIME_URL ?? process.env.DEPLOY_URL ?? process.env.URL;
  if (deployUrl) return deployUrl;
  return 'https://samherwig.dev';
}

export const SITE_URL = resolveSiteUrl();

// True for local dev (no CONTEXT) and prod Netlify deploys. False for any
// non-production Netlify deploy (branch-deploy, deploy-preview) — those get
// noindex metadata + a Disallow-all robots.txt.
export const ALLOW_INDEXING = !process.env.CONTEXT || process.env.CONTEXT === 'production';
