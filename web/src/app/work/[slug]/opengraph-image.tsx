import { ImageResponse } from 'next/og';
import { getProjectBySlug, getAllSlugs } from '@/data/projects';

export const alt = 'Case study — Sam Herwig';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  const title = project?.title ?? 'Case Study';
  const subtitle = project?.subtitle ?? '';
  const tags = project?.tags?.slice(0, 3) ?? [];

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 88px',
        background: '#f9fafb',
        color: '#18181b',
        backgroundImage:
          'radial-gradient(circle at 20% 110%, rgba(24,24,27,0.05), transparent 55%),' +
          'radial-gradient(circle at 100% 0%, rgba(24,24,27,0.06), transparent 55%),' +
          'repeating-linear-gradient(135deg, transparent 0 14px, rgba(24,24,27,0.025) 14px 15px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            fontFamily: 'sans-serif',
            fontSize: 18,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#18181b99',
          }}
        >
          <span style={{ display: 'block', width: 48, height: 1, background: '#18181b55' }} />
          <span>Field Journal — Case Study</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            fontFamily: 'serif',
            fontStyle: 'italic',
            fontSize: title.length > 22 ? 104 : 124,
            lineHeight: 0.98,
            letterSpacing: '-0.02em',
            color: '#18181b',
            fontWeight: 400,
            maxWidth: '90%',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 28,
              lineHeight: 1.25,
              color: '#18181bcc',
              maxWidth: '78%',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </div>
        )}
        {tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 14,
              marginTop: 4,
              fontFamily: 'sans-serif',
              fontSize: 16,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#18181b99',
            }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: 'block',
                  border: '1px solid #18181b33',
                  padding: '8px 14px',
                  borderRadius: 999,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontFamily: 'sans-serif',
          fontSize: 18,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#18181b88',
        }}
      >
        <span>Sam Herwig · samherwig.dev</span>
        <span>Three.js · Shaders · Web as canvas</span>
      </div>
    </div>,
    { ...size },
  );
}
