import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import InkWashTransition from '@/components/InkWashTransition';

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
    // Image auto-injected by src/app/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sam Herwig | Creative Engineer',
    description: 'I write code that you walk through. Three.js, shaders, and the browser as a canvas.',
    // Image auto-injected by src/app/opengraph-image.tsx
  },
};

export const viewport: Viewport = {
  themeColor: '#f5f5f4',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
      </body>
    </html>
  );
}
