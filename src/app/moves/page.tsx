import Link from 'next/link';
import { promises as fs } from 'fs';
import path from 'path';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Hero } from '@/components/ui/Hero';
import MovesDataTableSearch from '@/components/moves/moves-data-table-search';
import { MovesManifest } from '@/types/new';

export default async function MovesList() {
  // Load moves directly from manifest
  const manifestPath = path.join(process.cwd(), 'new/moves_manifest.json');
  const manifestData = await fs.readFile(manifestPath, 'utf-8');
  const allMoves: MovesManifest[] = JSON.parse(manifestData);

  return (
    <>
      <Hero
        headline="Moves"
        description="Your pocket guide to Pokemon attacks"
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
                <BreadcrumbPage className="">Moves</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
        <MovesDataTableSearch moves={allMoves} />
      </div>
    </>
  );
}

// Generate metadata for SEO and social sharing
export async function generateMetadata() {
  const title = 'Move Database | PolishedDex';
  const description = 'Browse all moves available in Pokémon Polished Crystal.';
  const url = 'https://www.polisheddex.app/moves';

  return {
    title,
    description,
    keywords: ['pokemon polished crystal', 'tm hm', 'moves', 'polisheddex'],

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
          alt: 'Items Database - PolishedDex',
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
  };
}
