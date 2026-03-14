import Link from 'next/link';
import { Project } from '@/data/projects';

interface AdjacentStudy {
  title: string;
  slug: string;
}

interface CaseStudyProps {
  project: Project;
  prev?: AdjacentStudy | null;
  next?: AdjacentStudy | null;
}

function renderBody(body: string) {
  return body.split('\n\n').map((para, i) => (
    <p key={i} className="mb-4 last:mb-0">{para}</p>
  ));
}

export default function CaseStudyContent({ project, prev, next }: CaseStudyProps) {
  const { title, subtitle, tags, projectUrl, overview, caseStudy } = project;

  return (
    <article className="w-full">
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

        {/* Overview */}
        {overview && (
          <section>
            {overview.headline && (
              <h2 className="text-2xl font-bold mb-4">{overview.headline}</h2>
            )}
            <div className="prose prose-lg max-w-none text-foreground/80">
              {renderBody(overview.body)}
            </div>
          </section>
        )}

        {/* The Brief */}
        {caseStudy?.problem && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/50 mb-4">The Brief</h2>
            <div className="prose prose-lg max-w-none text-foreground/80">
              {renderBody(caseStudy.problem)}
            </div>
          </section>
        )}

        {/* How I Built It */}
        {caseStudy?.approach && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/50 mb-4">How I Built It</h2>
            <div className="prose prose-lg max-w-none text-foreground/80">
              {renderBody(caseStudy.approach)}
            </div>
          </section>
        )}

        {/* What Shipped */}
        {caseStudy?.results && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/50 mb-4">What Shipped</h2>
            <div className="prose prose-lg max-w-none text-foreground/80">
              {renderBody(caseStudy.results)}
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
