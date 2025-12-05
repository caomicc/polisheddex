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
import AbilityDetailClient from '@/components/abilities/ability-detail-client';
import { PokemonGridSkeleton } from '@/components/pokemon/pokemon-card-skeleton';
import { promises as fs } from 'fs';
import path from 'path';
import { AbilityData } from '@/types/new';

export default async function AbilityDetail({ params }: { params: Promise<AbilityData> }) {
  const abilityId = (await params).name;

  // Load ability data
  try {
    const abilityPath = path.join(process.cwd(), `new/abilities/${abilityId}.json`);
    const abilityData = JSON.parse(await fs.readFile(abilityPath, 'utf-8'));

    return (
      <>
        <Hero
          headline={abilityData.name}
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
                  <BreadcrumbPage className="">{abilityData.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />

        <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
          <Suspense fallback={<PokemonGridSkeleton count={8} />}>
            <AbilityDetailClient abilityData={abilityData} />
          </Suspense>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error loading ability data:', error);
    return notFound();
  }
}

// Disable dynamic params - only pre-generated routes are valid
export const dynamicParams = false;

// Generate static params for all abilities
export async function generateStaticParams() {
  try {
    const manifestPath = path.join(process.cwd(), 'public/new/abilities_manifest.json');
    const manifestData = await fs.readFile(manifestPath, 'utf-8');
    const allAbilities = JSON.parse(manifestData);

    return allAbilities.map((ability: any) => ({
      name: ability.id,
    }));
  } catch (error) {
    console.error('Error generating static params for abilities:', error);
    return [];
  }
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const abilityId = (await params).name;

  try {
    const abilityPath = path.join(process.cwd(), `new/abilities/${abilityId}.json`);
    const abilityData = JSON.parse(await fs.readFile(abilityPath, 'utf-8'));

    if (!abilityData) {
      return {
        title: 'Ability Not Found',
        description: 'The requested ability could not be found.',
      };
    }

    const title = `${abilityData.name} | PolishedDex`;
    const description = `${abilityData.versions['polished'].description || 'Ability details'} View all Pokémon that have ${abilityData.name} in Pokémon Polished Crystal.`;
    const url = `https://www.polisheddex.app/abilities/${abilityId}`;

    const socialDescription = `${abilityData.versions['polished'].description || 'Ability details'}`;

    return {
      title,
      description,
      keywords: [
        'pokemon polished crystal',
        abilityData.name,
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
            alt: `${abilityData.name} - PolishedDex`,
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
