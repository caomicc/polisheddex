import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Navigation } from '@/components/ui';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Footer } from '@/components/ui/Footer';
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PolishedDex - Complete Pokémon Polished Crystal Database',
  description:
    'Explore the ultimate Pokédex for Pokémon Polished Crystal. Search Pokémon stats, moves, locations, evolution data, and more.',
  keywords: [
    'pokemon',
    'pokedex',
    'polished crystal',
    'pokemon database',
    'pokemon stats',
    'pokemon moves',
    'pokemon locations',
    'pokemon evolution',
    'game database',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://polisheddex.vercel.app',
    siteName: 'PolishedDex',
    title: 'PolishedDex - Pokémon Polished Crystal Database',
    description:
      'Explore the ultimate Pokédex for Pokémon Polished Crystal. Search Pokémon stats, moves, locations, evolution data, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PolishedDex - Pokémon Polished Crystal Database',
      },
    ],
  },
  category: 'Gaming',
  classification: 'Gaming Database',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://polisheddex.vercel.app'),
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100`}
      >
        <div className="flex flex-col min-h-screen pt-20 md:pt-24">
          <Navigation />
          <main className="flex-grow mb-10">{children}</main>
          <Footer />
        </div>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
