import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { BaseData } from '@/types/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import PokemonSearch from '@/components/pokemon/PokemonSearch';
import { Hero } from '@/components/ui/Hero';

export default async function PokemonList({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  // Read the JSON file at build time
  const filePath = path.join(process.cwd(), 'output/pokemon_base_data.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const { sort = 'johtodex' } = (await searchParams) ?? {};

  // Determine sort type from query param
  const sortType =
    sort === 'nationaldex' ? 'nationaldex' : sort === 'johtodex' ? 'johtodex' : 'alphabetical';

  // Prepare an array of Pokémon with their names and dex numbers
  const pokemonList: BaseData[] = Object.values(data) as BaseData[];

  // Sort based on selected sort type
  const sortedPokemon = [...pokemonList].sort((a, b) => {
    if (sortType === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    if (sortType === 'nationaldex') {
      return (a.nationalDex ?? 0) - (b.nationalDex ?? 0) || a.name.localeCompare(b.name);
    }
    if (sortType === 'johtodex') {
      return (a.johtoDex ?? 999) - (b.johtoDex ?? 999) || a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <>
    <Hero
      headline={'Pokedex'}
      description={
          'Browse all Pokémon available in Pokémon Polished Crystal'
      }
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
            <BreadcrumbPage className="text-white">Pokemon</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    }
    />

    <div className="max-w-xl md:max-w-4xl mx-auto p-4">
      <PokemonSearch pokemon={sortedPokemon} sortType={sortType} />
    </div>
    </>
  );
}
