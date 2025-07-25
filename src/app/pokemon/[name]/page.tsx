import path from 'path';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import PokemonFormClient from '@/components/pokemon/PokemonFormClient';
import PokemonNavigation from '@/components/pokemon/PokemonNavigation';
import PokemonKeyboardNavigation from '@/components/pokemon/PokemonKeyboardNavigation';
import { MoveDescription, FormData, PokemonDataV3 } from '@/types/types';
import { urlKeyToStandardKey, getPokemonFileName } from '@/utils/pokemonUrlNormalizer';
import { loadDexOrders, getDexOrderToUse, getPokemonNavigation } from '@/utils/pokemonNavigation';
import { loadJsonData } from '@/utils/fileLoader';
import { Button } from '@/components/ui/button';

export default async function PokemonDetail({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  const pokemonName = decodeURIComponent(nameParam);

  // Convert the URL key to a standardized key for file lookup
  const standardKey = urlKeyToStandardKey(pokemonName);

  const pokemonFile = path.join(process.cwd(), `output/pokemon/${getPokemonFileName(standardKey)}`);
  const pokemonData = await loadJsonData<PokemonDataV3>(pokemonFile);

  // Build the path to the individual Pokémon file using the URL-safe filename
  // const pokemonData = await loadJsonFile<PokemonDataV3>(`output/pokemon/${getPokemonFileName(standardKey)}`);
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
    faithfulMoves: pokemonData.faithfulMoves || pokemonData.faithfulLevelMoves || [],
    updatedMoves: pokemonData.updatedMoves || pokemonData.updatedLevelMoves || [],
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

  // Add any additional forms
  if (pokemonData.forms) {
    Object.entries(pokemonData.forms).forEach(([formKey, formValue]) => {
      allFormData[formKey] = {
        ...formValue,
        ...(formValue.detailedStats || {}),
        moves: formValue.moves || [],
        faithfulMoves:
          formValue.faithfulMoves ||
          pokemonData.faithfulMoves ||
          pokemonData.faithfulLevelMoves ||
          [],
        updatedMoves:
          formValue.updatedMoves || pokemonData.updatedMoves || pokemonData.updatedLevelMoves || [],
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

  // Load dex orders for navigation
  const dexOrders = await loadDexOrders();

  const { order: dexOrder, type: dexType } = getDexOrderToUse(
    pokemonData,
    dexOrders.national,
    dexOrders.johto,
  );

  const navigation = getPokemonNavigation(pokemonName, dexOrder);
  console.log('Generated navigation:', navigation);

  const moveDescFile = path.join(process.cwd(), `output/pokemon_move_descriptions.json`);
  const moveDescData = (await loadJsonData<Record<string, MoveDescription>>(moveDescFile)) || {};

  // Load move descriptions using the robust file loader
  // const moveDescData = await loadJsonFile<Record<string, MoveDescription>>('output/pokemon_move_descriptions.json') || {};

  return (
    <>
      <div className="max-w-xl md:max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 sr-only">{pokemonName}</h1>
        <PokemonKeyboardNavigation navigation={navigation} />
        <PokemonFormClient
          forms={forms}
          allFormData={allFormData}
          moveDescData={moveDescData}
          pokemonName={pokemonName}
        />
        {/* Only render navigation if we have valid navigation data */}
        {navigation.current.index !== -1 ? (
          <PokemonNavigation navigation={navigation} dexType={dexType} />
        ) : (
          <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <Button asChild variant="ghost" size="sm">
                <Link href="/pokemon" className="flex items-center gap-1">
                  <span className="text-xs">Back to List</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Generate static params for all Pokemon
export async function generateStaticParams() {
  const baseDataFile = path.join(process.cwd(), 'output/pokemon_base_data.json');
  const data = await loadJsonData<Record<string, unknown>>(baseDataFile);

  if (!data) return [];

  return Object.keys(data).map((pokemonKey) => ({
    name: pokemonKey,
  }));
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  const pokemonName = decodeURIComponent(nameParam);
  const standardKey = urlKeyToStandardKey(pokemonName);

  const pokemonFile = path.join(process.cwd(), `output/pokemon/${getPokemonFileName(standardKey)}`);
  const pokemonData = await loadJsonData<PokemonDataV3>(pokemonFile);

  if (!pokemonData) {
    return {
      title: 'Pokémon Not Found',
      description: 'The requested Pokémon could not be found.',
    };
  }

  // Get types for better description
  const types = pokemonData.detailedStats?.types || pokemonData.types || [];
  const typeText = Array.isArray(types) ? types.join('/') : types || 'Unknown';

  // Get dex numbers
  const nationalDex = pokemonData.nationalDex;
  const johtoDex = pokemonData.johtoDex;
  const dexInfo = nationalDex ? `#${nationalDex}` : '';
  const johtoInfo = johtoDex ? ` (Johto #${johtoDex})` : '';

  // Build description
  const pokemonDisplayName = pokemonData.name || 'Unknown Pokemon';
  const baseDescription = `${pokemonDisplayName} ${dexInfo}${johtoInfo} - ${typeText} type Pokémon`;
  const locationCount = pokemonData.locations?.length || 0;
  const locationText = locationCount > 0 ? ` Found in ${locationCount} locations.` : '';

  const title = `${pokemonDisplayName} ${dexInfo} | PolishedDex`;
  const description = `${baseDescription} in Pokémon Polished Crystal.${locationText} View stats, moves, evolution, and more.`;
  const url = `https://polisheddex.vercel.app/pokemon/${nameParam}`;

  // Create rich social description
  const baseStats = pokemonData.detailedStats?.baseStats;
  const statsText = baseStats
    ? ` HP: ${baseStats.hp || 0}, Attack: ${baseStats.attack || 0}, Defense: ${baseStats.defense || 0}.`
    : '';

  const socialDescription = `${baseDescription}.${statsText}${locationText}`;

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      pokemonDisplayName.toLowerCase(),
      'pokedex',
      'pokemon stats',
      'pokemon moves',
      'pokemon evolution',
      typeText.toLowerCase(),
      'polisheddex',
    ],

    // Open Graph metadata
    openGraph: {
      title,
      description: socialDescription,
      url,
      siteName: 'PolishedDex',
      type: 'website',
      images: [
        {
          url: pokemonData.frontSpriteUrl || '/og-image.png',
          width: pokemonData.frontSpriteUrl ? 288 : 1200,
          height: pokemonData.frontSpriteUrl ? 288 : 630,
          alt: `${pokemonData.name} sprite from Pokémon Polished Crystal`,
        },
        // Fallback to main OG image if sprite exists
        ...(pokemonData.frontSpriteUrl
          ? [
              {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: `${pokemonData.name} - PolishedDex`,
              },
            ]
          : []),
      ],
      locale: 'en_US',
    },

    // Twitter Card metadata
    twitter: {
      card: 'summary_large_image',
      title,
      description: socialDescription,
      images: [pokemonData.frontSpriteUrl || '/og-image.png'],
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
