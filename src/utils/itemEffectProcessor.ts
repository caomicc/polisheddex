/**
 * Utility functions to process item effects and parameters into meaningful user descriptions
 */

export interface ProcessedItemEffect {
  name: string;
  description: string;
  category: string;
  valueDisplay?: string;
}

/**
 * Process an item's effect and parameter into a meaningful description
 */
export function processItemEffect(
  name: string,
  effect: string | undefined,
  parameter: string | number | undefined,
  category?: string,
  description?: string,
  isKeyItem?: boolean,
): ProcessedItemEffect {
  const effectStr = effect || '0';
  const param = parameter || 0;

  // Handle numeric healing parameters
  if (effectStr === '0' && typeof param === 'number' && param > 0) {
    if (category === 'Medicine') {
      return {
        name: 'HP Restoration',
        description: `Restores ${param} HP when used`,
        category: 'healing',
        valueDisplay: `+${param} HP`,
      };
    }
  }

  // Handle status condition masks
  if (typeof param === 'string' && param.endsWith('_MASK')) {
    const statusMap: Record<string, string> = {
      SLP_MASK: 'Sleep',
      PAR_MASK: 'Paralysis',
      PSN_MASK: 'Poison',
      BRN_MASK: 'Burn',
      FRZ_MASK: 'Freeze',
    };

    const status = statusMap[param] || param.replace('_MASK', '').toLowerCase();
    const effectType = effectStr === 'Heal Status' ? 'held item effect' : 'consumable';

    return {
      name: `${status} Cure`,
      description: `Cures ${status.toLowerCase()} condition${effectType === 'held item effect' ? ' when held' : ''}`,
      category: 'status',
      valueDisplay: `Cures ${status}`,
    };
  }

  // Handle EV-related parameters
  if (typeof param === 'string' && param.includes('MON_') && param.includes('_EV')) {
    const statMatch = param.match(/MON_(\w+)_EV/);
    const stat = statMatch ? formatStatName(statMatch[1]) : 'Unknown Stat';

    const isReduction = effectStr === 'HELD_NO_BUG_BITE';
    return {
      name: `${stat} ${isReduction ? 'EV Reduction' : 'EV Enhancement'}`,
      description: `${isReduction ? 'Lowers' : 'Raises'} ${stat} EVs${isReduction ? ' and increases friendship' : ''}`,
      category: 'stat',
      valueDisplay: `${isReduction ? '-' : '+'}${stat} EVs`,
    };
  }

  // Handle battle stat modifiers
  if (typeof param === 'string' && param.includes('$') && param.includes('|')) {
    const parts = param.split('|').map((p) => p.trim());
    if (parts.length === 2) {
      const stat = formatStatName(parts[1]);
      return {
        name: `${stat} Boost`,
        description: `Temporarily raises ${stat} by one stage in battle`,
        category: 'battle',
        valueDisplay: `+1 ${stat} stage`,
      };
    }
  }

  // Handle type-based power boosts
  if (effectStr === 'Boost Move Type Power' && typeof param === 'string') {
    const type = formatTypeName(param);
    return {
      name: `${type} Power Boost`,
      description: `Powers up ${type}-type moves when held`,
      category: 'held',
      valueDisplay: `+${type} power`,
    };
  }

  // Handle held stat boosts
  if (effectStr === 'HELD_RAISE_STAT' && typeof param === 'string') {
    const stat = formatStatName(param);
    return {
      name: `${stat} Berry`,
      description: `Raises ${stat} by one stage when HP becomes low`,
      category: 'held',
      valueDisplay: `Emergency +${stat}`,
    };
  }

  // Handle offensive berries
  if (effectStr === 'HELD_OFFEND_HIT') {
    const moveType =
      param === 'PHYSICAL' ? 'physical' : param === 'SPECIAL' ? 'special' : 'contact';
    return {
      name: name,
      description: `Damages the attacker when hit by ${moveType} moves`,
      category: category ?? 'held item',
      valueDisplay: `Counter ${moveType} attacks`,
    };
  }

  // Handle accuracy reduction
  if (effectStr === 'Reduce Accuracy') {
    return {
      name: 'Accuracy Reduction',
      description: "Lowers the opponent's accuracy when held",
      category: 'held',
      valueDisplay: '-Accuracy',
    };
  }

  // Handle critical hit boost
  if (effectStr === 'Increase Critical Hit Ratio') {
    return {
      name: 'Critical Hit Boost',
      description: "Increases the holder's critical hit ratio",
      category: 'held',
      valueDisplay: '+Critical hits',
    };
  }

  // Handle special item effects
  if (effectStr === 'Iron Ball Effect') {
    return {
      name: 'Iron Ball',
      description: 'Halves Speed and grounds Flying-types and Pokémon with Levitate',
      category: 'special',
      valueDisplay: 'Speed/2, Grounded',
    };
  }

  if (effectStr === 'Mental Herb Effect') {
    return {
      name: 'Mental Protection',
      description:
        'Cures infatuation and prevents Taunt, Encore, Torment, Disable, and Cursed Body',
      category: 'special',
      valueDisplay: 'Mental status cure',
    };
  }

  // Handle Poké Ball mechanics (effect "0" with parameter 0)
  if (category === 'Poké Ball' && effectStr === '0' && param === 0) {
    return {
      name: 'Ball',
      description: 'Used to catch wild Pokémon',
      category: 'Poké Ball',
      valueDisplay: 'Capture item',
    };
  }

  if (isKeyItem) {
    return {
      name,
      description: description ?? '',
      category: 'Key Item',
      valueDisplay: 'Key Item',
    };
  }

  // Default fallback for unknown effects
  return {
    name: name,
    description: effect && effect !== '0' ? effect : (description ?? ''),
    category: category ?? 'unknown',
    valueDisplay: param ? String(param) : undefined,
  };
}

