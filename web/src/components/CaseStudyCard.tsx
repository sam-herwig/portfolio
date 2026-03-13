'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';

interface CaseStudyCardProps {
  title: string;
  subtitle: string;
  slug: string;
  thumbnail?: string;
  tags?: string[];
  side: 'left' | 'right';
}

export default function CaseStudyCard({ title, subtitle, slug, thumbnail, tags, side }: CaseStudyCardProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7, 0.9], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.3, 0.5, 0.7, 0.9], [100, 0, 0, -100]);

  const alignmentClass = side === 'left' 
    ? 'items-center md:items-start text-center md:text-left' 
    : 'items-center md:items-end text-center md:text-right';

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      className={`w-full min-h-[30vh] md:min-h-[40vh] flex flex-col justify-center px-4 md:px-32 my-[5vh] md:my-[10vh] transform-gpu ${alignmentClass}`}
    >
      <Link href={`/work/${slug}`} className="w-full md:w-[60%] block">
        <div className="p-6 md:p-12 bg-background/80 backdrop-blur-md rounded-3xl border border-foreground/10 shadow-2xl group cursor-pointer hover:bg-foreground/5 transition-colors duration-500">
          <div className="aspect-[4/3] w-full bg-foreground/10 rounded-xl mb-6 overflow-hidden relative">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-foreground/5" />
                <span className="absolute inset-0 flex items-center justify-center font-mono text-xs opacity-50 uppercase tracking-widest group-hover:scale-110 transition-transform duration-700">View Project</span>
              </>
            )}
          </div>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h3>
          <p className="text-foreground/70 mt-2">{subtitle}</p>
          {tags && tags.length > 0 && (
            <div className={`flex flex-wrap gap-2 mt-4 justify-center ${side === 'right' ? 'md:justify-end' : 'md:justify-start'}`}>
              {tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
