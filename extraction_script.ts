import reduce from './src/lib/reduce.ts';
import splitFile from './src/lib/split.ts';
import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pokemonData = {
  Polished: [],
  Faithful: [],
};

const mergedPokemon = [];
const movesManifest = {};
const pokemonMovesets = {};

//Paths
const namesASM = join(__dirname, 'polishedcrystal/data/pokemon/names.asm');
const formsASM = join(__dirname, 'polishedcrystal/constants/pokemon_constants.asm');
const monDIR = join(__dirname, 'polishedcrystal/data/pokemon/base_stats/');
const movesASM = join(__dirname, 'polishedcrystal/data/moves/moves.asm');
const moveNamesASM = join(__dirname, 'polishedcrystal/data/moves/names.asm');
const evoAttacksASM = join(__dirname, 'polishedcrystal/data/pokemon/evos_attacks.asm');

const extractMoves = (movesData, moveNamesData) => {
  const moveLines = movesData.filter(line => 
    line.trim().startsWith('move ') && 
    !line.includes('MACRO') && 
    !line.includes('ENDM')
  );
  
  const nameLines = moveNamesData.filter(line => 
    line.trim().startsWith('li "')
  );
  
  for (let i = 0; i < moveLines.length && i < nameLines.length; i++) {
    const moveLine = moveLines[i].trim();
    const nameLine = nameLines[i].trim();
    
    // Parse move data: move ACROBATICS, EFFECT_CONDITIONAL_BOOST, 55, FLYING, 100, 15, 0, PHYSICAL
    const parts = moveLine.split(',');
    if (parts.length >= 8) {
      const moveId = reduce(parts[0].replace('move ', '').trim());
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
        category: category
      };
    }
  }
};

const extractPokemonMovesets = (evoAttacksData, PF) => {
  const lines = evoAttacksData;
  let currentPokemon = null;
  let inLearnset = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Find Pokemon section: evos_attacks PokemonName
    if (line.startsWith('evos_attacks ')) {
      currentPokemon = reduce(line.replace('evos_attacks ', '').trim());
      if (!pokemonMovesets[PF]) pokemonMovesets[PF] = {};
      pokemonMovesets[PF][currentPokemon] = [];
      inLearnset = false;
    }
    
    // Find learnset entries: learnset level, MOVE_NAME
    if (line.startsWith('learnset ') && currentPokemon) {
      const parts = line.replace('learnset ', '').split(',');
      if (parts.length >= 2) {
        const level = parseInt(parts[0].trim());
        const move = reduce(parts[1].trim());
        pokemonMovesets[PF][currentPokemon].push({
          level: level,
          move: move
        });
      }
    }
  }
};

const extractNames = (data, PF) => {
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
    //TODO SPECIAL CASE: DUDUNSPARCE
    if (data[lineNo].includes('Dudunsparc')) {
      pokemonData[PF].push({
        id: 'dudunsparce',
        name: 'Dudunsparce',
        dexNo: dexNo,
        forms: [],
      });
      dexNo++;
      continue;
    }
    pokemonData[PF].push({
      id: reduce(data[lineNo].slice(9, -1)),
      name: data[lineNo].slice(9, -1),
      dexNo: dexNo,
      forms: [],
    });
    dexNo++;
  }
};

const extractForms = (data, PF) => {
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
        form[1] = parseInt(form[1].trim().slice(form[1].trim().indexOf('(') + 1, -1), 16);
        let mon = pokemonData[PF].find((mon) => mon['id'] === reduce(name));
        mon['forms'].push({
          id: reduce(form[0]),
          name: form[0],
          formNumber: form[1],
          type: [],
          abilities: [],
          baseStats: [],
          growthRate: [],
          hasGender: null,
        });
        lineNo++;
      }
    }

    //Regional Forms
    if (data[lineNo].includes('FORM EQU ')) {
      //IGNORE NO_FORM 0, PLAIN_FORM 1
      if (data[lineNo].includes('NO_FORM') || data[lineNo].includes('PLAIN_FORM')) {
        continue;
      }
      const formName = data[lineNo].slice(4, data[lineNo].indexOf('_')).toLowerCase();
      const formNo = parseInt(data[lineNo].slice(-1));
      //Run through all the Pokemon that have that Regional Form
      lineNo++;
      while (data[lineNo].startsWith('const_skip')) {
        let name = data[lineNo].slice(data[lineNo].indexOf(';') + 2);
        name = name.slice(name.indexOf(' ') + 1);

        //Add it in!
        const mon = pokemonData[PF].find((mon) => mon['id'] === reduce(name));
        mon['forms'].push({
          id: reduce(formName),
          name: formName,
          formNumber: formNo,
          type: [],
          abilities: [],
          baseStats: [],
          growthRate: [],
          hasGender: null,
        });
        lineNo++;
      }
    }
  }

  //Plain Form
  const plain = {
    id: 'plain',
    name: 'plain',
    formNumber: 1,
    type: [],
    abilities: [],
    baseStats: [],
    growthRate: [],
    hasGender: null,
  };
  pokemonData[PF].forEach((mon) => {
    //Case #1: Pokemon has no forms
    if (mon['forms'].length === 0) {
      mon['forms'].push({ ...plain });
    }
    //Case #2: Pokemon with alternate forms, none of which have default
    else if (mon['forms'].every((form) => form['formNumber'] != 1)) {
      mon['forms'].unshift({ ...plain });
    }
  });
};

