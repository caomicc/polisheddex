import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { reduce, toTitleCase, displayName } from '@/lib/extract-utils';
import { Prerequisite, StaticPokemon, StaticPokemonManifest } from '@/types/new';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// File paths
const mapsDir = join(__dirname, '../polishedcrystal/maps');
const wildDir = join(__dirname, '../polishedcrystal/data/wild');
const outputDir = join(__dirname, '..', 'public', 'new');

// Debug/test locations to exclude from extraction
const DEBUG_LOCATIONS = new Set([
  'playershouse2f', // Debug menu with test Pokemon
  'celadonuniversityhypertestroom', // Test room
]);

// Roaming Pokemon data (hardcoded since they're always the same 3)
const ROAMING_POKEMON = [
  { species: 'RAIKOU', level: 40 },
  { species: 'ENTEI', level: 40 },
  { species: 'SUICUNE', level: 40 },
];

/**
 * Parse roaming maps from roammon_maps.asm
 */
async function parseRoamingMaps(): Promise<string[]> {
  const filePath = join(wildDir, 'roammon_maps.asm');
  const content = await readFile(filePath, 'utf-8');

  const maps: string[] = [];
  const roamMapRegex = /roam_map\s+([A-Z_0-9]+)/g;
  let match;

  while ((match = roamMapRegex.exec(content)) !== null) {
    maps.push(match[1]);
  }

  return maps;
}

/**
 * Extract location ID from map filename
 * e.g., "FarawayJungle.asm" -> "farawayjungle"
 */
function getLocationId(filename: string): string {
  return reduce(basename(filename, '.asm'));
}

/**
 * Get location display name from filename
 * e.g., "FarawayJungle.asm" -> "Faraway Jungle"
 */
function getLocationDisplay(filename: string): string {
  return displayName(basename(filename, '.asm'));
}

/**
 * Parse prerequisite from script context
 * Looks for checkkeyitem, checkflag, or checkevent before the encounter
 */
function parsePrerequisite(scriptContent: string): Prerequisite | undefined {
  // Check for key item requirement
  const keyItemMatch = scriptContent.match(/checkkeyitem\s+([A-Z_]+)/);
  if (keyItemMatch) {
    const itemValue = keyItemMatch[1];
    return {
      type: 'item',
      value: reduce(itemValue),
      displayName: toTitleCase(itemValue),
    };
  }

  // Check for caught flag requirement
  const caughtMatch = scriptContent.match(/checkflag\s+ENGINE_PLAYER_CAUGHT_([A-Z_]+)/);
  if (caughtMatch) {
    const pokemonValue = caughtMatch[1];
    return {
      type: 'caught',
      value: reduce(pokemonValue),
      displayName: toTitleCase(pokemonValue),
    };
  }

  // Check for event requirement (common ones)
  const eventMatch = scriptContent.match(
    /checkevent\s+(EVENT_(?:BEAT_ELITE_FOUR|RESTORED_POWER_TO_KANTO|GOT_RAINBOW_WING|FOUGHT_[A-Z_]+))/,
  );
  if (eventMatch) {
    const eventValue = eventMatch[1];
    return {
      type: 'event',
      value: reduce(eventValue),
      displayName: toTitleCase(eventValue.replace('EVENT_', '')),
    };
  }

  return undefined;
}

/**
 * Extract script block containing a loadwildmon or givepoke command
 * Finds the script label that contains the command and only searches within that block
 * This prevents picking up prerequisites from unrelated scripts in the same file
 */
function extractScriptBlock(content: string, lineIndex: number): string {
  const lines = content.split('\n');

  // Find the script label that contains this line by searching backwards
  // Script labels end with ":" and start at column 0 (not indented)
  let scriptStartLine = lineIndex;
  for (let i = lineIndex; i >= 0; i--) {
    const line = lines[i];
    // Script labels are not indented and end with ":"
    if (line.match(/^[A-Za-z_][A-Za-z0-9_]*:/) && !line.startsWith('\t') && !line.startsWith(' ')) {
      scriptStartLine = i;
      break;
    }
  }

  // Look forward up to 10 lines for battle type (it comes after loadwildmon)
  const endLine = Math.min(lines.length, lineIndex + 10);

  return lines.slice(scriptStartLine, endLine).join('\n');
}

