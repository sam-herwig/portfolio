import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import InkWashTransition from '@/components/InkWashTransition';
import AudioToggle from '@/components/AudioToggle';
import CustomCursor from '@/components/CustomCursor';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sam Herwig | Creative Engineer',
  description: 'I write code that you walk through. Three.js, shaders, and the browser as a canvas.',
  metadataBase: new URL('https://samherwig.dev'),
  alternates: {
    canonical: '/',
  },
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
    title: 'Sam Herwig | Creative Engineer',
    description: 'I write code that you walk through. Three.js, shaders, and the browser as a canvas.',
    url: 'https://samherwig.dev',
    siteName: 'Sam Herwig',
    type: 'website',
    locale: 'en_US',
    // Image auto-injected by src/app/opengraph-image.tsx (1200×630)
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sam Herwig | Creative Engineer',
    description: 'I write code that you walk through. Three.js, shaders, and the browser as a canvas.',
    creator: '@samherwig',
    // Image auto-injected by src/app/opengraph-image.tsx (1200×630)
  },
  authors: [{ name: 'Sam Herwig', url: 'https://samherwig.dev' }],
  creator: 'Sam Herwig',
  category: 'portfolio',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#18181b' },
  ],
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Sam Herwig',
  url: 'https://samherwig.dev',
  jobTitle: 'Creative Engineer',
  description: 'Creative engineer building scroll-driven WebGL experiences in Three.js and shaders.',
  image: 'https://samherwig.dev/opengraph-image',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Denver',
    addressRegion: 'CO',
    addressCountry: 'US',
  },
  knowsAbout: ['Three.js', 'WebGL', 'GLSL', 'React', 'Next.js', 'Creative coding', 'Shader development'],
  worksFor: {
    '@type': 'Organization',
    name: 'CraftedKit',
    url: 'https://craftedkit.io',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </head>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} antialiased transition-colors duration-1000 bg-background text-foreground font-inter`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:border focus:border-foreground/20"
        >
          Skip to content
        </a>
        {children}
        <InkWashTransition />
        <AudioToggle />
        <CustomCursor />
      </body>
    </html>
  );
}
