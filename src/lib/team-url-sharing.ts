import { PokemonEntry, Nature } from '@/components/pokemon-slot';

export interface SerializedPokemonEntry {
  n: string; // name
  t?: string[]; // types (optional, can be derived)
  a?: string; // ability
  na?: string; // nature
  i?: string; // item
  m?: string[]; // moves (only names)
}

export function serializeTeamForUrl(team: PokemonEntry[]): string {
  // Filter out empty Pokemon entries
  const nonEmptyTeam = team.filter(pokemon => 
    pokemon.name && pokemon.name.trim() !== ''
  );

  if (nonEmptyTeam.length === 0) {
    return '';
  }

  // Convert team to compact format
  const serializedTeam = nonEmptyTeam.map((pokemon): SerializedPokemonEntry => {
    const serialized: SerializedPokemonEntry = {
      n: pokemon.name,
    };

    // Only include non-empty values to keep URL shorter
    if (pokemon.ability && pokemon.ability.trim()) {
      serialized.a = pokemon.ability;
    }

    if (pokemon.nature) {
      serialized.na = pokemon.nature;
    }

    if (pokemon.item && pokemon.item !== 'none') {
      serialized.i = pokemon.item;
    }

    // Only include moves that have names
    const moveNames = pokemon.moves
      .map(move => move.name)
      .filter(name => name && name.trim() !== '');
    
    if (moveNames.length > 0) {
      serialized.m = moveNames;
    }

    return serialized;
  });

  // Convert to JSON and encode for URL
  const jsonString = JSON.stringify(serializedTeam);
  
  // Use base64 encoding to make it URL-safe and more compact
  return btoa(jsonString);
}

export function deserializeTeamFromUrl(encodedTeam: string): PokemonEntry[] {
  try {
    // Decode from base64
    const jsonString = atob(encodedTeam);
    const serializedTeam: SerializedPokemonEntry[] = JSON.parse(jsonString);

    // Convert back to PokemonEntry format
    const team: PokemonEntry[] = serializedTeam.map((serialized): PokemonEntry => {
      return {
        name: serialized.n,
        types: [], // Types will be loaded when Pokemon data loads
        ability: serialized.a || '',
        nature: serialized.na as Nature | undefined,
        item: serialized.i,
        moves: [
          { name: serialized.m?.[0] || '', type: null },
          { name: serialized.m?.[1] || '', type: null },
          { name: serialized.m?.[2] || '', type: null },
          { name: serialized.m?.[3] || '', type: null },
        ],
      };
    });

    // Pad with empty entries to make it 6 Pokemon
    while (team.length < 6) {
      team.push({
        name: '',
        types: [],
        ability: '',
        nature: undefined,
        item: undefined,
        moves: [
          { name: '', type: null },
          { name: '', type: null },
          { name: '', type: null },
          { name: '', type: null },
        ],
      });
    }

    // Ensure we don't have more than 6
    return team.slice(0, 6);
  } catch (error) {
    console.error('Failed to deserialize team from URL:', error);
    // Return empty team on error
    return Array(6).fill(null).map(() => ({
      name: '',
      types: [],
      ability: '',
      nature: undefined,
      item: undefined,
      moves: [
        { name: '', type: null },
        { name: '', type: null },
        { name: '', type: null },
        { name: '', type: null },
      ],
    }));
  }
}

export function generateShareUrl(team: PokemonEntry[], baseUrl?: string): string {
  const encodedTeam = serializeTeamForUrl(team);
  
  if (!encodedTeam) {
    throw new Error('Cannot share an empty team');
  }

  const url = new URL(baseUrl || window.location.origin);
  url.pathname = '/team-builder';
  url.searchParams.set('team', encodedTeam);
  
  return url.toString();
}

export function getTeamFromUrl(): PokemonEntry[] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const teamParam = urlParams.get('team');
  
  if (!teamParam) {
    return null;
  }

  return deserializeTeamFromUrl(teamParam);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}