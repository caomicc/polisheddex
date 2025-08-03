import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import EmulatorRecommendations from '@/components/ui/emulator-recomendations';
import { Hero } from '@/components/ui/Hero';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="mb-10 p-2 lg:p-4">
      <Hero headline="Polished Dex" description="A companion pokedex for Pokémon Polished Crystal.">
        <div>
          <Button variant="default" size="sm" asChild>
            <Link
              href="https://github.com/Rangi42/polishedcrystal/releases/tag/v3.1.1"
              target="_blank"
              className="flex items-center gap-2"
            >
              Download ROM on GitHub
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Hero>
      <div className="max-w-4xl mx-auto min-h-screen flex flex-col gap-6">
        <EmulatorRecommendations />

        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          <Link href="/pokemon" className="group">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h3>Pokémon Database</h3>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Browse all Pokémon, their types, evolutions, moves, and where to find them.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant={'default'} size={'sm'}>
                  View Pokémon
                </Button>
              </CardFooter>
            </Card>
          </Link>

          <Link href="/locations" className="group">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h3>Location Guide</h3>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Explore all areas in the game and discover which Pokémon you can find in each
                  location.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant={'default'} size={'sm'}>
                  View Locations
                </Button>
              </CardFooter>
            </Card>
          </Link>
          <Link href="/items" className="group">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h3>Item Guide</h3>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Explore all items in the game and discover their effects and locations.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant={'default'} size={'sm'}>
                  View Items
                </Button>
              </CardFooter>
            </Card>
          </Link>
        </div>
        <div className="max-w-xl mx-auto mt-8"></div>
      </div>
    </div>
  );
}

// Generate metadata for SEO and social sharing
export async function generateMetadata() {
  const title = 'PolishedDex - Pokémon Polished Crystal Companion';
  const description =
    'A comprehensive companion pokedex for Pokémon Polished Crystal, providing detailed information on Pokémon, locations, items, moves, and more.';
  const url = 'https://www.polisheddex.app';

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      'pokedex',
      'pokemon database',
      'polisheddex',
      'pokemon guide',
      'pokemon locations',
      'pokemon items',
      'pokemon moves',
      'rom hack',
      'crystal version',
    ],

    // Open Graph metadata for Facebook, Discord, etc.
    openGraph: {
      title,
      description,
      url,
      siteName: 'PolishedDex',
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'PolishedDex - Pokémon Polished Crystal Companion',
        },
      ],
      locale: 'en_US',
    },

    // Twitter Card metadata
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
      creator: '@polisheddex',
      site: '@polisheddex',
    },

    // Additional metadata
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

    // Canonical URL
    alternates: {
      canonical: url,
    },

    // Viewport and other metadata
    viewport: {
      width: 'device-width',
      initialScale: 1,
    },
  };
}
