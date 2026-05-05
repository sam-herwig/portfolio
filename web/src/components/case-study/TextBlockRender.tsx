import { Fragment, type ReactNode } from 'react';
import type { TextBlock } from '@/data/projects';
import InlineData from './InlineData';

const TOKEN_RE = /\{\{([^}]+)\}\}/g;

function renderText(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      out.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    out.push(<InlineData key={key++}>{match[1]}</InlineData>);
    lastIndex = TOKEN_RE.lastIndex;
  }
  if (lastIndex < text.length) {
    out.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return out;
}

export default function TextBlockRender({ heading, body }: Omit<TextBlock, 'type'>) {
  const paragraphs = body.split('\n\n');
  return (
    <section className="px-8 py-16 md:px-16 md:py-24">
      <div className="grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-4">
          <h3
            className="text-[14px] tracking-[0.18em] text-foreground/50"
            style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
          >
            {heading}
          </h3>
        </div>
        <div className="md:col-span-8">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="mb-6 max-w-[58ch] text-lg leading-relaxed text-foreground/80 last:mb-0 md:text-xl md:leading-[1.55]"
            >
              {renderText(p)}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
