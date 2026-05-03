import type { TextBlock } from '@/data/projects';

export default function TextBlockRender({ heading, body }: Omit<TextBlock, 'type'>) {
  const paragraphs = body.split('\n\n');
  return (
    <section className="px-8 py-16 md:px-16 md:py-24">
      <div className="grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-4">
          <h3
            className="text-[11px] uppercase tracking-[0.35em] text-foreground/50"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
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
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
