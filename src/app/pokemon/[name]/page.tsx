import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PokemonFormClient from '@/components/pokemon/PokemonFormClient';
import { MoveDescription, FormData } from '@/types/types';
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
  let pokemonName = decodeURIComponent(nameParam);

  // Build the path to the individual Pokémon file
  const pokemonFile = path.join(process.cwd(), `output/pokemon/${pokemonName.toLowerCase()}.json`);
  const pokemonData = await loadJsonData<any>(pokemonFile);
  if (!pokemonData) return notFound();

  // Map the loaded data to the expected structure for the client component
  // (This assumes the individual file contains all the necessary fields)
  // If not, you may need to adjust this mapping.

  // Extract forms if present
  const forms = pokemonData.forms ? Object.keys(pokemonData.forms) : [];
  const allFormData: Record<string, FormData> = {};

  // Default form
  allFormData['default'] = {
    ...pokemonData.detailedStats,
    moves: pokemonData.levelMoves || [],
    tmHmLearnset: pokemonData.tmHmMoves || [],
    locations: pokemonData.locations || [],
    eggMoves: pokemonData.eggMoves || [],
    evolution: pokemonData.evolution || null,
    nationalDex: pokemonData.nationalDex || null,
    frontSpriteUrl: pokemonData.frontSpriteUrl,
    johtoDex: pokemonData.johtoDex || null,
    species: pokemonData.pokedexEntries?.species || '',
    description: pokemonData.pokedexEntries?.description || '',
  };

  // Add any additional forms
  if (pokemonData.forms) {
    Object.entries(pokemonData.forms).forEach(([formKey, formValue]: [string, any]) => {
      console.log(`Processing form: ${formKey} for ${pokemonName}`);
      allFormData[formKey] = {
        ...formValue,
        // moves: formValue.moves || [],
        // tmHmLearnset: formValue.tmHmMoves || [],
        // locations: formValue.locations || [],
        // eggMoves: formValue.eggMoves || [],
        // evolution: formValue.evolution || null,
        // nationalDex: formValue.nationalDex || null,
        // frontSpriteUrl: formValue.frontSpriteUrl,
        // johtoDex: formValue.johtoDex || null,
        // species: formValue.pokedexEntries?.species || '',
        // description: formValue.pokedexEntries?.description || '',
      };
    });
  }

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
