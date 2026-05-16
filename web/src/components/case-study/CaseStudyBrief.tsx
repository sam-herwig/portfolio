import type { ContentBlock } from '@/data/projects';
import BlockRenderer from './BlockRenderer';

export default function CaseStudyBrief({ blocks, slug }: { blocks: ContentBlock[]; slug: string }) {
  if (blocks.length === 0) return null;
  return (
    <section className="flex min-h-[100svh] flex-col justify-center">
      {blocks.map((block, i) => (
        <BlockRenderer key={`${block.type}-${i}`} block={block} slug={slug} variant="brief" />
      ))}
    </section>
  );
}
