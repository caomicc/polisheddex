import * as React from 'react';
import { DetailedStats } from '@/types/types';
import { cn } from '@/lib/utils';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { loadMultipleAbilitiesById } from '@/utils/loaders/ability-data-loader';

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
  const [resolvedAbilities, setResolvedAbilities] = React.useState<ResolvedAbility[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  console.log('PokemonAbilities props:', {
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

  // Load ability data when abilities change
  React.useEffect(() => {
    if (!abilitiesToShow || abilitiesToShow.length === 0) {
      setResolvedAbilities([]);
      return;
    }

    setIsLoading(true);

    const loadAbilities = async () => {
      try {
        const abilityIds = abilitiesToShow.map((ability) =>
          ability.id?.toLowerCase().replace(/\s+/g, '-'),
        );
        const abilityData = await loadMultipleAbilitiesById(abilityIds);

        const resolved: ResolvedAbility[] = abilitiesToShow.map((ability, index) => {
          const data = abilityData[index];
          return {
            id: ability.id,
            name:
              data?.name ||
              ability.id?.charAt(0).toUpperCase() + ability.id?.slice(1).replace(/-/g, ' '),
            description: data?.description || 'No description available',
            isHidden: ability.isHidden ?? false,
            abilityType: ability.abilityType ?? 'primary',
          };
        });

        setResolvedAbilities(resolved);
      } catch (error) {
        console.error('Failed to load ability data:', error);
        // Fallback to basic display
        const resolved: ResolvedAbility[] = abilitiesToShow.map((ability) => ({
          id: ability.id,
          name: ability.id?.charAt(0).toUpperCase() + ability.id?.slice(1).replace(/-/g, ' '),
          description: 'No description available',
          isHidden: ability.isHidden ?? false,
          abilityType: ability.abilityType ?? 'primary',
        }));
        setResolvedAbilities(resolved);
      } finally {
        setIsLoading(false);
      }
    };

    loadAbilities();
  }, [abilitiesToShow]);

  if (isLoading) {
    return (
      <div className={'space-y-2 ' + className}>
        <h3>Abilities:</h3>
        <div className={cn('flex flex-col gap-2', className)}>
          <span className="text-xs text-muted-foreground">Loading abilities...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={'space-y-2 ' + className}>
      <h3>Abilities:</h3>
      <div className={cn('flex flex-col md:flex-row gap-2', className)}>
        {resolvedAbilities.map((ability, idx) => (
          <AbilityRow key={`${ability.id}-${idx}`} ability={ability} />
        ))}
      </div>
    </div>
  );
}

function AbilityRow({ ability }: { ability: ResolvedAbility }) {
  return (
    <div className="w-full flex flex-col items-start justify-start">
      <span className="text-xs text-foreground">
        {ability.name} ({ability.abilityType}):
      </span>
      <span className="text-xs text-muted-foreground">{ability.description}</span>
    </div>
  );
}
