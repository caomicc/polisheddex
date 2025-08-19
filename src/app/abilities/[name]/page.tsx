import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Hero } from '@/components/ui/Hero';
import { loadAbilityById, getPokemonThatHaveAbility } from '@/utils/loaders/ability-data-loader';
import AbilityDetailClient from '@/components/abilities/ability-detail-client';
import { PokemonGridSkeleton } from '@/components/pokemon/pokemon-card-skeleton';

export default async function AbilityDetail({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  const abilityName = decodeURIComponent(nameParam);

  // Load ability data
  const abilityData = await loadAbilityById(abilityName.toLowerCase());

  if (!abilityData) {
    return notFound();
  }

  // Load Pokemon that have this ability
  const pokemonWithAbility = await getPokemonThatHaveAbility(abilityName.toLowerCase());

  return (
    <>
      <Hero
        headline={abilityData.name || abilityName}
        description={abilityData.description || 'Ability details and Pokemon that have it'}
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
                <BreadcrumbLink asChild>
                  <Link href="/abilities" className="hover:underline">
                    Abilities
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="">{abilityData.name || abilityName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
        <Suspense fallback={<PokemonGridSkeleton count={8} />}>
          <AbilityDetailClient
            abilityData={abilityData}
            pokemonWithAbility={pokemonWithAbility}
            abilityName={abilityData.name || abilityName}
          />
        </Suspense>
      </div>
    </>
  );
}

// Generate static params for all abilities
export async function generateStaticParams() {
  try {
    const { loadAbilitiesData } = await import('@/utils/loaders/ability-data-loader');
    const abilitiesData = await loadAbilitiesData();

    return Object.keys(abilitiesData).map((abilityKey) => ({
      name: abilityKey.toLowerCase(),
    }));
  } catch (error) {
    console.error('Error generating static params for abilities:', error);
    return [];
  }
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  const abilityName = decodeURIComponent(nameParam);

  try {
    const abilityData = await loadAbilityById(abilityName.toLowerCase());

    if (!abilityData) {
      return {
        title: 'Ability Not Found',
        description: 'The requested ability could not be found.',
      };
    }

    const pokemonCount = await getPokemonThatHaveAbility(abilityName.toLowerCase());
    const pokemonCountText =
      pokemonCount.length > 0 ? ` ${pokemonCount.length} Pokémon have this ability.` : '';

    const title = `${abilityData.name || abilityName} | PolishedDex`;
    const description = `${abilityData.description || 'Ability details'}${pokemonCountText} View all Pokémon that have ${abilityData.name || abilityName} in Pokémon Polished Crystal.`;
    const url = `https://www.polisheddex.app/abilities/${nameParam}`;

    const socialDescription = `${abilityData.description || 'Ability details'}.${pokemonCountText}`;

    return {
      title,
      description,
      keywords: [
        'pokemon polished crystal',
        abilityData.name?.toLowerCase() || abilityName.toLowerCase(),
        'ability',
        'pokemon abilities',
        'polisheddex',
      ].filter(Boolean),

      // Open Graph metadata
      openGraph: {
        title,
        description: socialDescription,
        url,
        siteName: 'PolishedDex',
        type: 'website',
        images: [
          {
            url: '/og-image.png',
            width: 1200,
            height: 630,
            alt: `${abilityData.name || abilityName} - PolishedDex`,
          },
        ],
        locale: 'en_US',
      },

      // Twitter Card metadata
      twitter: {
        card: 'summary_large_image',
        title,
        description: socialDescription,
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
    };
  } catch (error) {
    console.error('Error generating metadata for ability:', error);
    return {
      title: 'Ability | PolishedDex',
      description: 'Ability details and Pokémon that have it in Pokémon Polished Crystal.',
    };
  }
}

// Export viewport separately as required by Next.js 15+
export const viewport = 'width=device-width, initial-scale=1';
