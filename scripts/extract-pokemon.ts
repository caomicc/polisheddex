import { readFile, readdir, writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  ComprehensivePokemonData,
  EvolutionManifest,
  MoveData,
  PokemonData,
  PokemonManifest,
  PokemonMovesets,
} from '@/types/new';
import { reduce } from '@/lib/extract-utils';
import splitFile from '@/lib/split';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pokemonData: Record<string, PokemonData[]> = {
  polished: [],
  faithful: [],
};

const mergedPokemon: ComprehensivePokemonData[] = [];
const movesManifest: Record<string, MoveData> = {};
const pokemonMovesets: Record<string, Record<string, PokemonMovesets>> = {};
const pokemonTMCompatibility: Record<string, Record<string, string[]>> = {};
const evolutionChains: Record<string, EvolutionManifest> = {};

//Paths
const namesASM = join(__dirname, '../polishedcrystal/data/pokemon/names.asm');
const formsASM = join(__dirname, '../polishedcrystal/constants/pokemon_constants.asm');
const monDIR = join(__dirname, '../polishedcrystal/data/pokemon/base_stats/');
const movesASM = join(__dirname, '../polishedcrystal/data/moves/moves.asm');
const moveNamesASM = join(__dirname, '../polishedcrystal/data/moves/names.asm');
const moveDescriptionsASM = join(__dirname, '../polishedcrystal/data/moves/descriptions.asm');
const evoAttacksASM = join(__dirname, '../polishedcrystal/data/pokemon/evos_attacks.asm');
const eggMovesASM = join(__dirname, '../polishedcrystal/data/pokemon/egg_moves.asm');

