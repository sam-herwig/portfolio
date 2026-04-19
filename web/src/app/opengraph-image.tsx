import { ImageResponse } from 'next/og';

export const alt = 'Sam Herwig — Creative Engineer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '80px 88px',
        background: '#f9fafb',
        color: '#18181b',
        // Faint paper/ink cross-hatch made with layered gradients
        backgroundImage:
          'radial-gradient(circle at 20% 110%, rgba(24,24,27,0.05), transparent 55%),' +
          'radial-gradient(circle at 100% 0%, rgba(24,24,27,0.06), transparent 55%),' +
          'repeating-linear-gradient(135deg, transparent 0 14px, rgba(24,24,27,0.025) 14px 15px)',
      }}
    >
      {/* Top row — mono caption + rule */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
          <span
            style={{
              display: 'block',
              width: 48,
              height: 1,
              background: '#18181b55',
            }}
          />
          <span>samherwig.dev — Portfolio 2026</span>
        </div>
      </div>

      {/* Center — wordmark + tagline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div
          style={{
            fontFamily: 'serif',
            fontStyle: 'italic',
            fontSize: 180,
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            color: '#18181b',
            fontWeight: 400,
          }}
        >
          Sam Herwig
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            fontFamily: 'sans-serif',
            fontSize: 22,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#18181baa',
          }}
        >
          <span>Creative Engineer</span>
          <span
            style={{
              display: 'block',
              width: 6,
              height: 6,
              background: '#18181b55',
              borderRadius: '50%',
            }}
          />
          <span>Denver, CO</span>
        </div>
      </div>

      {/* Bottom — attribution line */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontFamily: 'sans-serif',
          fontSize: 18,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#18181b88',
        }}
      >
        <span>Three.js · Shaders · Web as canvas</span>
        <span>Fig. 01 — Field Journal</span>
      </div>
    </div>,
    { ...size },
  );
}
