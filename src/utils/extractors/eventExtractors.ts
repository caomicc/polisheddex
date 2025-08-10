import fs from 'node:fs';
import path from 'node:path';
import type { NPCTrade, LocationEvent } from '../../../src/types/types.ts';
import { normalizeLocationKey } from '../locationUtils.ts';
import { fileURLToPath } from 'node:url';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DailyEvent {
  id: string;
  name: string;
  day: string;
  location: string;
  description: string;
  npcName?: string;
  reward?: string;
  timeOfDay?: string;
}

export interface WeeklyEvent {
  id: string;
  name: string;
  days: string[];
  location: string;
  description: string;
  type: string;
  timeOfDay?: string;
}

export interface SpecialEvent {
  id: string;
  name: string;
  area: string;
  description: string;
  type: 'legendary' | 'gift' | 'egg' | 'other';
  pokemon?: string;
  conditions?: string;
}

export interface EventData {
  dailyEvents: DailyEvent[];
  weeklyEvents: WeeklyEvent[];
  specialEvents: SpecialEvent[];
}

// --- Legendary Event Locations Extraction from ROM ---
export function extractLegendaryEventLocations(): Record<string, any[]> {
  console.log('🏛️ Extracting legendary event locations from ROM data...');

  const mapsDir = path.join(__dirname, '../../../polishedcrystal/maps');
  if (!fs.existsSync(mapsDir)) {
    console.warn('⚠️ Maps directory not found:', mapsDir);
    return {};
  }

  const legendaryLocations: Record<string, any[]> = {};
  const mapFiles = fs.readdirSync(mapsDir).filter((file) => file.endsWith('.asm'));

  for (const mapFile of mapFiles) {
    const locationName = path.basename(mapFile, '.asm');
    const mapPath = path.join(mapsDir, mapFile);
    const mapContent = fs.readFileSync(mapPath, 'utf8');
    const lines = mapContent.split(/\r?\n/);

    // Look for loadwildmon commands indicating legendary encounters
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Match loadwildmon patterns: loadwildmon POKEMON, [FORM], LEVEL
      const loadwildMatch = line.match(/loadwildmon\s+(\w+)(?:,\s*(\w+))?,\s*(\d+)/i);
      if (loadwildMatch) {
        const pokemon = loadwildMatch[1].toLowerCase();
        const form = loadwildMatch[2];
        const level = parseInt(loadwildMatch[3]);

        // Look for battle type to determine if this is a legendary encounter
        let battleType = 'normal';
        let isLegendary = false;

        // Look for battle type indicators in surrounding lines
        for (let j = Math.max(0, i - 10); j <= Math.min(lines.length - 1, i + 10); j++) {
          const contextLine = lines[j].trim();
          if (contextLine.includes('BATTLETYPE_LEGENDARY') || contextLine.includes('BATTLETYPE_GHOST')) {
            isLegendary = true;
            battleType = contextLine.includes('BATTLETYPE_GHOST') ? 'ghost' : 'legendary';
            break;
          }
        }

        // Only include if it's a legendary encounter or specific known locations
        const knownLegendaryMaps = [
          'IlexForest', 'FarawayJungle', 'TinTowerRoof', 'WhirlIslandLugiaChamber',
          'CinnabarVolcanoB2F', 'SeafoamIslandsB4F', 'Route10North', 'VioletOutskirtsHouse',
          'ShamoutiIsland', 'MurkySwamp', 'CherrygroveBay'
        ];

        if (isLegendary || knownLegendaryMaps.some(map => locationName.includes(map))) {
          if (!legendaryLocations[pokemon]) {
            legendaryLocations[pokemon] = [];
          }

          // Extract conditions and descriptions directly from ROM assembly
          const romConditions = extractRomConditions(mapContent, pokemon);
          
          // Determine method based on battle type
          const method = battleType === 'ghost' ? 'event' : (isLegendary ? 'static' : 'event');
          
          const encounterData: any = {
            area: formatLocationName(locationName),
            method: method,
            conditions: romConditions.conditions || 'Special encounter',
            eventType: 'legendary',
            description: romConditions.description || generateDefaultDescription(pokemon, locationName),
            level: level
          };

          // Add form information if present
          if (form && form !== 'NO_FORM') {
            encounterData.form = form.toLowerCase().replace('_form', '');
          }

          legendaryLocations[pokemon].push(encounterData);
        }
      }
    }
  }

  console.log(`🏛️ Found ROM-based legendary locations for ${Object.keys(legendaryLocations).length} Pokémon`);
  return legendaryLocations;
}

