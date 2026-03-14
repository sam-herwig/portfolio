'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, MotionValue } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface CaseStudyCardProps {
  title: string;
  subtitle: string;
  slug: string;
  thumbnail?: string;
  tags?: string[];
  side: 'left' | 'right';
  linkable?: boolean;
  scrollProgress?: MotionValue<number>;
  range?: readonly [number, number, number, number];
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function CaseStudyCard({ title, subtitle, slug, thumbnail, tags, side, linkable = true }: CaseStudyCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTouch] = useState(() => typeof window !== 'undefined' && 'ontouchstart' in window);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7, 0.9], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.3, 0.5, 0.7, 0.9], [100, 0, 0, -100]);

  const alignmentClass =
    side === 'left'
      ? 'items-center md:items-start text-center md:text-left'
      : 'items-center md:items-end text-center md:text-right';

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setMousePos({ x, y });
  };

  const placeholderStyle = {
    backgroundImage: `
      radial-gradient(circle at ${hash(slug) % 40 + 30}% ${hash(slug) % 30 + 35}%, rgba(255,255,255,0.05) 0%, transparent 50%),
      radial-gradient(circle at ${(hash(slug) * 7) % 40 + 30}% ${(hash(slug) * 3) % 30 + 35}%, rgba(255,255,255,0.03) 0%, transparent 60%)
    `,
  };

  const cardInner = (
    <motion.div
      ref={cardRef}
      whileHover={isTouch ? undefined : { y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onMouseMove={isTouch ? undefined : handleMouseMove}
      onMouseEnter={isTouch ? undefined : () => setIsHovered(true)}
      onMouseLeave={isTouch ? undefined : () => { setIsHovered(false); setMousePos({ x: 0, y: 0 }); }}
      style={{
        boxShadow: isHovered && !isTouch
          ? `${mousePos.x * -20}px ${mousePos.y * -20}px 40px -10px rgba(0,0,0,0.3)`
          : undefined,
        transition: 'box-shadow 0.3s ease-out',
      }}
      className="relative p-6 md:p-12 bg-background/80 backdrop-blur-md rounded-3xl border border-foreground/10 shadow-2xl group cursor-pointer hover:bg-foreground/5 transition-colors duration-500"
    >
      {/* Gradient border trace on hover */}
      <AnimatePresence>
        {isHovered && !isTouch && (
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none animate-[border-rotate_3s_linear_infinite]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background:
                'conic-gradient(from var(--angle, 0deg), transparent 60%, rgba(255,255,255,0.15) 80%, transparent 100%)',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
              borderRadius: 'inherit',
            }}
          />
        )}
      </AnimatePresence>

      {/* Thumbnail */}
      <div className="aspect-[4/3] w-full bg-foreground/10 rounded-xl mb-6 overflow-hidden relative">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            loading="lazy"
            style={{
              objectPosition: isHovered && !isTouch
                ? `${50 + mousePos.x * 20}% ${50 + mousePos.y * 20}%`
                : '50% 50%',
              transition: 'object-position 0.5s ease-out, transform 0.7s ease-out',
              transform: isHovered && !isTouch ? 'scale(1.08)' : 'scale(1)',
            }}
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-foreground/5" />
            <div className="absolute inset-0" style={placeholderStyle} />
          </>
        )}
      </div>

      <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h3>
      <p className="text-foreground/70 mt-2">{subtitle}</p>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div
          className={`flex flex-wrap gap-2 mt-4 justify-center ${
            side === 'right' ? 'md:justify-end' : 'md:justify-start'
          }`}
        >
          {isTouch ? (
            // Always visible on touch devices
            tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono uppercase tracking-widest text-foreground/40"
              >
                {tag}
              </span>
            ))
          ) : (
            <AnimatePresence>
              {isHovered &&
                tags.slice(0, 4).map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, x: side === 'left' ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                    className="text-[10px] font-mono uppercase tracking-widest text-foreground/40"
                  >
                    {tag}
                  </motion.span>
                ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      className={`w-full min-h-[30vh] md:min-h-[40vh] flex flex-col justify-center px-4 md:px-32 my-[5vh] md:my-[10vh] transform-gpu ${alignmentClass}`}
    >
      {linkable ? (
        <Link href={`/work/${slug}`} className="w-full md:w-[60%] block">
          {cardInner}
        </Link>
      ) : (
        <div className="w-full md:w-[60%] block">{cardInner}</div>
      )}
    </motion.div>
  );
}
