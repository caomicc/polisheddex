import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { toCapitalCaseWithSpaces } from './stringUtils.ts';
import { normalizeMoveString } from './stringNormalizer/stringNormalizer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TM_HM_LEARNSET_OUTPUT = path.join(__dirname, '../../output/pokemon_tm_hm_learnset.json');

/**
 * Extracts TM/HM learnsets for all Pokémon from base stats files
 *
 * This function reads through all Pokémon base stat files in the ROM data
 * and extracts the TM/HM moves each Pokémon can learn.
 *
 * @returns Record<string, string[]> - Object mapping Pokémon names to arrays of learnable TM/HM moves
 */
export function extractTmHmLearnsets(): void {
  const baseStatsDir = path.join(__dirname, '../../rom/data/pokemon/base_stats');
  const baseStatsFiles = fs.readdirSync(baseStatsDir).filter(f => f.endsWith('.asm'));

  const tmHmLearnsets: Record<string, string[]> = {};

  console.log(`Processing ${baseStatsFiles.length} Pokémon base stat files for TM/HM learnsets...`);

  for (const file of baseStatsFiles) {
    const filePath = path.join(baseStatsDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileName = file.replace('.asm', '');

    // Create the standard Pokémon key - we'll use title case of the filename
    // This matches the format used in other extractors
    const pokemonKey = toCapitalCaseWithSpaces(fileName);

    // Find TM/HM learnset section in the file
    // Looking for the "; tm/hm learnset" comment followed by "tmhm" lines
    const lines = fileContent.split(/\r?\n/);
    let collectingTmHm = false;
    const tmHmMoves: string[] = [];

    for (const line of lines) {
      // Start collecting when we find the TM/HM learnset comment
      if (line.includes('; tm/hm learnset')) {
        collectingTmHm = true;
        continue;
      }

      // Stop collecting when we reach the end marker
      if (collectingTmHm && line.includes('; end')) {
        collectingTmHm = false;
        continue;
      }

      // While collecting, extract moves from each line that has the "tmhm" prefix
      if (collectingTmHm && line.trim()) {
        // In the aerodactyl.asm example, the line starts with "tmhm" and contains a comma-separated list of moves
        if (line.trim().startsWith('tmhm ')) {
          const movesPart = line.replace(/tmhm\s*/, '').trim();
          extractMovesFromLine(movesPart, tmHmMoves);
        }
      }
    }

    // Store the moves for this Pokémon
    if (tmHmMoves.length > 0) {
      tmHmLearnsets[pokemonKey] = tmHmMoves;
      console.log(`Extracted ${tmHmMoves.length} TM/HM moves for ${pokemonKey}`);
    }
  }

  // Normalize move names for consistency
  for (const pokemon in tmHmLearnsets) {
    tmHmLearnsets[pokemon] = tmHmLearnsets[pokemon].map(move => normalizeMoveString(move));
  }

  // Write the learnsets to the output file
  fs.writeFileSync(TM_HM_LEARNSET_OUTPUT, JSON.stringify(tmHmLearnsets, null, 2));
  console.log(`TM/HM learnsets extracted to ${TM_HM_LEARNSET_OUTPUT}`);
}

/**
 * Helper function to extract move names from a line of text
 *
 * @param line - Line of text containing move names
 * @param movesList - Array to append extracted moves to
 */
function extractMovesFromLine(line: string, movesList: string[]): void {
  // Clean the line and extract move names
  // Remove any comments (starting with ;)
  let cleanedLine = line.split(';')[0].trim();
  cleanedLine = cleanedLine.replace(/,$/, ''); // Remove trailing comma

  // Split the line by commas and extract move names
  const moves = cleanedLine.split(',').map(m => m.trim()).filter(Boolean);

  for (const move of moves) {
    // Format the move name properly (e.g., DRAGON_CLAW -> Dragon Claw)
    const formattedMove = toCapitalCaseWithSpaces(move);

    // Add the move if it's not already in the list
    if (!movesList.includes(formattedMove)) {
      movesList.push(formattedMove);
    }
  }
}