const extractMoves = (
  movesData: string[],
  moveNamesData: string[],
  moveDescriptionsData: string[],
) => {
  const moveLines = movesData.filter(
    (line) => line.trim().startsWith('move ') && !line.includes('MACRO') && !line.includes('ENDM'),
  );

  const nameLines = moveNamesData.filter((line) => line.trim().startsWith('li "'));

  // Parse descriptions into a map
  const descriptions: Record<string, string> = {};

  for (let i = 0; i < moveDescriptionsData.length; i++) {
    const line = moveDescriptionsData[i].trim();

    // Find description labels (e.g., "AcrobaticsDescription:")
    if (line.endsWith('Description:')) {
      const moveLabels = []; // Store all labels that share the same description
      let currentIndex = i;

      // Collect all consecutive description labels
      while (
        currentIndex < moveDescriptionsData.length &&
        moveDescriptionsData[currentIndex].trim().endsWith('Description:')
      ) {
        const labelLine = moveDescriptionsData[currentIndex].trim();
        const moveDescriptionName = labelLine.replace('Description:', '');
        const moveId = reduce(moveDescriptionName);
        moveLabels.push(moveId);
        currentIndex++;
      }

      // Parse the description text that follows all the labels
      let description = '';
      i = currentIndex; // Start from after all labels

      while (i < moveDescriptionsData.length) {
        const descLine = moveDescriptionsData[i].trim();

        if (descLine === 'done') {
          break; // End of this description
        }

        // Check if we've hit the next description label (stop condition for db format)
        if (descLine.endsWith('Description:')) {
          i--; // Step back so outer loop will process this label
          break;
        }

        // Extract text from 'text "..."', 'next "..."', or 'db "..."' lines (with flexible spacing)
        if (
          descLine.startsWith('text "') ||
          descLine.startsWith('next "') ||
          descLine.match(/^db\s+"/) // Allow flexible spacing after db
        ) {
          let textContent = descLine.replace(/^(text|next|db)\s*"/, '').replace(/"$/, '');

          // Handle special @ terminator (like in Thunder Wave)
          let isEndOfDescription = false;
          if (textContent.endsWith('@')) {
            textContent = textContent.replace('@', '').trim();
            isEndOfDescription = true;
          }

          // Add the text content
          if (description) {
            description += ' ' + textContent; // Add space between lines
          } else {
            description = textContent;
          }

          description = description.replace(/-\s+/g, '').replace(/#mon/g, 'Pokemon').trim(); // Clean up extra spaces

          // Break after adding the content if @ was found
          if (isEndOfDescription) {
            break; // @ indicates end of description
          }
        }

        i++;
      }

      // Assign the same description to all moves that shared the labels
      for (const moveId of moveLabels) {
        descriptions[moveId] = description;
      }
    }
  }

  for (let i = 0; i < moveLines.length && i < nameLines.length; i++) {
    const moveLine = moveLines[i].trim();
    const nameLine = nameLines[i].trim();

    // Parse move data: move ACROBATICS, EFFECT_CONDITIONAL_BOOST, 55, FLYING, 100, 15, 0, PHYSICAL
    const parts = moveLine.split(',');
    if (parts.length >= 8) {
      const moveId: string = reduce(parts[0].replace('move ', '').trim());
      const power = parseInt(parts[2].trim());
      const type = reduce(parts[3].trim());
      const accuracy = parseInt(parts[4].trim());
      const pp = parseInt(parts[5].trim());
      const category = reduce(parts[7].trim());

      // Extract name: li "Acrobatics"
      const name = nameLine.replace('li "', '').replace('"', '').trim();

      movesManifest[moveId] = {
        name: name,
        power: power,
        type: type,
        accuracy: accuracy,
        pp: pp,
        category: category,
        description: descriptions[moveId] || '',
      };
    }
  }
};

const extractEvolutions = (evoAttacksData: string[], version: string) => {
  const lines = evoAttacksData;
  let currentPokemon: PokemonData['name'] = '';
  let currentPokemonForm: string = 'plain';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Find Pokemon section: evos_attacks PokemonName
    if (line.startsWith('evos_attacks ')) {
      const romName = line.replace('evos_attacks ', '').trim();
      currentPokemon = reduce(romName);
    }

    currentPokemonForm =
      currentPokemon.match(/(plain|alolan|galarian|hisuian|paldean)$/)?.[1] || 'plain';

    // Parse evolution data: evo_data EVOLVE_TYPE, param, EVOLUTION_NAME[, FORM]
    if (line.startsWith('evo_data ') && currentPokemon) {
      const parts = line.split(',');
      if (parts.length >= 3) {
        const evolutionName = reduce(parts[2].trim());
        let evolutionForm = 'plain';

        // Handle form-specific evolutions (e.g., ARCANINE, HISUIAN_FORM)
        if (parts.length >= 4 && parts[3].includes('_FORM') && !parts[3].includes('NO_FORM')) {
          const formName = reduce(parts[3].trim().replace('_FORM', ''));
          evolutionForm = formName;
        }

        const basePokemon = currentPokemon.replace(/(plain|alolan|galarian|hisuian|paldean)$/i, '');

        // evolutionName = evolutionName + evolutionForm;

        if (!(version in evolutionChains)) {
          evolutionChains[version] = {};
        }
        if (!evolutionChains[version][basePokemon]) {
          evolutionChains[version][basePokemon] = {};
        }
        if (!evolutionChains[version][basePokemon][currentPokemonForm]) {
          evolutionChains[version][basePokemon][currentPokemonForm] = [];
        }
        evolutionChains[version][basePokemon][currentPokemonForm].push({
          name: evolutionName,
          form: evolutionForm,
        });
      }
    }
  }
};

const extractPokemonMovesets = (evoAttacksData: string[], version: string | number) => {
  const lines = evoAttacksData;
  let currentPokemon: PokemonData['name'] = '';
  const versionKey = String(version);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Find Pokemon section: evos_attacks PokemonName
    if (line.startsWith('evos_attacks ')) {
      const romName = line.replace('evos_attacks ', '').trim();
      // Keep the full ROM name as key to preserve form-specific movesets
      currentPokemon = reduce(romName);

      if (!(versionKey in pokemonMovesets)) {
        pokemonMovesets[versionKey] = {};
      }
      if (!pokemonMovesets[versionKey][currentPokemon]) {
        pokemonMovesets[versionKey][currentPokemon] = {
          levelUp: [], // level and name
          tm: [], // name only
          eggMoves: [], // name only
        };
      }
    }

    // Find learnset entries: learnset level, MOVE_NAME
    if (line.startsWith('learnset ') && currentPokemon) {
      const parts = line.replace('learnset ', '').split(',');
      if (parts.length >= 2) {
        const level = parseInt(parts[0].trim());
        const movePart = parts[1].trim();
        const move = reduce(movePart.split(';')[0]);
        if (!pokemonMovesets[versionKey][currentPokemon]) {
          pokemonMovesets[versionKey][currentPokemon] = {
            levelUp: [],
            tm: [],
            eggMoves: [],
          };
        }
        if (pokemonMovesets[versionKey][currentPokemon]) {
          // Add the move to the levelUp array
          pokemonMovesets[versionKey][currentPokemon].levelUp!.push({
            name: move,
            level,
          });
        }
      }
    }
  }

  // After processing all movesets, handle inheritance for forms without explicit movesets
  handleMovesetInheritance(versionKey);
};

