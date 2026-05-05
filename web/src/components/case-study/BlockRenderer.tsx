import type { ContentBlock } from '@/data/projects';
import ChapterMark from './ChapterMark';
import ChapterScreen from './ChapterScreen';
import ChapterScreenPinned from './ChapterScreenPinned';
import TextBlockRender from './TextBlockRender';
import MediaBlockRender from './MediaBlockRender';
import VideoBlockRender from './VideoBlockRender';
import SpotlightSlot from './SpotlightSlot';
import Reveal from './Reveal';

export default function BlockRenderer({ block, slug }: { block: ContentBlock; slug: string }) {
  switch (block.type) {
    case 'chapter':
      return (
        <Reveal y={48} amount={0.3}>
          <ChapterMark number={block.number} title={block.title} eyebrow={block.eyebrow} />
        </Reveal>
      );
    case 'text-block':
      return (
        <Reveal>
          <TextBlockRender heading={block.heading} body={block.body} />
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
    case 'chapter-screen':
      if (block.scrollMode === 'pinned-scrub') {
        return (
          <ChapterScreenPinned
            number={block.number}
            title={block.title}
            eyebrow={block.eyebrow}
            shaderId={block.shaderId}
          />
        );
      }
      return (
        <ChapterScreen number={block.number} title={block.title} eyebrow={block.eyebrow} shaderId={block.shaderId} />
      );
    default: {
      const _exhaustive: never = block;
      void _exhaustive;
      return null;
    }
  }
}
