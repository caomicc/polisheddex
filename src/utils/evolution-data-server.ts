import { promises as fs } from 'fs';
import path from 'path';
import { ChainLink } from '@/types/new';

export interface EvolutionChainMember {
  name: string;
  formName: string;
}

export interface EvolutionChainStep {
  from: EvolutionChainMember;
  to: EvolutionChainMember;
  method: {
    action: string;
    parameter?: string | number;
  };
}

// Full chain is an array of paths (for branching evolutions like Eevee)
export type EvolutionChain = EvolutionChainStep[][];

interface EvolutionChainsData {
  polished: Record<string, ChainLink[][]>;
  faithful: Record<string, ChainLink[][]>;
}

let evolutionChainsCache: EvolutionChainsData | null = null;

/**
 * Load evolution chains data once and cache it (server-side only)
 */
async function loadEvolutionChains(): Promise<EvolutionChainsData | null> {
  if (evolutionChainsCache) {
    return evolutionChainsCache;
  }

  try {
    const chainsPath = path.join(process.cwd(), 'public/new/evolution_chains.json');
    const chainsData = await fs.readFile(chainsPath, 'utf-8');
    evolutionChainsCache = JSON.parse(chainsData);
    return evolutionChainsCache;
  } catch (error) {
    console.error('Error loading evolution chains:', error);
    return null;
  }
}

/**
 * Get the evolution chain for a specific Pokemon
 * Returns the full chain including pre-evolutions and all possible evolutions
 */
export async function getEvolutionChainForPokemon(
  pokemonId: string,
  version: 'polished' | 'faithful' = 'polished',
): Promise<EvolutionChain | null> {
  const chains = await loadEvolutionChains();
  if (!chains) return null;

  const versionChains = chains[version];
  if (!versionChains) return null;

  // Normalize the Pokemon ID
  const normalizedId = pokemonId.toLowerCase().replace(/[^a-z0-9]/g, '');

  const chain = versionChains[normalizedId];
  if (!chain) return null;

  return chain as EvolutionChain;
}

/**
 * Format an evolution method for display
 */
export function formatEvolutionMethod(method: {
  action: string;
  parameter?: string | number;
}): string {
  const { action, parameter } = method;

  switch (action) {
    case 'level':
      return `Level ${parameter}`;
    case 'item':
      return formatItemName(String(parameter));
    case 'trade':
      if (parameter) {
        return `Trade holding ${formatItemName(String(parameter))}`;
      }
      return 'Trade';
    case 'happiness':
      if (parameter === 'day') return 'Happiness (Day)';
      if (parameter === 'night') return 'Happiness (Night)';
      return 'Happiness';
    case 'stat':
      return `Level up with specific stats`;
    case 'move':
      return `Level up knowing ${formatMoveName(String(parameter))}`;
    case 'location':
      return `Level up at ${formatLocationName(String(parameter))}`;
    case 'held_item':
      if (parameter === 'day') return 'Level up holding item (Day)';
      if (parameter === 'night') return 'Level up holding item (Night)';
      return `Level up holding ${formatItemName(String(parameter))}`;
    default:
      if (parameter) {
        return `${formatActionName(action)} (${parameter})`;
      }
      return formatActionName(action);
  }
}

function formatItemName(item: string): string {
  return item
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatMoveName(move: string): string {
  return move
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatLocationName(location: string): string {
  return location
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatActionName(action: string): string {
  return action
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