// --- Extract conditions and descriptions from ROM assembly ---
function extractRomConditions(mapContent: string, pokemon: string): { conditions: string; description: string } {
  const lines = mapContent.split(/\r?\n/);
  let conditions = '';
  let description = '';
  
  // Look for key item checks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for key item requirements
    const keyItemMatch = line.match(/checkkeyitem\s+([A-Z_0-9]+)/);
    if (keyItemMatch) {
      const keyItem = keyItemMatch[1];
      conditions = formatKeyItemCondition(keyItem);
      description = generateDescriptionFromKeyItem(pokemon, keyItem);
      break;
    }
    
    // Check for event flags that might indicate conditions
    const eventMatch = line.match(/checkevent\s+([A-Z_0-9]+)/);
    if (eventMatch) {
      const eventFlag = eventMatch[1];
      const eventCondition = formatEventCondition(eventFlag);
      if (eventCondition) {
        conditions = eventCondition;
        description = generateDescriptionFromEvent(pokemon, eventFlag);
      }
    }
  }
  
  return { conditions, description };
}

// --- Format key item conditions ---
function formatKeyItemCondition(keyItem: string): string {
  const keyItemMap: Record<string, string> = {
    'GS_BALL': 'Requires GS Ball',
    'SILPHSCOPE2': 'Requires Silph Scope 2', 
    'RAINBOW_WING': 'Requires Rainbow Wing',
    'SILVER_WING': 'Requires Silver Wing',
    'CLEAR_BELL': 'Requires Clear Bell',
    'TIDAL_BELL': 'Requires Tidal Bell'
  };
  
  return keyItemMap[keyItem] || `Requires ${keyItem.toLowerCase().replace(/_/g, ' ')}`;
}

// --- Generate descriptions based on key items ---
function generateDescriptionFromKeyItem(pokemon: string, keyItem: string): string {
  const pokemonName = pokemon.charAt(0).toUpperCase() + pokemon.slice(1);
  
  const descriptionMap: Record<string, string> = {
    'GS_BALL': `${pokemonName} can be encountered after obtaining the GS Ball and visiting the shrine.`,
    'SILPHSCOPE2': `A ghostly ${pokemonName} spirit can be encountered using the Silph Scope 2.`,
    'RAINBOW_WING': `${pokemonName} appears when the Rainbow Wing is presented.`,
    'SILVER_WING': `${pokemonName} emerges when the Silver Wing calls to it.`,
    'CLEAR_BELL': `${pokemonName} awakens when the Clear Bell chimes.`,
    'TIDAL_BELL': `${pokemonName} rises when the Tidal Bell tolls.`
  };
  
  return descriptionMap[keyItem] || `${pokemonName} can be encountered with the ${keyItem.toLowerCase().replace(/_/g, ' ')}.`;
}

// --- Format event conditions ---
function formatEventCondition(eventFlag: string): string {
  // Map specific event flags to readable conditions
  if (eventFlag.includes('ELITE_FOUR') || eventFlag.includes('CHAMPION')) {
    return 'After becoming Champion';
  }
  if (eventFlag.includes('POSTGAME')) {
    return 'Post-game content';
  }
  if (eventFlag.includes('KANTO')) {
    return 'Kanto region access';
  }
  
  return ''; // Return empty string if no specific mapping
}

