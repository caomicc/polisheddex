import Link from 'next/link';
import { AnyItemData } from '@/types/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import ItemDataTableSearch from '@/components/items/item-data-table-search';
import { Hero } from '@/components/ui/Hero';
import { loadItemsData } from '@/utils/loaders/item-data-loader';

export default async function ItemsList() {
  // Load items using the optimized loader
  const itemsData = await loadItemsData();

  // Convert to array for the data table
  const allItems: AnyItemData[] = Object.values(itemsData);

  return (
    <>
      <Hero
        headline="Items"
        description="Browse all items available in Pokémon Polished Crystal"
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
                <BreadcrumbPage className="">Items</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
        <ItemDataTableSearch items={allItems} />
      </div>
    </>
  );
}

// Generate metadata for SEO and social sharing
export async function generateMetadata() {
  const title = 'Items Database | PolishedDex';
  const description =
    'Browse all items available in Pokémon Polished Crystal including regular items, TMs, HMs, berries, and key items. View prices, effects, and locations.';
  const url = 'https://www.polisheddex.app/items';

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      'items',
      'pokemon items',
      'tm hm',
      'berries',
      'key items',
      'polisheddex',
      'item database',
      'item locations',
      'item prices',
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
