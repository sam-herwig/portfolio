import { Fragment } from 'react';
import type { TextBlock } from '@/data/projects';
import InlineData from './InlineData';

const TOKEN_RE = /\{\{([^}]+)\}\}/g;

// Splits a paragraph on `{{token}}` markers and renders each token through
// InlineData. Extracted as a real component (not an inline render helper) so
// React reconciles its children consistently across paragraph re-renders.
// Uses matchAll so the shared module-level regex doesn't get its lastIndex
// mutated during render (react-hooks/immutability).
function TokenizedParagraph({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      out.push(<Fragment key={key++}>{text.slice(lastIndex, start)}</Fragment>);
    }
    out.push(<InlineData key={key++}>{match[1]}</InlineData>);
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    out.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return <>{out}</>;
}

export default function TextBlockRender({
  heading,
  body,
  variant = 'body',
}: Omit<TextBlock, 'type'> & { variant?: 'body' | 'brief' }) {
  const paragraphs = body.split('\n\n');
  if (variant === 'brief') {
    return (
      <section className="px-8 py-8 md:px-12">
        <div className="mx-auto flex max-w-[44ch] flex-col gap-6">
          <h3
            className="text-[14px] tracking-[0.18em] text-foreground/50"
            style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
          >
            {heading}
          </h3>
          <div>
            {paragraphs.map((p) => (
              <p
                key={p}
                className="mb-6 text-lg leading-relaxed text-foreground/80 last:mb-0 md:text-xl md:leading-[1.55]"
              >
                <TokenizedParagraph text={p} />
              </p>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="px-8 py-16 md:px-16 md:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-4">
          <h3
            className="text-[14px] tracking-[0.18em] text-foreground/50"
            style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
          >
            {heading}
          </h3>
        </div>
        <div className="md:col-span-8">
          {paragraphs.map((p) => (
            <p
              key={p}
              className="mb-6 max-w-[58ch] text-lg leading-relaxed text-foreground/80 last:mb-0 md:text-xl md:leading-[1.55]"
            >
              <TokenizedParagraph text={p} />
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
