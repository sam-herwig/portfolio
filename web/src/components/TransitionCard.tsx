'use client';

import Image from 'next/image';

interface TransitionCardProps {
  title: string;
  imageSrc: string;
  imageAlt: string;
}

export default function TransitionCard({ title, imageSrc, imageAlt }: TransitionCardProps) {
  return (
    <div className="relative z-20 bg-white min-h-[50vh] flex items-center justify-center px-6 md:px-16">
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 max-w-4xl w-full">
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900 shrink-0">{title}</h2>
        <div className="relative w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 shrink-0">
          <Image src={imageSrc} alt={imageAlt} fill className="object-contain" />
        </div>
      </div>
    </div>
  );
}
