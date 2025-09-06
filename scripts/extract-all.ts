import extractPokemon from './extract-pokemon.ts';
import extractLocations from './extract-locations.ts';
import extractItems from './extract-items.ts';

await Promise.all([extractPokemon(), extractLocations(), extractItems()]);
