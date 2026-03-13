import { PortableText } from '@portabletext/react';

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
}

export default function CaseStudyContent({ caseStudy }: CaseStudyProps) {
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

        {/* The Problem */}
        {caseStudyProblem && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/50 mb-4">The Problem</h2>
            <div className="prose prose-lg max-w-none text-foreground/80">
              <PortableText value={caseStudyProblem} />
            </div>
          </section>
        )}

        {/* The Approach */}
        {caseStudyApproach && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/50 mb-4">The Approach</h2>
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

        {/* The Results */}
        {caseStudyResults && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/50 mb-4">The Results</h2>
            <div className="prose prose-lg max-w-none text-foreground/80">
              <PortableText value={caseStudyResults} />
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
