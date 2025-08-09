import path from 'path';
import { Suspense } from 'react';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import PokemonFormClient from '@/components/pokemon/pokemon-form-client';
import PokemonNavigation from '@/components/pokemon/pokemon-navigation';
import PokemonKeyboardNavigation from '@/components/pokemon/pokemon-keyboard-navigation';
import { FormData } from '@/types/types';
import { urlKeyToStandardKey, getPokemonFileName, normalizePokemonUrlKey } from '@/utils/pokemonUrlNormalizer';
import { loadDexOrders, getDexOrderToUse, getPokemonNavigation } from '@/utils/pokemonNavigation';
import { loadJsonData } from '@/utils/fileLoader';
import { loadPokemonData } from '@/utils/loaders/pokemon-data-loader';
import { Button } from '@/components/ui/button';
import { loadMovesData } from '@/utils/loaders/move-data-loader';
import { loadFormLocationData } from '@/utils/loaders/pokemon-form-location-loader';

export default async function PokemonDetail({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  const pokemonName = decodeURIComponent(nameParam);

  // Convert the URL key to a standardized key for file lookup
  const standardKey = urlKeyToStandardKey(pokemonName);

  // Load Pokemon data with resolved abilities using the new optimized loader
  const pokemonData = await loadPokemonData(getPokemonFileName(standardKey).replace('.json', ''));

  if (!pokemonData) return notFound();

  // Map the loaded data to the expected structure for the client component
  // (This assumes the individual file contains all the necessary fields)
  // If not, you may need to adjust this mapping.

  // Extract forms if present
  const forms = pokemonData.forms ? Object.keys(pokemonData.forms) : [];
  const allFormData: Record<string, FormData> = {};

  // Default form - check if forms exist and use the first one, otherwise use root data
  const defaultFormData =
    pokemonData.forms && Object.keys(pokemonData.forms).length > 0
      ? pokemonData.forms[Object.keys(pokemonData.forms)[0]]
      : pokemonData;

  allFormData['default'] = {
    ...pokemonData,
    ...(pokemonData.detailedStats || {}),
    moves: defaultFormData.moves || [],
    faithfulMoves: defaultFormData.faithfulMoves || [],
    updatedMoves: defaultFormData.updatedMoves || [],
    tmHmLearnset: defaultFormData.tmHmMoves || [],
    locations: pokemonData.locations || [],
    eggMoves: defaultFormData.eggMoves || [],
    evolution: pokemonData.evolution || null,
    nationalDex: pokemonData.nationalDex || null,
    frontSpriteUrl: pokemonData.frontSpriteUrl,
    johtoDex: pokemonData.johtoDex || null,
    baseStats: 
      defaultFormData.baseStats ||
      pokemonData.detailedStats?.baseStats || 
      {},
    faithfulBaseStats: 
      defaultFormData.faithfulBaseStats ||
      pokemonData.detailedStats?.faithfulBaseStats || 
      undefined,
    polishedBaseStats: 
      defaultFormData.polishedBaseStats ||
      pokemonData.detailedStats?.polishedBaseStats || 
      undefined,
    species: pokemonData.pokedexEntries?.default?.species || '',
    description: pokemonData.pokedexEntries?.default?.description || '',
    // Provide safe defaults for missing detailedStats fields
    height: pokemonData.detailedStats?.height ?? 0,
    weight: pokemonData.detailedStats?.weight ?? 0,
    bodyColor: pokemonData.detailedStats?.bodyColor ?? 'Unknown',
    bodyShape: pokemonData.detailedStats?.bodyShape ?? 'Unknown',
    genderRatio: 
      defaultFormData.genderRatio ??
      pokemonData.detailedStats?.genderRatio ?? 
      { male: 50, female: 50 },
    catchRate: 
      defaultFormData.catchRate ??
      pokemonData.detailedStats?.catchRate ?? 
      255,
    baseExp: 
      defaultFormData.baseExp ??
      pokemonData.detailedStats?.baseExp ?? 
      0,
    hatchRate: 
      defaultFormData.hatchRate ??
      pokemonData.detailedStats?.hatchRate ?? 
      'Unknown',
    growthRate: 
      defaultFormData.growthRate ??
      pokemonData.detailedStats?.growthRate ?? 
      'Medium Fast',
    eggGroups: 
      defaultFormData.eggGroups ??
      pokemonData.detailedStats?.eggGroups ?? 
      [],
    evYield: 
      defaultFormData.evYield ??
      pokemonData.detailedStats?.evYield ?? 
      'None',
    abilities: 
      defaultFormData.abilities ?? 
      pokemonData.detailedStats?.abilities ?? 
      [],
    faithfulAbilities: 
      defaultFormData.faithfulAbilities ?? 
      pokemonData.detailedStats?.faithfulAbilities ?? 
      [],
    updatedAbilities: 
      defaultFormData.updatedAbilities ?? 
      pokemonData.detailedStats?.updatedAbilities ?? 
      [],
  };

  // Add any additional forms with form-specific location data
  if (pokemonData.forms) {
    const formEntries = await Promise.all(
      Object.entries(pokemonData.forms).map(async ([formKey, formValue]) => {
        // Try to load form-specific location data
        const formLocationData = await loadFormLocationData(standardKey, formKey);

        return [
          formKey,
          {
            ...formValue,
            ...(formValue.detailedStats || {}),
            moves: formValue.moves || [],
            faithfulMoves: formValue.faithfulMoves || [],
            updatedMoves: formValue.updatedMoves || [],
            levelMoves: formValue.moves || [],
            tmHmLearnset: formValue.tmHmMoves || [],
            locations: formLocationData || formValue.locations || [],
            eggMoves: formValue.eggMoves || [],
            evolution: formValue.evolution || pokemonData.evolution || null,
            nationalDex: formValue.nationalDex || pokemonData.nationalDex || null,
            frontSpriteUrl: formValue.frontSpriteUrl,
            johtoDex: formValue.johtoDex || pokemonData.johtoDex || null,
            species: pokemonData.pokedexEntries?.[formKey]?.species || '',
            description: pokemonData.pokedexEntries?.[formKey]?.description || '',
            baseStats:
              formValue.baseStats ||
              formValue.detailedStats?.baseStats ||
              pokemonData.detailedStats?.baseStats ||
              {},
            faithfulBaseStats:
              formValue.faithfulBaseStats ||
              formValue.detailedStats?.faithfulBaseStats ||
              pokemonData.detailedStats?.faithfulBaseStats ||
              undefined,
            polishedBaseStats:
              formValue.polishedBaseStats ||
              formValue.detailedStats?.polishedBaseStats ||
              pokemonData.detailedStats?.polishedBaseStats ||
              undefined,
            // Provide safe defaults for missing detailedStats fields
            height: formValue.detailedStats?.height ?? pokemonData.detailedStats?.height ?? 0,
            weight: formValue.detailedStats?.weight ?? pokemonData.detailedStats?.weight ?? 0,
            bodyColor:
              formValue.detailedStats?.bodyColor ??
              pokemonData.detailedStats?.bodyColor ??
              'Unknown',
            bodyShape:
              formValue.detailedStats?.bodyShape ??
              pokemonData.detailedStats?.bodyShape ??
              'Unknown',
            genderRatio:
              formValue.genderRatio ??
              formValue.detailedStats?.genderRatio ??
              pokemonData.detailedStats?.genderRatio ?? 
              { male: 50, female: 50 },
            catchRate:
              formValue.catchRate ??
              formValue.detailedStats?.catchRate ?? 
              pokemonData.detailedStats?.catchRate ?? 
              255,
            baseExp: 
              formValue.baseExp ??
              formValue.detailedStats?.baseExp ?? 
              pokemonData.detailedStats?.baseExp ?? 
              0,
            hatchRate:
              formValue.hatchRate ??
              formValue.detailedStats?.hatchRate ??
              pokemonData.detailedStats?.hatchRate ??
              'Unknown',
            growthRate:
              formValue.growthRate ??
              formValue.detailedStats?.growthRate ??
              pokemonData.detailedStats?.growthRate ??
              'Medium Fast',
            eggGroups:
              formValue.eggGroups ??
              formValue.detailedStats?.eggGroups ?? 
              pokemonData.detailedStats?.eggGroups ?? 
              [],
            evYield:
              formValue.evYield ??
              formValue.detailedStats?.evYield ?? 
              pokemonData.detailedStats?.evYield ?? 
              'None',
            abilities:
              formValue.abilities && formValue.abilities.length > 0
                ? formValue.abilities
                : formValue.detailedStats?.abilities && formValue.detailedStats.abilities.length > 0
                  ? formValue.detailedStats.abilities
                  : (pokemonData.detailedStats?.abilities ?? []),
            faithfulAbilities:
              formValue.faithfulAbilities && formValue.faithfulAbilities.length > 0
                ? formValue.faithfulAbilities
                : formValue.detailedStats?.faithfulAbilities &&
                    formValue.detailedStats.faithfulAbilities.length > 0
                  ? formValue.detailedStats.faithfulAbilities
                  : (pokemonData.detailedStats?.faithfulAbilities ?? []),
            updatedAbilities:
              formValue.updatedAbilities && formValue.updatedAbilities.length > 0
                ? formValue.updatedAbilities
                : formValue.detailedStats?.updatedAbilities &&
                    formValue.detailedStats.updatedAbilities.length > 0
                  ? formValue.detailedStats.updatedAbilities
                  : (pokemonData.detailedStats?.updatedAbilities ?? []),
          },
        ];
      }),
    );

    // Add all form entries to allFormData
    formEntries.forEach(([formKey, formData]) => {
      allFormData[formKey] = formData;
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
  // console.log('Generated navigation:', navigation);

  // const moveDescFile = path.join(process.cwd(), `output/pokemon_move_descriptions.json`);
  // const moveDescData = (await loadJsonData<Record<string, MoveDescription>>(moveDescFile)) || {};
  const movesData = await loadMovesData();

  // Load move descriptions using the robust file loader
  // const moveDescData = await loadJsonFile<Record<string, MoveDescription>>('output/pokemon_move_descriptions.json') || {};

  return (
    <>
      <div className="max-w-xl md:max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 sr-only">{pokemonName}</h1>
        <PokemonKeyboardNavigation navigation={navigation} />
        <Suspense fallback={<div className="flex justify-center py-8">Loading...</div>}>
          <PokemonFormClient
            forms={forms}
            allFormData={allFormData}
            moveDescData={movesData}
            pokemonName={pokemonName}
          />
        </Suspense>
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

// Generate static params for all Pokemon - only lowercase normalized names
export async function generateStaticParams() {
  const baseDataFile = path.join(process.cwd(), 'output/pokemon_base_data.json');
  const data = await loadJsonData<Record<string, unknown>>(baseDataFile);

  if (!data) return [];

  // Only generate lowercase normalized URLs to prevent uppercase static generation
  return Object.keys(data).map((pokemonKey) => ({
    name: normalizePokemonUrlKey(pokemonKey),
  }));
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  const pokemonName = decodeURIComponent(nameParam);
  const standardKey = urlKeyToStandardKey(pokemonName);

  // Use the optimized loader for metadata as well
  const pokemonData = await loadPokemonData(getPokemonFileName(standardKey).replace('.json', ''));

  if (!pokemonData) {
    return {
      title: 'Pokémon Not Found',
      description: 'The requested Pokémon could not be found.',
    };
  }

  // Get types for better description
  const types = pokemonData.types || [];
  const typeText = Array.isArray(types) ? types.join('/') : types || 'Unknown';

  // Get dex numbers
  const nationalDex = pokemonData.nationalDex;
  const johtoDex = pokemonData.johtoDex;
  const dexInfo = nationalDex ? `#${nationalDex}` : '';
  const johtoInfo = johtoDex ? ` (Johto #${johtoDex})` : '';

  // Build description
  const pokemonDisplayName = (pokemonData.name || 'Unknown Pokemon').replace(/\b\w/g, (char) =>
    char.toUpperCase(),
  );
  const baseDescription = `${pokemonDisplayName} ${dexInfo}${johtoInfo} - ${typeText} type Pokémon`;
  const locationCount = pokemonData.locations?.length || 0;
  const locationText = locationCount > 0 ? ` Found in ${locationCount} locations.` : '';

  const title = `${pokemonDisplayName} ${dexInfo} | PolishedDex`;
  const description = `${baseDescription} in Pokémon Polished Crystal.${locationText} View stats, moves, evolution, and more.`;
  const url = `https://www.polisheddex.app/pokemon/${nameParam}`;

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

// Export viewport separately as required by Next.js 15+
export const viewport = 'width=device-width, initial-scale=1';