// --- Generate descriptions from events ---
function generateDescriptionFromEvent(pokemon: string, eventFlag: string): string {
  const pokemonName = pokemon.charAt(0).toUpperCase() + pokemon.slice(1);
  
  if (eventFlag.includes('ELITE_FOUR') || eventFlag.includes('CHAMPION')) {
    return `${pokemonName} can be encountered after becoming the Champion.`;
  }
  if (eventFlag.includes('POSTGAME')) {
    return `${pokemonName} appears during post-game content.`;
  }
  if (eventFlag.includes('KANTO')) {
    return `${pokemonName} can be found after gaining access to Kanto.`;
  }
  
  return `${pokemonName} can be encountered under special conditions.`;
}

// --- Generate default description ---
function generateDefaultDescription(pokemon: string, locationName: string): string {
  const pokemonName = pokemon.charAt(0).toUpperCase() + pokemon.slice(1);
  const locationFormatted = formatLocationName(locationName);
  return `${pokemonName} can be encountered at ${locationFormatted}.`;
}

// --- NPC Trades Extraction ---
export function extractNPCTrades(): Record<string, NPCTrade[]> {
  console.log('💱 Extracting NPC trades...');
  const tradesPath = path.join(__dirname, '../../../polishedcrystal/data/events/npc_trades.asm');

  if (!fs.existsSync(tradesPath)) {
    console.warn('NPC trades file not found');
    return {};
  }

  const tradesContent = fs.readFileSync(tradesPath, 'utf8');
  const lines = tradesContent.split(/\r?\n/);
  const tradesByLocation: Record<string, NPCTrade[]> = {};

  let currentTrade: Partial<NPCTrade> = {};
  let currentLocation: string = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Parse location from comments like "; NPC_TRADE_MIKE in Goldenrod City"
    const locationMatch = line.match(/;\s*NPC_TRADE_\w+\s+in\s+(.+)/i);
    if (locationMatch) {
      currentLocation = normalizeLocationKey(locationMatch[1]);
      currentTrade = {};
      continue;
    }

    // Parse wants Pokemon: dp ABRA, NO_FORM
    const wantsMatch = line.match(/dp\s+(\w+),\s*(\w+)\s*;\s*wants/);
    if (wantsMatch) {
      currentTrade.wantsPokemon = wantsMatch[1].toLowerCase();
      if (wantsMatch[2] !== 'NO_FORM') {
        currentTrade.wantsForm = wantsMatch[2].toLowerCase();
      }
      continue;
    }

    // Parse gives Pokemon: dp MACHOP, FEMALE
    const givesMatch = line.match(/dp\s+(\w+),\s*(\w+)\s*;\s*gives/);
    if (givesMatch) {
      currentTrade.givesPokemon = givesMatch[1].toLowerCase();
      if (givesMatch[2] === 'MALE' || givesMatch[2] === 'FEMALE') {
        currentTrade.givesGender = givesMatch[2].toLowerCase();
      } else if (givesMatch[2] !== 'NO_FORM') {
        currentTrade.givesForm = givesMatch[2].toLowerCase();
      }
      continue;
    }

    // Parse nickname: rawchar "Muscle@@@@@"
    const nicknameMatch = line.match(/rawchar\s+"([^"@]+)@*/);
    if (nicknameMatch && !currentTrade.nickname) {
      currentTrade.nickname = nicknameMatch[1];
      continue;
    }

    // Parse trainer name: rawchar "Mike@@@@", $00
    const trainerMatch = line.match(/rawchar\s+"([^"@]+)@*",\s*\$00/);
    if (trainerMatch) {
      currentTrade.traderName = trainerMatch[1];

      // Complete trade entry
      if (currentLocation && currentTrade.wantsPokemon && currentTrade.givesPokemon) {
        if (!tradesByLocation[currentLocation]) {
          tradesByLocation[currentLocation] = [];
        }
        tradesByLocation[currentLocation].push(currentTrade as NPCTrade);
      }
      continue;
    }
  }

  const totalTrades = Object.values(tradesByLocation).reduce(
    (sum, trades) => sum + trades.length,
    0,
  );
  console.log(
    `💱 Found ${totalTrades} NPC trades across ${Object.keys(tradesByLocation).length} locations`,
  );

  return tradesByLocation;
}

