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
  location: string;
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

// --- Event Data Extraction ---
export function extractEventData(): EventData {
  console.log('📅 Extracting event data...');
  const eventData: EventData = {
    dailyEvents: [],
    weeklyEvents: [],
    specialEvents: []
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
      reward: 'Sharp Beak'
    },
    {
      id: 'tuscany_tuesday',
      name: 'Tuscany of Tuesday',
      day: 'Tuesday',
      location: 'Route 29',
      description: 'Tuscany appears on Route 29 and gives away Silk Scarfs to trainers.',
      npcName: 'Tuscany',
      reward: 'Silk Scarf'
    },
    {
      id: 'wesley_wednesday',
      name: 'Wesley of Wednesday',
      day: 'Wednesday',
      location: 'Lake of Rage',
      description: 'Wesley appears at Lake of Rage and gives away Black Belts to trainers.',
      npcName: 'Wesley',
      reward: 'Black Belt'
    },
    {
      id: 'arthur_thursday',
      name: 'Arthur of Thursday',
      day: 'Thursday',
      location: 'Route 36',
      description: 'Arthur appears on Route 36 and gives away Hard Stones to trainers.',
      npcName: 'Arthur',
      reward: 'Hard Stone'
    },
    {
      id: 'frieda_friday',
      name: 'Frieda of Friday',
      day: 'Friday',
      location: 'Route 32',
      description: 'Frieda appears on Route 32 and gives away Poison Barbs to trainers.',
      npcName: 'Frieda',
      reward: 'Poison Barb'
    },
    {
      id: 'santos_saturday',
      name: 'Santos of Saturday',
      day: 'Saturday',
      location: 'Blackthorn City',
      description: 'Santos appears in Blackthorn City and gives away Spell Tags to trainers.',
      npcName: 'Santos',
      reward: 'Spell Tag'
    },
    {
      id: 'sunny_sunday',
      name: 'Sunny of Sunday',
      day: 'Sunday',
      location: 'Route 37',
      description: 'Sunny appears on Route 37 and gives away Magnets to trainers.',
      npcName: 'Sunny',
      reward: 'Magnet'
    }
  ];

  eventData.dailyEvents = dailyEvents;

  // Extract weekly recurring events
  const weeklyEvents: WeeklyEvent[] = [
    {
      id: 'bug_catching_contest',
      name: 'Bug Catching Contest',
      days: ['Tuesday', 'Thursday', 'Saturday'],
      location: 'National Park',
      description: 'A contest where trainers compete to catch the best Bug-type Pokémon. Winners receive prizes and keep their caught Pokémon.',
      type: 'contest'
    },
    {
      id: 'goldenrod_underground_bitter_merchant',
      name: 'Bitter Merchant (Goldenrod Underground)',
      days: ['Saturday', 'Sunday'],
      location: 'Goldenrod Underground (Warehouse Entrance)',
      description: 'A merchant selling bitter healing items only opens on weekends.',
      type: 'shop'
    },
    {
      id: 'goldenrod_underground_fresh_merchant',
      name: 'Fresh Merchant (Goldenrod Underground)',
      days: ['Monday'],
      location: 'Goldenrod Underground (Warehouse Entrance)',
      description: 'A merchant selling fresh items only opens on Monday mornings.',
      type: 'shop',
      timeOfDay: 'morning'
    },
    {
      id: 'older_haircut_brother',
      name: 'Older Haircut Brother',
      days: ['Tuesday', 'Thursday', 'Saturday'],
      location: 'Goldenrod Underground (Warehouse Entrance)',
      description: 'The older haircut brother provides Pokemon grooming services to increase friendship.',
      type: 'service'
    },
    {
      id: 'younger_haircut_brother',
      name: 'Younger Haircut Brother',
      days: ['Sunday', 'Wednesday', 'Friday'],
      location: 'Goldenrod Underground (Warehouse Entrance)',
      description: 'The younger haircut brother provides Pokemon grooming services to increase friendship.',
      type: 'service'
    },
    {
      id: 'mount_moon_clefairy_dance',
      name: 'Clefairy Dance',
      days: ['Monday'],
      location: 'Mount Moon Square',
      description: 'Clefairy appear to dance at Mount Moon Square on Monday nights.',
      type: 'special',
      timeOfDay: 'night'
    }
  ];

  eventData.weeklyEvents = weeklyEvents;

  // Extract special one-time events and legendary Pokemon
  const specialEvents: SpecialEvent[] = [
    {
      id: 'celebi_event',
      name: 'Celebi Time Travel Event',
      location: 'Ilex Forest Shrine',
      description: 'Celebi can be encountered after obtaining the GS Ball and visiting the Ilex Forest shrine.',
      type: 'legendary',
      pokemon: 'Celebi',
      conditions: 'Requires GS Ball'
    },
    {
      id: 'lugia_whirl_islands',
      name: 'Lugia at Whirl Islands',
      location: 'Whirl Islands Lugia Chamber',
      description: 'Lugia can be encountered in the deepest chamber of the Whirl Islands.',
      type: 'legendary',
      pokemon: 'Lugia',
      conditions: 'Requires Silver Wing'
    },
    {
      id: 'ho_oh_tin_tower',
      name: 'Ho-Oh at Tin Tower',
      location: 'Tin Tower Summit',
      description: 'Ho-Oh can be encountered at the top of Tin Tower.',
      type: 'legendary',
      pokemon: 'Ho-Oh',
      conditions: 'Requires Rainbow Wing'
    },
    {
      id: 'legendary_beasts',
      name: 'Legendary Beasts (Roaming)',
      location: 'Johto (Roaming)',
      description: 'Raikou, Entei, and Suicune roam throughout Johto after being awakened in Brass Tower.',
      type: 'legendary',
      pokemon: 'Raikou, Entei, Suicune',
      conditions: 'Activated after Brass Tower event'
    },
    {
      id: 'mewtwo_cerulean_cave',
      name: 'Mewtwo in Cerulean Cave',
      location: 'Cerulean Cave B1F',
      description: 'Mewtwo can be encountered in the deepest part of Cerulean Cave.',
      type: 'legendary',
      pokemon: 'Mewtwo',
      conditions: 'Post-Elite Four'
    },
    {
      id: 'mew_faraway_island',
      name: 'Mew at Faraway Island',
      location: 'Faraway Island',
      description: 'Mew can be encountered at Faraway Island.',
      type: 'legendary',
      pokemon: 'Mew',
      conditions: 'Special access required'
    },
    {
      id: 'mystery_egg_mr_pokemon',
      name: 'Mystery Egg from Mr. Pokemon',
      location: 'Route 30 (Mr. Pokemon\'s House)',
      description: 'Mr. Pokemon gives the player a Mystery Egg early in the game, which hatches into Togepi.',
      type: 'egg',
      pokemon: 'Togepi',
      conditions: 'Story progression'
    },
    {
      id: 'odd_egg_day_care',
      name: 'Odd Egg from Day Care',
      location: 'Day Care',
      description: 'The Day Care Man gives an Odd Egg that always hatches into a shiny Pokemon.',
      type: 'egg',
      conditions: 'Always shiny'
    },
    {
      id: 'lyras_egg',
      name: 'Lyra\'s Egg',
      location: 'Day Care',
      description: 'Lyra gives the player an egg containing a rare Pokemon.',
      type: 'egg',
      conditions: 'After certain story progression'
    },
    {
      id: 'rivals_egg',
      name: 'Rival\'s Egg',
      location: 'Dragon\'s Den B1F',
      description: 'The rival gives the player an egg on certain days of the week.',
      type: 'egg',
      conditions: 'Tuesday, Thursday, or Saturday'
    },
    {
      id: 'starter_pokemon_elm',
      name: 'Starter Pokemon from Professor Elm',
      location: 'New Bark Town (Elm\'s Lab)',
      description: 'Professor Elm allows the player to choose their first Pokemon: Chikorita, Cyndaquil, or Totodile.',
      type: 'gift',
      pokemon: 'Chikorita, Cyndaquil, or Totodile',
      conditions: 'Beginning of game'
    },
    {
      id: 'eevee_bill',
      name: 'Eevee from Bill',
      location: 'Ecruteak City (Bill\'s House)',
      description: 'Bill gives the player an Eevee after completing certain tasks.',
      type: 'gift',
      pokemon: 'Eevee',
      conditions: 'After helping Bill'
    },
    {
      id: 'tyrogue_karate_master',
      name: 'Tyrogue from Karate Master',
      location: 'Mount Mortar',
      description: 'The Karate Master gives a Tyrogue after being defeated.',
      type: 'gift',
      pokemon: 'Tyrogue',
      conditions: 'Defeat Karate Master Kiyo'
    }
  ];

  eventData.specialEvents = specialEvents;

  // Extract phone call events (daily/time-based)
  const phoneEvents: DailyEvent[] = [
    {
      id: 'jack_monday_morning',
      name: 'Jack\'s Monday Morning Call',
      day: 'Monday',
      location: 'Phone Call',
      description: 'Jack calls on Monday mornings with special information.',
      npcName: 'Jack',
      timeOfDay: 'morning'
    },
    {
      id: 'huey_wednesday_night',
      name: 'Huey\'s Wednesday Night Call',
      day: 'Wednesday',
      location: 'Phone Call',
      description: 'Huey calls on Wednesday nights with special information.',
      npcName: 'Huey',
      timeOfDay: 'night'
    },
    {
      id: 'gaven_thursday_morning',
      name: 'Gaven\'s Thursday Morning Call',
      day: 'Thursday',
      location: 'Phone Call',
      description: 'Gaven calls on Thursday mornings with special information.',
      npcName: 'Gaven',
      timeOfDay: 'morning'
    },
    {
      id: 'beth_friday_afternoon',
      name: 'Beth\'s Friday Afternoon Call',
      day: 'Friday',
      location: 'Phone Call',
      description: 'Beth calls on Friday afternoons with special information.',
      npcName: 'Beth',
      timeOfDay: 'afternoon'
    },
    {
      id: 'jose_saturday_night',
      name: 'Jose\'s Saturday Night Call',
      day: 'Saturday',
      location: 'Phone Call',
      description: 'Jose calls on Saturday nights with special information.',
      npcName: 'Jose',
      timeOfDay: 'night'
    },
    {
      id: 'reena_sunday_morning',
      name: 'Reena\'s Sunday Morning Call',
      day: 'Sunday',
      location: 'Phone Call',
      description: 'Reena calls on Sunday mornings with special information.',
      npcName: 'Reena',
      timeOfDay: 'morning'
    }
  ];

  eventData.dailyEvents.push(...phoneEvents);

  console.log(`📅 Extracted ${eventData.dailyEvents.length} daily events, ${eventData.weeklyEvents.length} weekly events, ${eventData.specialEvents.length} special events`);

  return eventData;
}

export function writeEventDataToFile(eventData: EventData, outputPath: string): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(eventData, null, 2), 'utf8');
  console.log(`📅 Event data written to ${outputPath}`);
}