/**
 * Parse static Pokemon from a map file using loadwildmon
 */
function parseLoadWildmon(content: string, filename: string): StaticPokemon[] {
  const results: StaticPokemon[] = [];
  const lines = content.split('\n');
  const locationId = getLocationId(filename);
  const locationDisplay = getLocationDisplay(filename);

  // Match: loadwildmon SPECIES, LEVEL or loadwildmon SPECIES, FORM, LEVEL
  const loadwildmonRegex = /loadwildmon\s+([A-Z_]+)(?:,\s*([A-Z_]+_FORM|[A-Z]+_FORM))?,\s*(\d+)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(loadwildmonRegex);

    if (match) {
      const species = match[1];
      const formRaw = match[2];
      const level = parseInt(match[3], 10);

      // Check if level is actually a form (when 3 params exist but parsed wrong)
      let form: string | undefined;
      const actualLevel = level;

      if (formRaw && formRaw.endsWith('_FORM')) {
        form = reduce(formRaw.replace('_FORM', ''));
      }

      // Get script context for prerequisite detection
      const scriptContext = extractScriptBlock(content, i);

      // Check for legendary battle type
      const isLegendary = scriptContext.includes('BATTLETYPE_LEGENDARY');

      // Parse prerequisite
      const prerequisite = parsePrerequisite(scriptContext);

      const id = `${locationId}_${reduce(species)}${form ? `_${form}` : ''}_${actualLevel}`;

      results.push({
        id,
        species: reduce(species),
        speciesDisplay: toTitleCase(species),
        ...(form && { form, formDisplay: toTitleCase(form) }),
        level: actualLevel,
        location: locationId,
        locationDisplay,
        type: 'static',
        ...(isLegendary && { isLegendary: true }),
        ...(prerequisite && { prerequisite }),
      });
    }
  }

  return results;
}

/**
 * Parse gift Pokemon from a map file using givepoke
 */
function parseGivePoke(content: string, filename: string): StaticPokemon[] {
  const results: StaticPokemon[] = [];
  const lines = content.split('\n');
  const locationId = getLocationId(filename);
  const locationDisplay = getLocationDisplay(filename);

  // Match various givepoke formats:
  // givepoke SPECIES, LEVEL
  // givepoke SPECIES, FORM, LEVEL
  // givepoke SPECIES, FORM, LEVEL, ITEM
  // givepoke SPECIES, FORM, LEVEL, ITEM, BALL
  const givepokeRegex =
    /givepoke\s+([A-Z_]+)(?:,\s*(?:(?:MALE|FEMALE)\s*\|\s*)?([A-Z_]+_FORM|PLAIN_FORM))?(?:,\s*(\d+))?/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(givepokeRegex);

    if (match) {
      const species = match[1];
      const formRaw = match[2];
      const levelStr = match[3];

      // Skip if no level found (malformed line)
      if (!levelStr) continue;

      const level = parseInt(levelStr, 10);

      let form: string | undefined;
      if (formRaw && formRaw !== 'PLAIN_FORM' && formRaw.endsWith('_FORM')) {
        form = reduce(formRaw.replace('_FORM', ''));
      }

      // Check for held item in the line
      const itemMatch = line.match(
        /givepoke\s+[A-Z_]+(?:,\s*(?:(?:MALE|FEMALE)\s*\|\s*)?[A-Z_]+)?(?:,\s*\d+),\s*([A-Z_]+)(?:,|$)/,
      );
      let heldItem: string | undefined;
      let heldItemDisplay: string | undefined;
      if (itemMatch && itemMatch[1] && itemMatch[1] !== 'NO_ITEM') {
        heldItem = reduce(itemMatch[1]);
        heldItemDisplay = toTitleCase(itemMatch[1]);
      }

      // Get script context for prerequisite detection
      const scriptContext = extractScriptBlock(content, i);
      const prerequisite = parsePrerequisite(scriptContext);

      const id = `${locationId}_gift_${reduce(species)}${form ? `_${form}` : ''}_${level}`;

      results.push({
        id,
        species: reduce(species),
        speciesDisplay: toTitleCase(species),
        ...(form && { form, formDisplay: toTitleCase(form) }),
        level,
        location: locationId,
        locationDisplay,
        type: 'gift',
        ...(heldItem && { heldItem, heldItemDisplay }),
        ...(prerequisite && { prerequisite }),
      });
    }
  }

  return results;
}