const extractMon = (data, PF) => {
  //Parse all the data
  const name_form = data
    .find((line: string) => line.startsWith('abilities_for'))
    .split(',')
    .at(0)
    .split(' ')
    .at(-1);

  let types = data
    .find((line: string) => line.endsWith('type'))
    .slice(3, -7)
    .split(',');
  types = types.map((type: string) => reduce(type.trim()));
  if (types[0] === types[1]) {
    types = [types[0]];
  }

  let abilities = data
    .find((line: string) => line.startsWith('abilities_for'))
    .split(',')
    .slice(1);
  abilities = abilities.map((ability) => reduce(ability.trim()));

  let bsts = data
    .find((line: string) => line.endsWith('BST'))
    .slice(3, -9)
    .split(',');
  bsts = bsts.map((bst) => parseInt(bst.trim()));

  const growthRate = reduce(
    data
      .find((line: string) => line.includes('db GROWTH'))
      .slice(3)
      .split(';')
      .at(0)
      .trim(),
  );

  const hasGender =
    data
      .find((line: string) => line.includes('GENDER'))
      .slice(3)
      .split(',')
      .at(0)
      .trim() === 'GENDER_UNKNOWN'
      ? false
      : true;

  //Add it in!
  //Special Case: Armored Mewtwo (labelled as Mewtwo in file)
  //If Polished, Armored Mewtwo is a functional variant
  //If Faithful, Armored Mewtwo is a cosmetic variant
  //Plan of action - if name is Mewtwo and types are Psychic, Steel
  //We must be in the Polished version, so add a special handler
  if (reduce(name_form) === 'mewtwo' && JSON.stringify(types) === '["psychic","steel"]') {
    const mon = pokemonData['Polished'].find((mon) => mon['id'] === 'mewtwo');
    const form = mon['forms'].find((form) => form['id'] === 'armored');
    form['type'] = types;
    form['abilities'] = abilities;
    form['baseStats'] = bsts;
    form['growthRate'] = growthRate;
    form['hasGender'] = hasGender;
    return;
  }

  //Case #1: Adding to plain form
  let mon = pokemonData[PF].find((mon) => mon['id'] === reduce(name_form));
  if (mon) {
    const form = mon?.['forms'].find((form) => form['formNumber'] === 1);
    if (form) {
      form['type'] = types;
      form['abilities'] = abilities;
      form['baseStats'] = bsts;
      form['growthRate'] = growthRate;
      form['hasGender'] = hasGender;
    }
    return;
  }

  //Case #2: Adding to functional form
  mon = pokemonData[PF].find(
    (mon) => mon['ID'] === reduce(name_form.split('_').slice(0, -1).join('_')),
  );
  if (mon) {
    const form = mon['forms'].find((form) => form['id'] === reduce(name_form.split('_').at(-1)));
    form['type'] = types;
    form['abilities'] = abilities;
    form['baseStats'] = bsts;
    form['growthRate'] = growthRate;
    form['hasGender'] = hasGender;
    return;
  }
};

const extractCosmetic = (PF) => {
  //Case #3: Adding to cosmetic form: Can only be done after all files are read.
  const mons = pokemonData[PF].filter((mon) => {
    return mon?.['forms'].some((form) => form['hasGender'] === null);
  });
  for (const mon of mons) {
    //Distribute default form data to the rest of the forms
    //TODO: This is predicated on the assumption that a Pokemon cannot have both cosmetic and functional variants
    for (const form of mon['forms'].slice(1)) {
      form['type'] = mon['forms'][0]['type'];
      form['abilities'] = mon['forms'][0]['abilities'];
      form['baseStats'] = mon['forms'][0]['baseStats'];
      form['growthRate'] = mon['forms'][0]['growthRate'];
      form['hasGender'] = mon['forms'][0]['hasGender'];
    }
  }
};

