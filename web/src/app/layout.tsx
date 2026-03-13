import type { Metadata } from 'next';
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
  title: 'Sam Herwig | Mountain Man & Creative Technologist',
  description: 'Portfolio of Sam Herwig, showcasing frontend engineering, webgl, and AR experiences.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${instrument.variable} antialiased transition-colors duration-1000 bg-background text-foreground font-inter`}>
        {children}
      </body>
    </html>
  );
}