// --- Location Events Extraction ---
export function extractLocationEvents(): Record<string, LocationEvent[]> {
  console.log('⚡ Extracting location events...');
  const mapsDir = path.join(__dirname, '../../../polishedcrystal/maps');
  const eventsByLocation: Record<string, LocationEvent[]> = {};

  if (!fs.existsSync(mapsDir)) {
    console.warn('Maps directory not found');
    return {};
  }

  const mapFiles = fs.readdirSync(mapsDir).filter((file) => file.endsWith('.asm'));

  for (const mapFile of mapFiles) {
    const locationKey = path.basename(mapFile, '.asm');
    // Use the normalization function for consistent keys
    const normalizedKey = normalizeLocationKey(locationKey);

    const mapPath = path.join(mapsDir, mapFile);
    const mapContent = fs.readFileSync(mapPath, 'utf8');
    const lines = mapContent.split(/\r?\n/);

    const events: LocationEvent[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Rival battles
      if (line.includes('RivalBattle') || line.includes('RIVAL_')) {
        // events.push({
        //   type: 'rival_battle',
        //   description: 'Rival Battle',
        //   details: 'Battle with your rival',
        // });
        continue; // Skip Rival battles for now
      }

      // Coordinate events that trigger battles
      const coordEventMatch = line.match(/coord_event\s+(\d+),\s*(\d+),\s*\d+,\s*(.+)/);
      if (coordEventMatch) {
        const eventName = coordEventMatch[3];
        if (eventName.includes('Battle') || eventName.includes('Trigger')) {
          events.push({
            type: 'coordinate_trigger',
            description: eventName.replace(/([A-Z])/g, ' $1').trim(),
            coordinates: { x: parseInt(coordEventMatch[1]), y: parseInt(coordEventMatch[2]) },
          });
        }
      }

      // Special events
      if (line.includes('CelebiTrigger')) {
        events.push({
          type: 'special',
          description: 'Celebi Event',
          details: 'Time travel encounter with Celebi',
        });
      }
    }

    if (events.length > 0) {
      // Try both the original key and normalized key
      eventsByLocation[normalizedKey] = events;
      if (normalizedKey !== locationKey) {
        eventsByLocation[locationKey] = events;
      }
    }
  }

  const totalEvents = Object.values(eventsByLocation).reduce(
    (sum, events) => sum + events.length,
    0,
  );
  console.log(
    `⚡ Found ${totalEvents} events across ${Object.keys(eventsByLocation).length} locations`,
  );

  return eventsByLocation;
}

