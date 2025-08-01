import fs from 'node:fs';
import path from 'node:path';
import type { NPCTrade, LocationEvent } from '../../../src/types/types.ts';
import { normalizeLocationKey } from '../locationUtils.ts';
import { fileURLToPath } from 'node:url';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
