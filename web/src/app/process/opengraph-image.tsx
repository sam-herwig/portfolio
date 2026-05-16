import { ImageResponse } from 'next/og';

export const alt = 'Process — Sam Herwig';
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
        <span>Process · AI Engineering for Frontend</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div
          style={{
            fontFamily: 'serif',
            fontSize: 96,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            color: '#fafafa',
            fontWeight: 500,
            maxWidth: '92%',
          }}
        >
          Multi-agent pipelines that ship production WebGL.
        </div>
        <div
          style={{
            fontFamily: 'serif',
            fontStyle: 'italic',
            fontSize: 28,
            lineHeight: 1.25,
            color: '#fafafacc',
            maxWidth: '78%',
            fontWeight: 400,
          }}
        >
          Five specialists. Four human gates I sit at personally. One brief in. One pull request out.
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
        <span>Sam Herwig · samherwig.dev</span>
        <span>Research · Design · Build · QA · Ship</span>
      </div>
    </div>,
    { ...size },
  );
}