// --- Map-based Pokemon Gift Events Extraction ---
export function extractMapGiftEvents(): SpecialEvent[] {
  console.log('🎁 Extracting map-based gift Pokemon events...');
  const mapsDir = path.join(__dirname, '../../../polishedcrystal/maps');
  const giftEvents: SpecialEvent[] = [];

  if (!fs.existsSync(mapsDir)) {
    console.warn('Maps directory not found');
    return [];
  }

  const mapFiles = fs.readdirSync(mapsDir).filter((file) => file.endsWith('.asm'));

  for (const mapFile of mapFiles) {
    const locationName = path.basename(mapFile, '.asm');
    const mapPath = path.join(mapsDir, mapFile);
    const mapContent = fs.readFileSync(mapPath, 'utf8');
    const lines = mapContent.split(/\r?\n/);

    // Look for givepoke commands
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Match givepoke commands: givepoke POKEMON, [FORM], LEVEL, [ITEM], [BALL], [MOVE]
      const givepokeMatch = line.match(/givepoke\s+(\w+)(?:,\s*(\w+))?,?\s*(\d+)?/i);
      if (givepokeMatch) {
        const pokemon = givepokeMatch[1];
        const level = givepokeMatch[3] || '5'; // Default level if not specified

        // Skip if this is a starter Pokemon (already handled)
        if (
          ['CHIKORITA', 'CYNDAQUIL', 'TOTODILE', 'BULBASAUR', 'CHARMANDER', 'SQUIRTLE'].includes(
            pokemon,
          )
        ) {
          continue;
        }

        // Skip debug events at Player's House
        if (locationName === 'PlayersHouse2F') {
          continue;
        }

        // Look backwards for context (NPC name, event conditions, etc.)
        let context = '';
        let npcName = '';
        let conditions = '';

        // Look for context in nearby lines
        for (let j = Math.max(0, i - 10); j < i; j++) {
          const contextLine = lines[j].trim();

          // Look for common NPC names or event descriptions
          if (contextLine.includes('Text') && contextLine.includes(':')) {
            const textMatch = contextLine.match(/(\w+)Text:/);
            if (textMatch) {
              context = textMatch[1];
            }
          }

          // Look for event checks that give us conditions
          if (contextLine.includes('checkevent') || contextLine.includes('checkflag')) {
            const eventMatch = contextLine.match(/check(?:event|flag)\s+(\w+)/);
            if (eventMatch) {
              conditions += eventMatch[1] + ' ';
            }
          }
        }

        // Determine NPC/location based on map name and context
        let giftName = `${pokemon} from ${formatLocationName(locationName)}`;
        let description = `A ${pokemon} can be obtained at ${formatLocationName(locationName)}.`;

        // Special cases for known locations
        if (locationName === 'OaksLab') {
          npcName = 'Professor Oak';
          giftName = `${pokemon} from Professor Oak`;
          description = `Professor Oak gives a ${pokemon} to trainers who have completed certain requirements.`;
          conditions = 'After getting Kanto starter from Ivy';
        } else if (locationName === 'ElmsLab') {
          npcName = 'Professor Elm';
          giftName = `${pokemon} from Professor Elm`;
          description = `Professor Elm gives a ${pokemon} as a starter Pokemon.`;
          conditions = 'Beginning of game';
        } else if (locationName === 'EcruteakPokeCenter1F') {
          npcName = 'Bill';
          giftName = `${pokemon} from Bill`;
          description = `Bill gives an ${pokemon} to trainers at the Ecruteak Pokemon Center.`;
          conditions = 'After helping Bill with his research';
        } else if (locationName === 'MountMortarB1F') {
          npcName = 'Karate Master Kiyo';
          giftName = `${pokemon} from Karate Master`;
          description = `The Karate Master gives a ${pokemon} after being defeated in battle.`;
          conditions = 'Defeat Karate Master Kiyo';
        } else if (locationName === 'DragonShrine') {
          npcName = 'Dragon Master Elder';
          giftName = `${pokemon} from Dragon Elder`;
          description = `The Dragon Elder gives a ${pokemon} with special moves to worthy trainers.`;
          conditions = 'Complete Dragon Den challenge';
        } else if (locationName.includes('GameCorner')) {
          npcName = 'Game Corner Prize Vendor';
          giftName = `${pokemon} from Game Corner`;
          description = `A ${pokemon} can be obtained as a prize from the Game Corner.`;
          conditions = 'Exchange coins';
        }

        // Generate unique ID
        const eventId = `${locationName.toLowerCase()}_${pokemon.toLowerCase()}_gift`;

        const giftEvent: SpecialEvent = {
          id: eventId,
          name: giftName,
          area: formatLocationName(locationName),
          description: description,
          type: 'gift',
          pokemon: pokemon.charAt(0).toUpperCase() + pokemon.slice(1).toLowerCase(),
          conditions: conditions.trim() || 'Various requirements',
        };

        // Avoid duplicates
        if (!giftEvents.find((e) => e.id === eventId)) {
          giftEvents.push(giftEvent);
        }
      }
    }
  }

  console.log(`🎁 Found ${giftEvents.length} map-based gift Pokemon events`);
  return giftEvents;
}

