import { notFound } from 'next/navigation';
import { AnyItemData, isRegularItem, isTMHMItem } from '@/types/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { Hero } from '@/components/ui/Hero';
import { normalizeLocationKey } from '@/utils/locationUtils';
import { loadItemById, loadItemsData } from '@/utils/item-data-loader';

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
    <div className="max-w-xl md:max-w-4xl mx-auto">
      <div className="space-y-6">
        <Hero
          className="text-white"
          headline={item.name}
          description={item.description}
          breadcrumbs={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/" className="hover:underline text-white hover:text-slate-200">
                      Home
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/items" className="hover:underline text-white hover:text-slate-200">
                      Items
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white">{item.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        <div className="flex items-start gap-4 mb-4">
          <div className="flex flex-col items-end gap-2">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
              {isRegularItem(item) ? item.attributes?.category || 'Item' : 'TM/HM'}
            </span>
            {isRegularItem(item) && item.attributes?.price !== undefined && (
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₽{item.attributes.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {isRegularItem(item) ? (
        <RegularItemDetails item={item} />
      ) : isTMHMItem(item) ? (
        <TMHMItemDetails item={item} />
      ) : null}
    </div>
  );
}

// Component for regular items
function RegularItemDetails({ item }: { item: import('@/types/types').ItemData }) {
  // Group locations by area type for better organization
  const groupedLocations = (item.locations || []).reduce(
    (acc: Record<string, string[]>, location) => {
      const key = location.details;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(location.area);
      return acc;
    },
    {},
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Item Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Item Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-medium">Effect:</span>
            <span className="text-gray-600 dark:text-gray-400">
              {item.attributes?.effect || 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Parameter:</span>
            <span className="text-gray-600 dark:text-gray-400">
              {item.attributes?.parameter || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Price:</span>
            <span className="text-green-600 dark:text-green-400 font-semibold">
              ₽{(item.attributes?.price || 0).toLocaleString()}
            </span>
          </div>
          <div className="border-t pt-3">
            <div className="mb-2">
              <span className="font-medium">Outside Battle:</span>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {item.attributes?.useOutsideBattle || 'Unknown'}
              </p>
            </div>
            <div>
              <span className="font-medium">In Battle:</span>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {item.attributes?.useInBattle || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Locations ({item.locations?.length || 0})</h2>
        <div className="space-y-4">
          {Object.entries(groupedLocations).map(([method, areas]) => (
            <div
              key={method}
              className="border-b border-gray-200 dark:border-gray-600 pb-3 last:border-b-0"
            >
              <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-2 capitalize">
                {method}
              </h3>
              <ul className="space-y-1">
                {areas.map((area, index) => {
                  const shouldLink =
                    method.toLowerCase() === 'hidden item' ||
                    method.toLowerCase() === 'visible item';
                  return (
                    <li key={index} className="text-gray-600 dark:text-gray-400 text-sm pl-2">
                      •{' '}
                      {shouldLink ? (
                        <Link
                          href={`/locations/${normalizeLocationKey(area)}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                        >
                          {area}
                        </Link>
                      ) : (
                        <span>{area}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component for TM/HM items
function TMHMItemDetails({ item }: { item: import('@/types/types').TMHMData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Move Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Move Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-medium">Move:</span>
            <span className="text-gray-600 dark:text-gray-400">{item.moveName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Type:</span>
            <span
              className={`px-2 py-1 rounded text-sm font-medium bg-${item.type.toLowerCase()}-100 text-${item.type.toLowerCase()}-800`}
            >
              {item.type}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Category:</span>
            <span className="text-gray-600 dark:text-gray-400">{item.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Power:</span>
            <span className="text-gray-600 dark:text-gray-400">{item.power}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Accuracy:</span>
            <span className="text-gray-600 dark:text-gray-400">{item.accuracy}%</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">PP:</span>
            <span className="text-gray-600 dark:text-gray-400">{item.pp}</span>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Location</h2>
        <div className="space-y-2">
          <div>
            <Link
              href={`/locations/${normalizeLocationKey(item.location.area)}`}
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              {item.location.area}
            </Link>
            {item.location.details && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {item.location.details}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static params for all items
export async function generateStaticParams() {
  const itemsData = await loadItemsData();

  return Object.keys(itemsData).map((itemId) => ({
    name: itemId,
  }));
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
  const url = `https://polisheddex.vercel.app/items/${name}`;

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
