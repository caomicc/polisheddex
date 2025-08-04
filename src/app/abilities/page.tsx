import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Hero } from '@/components/ui/hero';
import AbilitiesDataTableSearch from '@/components/abilities/abilities-data-table-search';
import { loadAbilitiesData } from '@/utils/loaders/ability-data-loader';

export default async function AbilitiesList() {
  // Load abilities using the optimized loader
  const abilitiesData = await loadAbilitiesData();

  // Convert to array for the data table with id included
  const allAbilities = Object.entries(abilitiesData).map(([id, ability]) => ({
    id,
    ...ability,
  }));

  return (
    <>
      <Hero
        headline="Abilities"
        description="Browse all abilities available in Pokémon Polished Crystal"
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="hover:underline">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="">Abilities</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="max-w-xl md:max-w-4xl mx-auto md:px-4">
        <AbilitiesDataTableSearch abilities={allAbilities} />
      </div>
    </>
  );
}

// Generate metadata for SEO and social sharing
export async function generateMetadata() {
  const title = 'Abilities Database | PolishedDex';
  const description = 'Browse all abilities available in Pokémon Polished Crystal.';
  const url = 'https://www.polisheddex.app/abilities';

  return {
    title,
    description,
    keywords: ['pokemon polished crystal', 'abilities', 'pokemon abilities', 'polisheddex'],

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
          alt: 'Abilities Database - PolishedDex',
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
      site: '@polisheddx',
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
  };
}
