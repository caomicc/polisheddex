import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { isRegularItem, isTMHMItem } from '@/types/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Hero } from '@/components/ui/Hero';
import { Badge } from '@/components/ui/badge';
import { loadItemById, loadItemsData } from '@/utils/loaders/item-data-loader';
import ItemDetailClient from '@/components/items/ItemDetailClient';
import { PokemonGridSkeleton } from '@/components/pokemon/PokemonCardSkeleton';

interface ItemPageProps {
  params: Promise<{ name: string }>;
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { name } = await params;

  // Load the item using the optimized loader
  const item = await loadItemById(name);

  if (!item) {
    notFound();
  }

  return (
    <>
      <Hero
        headline={item.name}
        description={item.description}
        types={
          <div className="flex flex-wrap gap-2" aria-label="Item Type" role="group">
            <Badge variant="any">
              {isRegularItem(item) ? item.attributes?.category || 'Item' : 'TM/HM'}
            </Badge>
            {isRegularItem(item) && item.attributes?.price !== undefined && (
              <Badge variant="grass">₽{item.attributes.price.toLocaleString()}</Badge>
            )}
          </div>
        }
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
                  <Link href="/items" className="hover:underline">
                    Items
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="">{item.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <div className="max-w-xl md:max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 sr-only">{item.name}</h1>

        <Suspense fallback={<PokemonGridSkeleton count={4} />}>
          <ItemDetailClient item={item} itemName={item.name} />
        </Suspense>
      </div>
    </>
  );
}

// Generate static params for all items (temporarily back to full generation)
export async function generateStaticParams() {
  try {
    const itemsData = await loadItemsData();

    return Object.keys(itemsData).map((itemId) => ({
      name: itemId,
    }));
  } catch (error) {
    console.error('Error generating static params for items:', error);
    return [];
  }
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: ItemPageProps) {
  const { name } = await params;
  const item = await loadItemById(name);

  if (!item) {
    return {
      title: 'Item Not Found',
      description: 'The requested item could not be found.',
    };
  }

  const itemType = isRegularItem(item) ? item.attributes?.category || 'Item' : 'TM/HM';
  const priceInfo =
    isRegularItem(item) && item.attributes?.price
      ? `Price: ₽${item.attributes.price.toLocaleString()}.`
      : '';
  const locationInfo = isRegularItem(item)
    ? `Available at ${item.locations?.length || 0} locations`
    : isTMHMItem(item) && item.location
      ? `Available at ${item.location.area}`
      : 'Location unknown';

  const title = `${item.name} - PolishedDex Items`;
  const description = `${item.description} ${priceInfo} ${locationInfo} in Pokémon Polished Crystal.`;
  const url = `https://www.polisheddex.app/items/${name}`;

  // Create rich description for social sharing
  const socialDescription = isTMHMItem(item)
    ? `${item.name}: ${item.description} Teaches ${item.moveName} (${item.type} type, ${item.power} power). Found at ${item.location?.area || 'unknown location'}.`
    : `${item.name}: ${item.description} ${priceInfo} ${locationInfo}`;

  return {
    title,
    description,
    keywords: ['pokemon polished crystal', 'items', item.name, itemType, 'polisheddex'],

    // Open Graph metadata for Facebook, Discord, etc.
    openGraph: {
      title,
      description: socialDescription,
      url,
      siteName: 'PolishedDex',
      type: 'website',
      images: [
        {
          url: '/og-image.png', // Your existing OG image
          width: 1200,
          height: 630,
          alt: `${item.name} - Pokémon Polished Crystal Item`,
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
      creator: '@polisheddex', // Update with your Twitter handle if you have one
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
