import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { ItemsDatabase, AnyItemData } from '@/types/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import ItemDataTableSearch from '@/components/items/ItemDataTableSearch';
import { Hero } from '@/components/ui/Hero';

export default async function ItemsList() {
  // Read the JSON file at build time
  const filePath = path.join(process.cwd(), 'output/items_data.json');
  const data: ItemsDatabase = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Convert to array for the data table
  const allItems: AnyItemData[] = Object.values(data);

  return (
    <>
      <Hero
        className="text-white"
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
      <div className="max-w-xl md:max-w-4xl mx-auto px-4">
        <ItemDataTableSearch items={allItems} />
      </div>
    </>
  );
}
