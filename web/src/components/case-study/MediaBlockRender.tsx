import type { MediaBlock } from '@/data/projects';
import DitheredImage from './DitheredImage';

const ASPECT_CLASS: Record<NonNullable<MediaBlock['aspect']>, string> = {
  '16/9': 'aspect-[16/9]',
  '21/9': 'aspect-[21/9]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
};

interface Props extends Omit<MediaBlock, 'type'> {
  slug: string;
}

export default function MediaBlockRender({ src, alt, aspect = '16/9', fullBleed, caption, slug }: Props) {
  const wrap = fullBleed ? 'w-full' : 'mx-auto max-w-[1400px] px-8 md:px-16';

  return (
    <figure className={`${wrap} py-12 md:py-16`}>
      <div className={`relative overflow-hidden rounded-sm bg-foreground/5 ${ASPECT_CLASS[aspect]}`}>
        <DitheredImage src={src} alt={alt} slug={slug} />
      </div>
      {caption && (
        <figcaption className="mt-4 max-w-[60ch] px-1 text-sm text-foreground/55 md:text-base">{caption}</figcaption>
      )}
    </figure>
  );
}