function formatLocationName(mapName: string): string {
  // Convert map names to readable location names
  const locationMap: Record<string, string> = {
    OaksLab: "Oak's Lab (Pallet Town)",
    ElmsLab: "Elm's Lab (New Bark Town)",
    EcruteakPokeCenter1F: 'Ecruteak Pokemon Center',
    MountMortarB1F: 'Mount Mortar B1F',
    DragonShrine: "Dragon's Den Shrine",
    GoldenrodGameCorner: 'Goldenrod Game Corner',
    CeladonGameCornerPrizeRoom: 'Celadon Game Corner',
    ShamoutiPokeCenter1F: 'Shamouti Pokemon Center',
    PewterMuseumOfScience1F: 'Pewter Museum of Science',
    Route35GoldenrodGate: 'Route 35 Goldenrod Gate',
    PlayersHouse2F: "Player's House",
    ManiasHouse: "Mania's House",
    IndigoPlateauPokecenter1F: 'Indigo Plateau Pokemon Center',
    CeladonUniversityHyperTestRoom: 'Celadon University',
  };

  return locationMap[mapName] || mapName.replace(/([A-Z])/g, ' $1').trim();
}

// --- Event Data Extraction ---
export function extractEventData(): EventData {
  console.log('📅 Extracting event data...');
  const eventData: EventData = {
    dailyEvents: [],
    weeklyEvents: [],
    specialEvents: [],
  };

  // Extract daily day-of-week siblings events
  const dailyEvents: DailyEvent[] = [
    {
      id: 'monica_monday',
      name: 'Monica of Monday',
      day: 'Monday',
      location: 'Route 40',
      description: 'Monica appears on Route 40 and gives away Sharp Beaks to trainers.',
      npcName: 'Monica',
      reward: 'Sharp Beak',
    },
    {
      id: 'tuscany_tuesday',
      name: 'Tuscany of Tuesday',
      day: 'Tuesday',
      location: 'Route 29',
      description: 'Tuscany appears on Route 29 and gives away Silk Scarfs to trainers.',
      npcName: 'Tuscany',
      reward: 'Silk Scarf',
    },
    {
      id: 'wesley_wednesday',
      name: 'Wesley of Wednesday',
      day: 'Wednesday',
      location: 'Lake of Rage',
      description: 'Wesley appears at Lake of Rage and gives away Black Belts to trainers.',
      npcName: 'Wesley',
      reward: 'Black Belt',
    },
    {
      id: 'arthur_thursday',
      name: 'Arthur of Thursday',
      day: 'Thursday',
      location: 'Route 36',
      description: 'Arthur appears on Route 36 and gives away Hard Stones to trainers.',
      npcName: 'Arthur',
      reward: 'Hard Stone',
    },
    {
      id: 'frieda_friday',
      name: 'Frieda of Friday',
      day: 'Friday',
      location: 'Route 32',
      description: 'Frieda appears on Route 32 and gives away Poison Barbs to trainers.',
      npcName: 'Frieda',
      reward: 'Poison Barb',
    },
    {
      id: 'santos_saturday',
      name: 'Santos of Saturday',
      day: 'Saturday',
      location: 'Blackthorn City',
      description: 'Santos appears in Blackthorn City and gives away Spell Tags to trainers.',
      npcName: 'Santos',
      reward: 'Spell Tag',
    },
    {
      id: 'sunny_sunday',
      name: 'Sunny of Sunday',
      day: 'Sunday',
      location: 'Route 37',
      description: 'Sunny appears on Route 37 and gives away Magnets to trainers.',
      npcName: 'Sunny',
      reward: 'Magnet',
    },
  ];

  eventData.dailyEvents = dailyEvents;

  // Extract weekly recurring events
  const weeklyEvents: WeeklyEvent[] = [
    {
      id: 'bug_catching_contest',
      name: 'Bug Catching Contest',
      days: ['Tuesday', 'Thursday', 'Saturday'],
      location: 'National Park',
      description:
        'A contest where trainers compete to catch the best Bug-type Pokémon. Winners receive prizes and keep their caught Pokémon.',
      type: 'contest',
    },
    {
      id: 'goldenrod_underground_bitter_merchant',
      name: 'Bitter Merchant (Goldenrod Underground)',
      days: ['Saturday', 'Sunday'],
      location: 'Goldenrod Underground (Warehouse Entrance)',
      description: 'A merchant selling bitter healing items only opens on weekends.',
      type: 'shop',
    },
    {
      id: 'goldenrod_underground_fresh_merchant',
      name: 'Fresh Merchant (Goldenrod Underground)',
      days: ['Monday'],
      location: 'Goldenrod Underground (Warehouse Entrance)',
      description: 'A merchant selling fresh items only opens on Monday mornings.',
      type: 'shop',
      timeOfDay: 'morning',
    },
    {
      id: 'older_haircut_brother',
      name: 'Older Haircut Brother',
      days: ['Tuesday', 'Thursday', 'Saturday'],
      location: 'Goldenrod Underground (Warehouse Entrance)',
      description:
        'The older haircut brother provides Pokemon grooming services to increase friendship.',
      type: 'service',
    },
    {
      id: 'younger_haircut_brother',
      name: 'Younger Haircut Brother',
      days: ['Sunday', 'Wednesday', 'Friday'],
      location: 'Goldenrod Underground (Warehouse Entrance)',
      description:
        'The younger haircut brother provides Pokemon grooming services to increase friendship.',
      type: 'service',
    },
    {
      id: 'mount_moon_clefairy_dance',
      name: 'Clefairy Dance',
      days: ['Monday'],
      location: 'Mount Moon Square',
      description: 'Clefairy appear to dance at Mount Moon Square on Monday nights.',
      type: 'special',
      timeOfDay: 'night',
    },
  ];

  eventData.weeklyEvents = weeklyEvents;

  // Extract special non-legendary events (eggs and some gifts)
  const specialEvents: SpecialEvent[] = [
    {
      id: 'mystery_egg_mr_pokemon',
      name: 'Mystery Egg from Mr. Pokemon',
      area: "Route 30 (Mr. Pokemon's House)",
      description:
        'Mr. Pokemon gives the player a Mystery Egg early in the game, which hatches into Togepi.',
      type: 'egg',
      pokemon: 'Togepi',
      conditions: 'Story progression',
    },
    {
      id: 'odd_egg_day_care',
      name: 'Odd Egg from Day Care',
      area: 'Day Care',
      description: 'The Day Care Man gives an Odd Egg that always hatches into a shiny Pokemon.',
      type: 'egg',
      conditions: 'Always shiny',
    },
    {
      id: 'lyras_egg',
      name: "Lyra's Egg",
      area: 'Day Care',
      description: 'Lyra gives the player an egg containing a rare Pokemon.',
      type: 'egg',
      conditions: 'After certain story progression',
    },
    {
      id: 'rivals_egg',
      name: "Rival's Egg",
      area: "Dragon's Den B1F",
      description: 'The rival gives the player an egg on certain days of the week.',
      type: 'egg',
      conditions: 'Tuesday, Thursday, or Saturday',
    },
    {
      id: 'starter_pokemon_elm',
      name: 'Starter Pokemon from Professor Elm',
      area: "New Bark Town (Elm's Lab)",
      description:
        'Professor Elm allows the player to choose their first Pokemon: Chikorita, Cyndaquil, or Totodile.',
      type: 'gift',
      pokemon: 'Chikorita, Cyndaquil, or Totodile',
      conditions: 'Beginning of game',
    },
  ];

  // Extract map-based gift events and merge them
  const mapGiftEvents = extractMapGiftEvents();

  // Remove duplicates from manual events that are now automatically detected
  const filteredSpecialEvents = specialEvents.filter(
    (event) => !['eevee_bill', 'tyrogue_karate_master', 'starter_pokemon_elm'].includes(event.id),
  );

  // Combine manual and map-extracted events
  eventData.specialEvents = [...filteredSpecialEvents, ...mapGiftEvents];

  // Extract phone call events (daily/time-based)
  const phoneEvents: DailyEvent[] = [
    {
      id: 'jack_monday_morning',
      name: "Jack's Monday Morning Call",
      day: 'Monday',
      location: 'Phone Call',
      description: 'Jack calls on Monday mornings with special information.',
      npcName: 'Jack',
      timeOfDay: 'morning',
    },
    {
      id: 'huey_wednesday_night',
      name: "Huey's Wednesday Night Call",
      day: 'Wednesday',
      location: 'Phone Call',
      description: 'Huey calls on Wednesday nights with special information.',
      npcName: 'Huey',
      timeOfDay: 'night',
    },
    {
      id: 'gaven_thursday_morning',
      name: "Gaven's Thursday Morning Call",
      day: 'Thursday',
      location: 'Phone Call',
      description: 'Gaven calls on Thursday mornings with special information.',
      npcName: 'Gaven',
      timeOfDay: 'morning',
    },
    {
      id: 'beth_friday_afternoon',
      name: "Beth's Friday Afternoon Call",
      day: 'Friday',
      location: 'Phone Call',
      description: 'Beth calls on Friday afternoons with special information.',
      npcName: 'Beth',
      timeOfDay: 'afternoon',
    },
    {
      id: 'jose_saturday_night',
      name: "Jose's Saturday Night Call",
      day: 'Saturday',
      location: 'Phone Call',
      description: 'Jose calls on Saturday nights with special information.',
      npcName: 'Jose',
      timeOfDay: 'night',
    },
    {
      id: 'reena_sunday_morning',
      name: "Reena's Sunday Morning Call",
      day: 'Sunday',
      location: 'Phone Call',
      description: 'Reena calls on Sunday mornings with special information.',
      npcName: 'Reena',
      timeOfDay: 'morning',
    },
  ];

  eventData.dailyEvents.push(...phoneEvents);

  console.log(
    `📅 Extracted ${eventData.dailyEvents.length} daily events, ${eventData.weeklyEvents.length} weekly events, ${eventData.specialEvents.length} special events`,
  );

  return eventData;
}

