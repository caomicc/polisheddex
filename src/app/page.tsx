import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Hero } from '@/components/ui/Hero';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="mb-10 p-2 lg:p-4">
      <Hero
        className="text-white"
        headline="Polished Dex"
        description="A companion pokedex for Pokémon Polished Crystal, providing detailed information on Pokémon, locations, and items."
      />
      <div className="max-w-4xl mx-auto py-6 min-h-screen flex flex-col gap-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:space-x-12 space-y-4">
            <div className="flex flex-col">
              <div className="flex flex-col space-y-6">
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
                        Explore all areas in the game and discover which Pokémon you can find in
                        each location.
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
            </div>
            <div className="">
              <h2 className="text-xl mb-4 font-bold">Current Roadmap</h2>
              <ol className="relative border-s border-border pl-6 space-y-8">
                <li className="flex items-start gap-4">
                  <div>
                    <h3>Polished vs Faithful checks</h3>
                    <p className="text-foreground/80 text-sm">
                      Still some bugs in my extractor in terms of parsing data for the different
                      variations of the game.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div>
                    <h3>Item Database</h3>
                    <p className="text-foreground/80 text-sm">
                      Basic item data is available, but not formatted.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div>
                    <h3>Better Location Handling</h3>
                    <p className="text-foreground/80 text-sm">
                      Missing move tutors, this also includes making sure event pokemon and
                      evolutions have a value displaying in locations tab on dex.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div>
                    <h3>Move Database</h3>
                    <p className="text-foreground/80 text-sm">
                      Pages that will show what Pokemon can learn a specific move.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div>
                    <h3>Team Picker for Type Match-ups</h3>
                    <p className="text-foreground/80 text-sm">
                      A tool to help you build a team based on type match-ups, weaknesses, and
                      resistances for Pokemon and types specific to Polished Crystal.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
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
