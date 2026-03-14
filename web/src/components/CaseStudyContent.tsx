import { PortableText } from '@portabletext/react';
import Link from 'next/link';

interface AdjacentStudy {
  title: string;
  slug: string;
}

interface CaseStudyProps {
  caseStudy: {
    title: string;
    subtitle: string;
    slug: string;
    tags: string[];
    projectUrl?: string;
    overview?: {
      headline: string;
      richtext: any;
    };
    heroImage?: string;
    caseStudyProblem?: any;
    caseStudyApproach?: any;
    caseStudyResults?: any;
    gallery?: Array<{ url: string; alt?: string; caption?: string }>;
  };
  prev?: AdjacentStudy | null;
  next?: AdjacentStudy | null;
}

export default function CaseStudyContent({ caseStudy, prev, next }: CaseStudyProps) {
  const { title, subtitle, tags, projectUrl, overview, heroImage, caseStudyProblem, caseStudyApproach, caseStudyResults, gallery } = caseStudy;

  return (
    <article className="w-full">
      {/* Hero */}
      {heroImage && (
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-t-2xl">
          <img
            src={heroImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="px-4 py-8 md:px-16 md:py-12 space-y-10 md:space-y-16">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h1>
          <p className="text-xl text-foreground/70">{subtitle}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            {tags?.map((tag: string) => (
              <span key={tag} className="px-3 py-1 text-xs font-mono uppercase tracking-widest bg-foreground/5 rounded-full border border-foreground/10">
                {tag}
              </span>
            ))}
          </div>

          {projectUrl && (
            <a
              href={projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm font-mono uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors"
            >
              View Live Site →
            </a>
          )}
        </header>

        {/* Overview (from existing Sanity field) */}
        {overview?.richtext && (
          <section>
            {overview.headline && (
              <h2 className="text-2xl font-bold mb-4">{overview.headline}</h2>
            )}
            <div className="prose prose-lg max-w-none text-foreground/80">
              <PortableText value={overview.richtext} />
            </div>
          </section>
        )}

        {/* The Brief */}
        {caseStudyProblem && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/50 mb-4">The Brief</h2>
            <div className="prose prose-lg max-w-none text-foreground/80">
              <PortableText value={caseStudyProblem} />
            </div>
          </section>
        )}

        {/* How I Built It */}
        {caseStudyApproach && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/50 mb-4">How I Built It</h2>
            <div className="prose prose-lg max-w-none text-foreground/80">
              <PortableText value={caseStudyApproach} />
            </div>
          </section>
        )}

        {/* Gallery */}
        {gallery && gallery.length > 0 && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/50 mb-6">Key Visuals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gallery.map((img, i) => (
                <div key={i} className="relative overflow-hidden rounded-xl border border-foreground/10">
                  <img
                    src={img.url}
                    alt={img.alt || `${title} screenshot ${i + 1}`}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  {img.caption && (
                    <p className="text-xs text-foreground/50 p-3 font-mono">{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* What Shipped */}
        {caseStudyResults && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/50 mb-4">What Shipped</h2>
            <div className="prose prose-lg max-w-none text-foreground/80">
              <PortableText value={caseStudyResults} />
            </div>
          </section>
        )}

        {/* Prev / Next Navigation */}
        <nav className="flex justify-between items-center border-t border-foreground/10 pt-8 mt-16">
          {prev ? (
            <Link href={`/work/${prev.slug}`} className="group flex flex-col items-start">
              <span className="text-xs font-mono uppercase tracking-widest text-foreground/40 mb-1">← Previous</span>
              <span className="text-lg font-bold group-hover:text-foreground/80 transition-colors">{prev.title}</span>
            </Link>
          ) : <div />}
          {next ? (
            <Link href={`/work/${next.slug}`} className="group flex flex-col items-end">
              <span className="text-xs font-mono uppercase tracking-widest text-foreground/40 mb-1">Next →</span>
              <span className="text-lg font-bold group-hover:text-foreground/80 transition-colors">{next.title}</span>
            </Link>
          ) : <div />}
        </nav>

        {/* Contact CTA Footer */}
        <footer className="text-center py-16 mt-8 border-t border-foreground/5">
          <p className="text-foreground/50 text-sm font-mono uppercase tracking-widest mb-4">Like what you see?</p>
          <a
            href="mailto:sam@samherwig.dev"
            className="text-lg font-bold text-foreground hover:text-foreground/80 transition-colors"
          >
            sam@samherwig.dev →
          </a>
        </footer>
      </div>
    </article>
  );
}
