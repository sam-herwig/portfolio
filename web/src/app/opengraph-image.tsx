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
        background: '#0a0a0a',
        color: '#fafafa',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          fontFamily: 'sans-serif',
          fontSize: 18,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#fafafa99',
        }}
      >
        <span style={{ display: 'block', width: 48, height: 1, background: '#fafafa55' }} />
        <span>samherwig.dev — Portfolio 2026</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div
          style={{
            fontFamily: 'serif',
            fontSize: 200,
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            color: '#fafafa',
            fontWeight: 500,
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
            color: '#fafafaaa',
          }}
        >
          <span>Creative Engineer</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontFamily: 'sans-serif',
          fontSize: 18,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#fafafa88',
        }}
      >
        <span>Three.js · Shaders · WebGL</span>
      </div>
    </div>,
    { ...size },
  );
}
