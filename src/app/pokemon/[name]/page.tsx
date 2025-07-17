import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PokemonFormClient from '@/components/pokemon/PokemonFormClient';
import { MoveDescription, FormData, PokemonDataV3 } from '@/types/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Function to safely load JSON data
async function loadJsonData<T>(filePath: string): Promise<T | null> {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
    return null;
  }
}

export default async function PokemonDetail({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  const pokemonName = decodeURIComponent(nameParam);

  // Build the path to the individual Pokémon file
  const pokemonFile = path.join(process.cwd(), `output/pokemon/${pokemonName.toLowerCase()}.json`);
  const pokemonData = await loadJsonData<PokemonDataV3>(pokemonFile);
  if (!pokemonData) return notFound();

  // Map the loaded data to the expected structure for the client component
  // (This assumes the individual file contains all the necessary fields)
  // If not, you may need to adjust this mapping.

  // Extract forms if present
  const forms = pokemonData.forms ? Object.keys(pokemonData.forms) : [];
  const allFormData: Record<string, FormData> = {};

  // Default form
  allFormData['default'] = {
    ...pokemonData,
    ...pokemonData.detailedStats,
    moves: pokemonData.moves || pokemonData.levelMoves || [],
    tmHmLearnset: (pokemonData as FormData).tmHmLearnset || [],
    locations: pokemonData.locations || [],
    eggMoves: (pokemonData as FormData).eggMoves || [],
    evolution: (pokemonData as FormData).evolution || null,
    nationalDex: pokemonData.nationalDex || null,
    frontSpriteUrl: pokemonData.frontSpriteUrl,
    johtoDex: pokemonData.johtoDex || null,
    baseStats: pokemonData.detailedStats?.baseStats || {},
    species:
      pokemonData.pokedexEntries?.default?.species || (pokemonData as FormData).species || '',
    description:
      pokemonData.pokedexEntries?.default?.description ||
      (pokemonData as FormData).description ||
      '',
    // height: pokemonData.detailedStats?.height || 0,
    // weight: pokemonData.detailedStats?.weight || 0,
    // bodyColor: pokemonData.detailedStats?.bodyColor || '',
    // bodyShape: pokemonData.detailedStats?.bodyShape || '',
    // genderRatio: pokemonData.detailedStats?.genderRatio || {},
  };

  console.log(
    `Loaded default Pokémon data for ${pokemonName}`,
    allFormData['default'],
    pokemonData,
    (pokemonData as FormData).description,
  );

  // Add any additional forms
  if (pokemonData.forms) {
    Object.entries(pokemonData.forms).forEach(([formKey, formValue]) => {
      // console.log(`Processing form: ${formKey}`, formValue),
      allFormData[formKey] = {
        ...formValue,
        ...formValue.detailedStats,
        moves: formValue.moves || [],
        tmHmLearnset:
          (formValue as FormData).tmHmLearnset || (pokemonData as FormData).tmHmLearnset || [],
        locations: formValue.locations || pokemonData.locations || [],
        eggMoves: (formValue as FormData).eggMoves || (pokemonData as FormData).eggMoves || [],
        evolution: (formValue as FormData).evolution || (pokemonData as FormData).evolution || null,
        nationalDex: formValue.nationalDex || pokemonData.nationalDex || null,
        frontSpriteUrl: formValue.frontSpriteUrl,
        johtoDex: formValue.johtoDex || pokemonData.johtoDex || null,
        species:
          pokemonData.pokedexEntries?.[formKey]?.species || (pokemonData as FormData).species || '',
        description:
          pokemonData.pokedexEntries?.[formKey]?.description ||
          (pokemonData as FormData).description ||
          '',
        baseStats: formValue.detailedStats?.baseStats || pokemonData.detailedStats?.baseStats || {},
        // description:
        //   (formValue as FormData).description || (pokemonData as FormData).description || '',
      };
    });
  }

  console.log(`Loaded Pokémon data for ${pokemonName}`, allFormData);

  // You may want to load moveDescData as before, or optimize further if you have per-move files
  // For now, keep the original moveDescData loading for compatibility
  const moveDescFile = path.join(process.cwd(), 'output/pokemon_move_descriptions.json');
  const moveDescData = (await loadJsonData<Record<string, MoveDescription>>(moveDescFile)) || {};

  return (
    <div className="max-w-xl md:max-w-4xl mx-auto p-4">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="hover:underline dark:text-blue-200 text-blue-700">
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/pokemon" className="hover:underline dark:text-blue-200 text-blue-700">
                Pokemon
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pokemonName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-bold mb-4 sr-only">{pokemonName}</h1>
      <PokemonFormClient
        forms={forms}
        allFormData={allFormData}
        moveDescData={moveDescData}
        pokemonName={pokemonName}
      />
    </div>
  );
}
