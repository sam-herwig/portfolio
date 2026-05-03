'use client';

import type { VideoBlock } from '@/data/projects';

const ASPECT_CLASS: Record<NonNullable<VideoBlock['aspect']>, string> = {
  '16/9': 'aspect-[16/9]',
  '21/9': 'aspect-[21/9]',
};

export default function VideoBlockRender({ src, poster, alt, aspect = '16/9', caption }: Omit<VideoBlock, 'type'>) {
  return (
    <figure className="mx-auto max-w-[1400px] px-8 py-12 md:px-16 md:py-16">
      <div className={`relative overflow-hidden rounded-sm bg-foreground/5 ${ASPECT_CLASS[aspect]}`}>
        <video
          src={src}
          poster={poster}
          aria-label={alt}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
      {caption && (
        <figcaption className="mt-4 max-w-[60ch] px-1 text-sm text-foreground/55 md:text-base">{caption}</figcaption>
      )}
    </figure>
  );
}
