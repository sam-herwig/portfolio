'use client';

import type { VideoBlock } from '@/data/projects';

const ASPECT_CLASS: Record<NonNullable<VideoBlock['aspect']>, string> = {
  '16/9': 'aspect-[16/9]',
  '21/9': 'aspect-[21/9]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '9/16': 'aspect-[9/16]',
};

const IS_PORTRAIT: Record<NonNullable<VideoBlock['aspect']>, boolean> = {
  '16/9': false,
  '21/9': false,
  '4/3': false,
  '1/1': false,
  '9/16': true,
};

export default function VideoBlockRender({ src, poster, aspect = '16/9', caption }: Omit<VideoBlock, 'type'>) {
  const wrapperWidth = IS_PORTRAIT[aspect] ? 'max-w-[420px]' : 'max-w-[1400px]';
  return (
    <figure className={`mx-auto ${wrapperWidth} px-8 py-12 md:px-16 md:py-16`}>
      <div className={`relative overflow-hidden rounded-sm bg-foreground/5 ${ASPECT_CLASS[aspect]}`}>
        <video
          src={src}
          poster={poster}
          aria-hidden="true"
          role="presentation"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>
      {caption && (
        <figcaption className="mt-4 max-w-[60ch] px-1 text-sm text-foreground/55 md:text-base">{caption}</figcaption>
      )}
    </figure>
  );
}
