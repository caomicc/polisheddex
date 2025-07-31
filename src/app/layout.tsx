import type { Metadata } from 'next';
import { Geist_Mono, Manrope } from 'next/font/google';
import { Navigation } from '@/components/ui';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Footer } from '@/components/ui/Footer';
import { PokemonTypeProvider, FaithfulPreferenceProvider } from '@/contexts';
import { NuqsProvider } from '@/components/providers/nuqs-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

const rubik = Manrope({
  variable: '--font-rubik',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'PolishedDex - Complete Pokémon Polished Crystal Database',
    template: '%s | PolishedDex',
  },
  description:
    'The ultimate companion for Pokémon Polished Crystal. Browse complete Pokédex with stats, moves, locations, evolution data, items, and detailed guides.',
  keywords: [
    'pokemon polished crystal',
    'pokedex',
    'pokemon database',
    'polisheddex',
    'pokemon stats',
    'pokemon moves',
    'pokemon locations',
    'pokemon evolution',
    'pokemon items',
    'rom hack',
    'crystal version',
    'game guide',
    'pokemon guide',
  ],
  authors: [{ name: 'PolishedDex Team' }],
  creator: 'PolishedDex',
  publisher: 'PolishedDex',
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
    title: 'PolishedDex - Complete Pokémon Polished Crystal Database',
    description:
      'The ultimate companion for Pokémon Polished Crystal. Browse complete Pokédex with stats, moves, locations, evolution data, items, and detailed guides.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PolishedDex - Pokémon Polished Crystal Database',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PolishedDex - Pokémon Polished Crystal Database',
    description:
      'The ultimate companion for Pokémon Polished Crystal. Browse complete Pokédex with stats, moves, locations, and more.',
    images: ['/og-image.png'],
    creator: '@polisheddex',
    site: '@polisheddex',
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${rubik.variable} ${geistMono.variable} font-sans antialiased bg-slate-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsProvider>
            <FaithfulPreferenceProvider>
              <PokemonTypeProvider>
                <div className="flex flex-col min-h-screen">
                  <Navigation />
                  <main className="flex-grow">{children}</main>
                  <Footer />
                </div>
              </PokemonTypeProvider>
            </FaithfulPreferenceProvider>
          </NuqsProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
