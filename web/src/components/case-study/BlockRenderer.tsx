import type { ContentBlock } from '@/data/projects';
import ChapterMark from './ChapterMark';
import TextBlockRender from './TextBlockRender';
import MediaBlockRender from './MediaBlockRender';
import VideoBlockRender from './VideoBlockRender';
import SpotlightSlot from './SpotlightSlot';
import Reveal from './Reveal';

export default function BlockRenderer({
  block,
  slug,
  variant = 'body',
}: {
  block: ContentBlock;
  slug: string;
  variant?: 'body' | 'brief';
}) {
  switch (block.type) {
    case 'chapter':
      return (
        <Reveal y={48} amount={0.3}>
          <ChapterMark number={block.number} title={block.title} eyebrow={block.eyebrow} variant={variant} />
        </Reveal>
      );
    case 'text-block':
      return (
        <Reveal>
          <TextBlockRender heading={block.heading} body={block.body} variant={variant} />
        </Reveal>
      );
    case 'media-block':
      return (
        <Reveal y={36}>
          <MediaBlockRender
            src={block.src}
            alt={block.alt}
            aspect={block.aspect}
            fullBleed={block.fullBleed}
            caption={block.caption}
            slug={slug}
          />
        </Reveal>
      );
    case 'video-block':
      return (
        <Reveal y={36}>
          <VideoBlockRender
            src={block.src}
            poster={block.poster}
            alt={block.alt}
            aspect={block.aspect}
            caption={block.caption}
          />
        </Reveal>
      );
    case 'spotlight-block':
      return <SpotlightSlot spotlightId={block.spotlightId} caption={block.caption} />;
    default: {
      const _exhaustive: never = block;
      void _exhaustive;
      return null;
    }
  }
}
