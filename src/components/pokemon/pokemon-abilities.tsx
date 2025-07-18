import * as React from 'react';
import { DetailedStats } from '@/types/types';
import { cn } from '@/lib/utils';

interface PokemonAbilitiesProps {
  faithfulAbilities?: DetailedStats['faithfulAbilities'];
  updatedAbilities?: DetailedStats['updatedAbilities'];
  className?: string;
}

export function PokemonAbilities({
  faithfulAbilities,
  updatedAbilities,
  className,
}: PokemonAbilitiesProps) {
  const showUpdated = Array.isArray(updatedAbilities) && updatedAbilities.length > 0;

  return (
    <div>
      <div className={cn('grid grid-cols-1 gap-6', showUpdated ? 'md:grid-cols-2' : '')}>
        <div>
          <h3 className="italic font-bold text-sm mb-4 text-left">Faithful</h3>
          <div className={cn('flex flex-col gap-2  ', className, showUpdated ? 'mb-6 md:m-0' : '')}>
            {faithfulAbilities?.map((ability, idx) => (
              <AbilityRow key={`${ability.name}-${idx}`} ability={ability} />
            ))}
          </div>
        </div>
        <div>
          <h3
            className={cn('italic font-bold text-sm mb-4 text-left', showUpdated ? '' : 'hidden')}
          >
            Polished:
          </h3>
          <div className={cn('flex flex-col gap-2', className)}>
            {updatedAbilities?.map((ability, idx) => (
              <AbilityRow key={`${ability.name}-${idx}`} ability={ability} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AbilityRow({
  ability,
}: {
  ability: NonNullable<DetailedStats['faithfulAbilities']>[number];
}) {
  return (
    <div className="w-full flex flex-col items-start justify-start">
      <span className="text-sm text-foreground">
        {ability.name} ({ability.abilityType}):
      </span>
      <span className="text-sm text-muted-foreground">{ability.description}</span>
    </div>
  );
}