// Helper function to handle moveset inheritance for forms without explicit movesets
// literally only raticate and raticatealolan
const handleMovesetInheritance = (versionKey: string) => {
  const currentPokemonData = pokemonData[versionKey];

  for (const pokemon of currentPokemonData) {
    const baseName = pokemon.name;
    const plainFormKey = reduce(baseName + 'Plain');
    const plainMovesets = pokemonMovesets[versionKey]?.[plainFormKey];

    if (plainMovesets && pokemon.forms) {
      // Check each form of this Pokemon
      for (const [formName] of Object.entries(pokemon.forms)) {
        if (formName === 'plain') continue; // Skip plain form as it's the source

        const formKey = reduce(baseName + (formName.charAt(0).toUpperCase() + formName.slice(1)));

        // If this form doesn't have movesets defined, inherit from plain form
        if (
          !pokemonMovesets[versionKey]?.[formKey] ||
          pokemonMovesets[versionKey][formKey].levelUp?.length === 0
        ) {
          if (!pokemonMovesets[versionKey]) {
            pokemonMovesets[versionKey] = {};
          }

          // Deeeeeep copy the plain form's movesets
          pokemonMovesets[versionKey][formKey] = {
            levelUp: plainMovesets.levelUp ? [...plainMovesets.levelUp] : [],
            tm: plainMovesets.tm ? [...plainMovesets.tm] : [],
            eggMoves: plainMovesets.eggMoves ? [...plainMovesets.eggMoves] : [],
          };
        }
      }
    }
  }
};

const extractEggMoves = (eggMovesData: string[], version: string | number) => {
  const lines = eggMovesData;
  let currentPokemon: PokemonData['name'] = '';
  const versionKey = String(version);
  const eggMovesByPokemon: Record<string, string[]> = {};

  // First pass: extract all egg moves by Pokemon name
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Find Pokemon section: PokemonNameEggSpeciesMoves:
    if (line.endsWith('EggSpeciesMoves:')) {
      const pokemonName = line.replace('EggSpeciesMoves:', '');
      currentPokemon = reduce(pokemonName);
      eggMovesByPokemon[currentPokemon] = [];
      continue;
    }

    // Skip non-move lines (dp lines, $ff terminators, etc.)
    if (!line.startsWith('db ') || line.includes('$ff')) {
      continue;
    }

    // Extract move name
    if (line.startsWith('db ') && currentPokemon) {
      const moveName = line.replace('db ', '').trim();
      const move = reduce(moveName.split(';')[0]);
      eggMovesByPokemon[currentPokemon].push(move);
    }
  }

  // Second pass: propagate egg moves to entire evolution families
  // The key insight: if a Pokemon has egg moves in the ROM, ALL Pokemon in that evolution line should get them
  for (const [pokemonWithEggMoves, eggMoves] of Object.entries(eggMovesByPokemon)) {
    if (eggMoves.length === 0) continue;

    // Extract base name and form from the Pokemon with egg moves
    const baseNameMatch = pokemonWithEggMoves.match(
      /^([a-z]+?)(plain|alolan|galarian|hisuian|paldean)?$/i,
    );
    const baseName = baseNameMatch ? baseNameMatch[1] : pokemonWithEggMoves;
    const sourceForm = baseNameMatch ? baseNameMatch[2] || 'plain' : 'plain';

    // Apply these egg moves to all forms and evolutions of this Pokemon family
    for (const [targetPokemon] of Object.entries(pokemonMovesets[versionKey] || {})) {
      const targetBaseNameMatch = targetPokemon.match(
        /^([a-z]+?)(plain|alolan|galarian|hisuian|paldean)?$/i,
      );
      const targetBaseName = targetBaseNameMatch ? targetBaseNameMatch[1] : targetPokemon;
      const targetForm = targetBaseNameMatch ? targetBaseNameMatch[2] || 'plain' : 'plain';

      // Check if this Pokemon belongs to the same evolution family and has the same form
      const sameForm = sourceForm === targetForm;
      const sameBaseFamily = targetBaseName === baseName;
      const inEvolutionFamily = isInSameEvolutionFamily(targetBaseName, baseName, versionKey);

      if (sameForm && (sameBaseFamily || inEvolutionFamily)) {
        if (pokemonMovesets[versionKey][targetPokemon]) {
          // Only set egg moves if the Pokemon doesn't already have them
          if (pokemonMovesets[versionKey][targetPokemon].eggMoves?.length === 0) {
            pokemonMovesets[versionKey][targetPokemon].eggMoves = [...eggMoves];
          }
        }
      }
    }
  }

  // Third pass: inherit egg moves from plain form for Pokemon forms that don't have specific egg moves
  for (const [targetPokemon, movesets] of Object.entries(pokemonMovesets[versionKey] || {})) {
    if (!movesets.eggMoves || movesets.eggMoves.length === 0) {
      const targetBaseNameMatch = targetPokemon.match(
        /^([a-z]+?)(plain|alolan|galarian|hisuian|paldean)?$/i,
      );
      const targetBaseName = targetBaseNameMatch ? targetBaseNameMatch[1] : targetPokemon;
      const targetForm = targetBaseNameMatch ? targetBaseNameMatch[2] || 'plain' : 'plain';

      // Skip if this is already the plain form
      if (targetForm === 'plain') continue;

      // Look for the plain form of the same Pokemon
      const plainFormKey = reduce(targetBaseName + 'Plain');
      const plainFormMovesets = pokemonMovesets[versionKey][plainFormKey];

      if (
        plainFormMovesets &&
        plainFormMovesets.eggMoves &&
        plainFormMovesets.eggMoves.length > 0
      ) {
        movesets.eggMoves = [...plainFormMovesets.eggMoves];
      }
    }
  }
};