// --- Gift Events to Pokemon Location Data ---
export interface GiftLocationData {
  method: 'gift';
  location: string;
  npc?: string;
  conditions: string;
  level?: number;
}

export function extractGiftEventsForPokemon(): Record<string, GiftLocationData[]> {
  console.log('🎁 Extracting gift events for Pokémon location data...');

  // Get the map-based gift events
  const giftEvents = extractMapGiftEvents();
  const giftsByPokemon: Record<string, GiftLocationData[]> = {};

  for (const event of giftEvents) {
    if (event.pokemon && event.pokemon !== 'Various') {
      const pokemonName = event.pokemon.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!giftsByPokemon[pokemonName]) {
        giftsByPokemon[pokemonName] = [];
      }

      // Extract level from description if available
      let level: number | undefined;
      const levelMatch = event.description.match(/level (\d+)/i);
      if (levelMatch) {
        level = parseInt(levelMatch[1]);
      }

      const giftLocation: GiftLocationData = {
        method: 'gift',
        location: event.area,
        npc: event.name.split(' from ')[1] || 'NPC',
        conditions: event.conditions || 'Various requirements',
        ...(level && { level }),
      };

      giftsByPokemon[pokemonName].push(giftLocation);
    }
  }

  console.log(`🎁 Mapped gift events for ${Object.keys(giftsByPokemon).length} Pokémon species`);
  return giftsByPokemon;
}

export function writeGiftLocationDataToFile(
  giftData: Record<string, GiftLocationData[]>,
  outputPath: string,
): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(giftData, null, 2), 'utf8');
  console.log(`🎁 Gift location data written to ${outputPath}`);
}

export function writeEventDataToFile(eventData: EventData, outputPath: string): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(eventData, null, 2), 'utf8');
  console.log(`📅 Event data written to ${outputPath}`);
}
