import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const instrument = Instrument_Serif({
  variable: '--font-instrument',
  weight: '400',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sam Herwig | Creative Engineer',
  description: 'I write code that you walk through. Three.js, shaders, and the browser as a canvas.',
  metadataBase: new URL('https://samherwig.dev'),
  openGraph: {
    title: 'Sam Herwig | Creative Engineer',
    description: 'I write code that you walk through. Three.js, shaders, and the browser as a canvas.',
    url: 'https://samherwig.dev',
    siteName: 'Sam Herwig',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'Sam Herwig — Creative Engineer portfolio',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sam Herwig | Creative Engineer',
    description: 'I write code that you walk through. Three.js, shaders, and the browser as a canvas.',
    images: ['/og.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#f5f5f4',
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${instrument.variable} antialiased transition-colors duration-1000 bg-background text-foreground font-inter`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:border focus:border-foreground/20"
        >
          Skip to content
        </a>
        {children}
        {modal}
      </body>
    </html>
  );
}
