import type { ContentBlock } from '@/data/projects';
import ChapterMark from './ChapterMark';
import TextBlockRender from './TextBlockRender';
import MediaBlockRender from './MediaBlockRender';
import VideoBlockRender from './VideoBlockRender';
import SpotlightSlot from './SpotlightSlot';

export default function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'chapter':
      return <ChapterMark number={block.number} title={block.title} eyebrow={block.eyebrow} />;
    case 'text-block':
      return <TextBlockRender heading={block.heading} body={block.body} />;
    case 'media-block':
      return (
        <MediaBlockRender
          src={block.src}
          alt={block.alt}
          aspect={block.aspect}
          fullBleed={block.fullBleed}
          caption={block.caption}
        />
      );
    case 'video-block':
      return (
        <VideoBlockRender
          src={block.src}
          poster={block.poster}
          alt={block.alt}
          aspect={block.aspect}
          caption={block.caption}
        />
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
