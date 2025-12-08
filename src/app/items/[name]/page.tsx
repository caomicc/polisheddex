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
import { loadDetailedItemData, loadItemsData } from '@/utils/loaders/item-data-loader';
import ItemDetailClient from '@/components/items/item-detail-client';
import { PokemonGridSkeleton } from '@/components/pokemon/pokemon-card-skeleton';
import { getMoveData } from '@/utils/move-data-server';
import { ItemSprite } from '@/components/items/item-sprite';
import { getAllLocations } from '@/utils/location-data-server';

interface ItemPageProps {
  params: Promise<{ name: string }>;
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { name } = await params;

  // Load the item using the optimized loader
  const item = await loadDetailedItemData(name);

  if (!item) {
    notFound();
  }

  // Load move data for both versions if this is a TM/HM
  const polishedData = item.versions['polished'];
  const faithfulData = item.versions['faithful'];

  const polishedIsTmHm =
    polishedData?.attributes?.category === 'tm' || polishedData?.attributes?.category === 'hm';
  const faithfulIsTmHm =
    faithfulData?.attributes?.category === 'tm' || faithfulData?.attributes?.category === 'hm';

  let polishedMoveData = null;
  let faithfulMoveData = null;

  if (polishedIsTmHm && polishedData?.attributes?.moveName) {
    const moveId = polishedData.attributes.moveName.toLowerCase().replace(/\s+/g, '-');
    const rawMoveData = await getMoveData(moveId, 'polished');
    if (rawMoveData) {
      polishedMoveData = {
        name: rawMoveData.name || moveId,
        type: rawMoveData.type || 'normal',
        category: rawMoveData.category || 'Status',
        power: rawMoveData.power || 0,
        accuracy: rawMoveData.accuracy || 0,
        pp: rawMoveData.pp || 0,
      };
    }
  }

  if (faithfulIsTmHm && faithfulData?.attributes?.moveName) {
    const moveId = faithfulData.attributes.moveName.toLowerCase().replace(/\s+/g, '-');
    const rawMoveData = await getMoveData(moveId, 'faithful');
    if (rawMoveData) {
      faithfulMoveData = {
        name: rawMoveData.name || moveId,
        type: rawMoveData.type || 'normal',
        category: rawMoveData.category || 'Status',
        power: rawMoveData.power || 0,
        accuracy: rawMoveData.accuracy || 0,
        pp: rawMoveData.pp || 0,
      };
    }
  }

  // Get display name for hero (use polished as default)
  const displayName = polishedData?.name || item.id;
  const itemCategory = polishedData?.attributes?.category;

  // Load locations manifest for display names
  const locationsManifest = await getAllLocations();
  const locationNameMap: Record<string, string> = {};
  for (const loc of locationsManifest) {
    locationNameMap[loc.id] = loc.name;
  }

  return (
    <>
      <Hero
        headline={displayName}
        description={polishedData?.description || ''}
        icon={
          <ItemSprite
            itemName={item.id}
            category={itemCategory}
            size={64}
            className="w-16 h-16"
          />
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
                <BreadcrumbPage className="">{displayName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <div className="max-w-xl md:max-w-4xl mx-auto ">
        <Suspense fallback={<PokemonGridSkeleton count={4} />}>
          <ItemDetailClient
            item={item}
            polishedMoveData={polishedMoveData}
            faithfulMoveData={faithfulMoveData}
            locationNameMap={locationNameMap}
          />
        </Suspense>
      </div>
    </>
  );
}

// Disable dynamic params - only pre-generated routes are valid
export const dynamicParams = false;

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
  const item = await loadDetailedItemData(name);

  if (!item) {
    return {
      title: 'Item Not Found',
      description: 'The requested item could not be found.',
    };
  }

  // const itemType = item.versions['polished']?.attributes?.category || 'Item';
  const priceInfo = `Price: ₽${item.versions['polished']?.attributes?.price?.toLocaleString()}.`;
  const locationInfo = 'Location unknown';

  const title = `${item.versions['polished'].name} - PolishedDex Items`;
  const description = `${item.versions['polished'].description} ${priceInfo} ${locationInfo} in Pokémon Polished Crystal.`;
  const url = `https://www.polisheddex.app/items/${name}`;

  // Create rich description for social sharing
  const socialDescription = `${item.versions['polished'].name}: ${item.versions['polished'].description} ${priceInfo} ${locationInfo}`;

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      'items',
      item.versions['polished'].name,
      item.versions['faithful'].name,
      'polisheddex',
    ],

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
          alt: `${item.versions['polished'].name} - Pokémon Polished Crystal Item`,
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