/**
 * Format stat names for display
 */
function formatStatName(stat: string): string {
  const statMap: Record<string, string> = {
    HP: 'HP',
    ATK: 'Attack',
    DEF: 'Defense',
    SAT: 'Special Attack',
    SDF: 'Special Defense',
    SPE: 'Speed',
    ATTACK: 'Attack',
    DEFENSE: 'Defense',
    SPEED: 'Speed',
    SPECIAL_ATTACK: 'Special Attack',
    SPECIAL_DEFENSE: 'Special Defense',
  };

  return statMap[stat.toUpperCase()] || stat.charAt(0).toUpperCase() + stat.slice(1).toLowerCase();
}

/**
 * Format type names for display
 */
function formatTypeName(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/**
 * Get a user-friendly description of item usage
 */
export function getUsageDescription(
  useOutsideBattle?: string,
  useInBattle?: string,
  category?: string,
  isKeyItem?: boolean,
): string {
  if (category === 'Poké Ball') {
    return 'Use on wild Pokémon to catch them';
  }

  if (isKeyItem) {
    return 'Use in specific locations or events';
  }

  const descriptions: string[] = [];

  if (useOutsideBattle && useOutsideBattle !== 'Cannot use') {
    descriptions.push(`Outside battle: ${useOutsideBattle.toLowerCase()}`);
  }

  if (useInBattle && useInBattle !== 'Cannot use') {
    descriptions.push(`In battle: ${useInBattle.toLowerCase()}`);
  }

  if (useOutsideBattle === 'Cannot use' && useInBattle === 'Cannot use') {
    return 'This item cannot be used directly';
  }

  return descriptions.join('; ') || 'Can be used on Pokémon';
}

/**
 * Determine if an item is primarily a held item
 */
export function isHeldItem(effect: string | undefined, category?: string): boolean {
  if (!effect || effect === '0') return false;

  const heldEffects = [
    'Boost Move Type Power',
    'HELD_RAISE_STAT',
    'HELD_OFFEND_HIT',
    'HELD_NO_BUG_BITE',
    'Heal Status',
    'Reduce Accuracy',
    'Increase Critical Hit Ratio',
    'Iron Ball Effect',
    'Mental Herb Effect',
  ];

  return heldEffects.includes(effect);
}
