// Utility functions for common patterns in data extraction

export const specialTrainerClasses = ['GIOVANNI', 'LYRA1', 'RIVAL1', 'ARCHER', 'ARIANA'];

export const formNumberMap: Record<string, number> = {
  plain: 1,
  alolan: 2,
  galarian: 3,
  hisuian: 4,
  paldean: 5,
  paldeanfire: 2,
  paldeanwater: 3,
};

/**
 * Normalizes a string by trimming, lowercasing, and removing underscores
 * Used for Pokemon names, moves, items, abilities, etc.
 */
export const normalizeString = (str: string): string => {
  return str.trim().toLowerCase().replace(/_/g, '');
};

/**
 * Normalizes a string by lowercasing and removing spaces
 * Used for trainer names and location keys
 */
export const normalizeSpaces = (str: string): string => {
  return str.toLowerCase().replace(/\s+/g, '');
};

/**
 * Removes numeric suffixes from constant names
 * Handles both "_1" and "1" patterns at the end of strings
 */
export const removeNumericSuffix = (str: string, trimUnderScoreOnly: boolean = false): string => {
  if (trimUnderScoreOnly) {
    return str.replace(/(_?\d+)$/, '');
  }
  return str.replace(/(_?\d+)$/, '').replace(/\d+$/, '');
};

/**
 * Parses a line by removing a prefix and trimming
 * Used for parsing various ASM directives
 */
export const parseLineWithPrefix = (line: string, prefix: string): string => {
  return line.replace(prefix, '').trim();
};

/**
 * Ensures an array exists in an object and returns it
 * Prevents repeated null checking and initialization
 */
export const ensureArrayExists = <T>(obj: Record<string, T[] | undefined>, key: string): T[] => {
  if (!obj[key]) {
    obj[key] = [];
  }
  return obj[key]!;
};

/**
 * Parses trainer definition lines that have comma-separated values
 * Handles comments (semicolons) and splits properly
 */
export const parseTrainerDefinition = (line: string, prefix: string): string[] => {
  return line.replace(prefix, '').split(';')[0].split(',');
};

/**
 * Creates a trainer constant name based on class and ID
 * Handles special trainer classes differently
 */
export const createTrainerConstantName = (trainerClass: string, trainerIdPart: string): string => {
  const trainerConstantName = removeNumericSuffix(
    specialTrainerClasses.includes(trainerClass)
      ? trainerIdPart
      : `${trainerClass}_${trainerIdPart}`,
    true,
  );
  return trainerConstantName;
};

/**
 * Creates a base trainer key for consolidation
 * Always includes both class and name to prevent collisions
 */
export const createBaseTrainerKey = (trainerClass: string, trainerName: string): string => {
  // Always include both class and name to prevent collisions between trainers
  // with the same name but different classes
  return `${normalizeSpaces(trainerClass)}_${normalizeSpaces(trainerName)}`;
};

/**
 * Parses Pokemon name and held item from trainer data
 * Handles the "POKEMON @ ITEM" format
 */
export const parsePokemonWithItem = (pokemonPart: string): { pokemon: string; item?: string } => {
  if (pokemonPart.includes('@')) {
    const [pokemon, heldItem] = pokemonPart.split('@');
    return {
      pokemon: normalizeString(pokemon),
      item: normalizeString(heldItem),
    };
  }
  return {
    pokemon: normalizeString(pokemonPart),
  };
};

/**
 * Counts direction connections from a connections string
 * Used for map attributes parsing
 */
export const countConnections = (connectionsStr: string): number => {
  let count = 0;
  if (connectionsStr.includes('NORTH')) count++;
  if (connectionsStr.includes('SOUTH')) count++;
  if (connectionsStr.includes('EAST')) count++;
  if (connectionsStr.includes('WEST')) count++;
  return count;
};

//This function converts keys for in-game data to a
//display-friendly format by removing underscores, dashes, apostrophes, and periods.

