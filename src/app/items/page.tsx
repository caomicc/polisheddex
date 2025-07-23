import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { ItemsDatabase, AnyItemData, isRegularItem, isTMHMItem } from '@/types/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import ItemSearch from '@/components/items/ItemSearch';
import { Hero } from '@/components/ui/Hero';

export default async function ItemsList({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string }>;
}) {
  // Read the JSON file at build time
  const filePath = path.join(process.cwd(), 'output/items_data.json');
  const data: ItemsDatabase = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const { sort = 'alphabetical', category = 'all' } = (await searchParams) ?? {};

  // Convert to array and separate regular items from TM/HMs
  const allItems: AnyItemData[] = Object.values(data);
  const regularItems = allItems.filter(isRegularItem);
  const tmhmItems = allItems.filter(isTMHMItem);

  // For filtering, we'll primarily work with regular items
  // but we can add TM/HMs as a special category
  const filteredItems = category === 'all'
    ? regularItems
    : category === 'tm-hm'
    ? tmhmItems
    : regularItems.filter(item =>
        item.attributes?.category?.toLowerCase().replace(/\s+/g, '-') === category
      );

  // Sort based on selected sort type
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sort === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    if (sort === 'price-low-high' && isRegularItem(a) && isRegularItem(b)) {
      const priceA = a.attributes?.price || 0;
      const priceB = b.attributes?.price || 0;
      return priceA - priceB;
    }
    if (sort === 'price-high-low' && isRegularItem(a) && isRegularItem(b)) {
      const priceA = a.attributes?.price || 0;
      const priceB = b.attributes?.price || 0;
      return priceB - priceA;
    }
    if (sort === 'category') {
      const aCat = isRegularItem(a) ? (a.attributes?.category || 'Unknown') : 'TM/HM';
      const bCat = isRegularItem(b) ? (b.attributes?.category || 'Unknown') : 'TM/HM';
      return aCat.localeCompare(bCat) || a.name.localeCompare(b.name);
    }
    return 0;
  });

  // Get unique categories for filter (include TM/HM as special category)
  const categories = Array.from(new Set(
    regularItems
      .filter(item => item.attributes?.category) // Only include items with categories
      .map(item => item.attributes.category)
  )).sort();

  // Add TM/HM category if we have TM/HM items
  if (tmhmItems.length > 0) {
    categories.push('TM/HM');
  }

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
                <Link href="/" className="hover:underline text-white hover:text-slate-200">
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">Items</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    />
      <div className="max-w-xl md:max-w-4xl mx-auto p-4">

        <ItemSearch
          initialSort={sort}
          initialCategory={category}
          categories={categories}
          totalItems={filteredItems.length}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {sortedItems.map((item) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {isRegularItem(item) ? (item.attributes?.category || 'Item') : 'TM/HM'}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                {item.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                {isRegularItem(item) ? (
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ₽{(item.attributes?.price || 0).toLocaleString()}
                  </span>
                ) : (
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {isTMHMItem(item) ? item.type : 'Move'}
                  </span>
                )}
                <span className="text-gray-500 dark:text-gray-400">
                  {isRegularItem(item)
                    ? `${item.locations?.length || 0} location${(item.locations?.length || 0) !== 1 ? 's' : ''}`
                    : isTMHMItem(item) && item.location
                    ? '1 location'
                    : 'No locations'
                  }
                </span>
              </div>
            </Link>
          ))}
        </div>

        {sortedItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No items found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
