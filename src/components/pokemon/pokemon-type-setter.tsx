import { useEffect } from 'react';
import { usePokemonType } from '@/contexts/PokemonTypeContext';

interface PokemonTypeSetterProps {
  primaryType: string | string[] | null;
  secondaryType?: string | string[] | null;
}

/**
 * Component that sets the Pokemon type theme based on the provided types.
 * This should be placed at the top level of Pokemon-related pages.
 */
const PokemonTypeSetter: React.FC<PokemonTypeSetterProps> = ({ primaryType, secondaryType }) => {
  const { setPokemonTypes, clearPokemonTypes } = usePokemonType();

  useEffect(() => {
    if (primaryType) {
      // Handle string arrays or single strings
      const typeArray = Array.isArray(primaryType) ? primaryType : [primaryType];
      const secondaryTypeArray = Array.isArray(secondaryType)
        ? secondaryType
        : secondaryType
          ? [secondaryType]
          : [];

      const primary = typeArray[0]?.toLowerCase() as any;
      const secondary = (secondaryTypeArray[0] || typeArray[1])?.toLowerCase() as any | undefined;

      // Validate that the types are valid Pokemon types
      const validTypes = [
        'normal',
        'fire',
        'water',
        'electric',
        'grass',
        'ice',
        'fighting',
        'poison',
        'ground',
        'flying',
        'psychic',
        'bug',
        'rock',
        'ghost',
        'dragon',
        'dark',
        'steel',
        'fairy',
      ];

      if (primary && validTypes.includes(primary)) {
        setPokemonTypes(
          primary,
          secondary && validTypes.includes(secondary) ? secondary : undefined,
        );
      }
    } else {
      clearPokemonTypes();
    }

    // Cleanup when component unmounts
    return () => {
      clearPokemonTypes();
    };
  }, [primaryType, secondaryType, setPokemonTypes, clearPokemonTypes]);

  // This component doesn't render anything
  return null;
};

export default PokemonTypeSetter;