export const displayName = (str: string) => {
  // Handle floor suffixes like B1F, B2F, 1F, 2F, etc.
  return str
    .replace(/^Route(\d)/g, 'Route $1')
    .replace(/([a-zA-Z])Gate$/g, '$1 Gate')
    .replace(/F(North|South)$/g, 'F $1')
    .replace(/([a-zA-Z])([B]?\d+F)$/g, '$1 $2')
    .replace(/(\d)(?!F(?![a-zA-Z])|$)([a-zA-Z])/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ');
};

//This function stores the reduce function, which converts in-game data to its simplest form.
//It decapitalizes everything
//Removes underscores, dashes, apostrophes, periods
//Replaces Jupiter and Venus with m and f

export const reduce = (str: string) => {
  return str
    .toLowerCase()
    .replaceAll(' ', '')
    .replaceAll('<', '')
    .replaceAll('>', '')
    .replaceAll('_', '')
    .replaceAll('-', '')
    .replaceAll("'", '')
    .replaceAll('.', '')
    .replaceAll('♂', 'm')
    .replaceAll('♀', 'f')
    .replaceAll('é', 'e');
};

export const parseForm = (str: string) => {
  // Handle formats like "ALOLAN_FORM", "GALARIAN_FORM", etc.
  if (str.endsWith('_FORM')) {
    return reduce(
      str
        .replace('_FORM', '')
        .replace('TAUROS_', '')
        .replace('MAGIKARP_', '')
        .replace('PIKACHU_', '')
        .replace('MEWTWO_', '')
        .replace('ARBOK_', ''),
    );
  }
  // Fallback for other formats
  return reduce(str.slice(4, str.indexOf('_')));
};

/**
 * Parses an itemball_event line
 * Format: itemball_event x, y, ITEM_NAME, quantity, EVENT_NAME
 */
export const parseItemballEvent = (line: string) => {
  const match = line.match(/itemball_event\s+(\d+),\s*(\d+),\s*([A-Z_]+),\s*\d+,\s*([A-Z_]+)/);
  if (match) {
    const [, x, y, itemName] = match;
    return {
      name: reduce(itemName),
      type: 'item' as const,
      coordinates: {
        x: parseInt(x),
        y: parseInt(y),
      },
    };
  }
  return null;
};

/**
 * Parses a bg_event line with BGEVENT_ITEM
 * Format: bg_event x, y, BGEVENT_ITEM + ITEM_NAME, EVENT_NAME
 */
export const parseHiddenItemEvent = (line: string) => {
  const match = line.match(
    /bg_event\s+(\d+),\s*(\d+),\s*BGEVENT_ITEM\s*\+\s*([A-Z_]+),\s*([A-Z_]+)/,
  );
  if (match) {
    const [, x, y, itemName] = match;
    return {
      name: reduce(itemName),
      type: 'hiddenItem' as const,
      coordinates: {
        x: parseInt(x),
        y: parseInt(y),
      },
    };
  }
  return null;
};

export const parseMartItem = (line: string) => {
  const match = line.match(/db\s+([A-Z_]+)/);
  if (match) {
    const [, itemName] = match;
    return {
      name: reduce(itemName),
      type: 'purchase' as const,
    };
  }
  return null;
};

/**
 * Parses a fruittree_event line
 * Format: fruittree_event x, y, FRUITTREE_ID, BERRY_NAME, PAL_COLOR
 */
export const parseFruitTreeEvent = (line: string) => {
  if (line.match(/fruittree_event\s+/)) {
    const parts = line.split(/fruittree_event\s+/)[1].split(',');
    if (parts.length >= 4) {
      const [x, y, , itemName] = parts;
      return {
        name: reduce(itemName),
        type: 'berry' as const,
        coordinates: {
          x: parseInt(x.trim()),
          y: parseInt(y.trim()),
        },
      };
    }
  }
  return null;
};

/**
 * Parses a verbosegiveitem line
 * Format: verbosegiveitem ITEM_NAME
 */
export const parseVerboseGiveItemEvent = (line: string) => {
  if (line.match(/verbosegiveitem\s+/)) {
    const parts = line.split(/verbosegiveitem\s+/)[1].split(',');
    const [itemName] = parts;
    return {
      name: reduce(itemName),
      type: 'gift' as const,
    };
  }
  return null;
};
/**
 * Parses a verbosegivetmhm line
 * Format: verbosegivetmhm ITEM_NAME
 */
export const parseVerboseGiveTMHMEvent = (line: string) => {
  if (line.match(/verbosegivetmhm\s+/)) {
    const parts = line.split(/verbosegivetmhm\s+/)[1].split('_');
    return {
      name: parts.length > 1 ? reduce(parts.slice(1).join('_')) : reduce(parts[0]),
      type: reduce(parts[0]),
    };
  }
  return null;
};

/**
 * Parses a setevent line
 * Format: setevent EVENT_NAME
 */
export const parseMapEvent = (line: string) => {
  let eventType = 'event';
  let item;
  if (line.match(/setevent\s+/)) {
    const parts = line.trim().split(/setevent\s+/);
    const eventDescription = parts[1].split('EVENT_')[1].replaceAll('_', ' ').toLowerCase();
    if (parts.length > 1) {
      const eventName = parts[1].split('EVENT_')[1];

      // Skip events containing security
      if (
        eventName.toLowerCase().includes('security') ||
        eventDescription.toLowerCase().includes('switch')
      ) {
        return null;
      }

      switch (true) {
        case eventName.includes('BEAT_'):
          eventType = 'battle';
          break;
        case eventName.includes('GOT_'):
          item = eventName.split('GOT_')[1].split('_FROM_')[0];
          item = item.split('_IN')[0];
          if (item.includes('TM') || item.includes('HM')) {
            item = item.split('_')[0];
          }
          eventType = 'gift';
          break;
        case eventName.includes('PHONE_NUMBER'):
          eventType = 'phone';
          break;
        default:
          eventType = 'event';
      }
      console.log(eventName);
      return {
        name: reduce(eventName),
        type: eventType,
        description: eventDescription,
        item: item ? reduce(item) : undefined,
      };
    }
  }
  return null;
};

/**
 * Parses a move description line by removing leading hyphens and replacing placeholders
 * Specifically replaces "#mon" with "Pokemon"
 */
export const parseMoveDescription = (line: string): string => {
  return line.replace(/-\s+/g, '').replace(/#mon/g, 'Pokemon').trim();
};

/**
 * Parses a trainer line
 * Format: generictrainer SWIMMERF, KENDRA, EVENT_BEAT_SWIMMERF_KENDRA, .SeenText, .BeatenText or
 * Format: 	loadtrainer KAREN, 1
 * Format: 	loadtrainer CHAMPION, LANCE
 * Format: 	loadtrainer CHAMPION, LANCE2
 */

export const parseTrainerLine = (line: string): string | null => {
  // Handle generictrainer format: generictrainer CLASS, NAME, EVENT, .SeenText, .BeatenText
  const genericMatch = line.match(/generictrainer\s+([A-Z_]+),\s*([A-Z_]+),\s*(.+)/);
  if (genericMatch) {
    const [, className, name] = genericMatch;
    return reduce(className + name);
  }

  // Handle loadtrainer with numeric ID: loadtrainer CLASS, NUMBER
  const loadNumericMatch = line.match(/loadtrainer\s+([A-Z_]+),\s*(\d+)/);
  if (loadNumericMatch) {
    const [, className] = loadNumericMatch;
    return reduce(className);
  }

  // Handle loadtrainer with name: loadtrainer CLASS, NAME
  const loadNameMatch = line.match(/loadtrainer\s+([A-Z_]+),\s*([A-Z_0-9]+)/);
  if (loadNameMatch) {
    const [, className, name] = loadNameMatch;
    return reduce(
      removeNumericSuffix(
        specialTrainerClasses.includes(className) ? name : className + name,
        false,
      ),
    );
  }

  return null;
};

export const parseEvolutionParameter = (line: string): number | string | undefined => {
  const parameter = line.includes('TR_') ? line.replace('TR_', '') : line;
  return isNaN(Number(parameter))
    ? reduce(parameter)
    : Number(parameter) < 0
      ? undefined
      : Number(parameter);
};
