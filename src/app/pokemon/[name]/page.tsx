import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PokemonFormClient from '@/components/pokemon/PokemonFormClient';
import PokemonNavigation from '@/components/pokemon/PokemonNavigation';
import PokemonKeyboardNavigation from '@/components/pokemon/PokemonKeyboardNavigation';
import { MoveDescription, FormData, PokemonDataV3 } from '@/types/types';
import { urlKeyToStandardKey, getPokemonFileName } from '@/utils/pokemonUrlNormalizer';
import { loadDexOrders, getDexOrderToUse, getPokemonNavigation } from '@/utils/pokemonNavigation';
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

  // Convert the URL key to a standardized key for file lookup
  const standardKey = urlKeyToStandardKey(pokemonName);

  // Build the path to the individual Pokémon file using the URL-safe filename
  const pokemonFile = path.join(process.cwd(), `output/pokemon/${getPokemonFileName(standardKey)}`);
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
    ...(pokemonData.detailedStats || {}),
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
    // Provide safe defaults for missing detailedStats fields
    height: pokemonData.detailedStats?.height ?? 0,
    weight: pokemonData.detailedStats?.weight ?? 0,
    bodyColor: pokemonData.detailedStats?.bodyColor ?? 'Unknown',
    bodyShape: pokemonData.detailedStats?.bodyShape ?? 'Unknown',
    genderRatio: pokemonData.detailedStats?.genderRatio ?? { male: 50, female: 50 },
    catchRate: pokemonData.detailedStats?.catchRate ?? 255,
    baseExp: pokemonData.detailedStats?.baseExp ?? 0,
    hatchRate: pokemonData.detailedStats?.hatchRate ?? 'Unknown',
    growthRate: pokemonData.detailedStats?.growthRate ?? 'Medium Fast',
    eggGroups: pokemonData.detailedStats?.eggGroups ?? [],
    evYield: pokemonData.detailedStats?.evYield ?? 'None',
    abilities: pokemonData.detailedStats?.abilities ?? [],
    faithfulAbilities: pokemonData.detailedStats?.faithfulAbilities ?? [],
    updatedAbilities: pokemonData.detailedStats?.updatedAbilities ?? [],
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
      allFormData[formKey] = {
        ...formValue,
        ...(formValue.detailedStats || {}),
        moves: formValue.moves || [],
        levelMoves: formValue.moves || [],
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
        // Provide safe defaults for missing detailedStats fields
        height: formValue.detailedStats?.height ?? pokemonData.detailedStats?.height ?? 0,
        weight: formValue.detailedStats?.weight ?? pokemonData.detailedStats?.weight ?? 0,
        bodyColor:
          formValue.detailedStats?.bodyColor ?? pokemonData.detailedStats?.bodyColor ?? 'Unknown',
        bodyShape:
          formValue.detailedStats?.bodyShape ?? pokemonData.detailedStats?.bodyShape ?? 'Unknown',
        genderRatio: formValue.detailedStats?.genderRatio ??
          pokemonData.detailedStats?.genderRatio ?? { male: 50, female: 50 },
        catchRate:
          formValue.detailedStats?.catchRate ?? pokemonData.detailedStats?.catchRate ?? 255,
        baseExp: formValue.detailedStats?.baseExp ?? pokemonData.detailedStats?.baseExp ?? 0,
        hatchRate:
          formValue.detailedStats?.hatchRate ?? pokemonData.detailedStats?.hatchRate ?? 'Unknown',
        growthRate:
          formValue.detailedStats?.growthRate ??
          pokemonData.detailedStats?.growthRate ??
          'Medium Fast',
        eggGroups: formValue.detailedStats?.eggGroups ?? pokemonData.detailedStats?.eggGroups ?? [],
        evYield: formValue.detailedStats?.evYield ?? pokemonData.detailedStats?.evYield ?? 'None',
        abilities: formValue.detailedStats?.abilities ?? pokemonData.detailedStats?.abilities ?? [],
        faithfulAbilities:
          formValue.detailedStats?.faithfulAbilities ??
          pokemonData.detailedStats?.faithfulAbilities ??
          [],
        updatedAbilities:
          formValue.detailedStats?.updatedAbilities ??
          pokemonData.detailedStats?.updatedAbilities ??
          [],
        // description:
        //   (formValue as FormData).description || (pokemonData as FormData).description || '',
      };
    });
  }

  console.log(`Loaded Pokémon data for ${pokemonName}`, allFormData);

  // Load dex orders for navigation
  const dexOrders = await loadDexOrders();
  const { order: dexOrder, type: dexType } = getDexOrderToUse(
    pokemonData,
    dexOrders.national,
    dexOrders.johto
  );
  const navigation = getPokemonNavigation(pokemonName, dexOrder);

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
            <BreadcrumbPage className='capitalize'>{pokemonName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-bold mb-4 sr-only">{pokemonName}</h1>
      <PokemonKeyboardNavigation navigation={navigation} />
      <PokemonFormClient
        forms={forms}
        allFormData={allFormData}
        moveDescData={moveDescData}
        pokemonName={pokemonName}
      />
      <PokemonNavigation navigation={navigation} dexType={dexType} />
    </div>
  );
}
