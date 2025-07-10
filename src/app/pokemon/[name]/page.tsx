import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PokemonFormClient from '@/components/pokemon/PokemonFormClient';
import { BaseData, Evolution, LevelMovesData, LocationsData, MoveDetail } from '@/types/types';


// Function to safely load JSON data
async function loadJsonData<T>(filePath: string): Promise<T> {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
    return {} as T;
  }
}

// Moved outside the component to use for generateStaticParams
let cachedBaseStatsData: Record<string, BaseData> | null = null;

// This function helps Next.js pre-render pages at build time
export async function generateStaticParams() {
  const baseStatsFile = path.join(process.cwd(), 'pokemon_base_data.json');
  try {
    const data = await fs.promises.readFile(baseStatsFile, 'utf8');
    const parsed = JSON.parse(data);
    cachedBaseStatsData = parsed;
    return Object.keys(parsed).map(name => ({ name }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function PokemonDetail({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const pokemonName = name;

  // Define file paths
  const baseStatsFile = path.join(process.cwd(), 'pokemon_base_data.json');
  const moveDescFile = path.join(process.cwd(), 'pokemon_move_descriptions.json');
  const eggMovesFile = path.join(process.cwd(), 'pokemon_egg_moves.json');
  const levelMovesFile = path.join(process.cwd(), 'pokemon_level_moves.json');
  const locationsFile = path.join(process.cwd(), 'pokemon_locations.json');
  const evolutionDataFile = path.join(process.cwd(), 'pokemon_evolution_data.json');

  // Load data using Promise.all for parallel loading
  const [
    baseStatsData,
    moveDescData,
    eggMovesData,
    levelMovesData,
    locationsData,
    evolutionData
  ] = await Promise.all([
    cachedBaseStatsData || loadJsonData<Record<string, BaseData>>(baseStatsFile),
    loadJsonData<Record<string, MoveDetail>>(moveDescFile),
    loadJsonData<Record<string, string[]>>(eggMovesFile),
    loadJsonData<Record<string, LevelMovesData>>(levelMovesFile),
    loadJsonData<Record<string, LocationsData>>(locationsFile),
    loadJsonData<Record<string, Evolution | null>>(evolutionDataFile)
  ]);

  // Save the loaded base stats data for future use
  if (!cachedBaseStatsData) {
    cachedBaseStatsData = baseStatsData;
  }

  // Get the main data for this Pokémon
  const baseStats = baseStatsData[pokemonName];
  if (!baseStats) return notFound();

  // --- Handle forms ---
  // If forms exist, get the list of form keys (excluding 'default')
  const forms = baseStats.forms ? Object.keys(baseStats.forms) : [];
  // Default form is the base data
  const defaultForm = {
    types: baseStats.types,
    moves: (levelMovesData[pokemonName]?.moves) || [],
    locations: (locationsData[pokemonName]?.locations) || [],
    eggMoves: eggMovesData[pokemonName] || [],
    evolution: evolutionData[pokemonName],
    nationalDex: baseStats.nationalDex,
    frontSpriteUrl: baseStats.frontSpriteUrl // <-- add sprite url for default
  };

  // Prepare all form data for the client component
  const allFormData: Record<string, typeof defaultForm> = {
    default: defaultForm,
    ...Object.fromEntries(
      forms.map(formKey => [
        formKey,
        {
          types: baseStats.forms?.[formKey]?.types || baseStats.types,
          moves: (levelMovesData[pokemonName]?.forms?.[formKey]?.moves) || defaultForm.moves,
          locations: (locationsData[pokemonName]?.forms?.[formKey]?.locations) || defaultForm.locations,
          eggMoves: eggMovesData[pokemonName] || [],
          evolution: evolutionData[pokemonName],
          nationalDex: baseStats.nationalDex,
          frontSpriteUrl: baseStats.forms?.[formKey]?.frontSpriteUrl || baseStats.frontSpriteUrl // <-- add sprite url for form
        }
      ])
    )
  };

  // Render the main page
  return (
    <div className="max-w-xl md:max-w-4xl mx-auto p-4">
      <Breadcrumb className='mb-4'>
        <BreadcrumbList>
        <BreadcrumbItem>
                    <BreadcrumbLink asChild>
  <Link href="/" className="hover:underline text-blue-700">
          Home
          </Link>
                    </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
                    <BreadcrumbLink asChild>
          <Link href="/pokemon" className="hover:underline text-blue-700">
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
      <h1 className="text-2xl font-bold mb-4">{pokemonName}</h1>
      <PokemonFormClient
      forms={forms}
      allFormData={allFormData}
      moveDescData={moveDescData}
      pokemonName={pokemonName}
      />
    </div>
  );
}
