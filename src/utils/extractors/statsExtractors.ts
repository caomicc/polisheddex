import path from 'node:path';
import fs from 'node:fs';
import type { Ability, DetailedStats } from "../../types/types.ts";
import { convertEggGroupCode, convertGenderCode, convertGrowthRateCode, convertHatchCode, toCapitalCaseWithSpaces, toTitleCase } from "../stringUtils.ts";
import { extractFormInfo } from '../extractors/formExtractors.ts';
import { sharedDescriptionGroups } from '../../data/constants.ts';
import { fileURLToPath } from 'node:url';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const ABILITY_DESCRIPTIONS_OUTPUT = path.join(__dirname, '../../../output/pokemon_ability_descriptions.json');

// --- Detailed Stats Extraction ---
export function extractDetailedStats(): Record<string, DetailedStats> {
  const detailedStatsDir = path.join(__dirname, '../../../rom/data/pokemon/base_stats');
  const detailedStatsFiles = fs.readdirSync(detailedStatsDir).filter(f => f.endsWith('.asm'));

  const detailedStats: Record<string, DetailedStats> = {};

  // Debug - Check if ho_oh.asm is in the files list
  console.log('Files to process:', detailedStatsFiles.length);
  console.log('Is ho_oh.asm present?', detailedStatsFiles.includes('ho_oh.asm'));

  for (const file of detailedStatsFiles) {
    const fileName = file.replace('.asm', '');

    // Debug for specific Pokémon
    if (fileName === 'ho_oh') {
      console.log('Processing ho_oh.asm file');
    }

    const content = fs.readFileSync(path.join(detailedStatsDir, file), 'utf8');
    const lines = content.split(/\r?\n/);

    // Extract the Pokemon name from the file name
    const { basePokemonName, formName } = extractFormInfo(fileName);
    let pokemonName = formName ? `${basePokemonName} ${formName}`.trim() : basePokemonName.trim();

    // Special case handling for Ho-Oh
    if (fileName === 'ho_oh') {
      pokemonName = 'Ho-Oh'; // Force the correct name format
    }

    // Special case handling for Porygon-Z
    if (fileName === 'porygon_z') {
      pokemonName = 'Porygon-Z'; // Force the correct name format
    }

    try {
      // Extract base stats (first line)
      // Format: db hp, atk, def, spe, sat, sdf ; BST
      const baseStatsLine = lines.find(l => l.trim().match(/^db\s+\d+,\s+\d+,\s+\d+,\s+\d+,\s+\d+,\s+\d+/));
      if (!baseStatsLine) {
        if (fileName === 'ho_oh') {
          console.log('No base stats line found for Ho-Oh, skipping');
          console.log('First few lines:', lines.slice(0, 5));
        }
        continue;
      }

      const baseStatsMatch = baseStatsLine.trim().match(/db\s+(\d+),\s+(\d+),\s+(\d+),\s+(\d+),\s+(\d+),\s+(\d+)/);
      if (!baseStatsMatch) continue;

      // Get BST from comment if available
      const bstMatch = baseStatsLine.match(/;\s*(\d+)\s*BST/);
      const bst = bstMatch ? parseInt(bstMatch[1], 10) : 0;

      const baseStats = {
        hp: parseInt(baseStatsMatch[1], 10),
        attack: parseInt(baseStatsMatch[2], 10),
        defense: parseInt(baseStatsMatch[3], 10),
        speed: parseInt(baseStatsMatch[4], 10),
        specialAttack: parseInt(baseStatsMatch[5], 10),
        specialDefense: parseInt(baseStatsMatch[6], 10),
        total: bst || 0 // Use calculated BST or 0 if not found
      };

      // Calculate the total if it wasn't provided
      if (baseStats.total === 0) {
        baseStats.total = baseStats.hp + baseStats.attack + baseStats.defense +
          baseStats.speed + baseStats.specialAttack + baseStats.specialDefense;
      }

      // Extract catch rate - Format: db NUM ; catch rate
      const catchRateLine = lines.find(l => l.trim().match(/^db\s+\d+\s*;\s*catch rate/));
      let catchRate = 255; // Default
      if (catchRateLine) {
        const catchRateMatch = catchRateLine.match(/db\s+(\d+)/);
        if (catchRateMatch) {
          catchRate = parseInt(catchRateMatch[1], 10);
        }
      }

      // Extract base exp - Format: db NUM ; base exp
      const baseExpLine = lines.find(l => l.trim().match(/^db\s+\d+\s*;\s*base exp/));
      let baseExp = 0;
      if (baseExpLine) {
        const baseExpMatch = baseExpLine.match(/db\s+(\d+)/);
        if (baseExpMatch) {
          baseExp = parseInt(baseExpMatch[1], 10);
        }
      }

      // Extract held items - Format: db ITEM1, ITEM2 ; held items
      const heldItemsLine = lines.find(l => l.trim().match(/^db.*;\s*held items/));
      const heldItems: string[] = [];
      if (heldItemsLine) {
        const heldItemsMatch = heldItemsLine.match(/db\s+([A-Z_]+)(?:,\s*([A-Z_]+))?/);
        if (heldItemsMatch) {
          if (heldItemsMatch[1] && heldItemsMatch[1] !== 'NO_ITEM') {
            heldItems.push(heldItemsMatch[1]);
          }
          if (heldItemsMatch[2] && heldItemsMatch[2] !== 'NO_ITEM') {
            heldItems.push(heldItemsMatch[2]);
          }
        }
      }

      // Extract gender ratio and hatch rate
      // Format: dn GENDER_XXX, HATCH_XXX ; gender ratio, step cycles to hatch
      const genderHatchLine = lines.find(l => l.trim().match(/^dn.*;\s*gender ratio/));
      let genderRatio = 'Unknown';
      let hatchRate = 'Unknown';

      if (genderHatchLine) {
        const genderHatchMatch = genderHatchLine.match(/dn\s+([A-Z_\d]+),\s*([A-Z_\d]+)/);
        if (genderHatchMatch) {
          // Convert gender ratio code to human-readable text
          const genderCode = genderHatchMatch[1];
          genderRatio = convertGenderCode(genderCode);

          // Convert hatch rate code to human-readable text
          const hatchCode = genderHatchMatch[2];
          hatchRate = convertHatchCode(hatchCode);
        }
      }      // Extract abilities - Format: abilities_for POKEMON, ABILITY1, ABILITY2, HIDDEN_ABILITY
      // Check for faithful vs non-faithful conditional abilities
      let faithfulAbilitiesLine: string | undefined;
      let nonFaithfulAbilitiesLine: string | undefined;
      let hasFaithfulConditional = false;
      const abilities: Array<Ability> = [];
      const faithfulAbilities: Array<Ability> = [];
      const updatedAbilities: Array<Ability> = [];

      // Debug for Pikachu
      if (pokemonName === 'Pikachu') {
        console.log('Looking for abilities for Pikachu...');
        console.log('File contains conditional blocks:', lines.some(l => l.includes('if DEF(FAITHFUL)')));
      }

      // First try to find a standard abilities_for line regardless of conditional blocks
      const standardAbilitiesLine = lines.find(l => l.trim().startsWith('abilities_for'));

      // console.log('Standard abilities line:', standardAbilitiesLine);

      // Look for conditional ability definitions
      let foundConditionalAbilities = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('if DEF(FAITHFUL)')) {
          hasFaithfulConditional = true;
          // Look for the abilities_for line within the faithful block
          for (let j = i + 1; j < lines.length; j++) {
            const innerLine = lines[j].trim();
            if (innerLine.startsWith('abilities_for')) {
              faithfulAbilitiesLine = innerLine;
              foundConditionalAbilities = true;
              if (pokemonName === 'Pikachu') {
                console.log('Found faithful abilities line:', faithfulAbilitiesLine);
              }
              break;
            }
            if (innerLine === 'else' || innerLine === 'endc') {
              break;
            }
          }
        } else if (hasFaithfulConditional && line === 'else') {
          // Look for the abilities_for line within the non-faithful block
          for (let j = i + 1; j < lines.length; j++) {
            const innerLine = lines[j].trim();
            if (innerLine.startsWith('abilities_for')) {
              nonFaithfulAbilitiesLine = innerLine;
              foundConditionalAbilities = true;
              if (pokemonName === 'Pikachu') {
                console.log('Found non-faithful abilities line:', nonFaithfulAbilitiesLine);
              }
              break;
            }
            if (innerLine === 'endc') {
              break;
            }
          }
        }
      }

      // console.log(`Found conditional abilities for ${pokemonName}:`, foundConditionalAbilities);

      // If no conditional abilities were found, use the standard abilities line
      if (!foundConditionalAbilities && standardAbilitiesLine) {
        faithfulAbilitiesLine = standardAbilitiesLine;
        nonFaithfulAbilitiesLine = standardAbilitiesLine; // Use the same line for both faithful and non-faithful abilities

        if (pokemonName === 'Pikachu') {
          console.log('Using standard abilities line:', standardAbilitiesLine);
        }
      } else if (pokemonName === 'Pikachu' && !foundConditionalAbilities && !standardAbilitiesLine) {
        console.log('No abilities line found for Pikachu');
      }// Process abilities
      if (faithfulAbilitiesLine) {
        // console.log(`Processing abilities for ${pokemonName}: ${faithfulAbilitiesLine}`);
        const faithfulMatch = faithfulAbilitiesLine.match(/abilities_for\s+([A-Z_0-9]+),\s*([A-Z_0-9]+)(?:,\s*([A-Z_0-9]+))?(?:,\s*([A-Z_0-9]+))?/);

        // Special debug for Pikachu
        if (pokemonName === "Pikachu") {
          console.log("PIKACHU DEBUG: Match result:", faithfulMatch);
        }

        if (faithfulMatch) {

          // console.log(`Faithful match found for ${pokemonName}:`, faithfulMatch);

          // Extract ability names from the faithful match - handle NO_ABILITY properly
          const faithfulPrimaryName = faithfulMatch[2] && faithfulMatch[2] !== 'NO_ABILITY' ? toCapitalCaseWithSpaces(faithfulMatch[2].trim()) : null;
          const faithfulSecondaryName = faithfulMatch[3] && faithfulMatch[3] !== 'NO_ABILITY' ? toCapitalCaseWithSpaces(faithfulMatch[3].trim()) : null;
          const faithfulHiddenName = faithfulMatch[4] && faithfulMatch[4] !== 'NO_ABILITY' ? toCapitalCaseWithSpaces(faithfulMatch[4].trim()) : null;

          // console.log(`Parsed abilities for ${pokemonName}: Primary: ${faithfulPrimaryName}, Secondary: ${faithfulSecondaryName}, Hidden: ${faithfulHiddenName}`);

          // Process non-faithful abilities if available
          let nonFaithfulPrimaryName = faithfulPrimaryName;
          let nonFaithfulSecondaryName = faithfulSecondaryName;
          let nonFaithfulHiddenName = faithfulHiddenName;

          // Check if there are actually different ability lines for faithful vs non-faithful versions
          let hasDistinctAbilities = false;

          if (nonFaithfulAbilitiesLine && nonFaithfulAbilitiesLine !== faithfulAbilitiesLine) {
            // console.log(`Processing non-faithful abilities for ${pokemonName}: ${nonFaithfulAbilitiesLine}`);
            const nonFaithfulMatch = nonFaithfulAbilitiesLine.match(/abilities_for\s+([A-Z_0-9]+),\s*([A-Z_0-9]+)(?:,\s*([A-Z_0-9]+))?(?:,\s*([A-Z_0-9]+))?/);
            if (nonFaithfulMatch) {
              nonFaithfulPrimaryName = nonFaithfulMatch[2] && nonFaithfulMatch[2] !== 'NO_ABILITY' ? toCapitalCaseWithSpaces(nonFaithfulMatch[2].trim()) : null;
              nonFaithfulSecondaryName = nonFaithfulMatch[3] && nonFaithfulMatch[3] !== 'NO_ABILITY' ? toCapitalCaseWithSpaces(nonFaithfulMatch[3].trim()) : null;
              nonFaithfulHiddenName = nonFaithfulMatch[4] && nonFaithfulMatch[4] !== 'NO_ABILITY' ? toCapitalCaseWithSpaces(nonFaithfulMatch[4].trim()) : null;

              // Check if the abilities are actually different between faithful and non-faithful versions
              hasDistinctAbilities =
                faithfulPrimaryName !== nonFaithfulPrimaryName ||
                faithfulSecondaryName !== nonFaithfulSecondaryName ||
                faithfulHiddenName !== nonFaithfulHiddenName;
            }
          }

          // Add primary ability to faithful abilities
          if (faithfulPrimaryName) {
            // console.log(`Adding faithful primary ability for ${pokemonName}: ${faithfulPrimaryName}`);
            const faithfulAbilityData: Ability = {
              name: faithfulPrimaryName,
              description: '', // Will be filled in later
              isHidden: false,
              abilityType: 'primary'
            };
            faithfulAbilities.push(faithfulAbilityData);
            abilities.push({ ...faithfulAbilityData }); // For backward compatibility
          }

          // Add secondary ability to faithful abilities
          if (faithfulSecondaryName) {
            // console.log(`Adding faithful secondary ability for ${pokemonName}: ${faithfulSecondaryName}`);
            const faithfulAbilityData: Ability = {
              name: faithfulSecondaryName,
              description: '', // Will be filled in later
              isHidden: false,
              abilityType: 'secondary'
            };
            faithfulAbilities.push(faithfulAbilityData);
            abilities.push({ ...faithfulAbilityData }); // For backward compatibility
          }

          // Add hidden ability to faithful abilities
          if (faithfulHiddenName) {
            // console.log(`Adding faithful hidden ability for ${pokemonName}: ${faithfulHiddenName}`);
            const faithfulAbilityData: Ability = {
              name: faithfulHiddenName,
              description: '', // Will be filled in later
              isHidden: true,
              abilityType: 'hidden'
            };
            faithfulAbilities.push(faithfulAbilityData);
            abilities.push({ ...faithfulAbilityData }); // For backward compatibility
          }

          // Only create separate updatedAbilities if they're actually different from faithful abilities
          if (hasDistinctAbilities) {
            // console.log(`Creating updated abilities for ${pokemonName} since they differ from faithful abilities`);
            // Add abilities to the updated abilities array since they differ from faithful
            if (nonFaithfulPrimaryName) {
              const updatedAbilityData: Ability = {
                name: nonFaithfulPrimaryName,
                description: '', // Will be filled in later
                isHidden: false,
                abilityType: 'primary'
              };
              updatedAbilities.push(updatedAbilityData);
            }

            if (nonFaithfulSecondaryName) {
              // console.log(`Adding non-faithful secondary ability for ${pokemonName}: ${nonFaithfulSecondaryName}`);
              const updatedAbilityData: Ability = {
                name: nonFaithfulSecondaryName,
                description: '', // Will be filled in later
                isHidden: false,
                abilityType: 'secondary'
              };
              updatedAbilities.push(updatedAbilityData);
            }

            if (nonFaithfulHiddenName) {
              // console.log(`Adding non-faithful hidden ability for ${pokemonName}: ${nonFaithfulHiddenName}`);
              const updatedAbilityData: Ability = {
                name: nonFaithfulHiddenName,
                description: '', // Will be filled in later
                isHidden: true,
                abilityType: 'hidden'
              };
              updatedAbilities.push(updatedAbilityData);
            }
          } else {
            // If the abilities are identical, use an empty array for updatedAbilities
            // This will signal that the updatedAbilities are the same as faithfulAbilities
            updatedAbilities.length = 0; // Clear any existing entries
          }
        }
      }

      // Extract growth rate - Format: db GROWTH_XXX ; growth rate
      const growthRateLine = lines.find(l => l.trim().match(/^db\s+GROWTH_[A-Z_]+\s*;\s*growth rate/));
      let growthRate = 'Medium';

      if (growthRateLine) {
        const growthRateMatch = growthRateLine.match(/db\s+(GROWTH_[A-Z_]+)/);
        if (growthRateMatch) {
          growthRate = convertGrowthRateCode(growthRateMatch[1]);
        }
      }

      // Extract egg groups - Format: dn EGG_GROUP1, EGG_GROUP2 ; egg groups
      const eggGroupsLine = lines.find(l => l.trim().match(/^dn.*;\s*egg groups/));
      const eggGroups: string[] = [];

      if (eggGroupsLine) {
        const eggGroupsMatch = eggGroupsLine.match(/dn\s+([A-Z_]+)(?:,\s*([A-Z_]+))?/);
        if (eggGroupsMatch) {
          if (eggGroupsMatch[1]) {
            eggGroups.push(convertEggGroupCode(eggGroupsMatch[1]));
          }
          if (eggGroupsMatch[2]) {
            eggGroups.push(convertEggGroupCode(eggGroupsMatch[2]));
          }
        }
      }

      // Extract EV yield - Format: ev_yield NUM STAT
      const evYieldLine = lines.find(l => l.trim().startsWith('ev_yield'));
      let evYield = 'None';

      if (evYieldLine) {
        const evYieldMatch = evYieldLine.match(/ev_yield\s+(\d+)\s+([A-Za-z]+)/);
        if (evYieldMatch) {
          evYield = `${evYieldMatch[1]} ${evYieldMatch[2]}`;
        }
      }

      // Add the detailed stats to our result
      // For updatedAbilities, only use fallbacks if there are distinct abilities
      detailedStats[pokemonName] = {
        baseStats,
        catchRate,
        baseExp,
        heldItems,
        genderRatio,
        hatchRate,
        abilities: abilities.length > 0 ? abilities : [],
        faithfulAbilities: faithfulAbilities.length > 0 ? faithfulAbilities : abilities.length > 0 ? abilities : [],
        // Keep updatedAbilities empty if we explicitly cleared it (meaning abilities are identical)
        updatedAbilities: updatedAbilities,
        growthRate,
        eggGroups,
        evYield
      };
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error);
    }
  }

  // Write the detailedStats to a JSON file for use in the app
  const outputPath = path.join(__dirname, '../../../output/pokemon_detailed_stats.json');
  fs.writeFileSync(outputPath, JSON.stringify(detailedStats, null, 2));
  console.log('Detailed stats extracted to', outputPath);

  // Debug check for Ho-Oh
  console.log('Is Ho-Oh in detailedStats?', 'Ho-Oh' in detailedStats);
  if (!('Ho-Oh' in detailedStats)) {
    // Log all keys to see what's there
    console.log('All keys in detailedStats:', Object.keys(detailedStats).filter(k => k.includes('Ho') || k.includes('Oh')));
  }

  return detailedStats;
}
/**
 * Extracts body data from a line and adds it to the detailed stats object for a Pokémon.
 * @param line - The body_data line from the ASM file.
 * @param detailedStats - The detailed stats object to update.
 * @returns The updated detailed stats object with body data fields.
 */
