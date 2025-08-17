import * as React from 'react';
import { DetailedStats } from '@/types/types';
import { cn } from '@/lib/utils';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { BentoGridItem } from '../ui/bento-box';
import { Badge } from '../ui/badge';

interface PokemonAbilitiesProps {
  abilities?: DetailedStats['abilities'];
  faithfulAbilities?: DetailedStats['faithfulAbilities'];
  updatedAbilities?: DetailedStats['updatedAbilities'];
  className?: string;
}

interface ResolvedAbility {
  id: string;
  name: string;
  description: string;
  isHidden: boolean;
  abilityType: 'primary' | 'secondary' | 'hidden';
}

export function PokemonAbilities({
  abilities,
  faithfulAbilities,
  updatedAbilities,
  className,
}: PokemonAbilitiesProps) {
  const { showFaithful } = useFaithfulPreference();

  console.log('PokemonAbilities render', {
    abilities,
    faithfulAbilities,
    updatedAbilities,
    showFaithful,
  });

  // Determine which abilities to show based on faithful preference and availability
  let abilitiesToShow;
  if (showFaithful) {
    abilitiesToShow =
      faithfulAbilities && faithfulAbilities.length > 0 ? faithfulAbilities : abilities;
  } else {
    abilitiesToShow =
      updatedAbilities && updatedAbilities.length > 0 ? updatedAbilities : abilities;
  }

  if (!abilitiesToShow || abilitiesToShow.length === 0) {
    return (
      <div className={'space-y-2 ' + className}>
        <h3>Abilities:</h3>
        <div className={cn('flex flex-col gap-2', className)}>
          <span className="text-xs text-muted-foreground">No abilities available</span>
        </div>
      </div>
    );
  }

  // Convert abilities to resolved format for display
  const resolvedAbilities: ResolvedAbility[] = abilitiesToShow.map((ability) => ({
    id: ability.id,
    name: ability.name || ability.id?.replace(/-/g, ' ') || 'Unknown',
    description: ability.description || 'No description available',
    isHidden: ability.isHidden ?? false,
    abilityType: ability.abilityType ?? 'primary',
  }));

  console.log('Resolved abilities:', resolvedAbilities);

  return resolvedAbilities.map((ability, idx) => (
    <AbilityRow key={`${ability.id}-${idx}`} ability={ability} />
  ));
  // <div className={'space-y-2 ' + className}>
  //   <h3>Abilities:</h3>
  //   <div className={cn('flex flex-col md:flex-row gap-2', className)}>

  //   </div>
  // </div>
}

function AbilityRow({ ability }: { ability: ResolvedAbility }) {
  return (
    // <BentoGridNoLink className="md:col-span-2">
    //   <span className="text-xs text-foreground capitalize">
    //     {ability.name} ({ability.abilityType}):
    //   </span>
    //   <span className="text-xs text-muted-foreground">{ability.description}</span>
    // </BentoGridNoLink>
    <BentoGridItem
      icon={<Badge variant={ability.abilityType}>{ability.abilityType} Ability</Badge>}
      className="md:col-span-2"
      title={`${ability.name}`}
      description={ability.description}
      href={`/abilities/${ability.name.toLowerCase().replace(/ /g, '-')}`}
    />
  );
}
