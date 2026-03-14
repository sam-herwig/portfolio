'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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
  const { title, subtitle, tags, projectUrl, overview, gallery, sections } = project;

  const heroImage = gallery && gallery.length > 0 ? gallery[0] : null;
  const remainingImages = gallery && gallery.length > 1 ? gallery.slice(1) : [];

  return (
    <article className="w-full">
      {/* Hero Image */}
      {heroImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full"
        >
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-lg overflow-hidden mx-4 md:mx-16 mt-8">
            <img
              src={heroImage}
              alt={`${title} hero`}
              className="object-cover w-full h-full"
            />
          </div>
        </motion.div>
      )}

      <div className="px-4 py-8 md:px-16 md:py-12 space-y-10 md:space-y-16">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h1>
          <p className="text-xl text-foreground/70">{subtitle}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            {tags?.map((tag: string, i: number) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
                className="px-3 py-1 text-xs font-mono uppercase tracking-widest bg-foreground/5 rounded-full border border-foreground/10"
              >
                {tag}
              </motion.span>
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

        {/* Sections (structured) or Overview (fallback) */}
        {sections && sections.length > 0 ? (
          <div className="space-y-12">
            {sections.map((section, i) => (
              <motion.section
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/50 mb-4">
                  {section.heading}
                </h2>
                <div className="prose prose-lg max-w-none text-foreground/80">
                  {renderBody(section.body)}
                </div>
              </motion.section>
            ))}
          </div>
        ) : overview ? (
          <section>
            {overview.headline && (
              <h2 className="text-2xl font-bold mb-4">{overview.headline}</h2>
            )}
            <div className="prose prose-lg max-w-none text-foreground/80">
              {renderBody(overview.body)}
            </div>
          </section>
        ) : null}

        {/* Gallery (remaining images after hero) */}
        {remainingImages.length > 0 && (
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/50 mb-4">The Work</h2>
            <div className="space-y-4">
              {/* First remaining image: full width */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="group relative aspect-video rounded-lg overflow-hidden bg-foreground/5"
              >
                <img
                  src={remainingImages[0]}
                  alt={`${title} screenshot 2`}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </motion.div>

              {/* Rest in 2-col grid */}
              {remainingImages.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {remainingImages.slice(1).map((src, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{ duration: 0.5, delay: (i + 1) * 0.1, ease: 'easeOut' }}
                      className="group relative aspect-video rounded-lg overflow-hidden bg-foreground/5"
                    >
                      <img
                        src={src}
                        alt={`${title} screenshot ${i + 3}`}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Prev / Next Navigation */}
        <nav className="flex justify-between items-center border-t border-foreground/10 pt-8 mt-16">
          {prev ? (
            <Link href={`/work/${prev.slug}`} className="group flex flex-col items-start">
              <span className="text-xs font-mono uppercase tracking-widest text-foreground/40 mb-1 inline-flex items-center gap-1">
                <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">←</span> Previous
              </span>
              <span className="text-lg font-bold group-hover:text-foreground/80 transition-colors">{prev.title}</span>
            </Link>
          ) : <div />}
          {next ? (
            <Link href={`/work/${next.slug}`} className="group flex flex-col items-end">
              <span className="text-xs font-mono uppercase tracking-widest text-foreground/40 mb-1 inline-flex items-center gap-1">
                Next <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
              <span className="text-lg font-bold group-hover:text-foreground/80 transition-colors">{next.title}</span>
            </Link>
          ) : <div />}
        </nav>

        {/* Contact CTA Footer */}
        <footer className="text-center py-16 mt-8">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-px bg-foreground/5 mb-12 origin-center"
          />
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