export function addBodyDataToDetailedStats(
  line: string,
  detailedStats: DetailedStats
): DetailedStats {
  // Example line: body_data   7,   69, QUADRUPED,    GREEN  ; BULBASAUR
  const bodyDataRegex = /body_data\s+(\d+),\s*(\d+),\s*([A-Z_]+),\s*([A-Z_]+)\s*;\s*(.+)/;
  const match = line.match(bodyDataRegex);
  if (!match) return detailedStats;

  console.log('Extracting body data from line:', line, match);

  const [, height, weight, shape, color] = match;

  // Add body data to detailedStats
  return {
    ...detailedStats,
    height: Number(height),
    weight: Number(weight),
    bodyShape: toTitleCase(shape),
    bodyColor: toTitleCase(color),
  };
}

export function extractAbilityDescriptions() {
  const abilityNamesPath = path.join(__dirname, '../../../rom/data/abilities/names.asm');
  const abilityDescriptionsPath = path.join(__dirname, '../../../rom/data/abilities/descriptions.asm');

  const namesData = fs.readFileSync(abilityNamesPath, 'utf8');
  const descData = fs.readFileSync(abilityDescriptionsPath, 'utf8');

  console.log('Extracting ability descriptions...');

  // Parse ability names (order matters)
  // First get the ability identifiers from the table at the beginning
  console.log('Parsing ability name IDs...', namesData);
  console.log('Names data length:', namesData.length);
  const nameIds = namesData.split(/\r?\n/)
    .filter(l => l.trim().startsWith('dw '))
    .map(l => l.trim().replace(/^dw\s+/, '')) // Ensure space after 'dw'
    .map(id => id.replace(/([a-z])([A-Z])/g, '$1 $2'))
    .filter(Boolean);

  console.log('Ability name IDs found:', nameIds.length, [...nameIds]);

  // Then get the actual string names from the rawchar definitions
  const abilityNameMap: Record<string, string> = {};

  console.log('Parsing ability names...');
  const rawNameMatches = namesData.matchAll(/^(\w+):\s+rawchar\s+"([^@]+)@"/gm);
  console.log('Raw name matches found:', [...rawNameMatches].length);
  console.log('rawNameMatches', [...rawNameMatches]);

  // Debug the rawchar matching
  console.log('Raw name matches found:', [...namesData.matchAll(/^(\w+):\s+rawchar\s+"([^@]+)@"/gm)].length);

  for (const match of rawNameMatches) {
    const [, id, name] = match;
    abilityNameMap[id] = name;
  }

  console.log('Ability name map entries:', Object.keys(abilityNameMap).length);

  // Map the ids to their corresponding names
  const abilityNames = nameIds.map(id => abilityNameMap[toTitleCase(id)] || toTitleCase(id));


  console.log('Ability names parsed:', abilityNames.length, abilityNames, 'abilities');

  // Parse descriptions by label name
  const descLines = descData.split(/\r?\n/);
  console.log('Parsing ability descriptions...');
  console.log('Description lines found:', descLines.length, [...descLines.slice(0, 10)]); // Show first 10 lines for context
  const descMap: Record<string, string> = {};
  let currentLabels: string[] = [];
  let collecting = false;
  let buffer: string[] = [];
  for (const line of descLines) {
    const labelMatch = line.match(/^([A-Za-z0-9_]+)Description:/);
    console.log('Processing line:', line.trim(), labelMatch ? labelMatch[1] : null);
    if (labelMatch) {
      if (currentLabels.length && buffer.length) {
        for (const label of currentLabels) {
          const normalizedLabel = toTitleCase(label);
          descMap[normalizedLabel] = buffer.join(' ');
        }
      }
      // Start a new group of labels
      const normalizedLabel = labelMatch[1].replace(/([a-z])([A-Z])/g, '$1 $2');
      console.log('Found new label: normalizedLabel', normalizedLabel);
      currentLabels = [normalizedLabel];
      buffer = [];
      collecting = false;
    } else if (line.match(/^\s*[A-Za-z0-9_]+Description:/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)Description:/);
      if (match) {
        const extraLabel = toTitleCase(match[1]);
        currentLabels.push(extraLabel);
      }
    } else if (line.trim().startsWith('text ')) {
      collecting = true;
      buffer.push(line.replace('text ', '').replace(/"/g, ''));
    } else if (line.trim().startsWith('next ')) {
      buffer.push(line.replace('next ', '').replace(/"/g, ''));
    } else if (line.trim() === 'done') {
      collecting = false;
    } else if (collecting && line.trim()) {
      buffer.push(line.trim().replace(/"/g, ''));
    }
  }
  if (currentLabels.length && buffer.length) {
    for (const label of currentLabels) {
      const normalizedLabel = toTitleCase(label);
      descMap[normalizedLabel] = buffer.join(' ');
    }
  }

  // Map ability names to their description
  const abilityDescByName: Record<string, { description: string }> = {};
  for (let i = 0; i < abilityNames.length; i++) {
    const normalizedAbilityName = toTitleCase(abilityNames[i]);
    const desc = descMap[normalizedAbilityName] || '';
    abilityDescByName[normalizedAbilityName] = {
      description: desc
    };
  }

  // Apply shared descriptions
  for (const [primary, aliasList] of Object.entries(sharedDescriptionGroups)) {
    const primaryDesc = abilityDescByName[primary];
    if (primaryDesc) {
      for (const alias of aliasList) {
        abilityDescByName[alias] = primaryDesc;
      }
    }
  }

  // Save to a JSON file for reference
  fs.writeFileSync(ABILITY_DESCRIPTIONS_OUTPUT, JSON.stringify(abilityDescByName, null, 2));
  console.log('Ability descriptions extracted to', ABILITY_DESCRIPTIONS_OUTPUT);

  return abilityDescByName;
}

