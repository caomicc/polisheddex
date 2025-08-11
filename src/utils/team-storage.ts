// Team storage utility using localStorage
// Manages up to 6 saved teams with names

export interface SavedTeamPokemon {
  name: string;
  formName?: string;
  moves?: string[];
}

export interface SavedTeam {
  id: string;
  name: string;
  pokemon: (SavedTeamPokemon | null)[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'polisheddex_saved_teams';
const MAX_TEAMS = 6;

// Get all saved teams from localStorage
export function getSavedTeams(): SavedTeam[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const teams = JSON.parse(stored);
    return Array.isArray(teams) ? teams : [];
  } catch (error) {
    console.error('Error loading saved teams:', error);
    return [];
  }
}

// Save a new team or update existing one
export function saveTeam(
  teamName: string,
  pokemon: (SavedTeamPokemon | null)[],
  teamId?: string,
): { success: boolean; error?: string; team?: SavedTeam } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not available server-side' };
  }

  try {
    const teams = getSavedTeams();
    const now = new Date().toISOString();

    // Validate team name
    if (!teamName.trim()) {
      return { success: false, error: 'Team name is required' };
    }

    // Check if team name already exists (for new teams)
    if (!teamId && teams.some((team) => team.name.toLowerCase() === teamName.toLowerCase())) {
      return { success: false, error: 'A team with this name already exists' };
    }

    // Filter out empty slots and validate pokemon data
    const filteredPokemon = pokemon.map((p) => {
      if (!p || !p.name) return null;
      return {
        name: p.name,
        formName: p.formName || undefined,
        moves: p.moves && p.moves.length > 0 ? p.moves : undefined,
      };
    });

    // Check if team has at least one Pokemon
    if (!filteredPokemon.some((p) => p !== null)) {
      return { success: false, error: 'Team must have at least one Pokémon' };
    }

    if (teamId) {
      // Update existing team
      const teamIndex = teams.findIndex((team) => team.id === teamId);
      if (teamIndex === -1) {
        return { success: false, error: 'Team not found' };
      }

      teams[teamIndex] = {
        ...teams[teamIndex],
        name: teamName,
        pokemon: filteredPokemon,
        updatedAt: now,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
      return { success: true, team: teams[teamIndex] };
    } else {
      // Create new team
      if (teams.length >= MAX_TEAMS) {
        return { success: false, error: `Maximum of ${MAX_TEAMS} teams allowed` };
      }

      const newTeam: SavedTeam = {
        id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: teamName,
        pokemon: filteredPokemon,
        createdAt: now,
        updatedAt: now,
      };

      teams.push(newTeam);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
      return { success: true, team: newTeam };
    }
  } catch (error) {
    console.error('Error saving team:', error);
    return { success: false, error: 'Failed to save team' };
  }
}

// Delete a saved team
export function deleteTeam(teamId: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Not available server-side' };
  }

  try {
    const teams = getSavedTeams();
    const filteredTeams = teams.filter((team) => team.id !== teamId);

    if (filteredTeams.length === teams.length) {
      return { success: false, error: 'Team not found' };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredTeams));
    return { success: true };
  } catch (error) {
    console.error('Error deleting team:', error);
    return { success: false, error: 'Failed to delete team' };
  }
}

// Get a specific team by ID
export function getTeamById(teamId: string): SavedTeam | null {
  const teams = getSavedTeams();
  return teams.find((team) => team.id === teamId) || null;
}

// Convert team URL param format to SavedTeamPokemon format
export function parseTeamFromUrl(teamParam: string): (SavedTeamPokemon | null)[] {
  if (!teamParam) return Array(6).fill(null);

  const pokemonEntries = teamParam.split(',').filter((entry) => entry.trim());
  const teamArray: (SavedTeamPokemon | null)[] = Array(6).fill(null);

  pokemonEntries.forEach((entry, index) => {
    if (index < 6) {
      const parts = entry.split(':');
      const name = parts[0];
      const formName = parts[1] || undefined;
      const movesStr = parts[2] || '';
      const moves = movesStr ? movesStr.split('|').filter(m => m.trim()) : [];
      
      if (name) {
        teamArray[index] = {
          name,
          formName,
          moves: moves.length > 0 ? moves : undefined,
        };
      }
    }
  });

  return teamArray;
}

// Convert SavedTeamPokemon format to team URL param format
export function formatTeamForUrl(pokemon: (SavedTeamPokemon | null)[]): string {
  // Find the last non-null pokemon
  let lastIndex = -1;
  pokemon.forEach((p, index) => {
    if (p) lastIndex = index;
  });

  if (lastIndex === -1) return '';

  return pokemon
    .slice(0, lastIndex + 1)
    .map((p) => {
      if (!p) return '';
      let pokemonStr = p.name;
      if (p.formName) {
        pokemonStr += `:${p.formName}`;
      } else if (p.moves && p.moves.length > 0) {
        pokemonStr += ':'; // Empty form part
      }
      if (p.moves && p.moves.length > 0) {
        pokemonStr += `:${p.moves.join('|')}`;
      }
      return pokemonStr;
    })
    .join(',');
}

// Clear all saved teams (for debugging/reset)
export function clearAllTeams(): { success: boolean } {
  if (typeof window === 'undefined') {
    return { success: false };
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing teams:', error);
    return { success: false };
  }
}