//#1: Names, Dex Numbers
let raw = await readFile(namesASM, 'utf-8');
const namesFILES = splitFile(raw);
extractNames(namesFILES[0], 'Polished');
extractNames(namesFILES[1], 'Faithful');

//#2: Forms
raw = await readFile(formsASM, 'utf-8');
const formsFILES = splitFile(raw);
extractForms(formsFILES[0], 'Polished');
extractForms(formsFILES[1], 'Faithful');

//#3: Type, Abilities, Base Stats, Growth Rate, Gender
const filenames = await readdir(monDIR);
await Promise.all(
  filenames.map(async (filename) => {
    raw = await readFile(join(monDIR, filename), 'utf-8');
    const monFILES = splitFile(raw);
    extractMon(monFILES[0], 'Polished');
    extractMon(monFILES[1], 'Faithful');
  }),
);

//#3: Special Case: Cosmetic Forms
extractCosmetic('Polished');
extractCosmetic('Faithful');

//#4: Extract Moves
raw = await readFile(movesASM, 'utf-8');
const movesFiles = splitFile(raw);
raw = await readFile(moveNamesASM, 'utf-8');
const moveNamesFiles = splitFile(raw);
extractMoves(movesFiles[0], moveNamesFiles[0]); // Use Polished version for moves

//#5: Extract Pokemon Movesets
raw = await readFile(evoAttacksASM, 'utf-8');
const evoAttacksFiles = splitFile(raw);
extractPokemonMovesets(evoAttacksFiles[0], 'Polished');
extractPokemonMovesets(evoAttacksFiles[1], 'Faithful');

// Merge Pokemon data by combining Polished and Faithful versions
const mergeVersions = () => {
  const polishedPokemon = pokemonData.Polished;
  const faithfulPokemon = pokemonData.Faithful;

  for (let i = 0; i < polishedPokemon.length; i++) {
    const polishedMon = polishedPokemon[i];
    const faithfulMon = faithfulPokemon[i];

    // Get movesets for this Pokemon
    const polishedMoves = pokemonMovesets.Polished?.[polishedMon.id] || [];
    const faithfulMoves = pokemonMovesets.Faithful?.[faithfulMon.id] || [];
    
    // Create merged Pokemon structure
    const mergedMon = {
      id: polishedMon.id,
      name: polishedMon.name,
      dexNo: polishedMon.dexNo,
      versions: {
        polished: {
          forms: polishedMon.forms,
          moves: polishedMoves.map(m => m.move), // Just store move IDs as strings
        },
        faithful: {
          forms: faithfulMon.forms,
          moves: faithfulMoves.map(m => m.move), // Just store move IDs as strings
        },
      },
    };

    mergedPokemon.push(mergedMon);
  }
};

mergeVersions();

// Create output directories
const pokemonDir = join(__dirname, 'new', 'pokemon');
const outputDir = join(__dirname, 'new');

try {
  await mkdir(pokemonDir, { recursive: true });
  console.log('Created output directories');
} catch (error) {
  // Directory might already exist, continue
}

// Write individual Pokemon files
const manifest = [];
for (const pokemon of mergedPokemon) {
  // Create individual Pokemon file
  const pokemonPath = join(pokemonDir, `${pokemon.id}.json`);
  await writeFile(pokemonPath, JSON.stringify(pokemon, null, 2), 'utf-8');

  // Add to manifest with compact data
  const manifestEntry = {
    id: pokemon.id,
    name: pokemon.name,
    dexNo: pokemon.dexNo,
    forms: [
      ...new Set([
        ...pokemon.versions.polished.forms.map((f) => f.name),
        ...pokemon.versions.faithful.forms.map((f) => f.name),
      ]),
    ],
  };
  manifest.push(manifestEntry);
}

// Write compact manifest file
const manifestPath = join(outputDir, 'pokemon_manifest.json');
await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

// Write moves manifest file
const movesManifestPath = join(outputDir, 'moves_manifest.json');
await writeFile(movesManifestPath, JSON.stringify(movesManifest, null, 2), 'utf-8');

console.log(`${mergedPokemon.length} Pokemon files written to ${pokemonDir}`);
console.log(`Manifest written to ${manifestPath}`);
console.log(`${Object.keys(movesManifest).length} moves written to ${movesManifestPath}`);

//Pokemon GETTER
const getPokemon = () => {
  return mergedPokemon;
};

export default getPokemon;
