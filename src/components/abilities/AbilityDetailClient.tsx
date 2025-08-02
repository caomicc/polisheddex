'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { PokemonWithAbility } from '@/utils/loaders/ability-data-loader';
import PokemonWithAbilityDataTable from './PokemonWithAbilityDataTable';

interface AbilityDetailClientProps {
  abilityData: {
    name?: string;
    description?: string;
  };
  pokemonWithAbility: PokemonWithAbility[];
  abilityName: string;
}

export default function AbilityDetailClient({
  abilityData,
  pokemonWithAbility,
  abilityName,
}: AbilityDetailClientProps) {
  const [abilityTypeFilter, setAbilityTypeFilter] = useState<string>('all');
  const { showFaithful } = useFaithfulPreference();

  return (
    <div className="space-y-6 p-4">
      {/* Ability Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {abilityName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{abilityData.description}</p>
        </CardContent>
      </Card>

      {/* Pokemon List Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <h3>Pokémon that have {abilityName}</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PokemonWithAbilityDataTable
            pokemonWithAbility={pokemonWithAbility}
            abilityTypeFilter={abilityTypeFilter}
            onAbilityTypeFilterChange={setAbilityTypeFilter}
            showFaithful={showFaithful}
          />
        </CardContent>
      </Card>
    </div>
  );
}