/**
 * Create roaming Pokemon entries
 */
function createRoamingPokemon(roamingMaps: string[]): StaticPokemon[] {
  const validMaps = roamingMaps.map((m) => reduce(m));

  return ROAMING_POKEMON.map((pokemon) => ({
    id: `roaming_${reduce(pokemon.species)}`,
    species: reduce(pokemon.species),
    speciesDisplay: toTitleCase(pokemon.species),
    level: pokemon.level,
    location: 'roaming',
    locationId: 'roaming',
    locationDisplay: 'Roaming (Johto Routes)',
    type: 'roaming' as const,
    isLegendary: true,
    validMaps,
    prerequisite: {
      type: 'event' as const,
      value: 'beatelitefourfoughtsuicune',
      displayName: 'Beat Elite Four & Fought Suicune',
    },
  }));
}

/**
 * Main extraction function
 */
async function extractStaticPokemon(): Promise<StaticPokemonManifest> {
  console.log('Extracting static Pokemon encounters...');

  const staticPokemon: StaticPokemon[] = [];

  // Get all map files
  const mapFiles = await readdir(mapsDir);
  const asmFiles = mapFiles.filter((f) => f.endsWith('.asm'));

  console.log(`  Found ${asmFiles.length} map files to scan`);

  // Process each map file
  for (const file of asmFiles) {
    const locationId = getLocationId(file);

    // Skip debug/test locations
    if (DEBUG_LOCATIONS.has(locationId)) {
      continue;
    }

    const filePath = join(mapsDir, file);
    const content = await readFile(filePath, 'utf-8');

    // Parse loadwildmon (static encounters)
    const staticFromFile = parseLoadWildmon(content, file);
    staticPokemon.push(...staticFromFile);

    // Parse givepoke (gift Pokemon)
    const giftsFromFile = parseGivePoke(content, file);
    staticPokemon.push(...giftsFromFile);
  }

  // Parse roaming maps and create roaming Pokemon entries
  const roamingMaps = await parseRoamingMaps();
  const roamingPokemon = createRoamingPokemon(roamingMaps);
  staticPokemon.push(...roamingPokemon);

  console.log(`  Found ${staticPokemon.filter((p) => p.type === 'static').length} static encounters`);
  console.log(`  Found ${staticPokemon.filter((p) => p.type === 'gift').length} gift Pokemon`);
  console.log(`  Found ${staticPokemon.filter((p) => p.type === 'roaming').length} roaming Pokemon`);

  // Deduplicate by id (keep first occurrence)
  const seenIds = new Set<string>();
  const deduplicatedPokemon = staticPokemon.filter((pokemon) => {
    if (seenIds.has(pokemon.id)) {
      return false;
    }
    seenIds.add(pokemon.id);
    return true;
  });

  console.log(`  Deduplicated: ${staticPokemon.length} -> ${deduplicatedPokemon.length} entries`);

  // Create manifest
  const manifest: StaticPokemonManifest = {
    staticPokemon: deduplicatedPokemon,
    roamingMaps: roamingMaps.map((m) => reduce(m)),
    lastUpdated: new Date().toISOString(),
  };

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  // Write manifest
  const outputPath = join(outputDir, 'static_pokemon_manifest.json');
  await writeFile(outputPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`  Wrote ${deduplicatedPokemon.length} total static Pokemon to manifest`);
  console.log('Static Pokemon extraction complete!');

  return manifest;
}

// Run extraction
await extractStaticPokemon();

export default extractStaticPokemon;
