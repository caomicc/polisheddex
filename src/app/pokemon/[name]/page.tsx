import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PokemonFormClient from '@/components/pokemon/PokemonFormClient';
import {
  BaseData,
  DetailedStats,
  Evolution,
  LevelMovesData,
  LocationsData,
  MoveDescription,
  PokemonDexEntry,
  FormData,
  Move,
} from '@/types/types';

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

// Helper function to get regional variant keys
function getRegionalVariantKeys(
  pokemonName: string,
  detailedStatData: Record<string, DetailedStats>,
): string[] {
  // Look for entries like "Diglett alolan", "Meowth galarian", etc.
  const variants: string[] = [];
  const formTypes = ['alolan', 'galarian', 'hisuian', 'paldean', 'paldean fire', 'paldean water'];

  for (const formType of formTypes) {
    const variantKey = `${pokemonName} ${formType}`;
    if (detailedStatData[variantKey]) {
      variants.push(variantKey);
    }
  }

  return variants;
}

// Moved outside the component to use for generateStaticParams
let cachedBaseStatsData: Record<string, BaseData> | null = null;

// This function helps Next.js pre-render pages at build time
export async function generateStaticParams() {
  const baseStatsFile = path.join(process.cwd(), 'output/pokemon_base_data.json');
  try {
    const data = await fs.promises.readFile(baseStatsFile, 'utf8');
    const parsed = JSON.parse(data);
    cachedBaseStatsData = parsed;
    return Object.keys(parsed).map((name) => ({ name }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function PokemonDetail({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  // The URL may have encoded characters, so we need to decode it
  let pokemonName = decodeURIComponent(nameParam);

  // console.log(`Loading Pokémon data for: ${pokemonName}`);

  // Define file paths
  const baseStatsFile = path.join(process.cwd(), 'output/pokemon_base_data.json');
  const moveDescFile = path.join(process.cwd(), 'output/pokemon_move_descriptions.json');
  const eggMovesFile = path.join(process.cwd(), 'output/pokemon_egg_moves.json');
  const levelMovesFile = path.join(process.cwd(), 'output/pokemon_level_moves.json');
  const locationsFile = path.join(process.cwd(), 'output/pokemon_locations.json');
  const evolutionDataFile = path.join(process.cwd(), 'output/pokemon_evolution_data.json');
  const dexEntryDataFile = path.join(process.cwd(), 'output/pokemon_pokedex_entries.json');
  const detailedStatDataFile = path.join(process.cwd(), 'output/pokemon_detailed_stats.json');
  const tmHmLearnsetFile = path.join(process.cwd(), 'output/pokemon_tm_hm_learnset.json');

  // Load data using Promise.all for parallel loading
  const [
    baseStatsData,
    moveDescData,
    eggMovesData,
    levelMovesData,
    locationsData,
    evolutionData,
    dexEntryData,
    detailedStatData,
    tmHmLearnsetData,
  ] = await Promise.all([
    cachedBaseStatsData || loadJsonData<Record<string, BaseData>>(baseStatsFile),
    loadJsonData<Record<string, MoveDescription>>(moveDescFile),
    loadJsonData<Record<string, string[]>>(eggMovesFile),
    loadJsonData<Record<string, LevelMovesData>>(levelMovesFile),
    loadJsonData<Record<string, LocationsData>>(locationsFile),
    loadJsonData<Record<string, Evolution | null>>(evolutionDataFile),
    loadJsonData<Record<string, PokemonDexEntry>>(dexEntryDataFile),
    loadJsonData<Record<string, DetailedStats>>(detailedStatDataFile), // Adjusted type to 'any' for detailed stats
    loadJsonData<Record<string, Move[]>>(tmHmLearnsetFile),
  ]);

  // Save the loaded base stats data for future use
  if (!cachedBaseStatsData) {
    cachedBaseStatsData = baseStatsData;
  }

  // Get the main data for this Pokémon
  let baseStats = baseStatsData[pokemonName];

  // console.log(`Looking up base stats for: ${pokemonName}`, baseStats ? 'Found' : 'Not found');

  // Special handling for hyphenated Pokémon names
  const alternativeKeys = [];
  if (!baseStats && pokemonName === 'Porygon-Z') {
    alternativeKeys.push('Porygon Z');
  }

  // Try alternative keys if the main lookup failed
  if (!baseStats && alternativeKeys.length > 0) {
    const alternativeKey = alternativeKeys.find((key) => baseStatsData[key]);
    if (alternativeKey) {
      // console.log(`Found alternative key: ${alternativeKey} for ${pokemonName}`);
      baseStats = baseStatsData[alternativeKey];
      // For consistency in the UI, use a consistent key for data lookups
      // This helps us handle different formats in our JSON files
      // console.log(`Using key ${alternativeKey} for all data lookups`);
      pokemonName = alternativeKey;
    }
  }

  if (!baseStats) return notFound();

  // --- Handle forms ---
  // Check for regional variants in the detailed stats data
  const variantKeys = getRegionalVariantKeys(pokemonName, detailedStatData);

  // Extract form types from variant keys
  const variantFormTypes = variantKeys.map((key) => {
    // Extract the form type from the key (e.g., "Diglett alolan" -> "alolan")
    return key.replace(pokemonName, '').trim();
  });

  // If forms exist in base data, get the list of form keys (excluding 'default')
  const baseDataForms = baseStats.forms ? Object.keys(baseStats.forms) : [];

  // Combine all form types
  const forms = [...baseDataForms, ...variantFormTypes];

  // Default form is the base data
  const defaultForm: FormData = {
    types: baseStats.types,
    moves: levelMovesData[pokemonName]?.moves || [],
    locations: locationsData[pokemonName]?.locations || [],
    eggMoves: eggMovesData[pokemonName] || [],
    tmHmLearnset: tmHmLearnsetData[pokemonName] || [],
    evolution: evolutionData[pokemonName],
    nationalDex: baseStats.nationalDex,
    frontSpriteUrl: baseStats.frontSpriteUrl,
    johtoDex: baseStats.johtoDex,
    species: dexEntryData[pokemonName]?.species || '',
    description: dexEntryData[pokemonName]?.description || '',
    catchRate: detailedStatData[pokemonName]?.catchRate || 0,
    baseExp: detailedStatData[pokemonName]?.baseExp || 0,
    heldItems: detailedStatData[pokemonName]?.heldItems,
    abilities: detailedStatData[pokemonName]?.abilities,
    faithfulAbilities: detailedStatData[pokemonName]?.faithfulAbilities || [],
    updatedAbilities: detailedStatData[pokemonName]?.updatedAbilities || [],
    genderRatio: detailedStatData[pokemonName]?.genderRatio,
    growthRate: detailedStatData[pokemonName]?.growthRate,
    baseStats: detailedStatData[pokemonName]?.baseStats,
    height: detailedStatData[pokemonName]?.height ?? 0,
    weight: detailedStatData[pokemonName]?.weight ?? 0,
    evYield: detailedStatData[pokemonName]?.evYield || '',
    bodyColor: detailedStatData[pokemonName]?.bodyColor || '', // Add color property
    bodyShape: detailedStatData[pokemonName]?.bodyShape || '', // Add body shape property
    hatchRate: detailedStatData[pokemonName]?.hatchRate || '',
    eggGroups: detailedStatData[pokemonName]?.eggGroups || [],
  };

  // Prepare all form data for the client component
  const allFormData: Record<string, typeof defaultForm> = {
    default: defaultForm,
  };

  // Map to track which forms we have processed
  const processedForms = new Set<string>();

  // First, process base data forms
  if (baseStats.forms) {
    // console.log(`Processing forms for ${pokemonName}:`, Object.keys(baseStats.forms));
    Object.keys(baseStats.forms).forEach((formKey) => {
      allFormData[formKey] = { ...defaultForm };

      // Override with form-specific data
      if (baseStats.forms && baseStats.forms[formKey]?.types) {
        allFormData[formKey].types = baseStats.forms[formKey].types;
      }

      if (baseStats.forms && baseStats.forms[formKey]?.frontSpriteUrl) {
        // console.log(
        //   `Using front sprite URL for form ${formKey}:`,
        //   baseStats.forms[formKey].frontSpriteUrl,
        // );
        allFormData[formKey].frontSpriteUrl = baseStats.forms[formKey].frontSpriteUrl;
      }

      // Check for form-specific moves
      const pokemonLevelMoves = levelMovesData[pokemonName];
      if (pokemonLevelMoves?.forms && formKey in pokemonLevelMoves.forms) {
        allFormData[formKey].moves = pokemonLevelMoves.forms[formKey]?.moves || [];
      }

      // Check for form-specific locations
      const pokemonLocations = locationsData[pokemonName];
      if (pokemonLocations?.forms && formKey in pokemonLocations.forms) {
        allFormData[formKey].locations = pokemonLocations.forms[formKey]?.locations || [];
      }

      processedForms.add(formKey);
    });
  }

  // Then, process regional variants
  variantKeys.forEach((variantKey) => {
    const formType = variantKey.replace(pokemonName, '').trim();

    if (detailedStatData[variantKey] && !processedForms.has(formType)) {
      allFormData[formType] = { ...defaultForm };

      // For regional variants, override with variant-specific data
      const variantData = detailedStatData[variantKey];
      if (variantData) {
        if (variantData.baseStats) allFormData[formType].baseStats = variantData.baseStats;
        if (variantData.evYield) allFormData[formType].evYield = variantData.evYield;
        if (variantData.bodyColor) allFormData[formType].bodyColor = variantData.bodyColor;
        if (variantData.abilities) allFormData[formType].abilities = variantData.abilities;
        if (variantData.faithfulAbilities)
          allFormData[formType].faithfulAbilities = variantData.faithfulAbilities;
        if (variantData.updatedAbilities)
          allFormData[formType].updatedAbilities = variantData.updatedAbilities;
        // Ensure genderRatio is copied to the form data
        if (variantData.genderRatio) {
          allFormData[formType].genderRatio = variantData.genderRatio;
        } else {
          // Fallback to default gender ratio if not specified in variant data
          allFormData[formType].genderRatio = { male: 0, female: 0, genderless: 100 };
        }
      }

      // Generate a sprite URL for the variant
      const formattedName = pokemonName.toLowerCase();
      const formattedForm = formType.toLowerCase();
      allFormData[
        formType
      ].frontSpriteUrl = `/sprites/pokemon/${formattedName}_${formattedForm}/front_cropped.png`;

      processedForms.add(formType);
    }
  });

  // console.log(`All form data for ${pokemonName}:`, allFormData);

  // Render the main page
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

      {/* Add debug info for forms */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-gray-100 p-4 mb-4 text-xs rounded">
          <h3 className="font-bold">Debug Info:</h3>
          <p>Regional variants: {variantKeys.join(', ') || 'None'}</p>
          <p>All forms: {forms.join(', ') || 'None'}</p>
          <p>
            Valid forms:{' '}
            {Object.keys(allFormData)
              .filter((f) => f !== 'default')
              .join(', ') || 'None'}
          </p>
        </div>
      )}

      <PokemonFormClient
        forms={Object.keys(allFormData).filter((f) => f !== 'default')}
        allFormData={allFormData}
        moveDescData={moveDescData}
        pokemonName={pokemonName}
      />
    </div>
  );
}
