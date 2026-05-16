import type { Metadata, Viewport } from 'next';
import { Fraunces, Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import localFont from 'next/font/local';
import MotionProvider from '@/components/MotionProvider';
import SceneCanvasClient from '@/components/SceneCanvasClient';
import { ALLOW_INDEXING, SITE_URL } from '@/lib/siteUrl';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
  weight: '400',
  style: ['normal', 'italic'],
});

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

// Pixel fonts: bypass geist/font/pixel because its barrel declares all 5
// variants at module scope, so Next preloads woff2s we never use (Circle,
// Line, Triangle). Importing only Square + Grid via next/font/local keeps the
// critical-path font preloads down to what we actually render.
const geistPixelSquare = localFont({
  src: '../fonts/GeistPixel-Square.woff2',
  variable: '--font-geist-pixel-square',
  weight: '500',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Geist Mono', 'ui-monospace', 'monospace'],
});

const geistPixelGrid = localFont({
  src: '../fonts/GeistPixel-Grid.woff2',
  variable: '--font-geist-pixel-grid',
  weight: '500',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Geist Mono', 'ui-monospace', 'monospace'],
});

export const metadata: Metadata = {
  title: 'Sam Herwig — Creative Engineer',
  description: '3D web, motion systems, AI agent pipelines. Currently shipping things at the limit of WebGL and taste.',
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Sam Herwig — Creative Engineer',
    description:
      '3D web, motion systems, AI agent pipelines. Currently shipping things at the limit of WebGL and taste.',
    url: SITE_URL,
    siteName: 'Sam Herwig',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sam Herwig — Creative Engineer',
    description:
      '3D web, motion systems, AI agent pipelines. Currently shipping things at the limit of WebGL and taste.',
    creator: '@samherwig',
  },
  authors: [{ name: 'Sam Herwig', url: SITE_URL }],
  creator: 'Sam Herwig',
  category: 'portfolio',
  ...(ALLOW_INDEXING ? {} : { robots: { index: false, follow: false } }),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Sam Herwig',
  url: SITE_URL,
  jobTitle: 'Creative Engineer',
  description: 'Creative engineer building scroll-driven WebGL experiences in Three.js and shaders.',
  image: `${SITE_URL}/opengraph-image`,
  knowsAbout: [
    'Three.js',
    'React Three Fiber',
    'WebGL',
    'GLSL',
    'React',
    'Next.js',
    'TypeScript',
    'Creative coding',
    'Shader development',
    'Frontend engineering',
    'AI agent systems',
    'Multi-agent orchestration',
  ],
  worksFor: { '@type': 'Organization', name: 'CraftedKit', url: 'https://craftedkit.io' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </head>
      <body
        className={`${fraunces.variable} ${instrumentSerif.variable} ${geistSans.variable} ${geistMono.variable} ${geistPixelSquare.variable} ${geistPixelGrid.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: 'var(--font-geist-sans)' }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-foreground focus:text-background focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <MotionProvider>
          <SceneCanvasClient />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
