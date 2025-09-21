import * as React from 'react';
import { cn } from '@/lib/utils';
import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';
import { BentoGridItem } from '../ui/bento-box';
import { Badge } from '../ui/badge';

interface PokemonAbilitiesProps {
  abilities?: {
    id: string;
    name: string;
    description?: string;
  }[];
  className?: string;
}

export function PokemonAbilities({ abilities, className }: PokemonAbilitiesProps) {
  const { showFaithful } = useFaithfulPreference();
  const version = showFaithful ? 'faithful' : 'polished';
  if (!abilities || abilities.length === 0) {
    return (
      <div className={'space-y-2 ' + className}>
        <h3>Abilities:</h3>
        <div className={cn('flex flex-col gap-2', className)}>
          <span className="text-xs text-muted-foreground">No abilities available</span>
        </div>
      </div>
    );
  }

  return abilities.map((ability, idx) => (
    <AbilityRow key={`${ability.id}-${idx}`} ability={ability} version={version} order={idx} />
  ));
}

function AbilityRow({
  ability,
  version,
  order,
}: {
  ability: { id: string; name: string; description?: string };
  version: string;
  order: number;
}) {
  console.log(
    `Rendering Ability: ${JSON.stringify(ability)} (${ability.id}) for version: ${version}`,
  );
  const abilityType = order === 0 ? 'primary' : order === 1 ? 'secondary' : 'hidden';
  return (
    <BentoGridItem
      icon={<Badge variant={abilityType}>{abilityType} Ability</Badge>}
      className="md:col-span-2"
      title={`${ability.name}`}
      description={ability.description || 'No description available'}
      href={`/abilities/${ability.id}`}
    />
  );
}