// Helper function to check if two Pokemon are in the same evolution family
const isInSameEvolutionFamily = (pokemon1: string, pokemon2: string, formKey: string): boolean => {
  const chains = evolutionChains[formKey];
  if (!chains) return false;
  // Check if pokemon1 evolves from or to pokemon2
  const findAllConnected = (pokemon: string, visited = new Set<string>()): Set<string> => {
    if (visited.has(pokemon)) return visited;
    visited.add(pokemon);

    if (chains[pokemon]) {
      for (const evolutions of Object.values(chains[pokemon])) {
        for (const evolution of evolutions) {
          findAllConnected(evolution.name, visited);
        }
      }
    }
    // Find all Pokemon that evolve into this one
    for (const [basePokemon, formEvolutions] of Object.entries(chains)) {
      for (const evolutions of Object.values(formEvolutions)) {
        if (evolutions.some((evolution) => evolution.name === pokemon)) {
          findAllConnected(basePokemon, visited);
        }
      }
    }

    return visited;
  };

  const connectedToPokemon1 = findAllConnected(pokemon1);
  return connectedToPokemon1.has(pokemon2);
};

const extractNames = (data: string[], version: string) => {
  let dexNo = 1;
  for (let lineNo = 0; lineNo < data.length; lineNo++) {
    //Skips undesirable lines
    if (
      !data[lineNo].startsWith('rawchar ') ||
      data[lineNo].includes('?000?') ||
      data[lineNo].includes('Egg') ||
      data[lineNo].includes('?256?')
    ) {
      continue;
    }
    if (data[lineNo].includes('Dudunsparc')) {
      pokemonData[version].push({
        id: 'dudunsparce',
        name: 'Dudunsparce',
        dexNo: dexNo,
        forms: {
          plain: {
            formNumber: 1,
            types: [],
            abilities: [],
            baseStats: {
              hp: 0,
              attack: 0,
              defense: 0,
              specialAttack: 0,
              specialDefense: 0,
              speed: 0,
            },
          },
        },
      });
      dexNo++;
      continue;
    }

    pokemonData[version]?.push({
      id: reduce(data[lineNo].slice(9, -1)),
      name: data[lineNo].slice(9, -1),
      dexNo: dexNo,
      forms: {
        plain: {
          formNumber: 1,
          types: [],
          abilities: [],
          baseStats: {
            hp: 0,
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
        },
      },
    });
    dexNo++;
  }
};

const extractForms = (data: string[], pokemonForm: string) => {
  //Has Form
  for (let lineNo = 0; lineNo < data.length; lineNo++) {
    //Non-Regional Forms
    if (data[lineNo].startsWith('ext_const_def')) {
      //Get the name of the Pokemon
      const name = data[lineNo - 1].slice(2);
      while (data[lineNo].startsWith('ext_const')) {
        //Skip undesirable lines
        if (!data[lineNo].includes(';')) {
          lineNo++;
          continue;
        }
        const form = data[lineNo].split(';');
        form[0] = form[0].slice(10);
        form[0] = form[0].slice(form[0].indexOf('_') + 1).trim();
        form[0] = form[0].slice(0, -5).toLowerCase();
        const formNumber = parseInt(form[1].trim().slice(form[1].trim().indexOf('(') + 1, -1), 16);

        //Skip non-plain forms with formNumber 1 to avoid duplicates
        if (formNumber === 1 && form[0] !== 'plain') {
          lineNo++;
          continue;
        }

        const mon = pokemonData[pokemonForm]?.find((mon) => mon['id'] === reduce(name));

        if (mon?.forms) {
          mon.forms[reduce(form[0])] = {
            formNumber: formNumber,
            types: [],
            abilities: [],
            baseStats: {
              hp: 0,
              attack: 0,
              defense: 0,
              specialAttack: 0,
              specialDefense: 0,
              speed: 0,
            },
          };
        }
        lineNo++;
      }
    }

    //Regional Forms
    if (data[lineNo].includes('FORM EQU ')) {
      const formName = data[lineNo].slice(4, data[lineNo].indexOf('_')).toLowerCase();
      const formNo = parseInt(data[lineNo].slice(-1));
      //Run through all the Pokemon that have that Regional Form
      lineNo++;
      while (data[lineNo].startsWith('const_skip')) {
        let name = data[lineNo].slice(data[lineNo].indexOf(';') + 2);
        name = name.slice(name.indexOf(' ') + 1);

        //Add it in!
        const mon = pokemonData[pokemonForm]?.find((mon) => mon['id'] === reduce(name));
        if (mon?.forms) {
          mon.forms[reduce(formName)] = {
            formNumber: formNo,
            types: [],
            abilities: [],
            baseStats: {
              hp: 0,
              attack: 0,
              defense: 0,
              specialAttack: 0,
              specialDefense: 0,
              speed: 0,
            },
          };
        }
        lineNo++;
      }
    }
  }
};

const extractMon = (data: string[], pokemonForm: string) => {
  //Parse all the data
  const abilitiesLine = data.find((line: string) => line.startsWith('abilities_for'));
  if (!abilitiesLine) {
    throw new Error('No abilities_for line found in data');
  }

  const firstPart = abilitiesLine.split(',').at(0);
  if (!firstPart) {
    throw new Error('Unable to parse abilities_for line');
  }

  const name_form = firstPart.split(' ').at(-1);
  if (!name_form) {
    throw new Error('Unable to extract name_form from abilities_for line');
  }

  const typeLine = data.find((line: string) => line.endsWith('type'));
  if (!typeLine) {
    throw new Error('No type line found in data');
  }
  let types: PokemonData['types'] = typeLine
    .slice(3, -7)
    .split(',')
    .map((type) => reduce(type.trim()));
  if (types[0] === types[1]) {
    types = [types[0]];
  }

  let abilities = abilitiesLine.split(',').slice(1);
  abilities = abilities.map((ability) => reduce(ability.trim()));

  const bstLine = data.find((line: string) => line.endsWith('BST'));
  if (!bstLine) {
    throw new Error('No BST line found in data');
  }

  const bstStrings = bstLine.slice(3, -9).split(',');
  const bstValues = bstStrings.map((bst) => parseInt(bst.trim()));
  const bsts: PokemonData['baseStats'] = {
    hp: bstValues[0],
    attack: bstValues[1],
    defense: bstValues[2],
    specialAttack: bstValues[3],
    specialDefense: bstValues[4],
    speed: bstValues[5],
  };

  const growthRateLine = data.find((line: string) => line.includes('db GROWTH'));
  if (!growthRateLine) {
    throw new Error('No growth rate line found in data');
  }
  const growthRate = reduce(growthRateLine.slice(3).split(';').at(0)?.trim() || '');

  const genderLine = data.find((line: string) => line.includes('GENDER'));
  if (!genderLine) {
    throw new Error('No gender line found in data');
  }
  const hasGender =
    genderLine.slice(3).split(',').at(0)?.trim() === 'GENDER_UNKNOWN' ? false : true;

  // Extract TM/HM moves
  const tmLine = data.find((line: string) => line.trim().startsWith('tmhm '));
  let tmMoves: string[] = [];
  if (tmLine) {
    const movesText = tmLine.replace('tmhm ', '').trim();
    tmMoves = movesText.split(',').map((move) => reduce(move.trim()));

    // Store TM compatibility
    if (!(pokemonForm in pokemonTMCompatibility)) {
      pokemonTMCompatibility[pokemonForm] = {};
    }
    pokemonTMCompatibility[pokemonForm][reduce(name_form)] = tmMoves;
  }

  //Add it in!
  //Special Case: Armored Mewtwo (labelled as Mewtwo in file)
  //If Polished, Armored Mewtwo is a functional variant
  //If Faithful, Armored Mewtwo is a cosmetic variant
  //Plan of action - if name is Mewtwo and types are Psychic, Steel
  //We must be in the Polished version, so add a special handler
  if (reduce(name_form) === 'mewtwo' && JSON.stringify(types) === '["psychic","steel"]') {
    const mon = pokemonData['polished'].find((mon) => mon['id'] === 'mewtwo');
    const form = mon?.forms && mon.forms[reduce('armored')];
    if (form) {
      form['types'] = types;
      form['abilities'] = abilities;
      form['baseStats'] = bsts;
      form['growthRate'] = growthRate;
      form['hasGender'] = hasGender;
    }
    return;
  }

  //Case #1: Adding to plain form
  let mon = pokemonData[pokemonForm]?.find((mon) => mon['id'] === reduce(name_form));
  if (mon) {
    const form = Object.values(mon?.['forms'] || {}).find((form) => form['formNumber'] === 1);
    if (form) {
      form['types'] = types;
      form['abilities'] = abilities;
      form['baseStats'] = bsts;
      form['growthRate'] = growthRate;
      form['hasGender'] = hasGender;
    }
    return;
  }

  //Case #2: Adding to functional form
  mon = pokemonData[pokemonForm]?.find(
    (mon) => mon['id'] === reduce(name_form.split('_').slice(0, -1).join('_')),
  );
  if (mon) {
    const formKey = reduce(name_form.split('_').at(-1) as string);
    const form = mon['forms']?.[formKey];
    if (form) {
      form['types'] = types as unknown as PokemonData['types'];
      form['abilities'] = abilities;
      form['baseStats'] = bsts;
      form['growthRate'] = growthRate;
      form['hasGender'] = hasGender;
    }
    return;
  }
};

const extractCosmetic = (pokemonForm: string) => {
  //Case #3: Adding to cosmetic form: Can only be done after all files are read.
  const mons = pokemonData[pokemonForm]?.filter((mon) => {
    return mon?.forms && Object.values(mon.forms).some((form) => form['hasGender'] === undefined);
  });
  if (!mons) return;

  for (const mon of mons) {
    //Distribute default form data to the rest of the forms
    //TODO: This is predicated on the assumption that a Pokemon cannot have both cosmetic and functional variants
    const plainForm = Object.values(mon['forms'] || {}).find((form) => form['formNumber'] === 1);
    if (plainForm) {
      for (const form of Object.values(mon['forms'] || {})) {
        if (form['hasGender'] === undefined && form['formNumber'] !== 1) {
          form['types'] = plainForm['types'];
          form['abilities'] = plainForm['abilities'];
          form['baseStats'] = plainForm['baseStats'];
          form['growthRate'] = plainForm['growthRate'];
          form['hasGender'] = plainForm['hasGender'];
        }
      }
    }
  }
};

//#1: Names, Dex Numbers
let raw = await readFile(namesASM, 'utf-8');
const namesFILES = splitFile(raw);
extractNames(namesFILES[0], 'polished');
extractNames(namesFILES[1], 'faithful');

//#2: Forms
raw = await readFile(formsASM, 'utf-8');
const formsFILES = splitFile(raw);
extractForms(formsFILES[0], 'polished');
extractForms(formsFILES[1], 'faithful');

//#3: Type, Abilities, Base Stats, Growth Rate, Gender
const filenames = await readdir(monDIR);
await Promise.all(
  filenames.map(async (filename) => {
    raw = await readFile(join(monDIR, filename), 'utf-8');
    const monFILES = splitFile(raw);
    extractMon(monFILES[0], 'polished');
    extractMon(monFILES[1], 'faithful');
  }),
);

//#3: Special Case: Cosmetic Forms
extractCosmetic('polished');
extractCosmetic('faithful');

//#4: Extract Moves
raw = await readFile(movesASM, 'utf-8');
const movesFiles = splitFile(raw);
raw = await readFile(moveNamesASM, 'utf-8');
const moveNamesFiles = splitFile(raw);
raw = await readFile(moveDescriptionsASM, 'utf-8');
const moveDescriptionsData = raw
  .trim()
  .split('\n')
  .map((line) => line.trim());
extractMoves(movesFiles[0], moveNamesFiles[0], moveDescriptionsData); // Use Polished version for moves

//#5: Extract Evolution Chains
raw = await readFile(evoAttacksASM, 'utf-8');
const evoAttacksFiles = splitFile(raw);
extractEvolutions(evoAttacksFiles[0], 'polished');
extractEvolutions(evoAttacksFiles[1], 'faithful');

//#6: Extract Pokemon Movesets
extractPokemonMovesets(evoAttacksFiles[0], 'polished');
extractPokemonMovesets(evoAttacksFiles[1], 'faithful');

//#7: Extract Egg Moves
raw = await readFile(eggMovesASM, 'utf-8');
const eggMovesFiles = splitFile(raw);
extractEggMoves(eggMovesFiles[0], 'polished');
extractEggMoves(eggMovesFiles[1], 'faithful');

// Merge Pokemon data by combining Polished and Faithful versions
const mergeVersions = () => {
  const polishedPokemon = pokemonData.polished;
  const faithfulPokemon = pokemonData.faithful;

  for (let i = 0; i < polishedPokemon.length; i++) {
    const polishedMon: PokemonData = polishedPokemon[i];
    const faithfulMon: PokemonData = faithfulPokemon[i];

    const defaultMovesets = { levelUp: {}, tm: [], eggMoves: [] };

    // Add movesets to each form for polished version
    const polishedFormsWithRest = { ...polishedMon.forms };
    if (polishedFormsWithRest) {
      Object.keys(polishedFormsWithRest).forEach((formKey) => {
        if (polishedFormsWithRest[formKey]) {
          // Map form to ROM naming pattern
          const pokemonName = polishedMon.name;
          let romFormName =
            pokemonName +
            (formKey === 'plain' ? 'Plain' : formKey.charAt(0).toUpperCase() + formKey.slice(1));
          romFormName = reduce(romFormName);

          // Get form-specific movesets
          const formMovesets =
            pokemonMovesets.polished?.[romFormName] ||
            pokemonMovesets.faithful?.[romFormName] ||
            pokemonMovesets.polished?.[reduce(pokemonName)] ||
            pokemonMovesets.faithful?.[reduce(pokemonName)] ||
            defaultMovesets;

          // Get form-specific TM moves
          const formTMMoves =
            pokemonTMCompatibility.polished?.[romFormName] ||
            pokemonTMCompatibility.faithful?.[romFormName] ||
            pokemonTMCompatibility.polished?.[reduce(pokemonName)] ||
            pokemonTMCompatibility.faithful?.[reduce(pokemonName)] ||
            [];

          // Merge TM moves into movesets
          const finalMovesets = { ...formMovesets };
          finalMovesets.tm = formTMMoves;

          polishedFormsWithRest[formKey].movesets = finalMovesets;
        }
      });
    }

    // Add movesets to each form for faithful version
    const faithfulFormsWithRest = { ...faithfulMon.forms };
    if (faithfulFormsWithRest) {
      Object.keys(faithfulFormsWithRest).forEach((formKey) => {
        if (faithfulFormsWithRest[formKey]) {
          // Map form to ROM naming pattern
          const pokemonName = faithfulMon.name;
          let romFormName =
            pokemonName +
            (formKey === 'plain' ? 'Plain' : formKey.charAt(0).toUpperCase() + formKey.slice(1));
          romFormName = reduce(romFormName);

          // Get form-specific movesets
          const formMovesets =
            pokemonMovesets.faithful?.[romFormName] ||
            pokemonMovesets.polished?.[romFormName] ||
            pokemonMovesets.faithful?.[reduce(pokemonName)] ||
            pokemonMovesets.polished?.[reduce(pokemonName)] ||
            defaultMovesets;

          // Get form-specific TM moves
          const formTMMoves =
            pokemonTMCompatibility.faithful?.[romFormName] ||
            pokemonTMCompatibility.polished?.[romFormName] ||
            pokemonTMCompatibility.faithful?.[reduce(pokemonName)] ||
            pokemonTMCompatibility.polished?.[reduce(pokemonName)] ||
            [];

          // Merge TM moves into movesets
          const finalMovesets = { ...formMovesets };
          finalMovesets.tm = formTMMoves;

          faithfulFormsWithRest[formKey].movesets = finalMovesets;
        }
      });
    }

    // Create merged Pokemon structure
    const mergedMon: ComprehensivePokemonData = {
      id: polishedMon.id,
      name: polishedMon.name,
      dexNo: polishedMon.dexNo,
      versions: {
        polished: {
          // ...polishedMon,
          forms: polishedFormsWithRest,
        },
        faithful: {
          // ...faithfulMon,
          forms: faithfulFormsWithRest,
        },
      },
    };

    mergedPokemon.push(mergedMon);
  }
};

mergeVersions();

// Create output directories
const pokemonDir = join(__dirname, '..', 'new', 'pokemon');
const outputDir = join(__dirname, '..', 'new');

// Clear and recreate pokemon directory
try {
  await rm(pokemonDir, { recursive: true, force: true });
  await mkdir(pokemonDir, { recursive: true });
  console.log('Cleared and created pokemon directory');
} catch (error) {
  if (error) {
    throw error;
  }
  // Directory might already exist, continue
}

// Write individual Pokemon files
const manifest: PokemonManifest[] = [];
for (const pokemon of mergedPokemon) {
  // Create individual Pokemon file
  const pokemonPath = join(pokemonDir, `${pokemon.id}.json`);
  await writeFile(pokemonPath, JSON.stringify(pokemon, null, 2), 'utf-8');

  // Add to manifest with compact data
  const formsWithTypes: Record<
    string,
    { polished: { types: string[] }; faithful: { types: string[] } }
  > = {};

  // Get all unique form names from both versions
  const allFormNames = new Set([
    ...(pokemon.versions.polished.forms ? Object.keys(pokemon.versions.polished.forms) : []),
    ...(pokemon.versions.faithful.forms ? Object.keys(pokemon.versions.faithful.forms) : []),
  ]);

  // Build forms object with types for each version
  for (const formName of allFormNames) {
    const polishedForm = pokemon.versions.polished.forms?.[formName];
    const faithfulForm = pokemon.versions.faithful.forms?.[formName];

    //init
    if (!formsWithTypes[formName]) {
      formsWithTypes[formName] = {
        polished: {
          types: [],
        },
        faithful: {
          types: [],
        },
      };
    }

    if (polishedForm) {
      formsWithTypes[formName].polished = {
        types: polishedForm.types || [],
      };
    }

    if (faithfulForm) {
      formsWithTypes[formName].faithful = {
        types: faithfulForm.types || [],
      };
    }
  }

  const manifestEntry: PokemonManifest = {
    id: pokemon.id,
    name: pokemon.name,
    dexNo: pokemon.dexNo,
    versions: {
      polished: {
        ...Object.fromEntries(
          Object.entries(formsWithTypes).map(([formName, formData]) => [
            formName,
            { types: formData.polished.types },
          ]),
        ),
      },
      faithful: {
        ...Object.fromEntries(
          Object.entries(formsWithTypes).map(([formName, formData]) => [
            formName,
            { types: formData.faithful.types },
          ]),
        ),
      },
    },
  };
  manifest.push(manifestEntry);
}

// Write compact manifest file
const manifestPath = join(outputDir, 'pokemon_manifest.json');
await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

// Write moves manifest file
const movesManifestPath = join(outputDir, 'moves_manifest.json');
await writeFile(movesManifestPath, JSON.stringify(movesManifest, null, 2), 'utf-8');

// Write Evolution Chains file
const evolutionChainsPath = join(outputDir, 'evolution_chains.json');
await writeFile(evolutionChainsPath, JSON.stringify(evolutionChains, null, 2));

console.log(`${mergedPokemon.length} Pokemon files written to ${pokemonDir}`);
console.log(`Manifest written to ${manifestPath}`);
console.log(`${Object.keys(movesManifest).length} moves written to ${movesManifestPath}`);
console.log(`Evolution chains written to ${evolutionChainsPath}`);

//Pokemon GETTER
const getPokemon = () => {
  return mergedPokemon;
};

export default getPokemon;
