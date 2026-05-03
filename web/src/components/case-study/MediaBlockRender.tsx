import Image from 'next/image';
import type { MediaBlock } from '@/data/projects';

const ASPECT_CLASS: Record<NonNullable<MediaBlock['aspect']>, string> = {
  '16/9': 'aspect-[16/9]',
  '21/9': 'aspect-[21/9]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
};

export default function MediaBlockRender({ src, alt, aspect = '16/9', fullBleed, caption }: Omit<MediaBlock, 'type'>) {
  const wrap = fullBleed ? 'w-full' : 'mx-auto max-w-[1400px] px-8 md:px-16';

  return (
    <figure className={`${wrap} py-12 md:py-16`}>
      <div className={`relative overflow-hidden rounded-sm bg-foreground/5 ${ASPECT_CLASS[aspect]}`}>
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 1400px" className="object-cover" />
      </div>
      {caption && (
        <figcaption className="mt-4 max-w-[60ch] px-1 text-sm text-foreground/55 md:text-base">{caption}</figcaption>
      )}
    </figure>
  );
}
