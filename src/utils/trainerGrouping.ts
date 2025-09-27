import type { GroupedTrainer, LocationTrainer } from '../types/types.ts';

/**
 * Detect if a group of trainers represents starter variations
 * rather than traditional rematches
 */
function isStarterVariationGroup(group: LocationTrainer[]): boolean {
  if (group.length < 2) return false;

  const firstTrainer = group[0];

  // Check if this is a known starter-dependent trainer
  const starterTrainers = ['lyra', 'rival', '<rival>'];
  const isStarterTrainer = starterTrainers.some(
    (name) =>
      firstTrainer.name.toLowerCase().includes(name.toLowerCase()) ||
      firstTrainer.trainerClass.toLowerCase().includes('lyra') ||
      firstTrainer.trainerClass.toLowerCase().includes('rival'),
  );

  if (!isStarterTrainer) return false;

  // Check if all trainers have similar levels (starter variations should be at similar levels)
  // Unlike rematches which typically have increasing levels
  const levels = group.flatMap(
    (trainer) =>
      trainer.pokemon?.map((p) => {
        // Convert badge levels to numbers for comparison, default to 25
        const level = p.level || 0;
        return typeof level === 'string' ? 25 : level;
      }) || [],
  );

  if (levels.length === 0) return false;

  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const levelRange = maxLevel - minLevel;

  // If level range is small (≤ 10), likely starter variations
  // If level range is large (> 15), likely rematches
  return levelRange <= 10;
}

/**
 * Analyze a trainer group to determine the most likely grouping type
 */
function determineGroupType(
  group: LocationTrainer[],
): 'rematch' | 'starter_variation' | 'double_battle' {
  const firstTrainer = group[0];

  // Check for starter variations first
  if (isStarterVariationGroup(group)) {
    return 'starter_variation';
  }

  // Check for trainer pairs/twins (double battles)
  if (group.length === 2) {
    const areTrainerPairs = group.every(
      (trainer) =>
        trainer.name === firstTrainer.name &&
        trainer.trainerClass === firstTrainer.trainerClass &&
        (trainer.trainerClass === 'TWINS' ||
          trainer.trainerClass === 'SR_AND_JR' ||
          trainer.trainerClass === 'ACE_DUO' ||
          trainer.name.includes('&')) &&
        // Check if coordinates are adjacent
        Math.abs(trainer.coordinates.x - firstTrainer.coordinates.x) <= 2 &&
        Math.abs(trainer.coordinates.y - firstTrainer.coordinates.y) <= 2 &&
        // But not exactly the same coordinates
        !(
          trainer.coordinates.x === firstTrainer.coordinates.x &&
          trainer.coordinates.y === firstTrainer.coordinates.y
        ),
    );

    if (areTrainerPairs) {
      return 'double_battle';
    }
  }

  // Default to rematch for other grouped trainers
  return 'rematch';
}

export function groupRematchTrainers(trainers: LocationTrainer[]): GroupedTrainer[] {
  const trainerGroups = new Map<string, LocationTrainer[]>();

  // First, group trainers by base identity
  trainers.forEach((trainer) => {
    // Extract base identity - remove numeric suffixes for potential rematches
    const baseId = trainer.id.replace(/\d+$/, '');
    const baseName = trainer.name;
    const baseClass = trainer.trainerClass;

    // Create a unique key for grouping
    const groupKey = `${baseClass}_${baseName}_${baseId}`;

    if (!trainerGroups.has(groupKey)) {
      trainerGroups.set(groupKey, []);
    }
    trainerGroups.get(groupKey)!.push(trainer);
  });

  const groupedTrainers: GroupedTrainer[] = [];

  // Process each group
  trainerGroups.forEach((group) => {
    if (group.length === 1) {
      // Single trainer - not grouped
      groupedTrainers.push({
        baseTrainer: group[0],
        rematches: [],
        isGrouped: false,
      });
    } else {
      // Multiple trainers with similar identity
      // Check if they're actually rematches (same name, class, coordinates, and rematchable)
      const firstTrainer = group[0];
      const areRematches = group.every(
        (trainer) =>
          trainer.name === firstTrainer.name &&
          trainer.trainerClass === firstTrainer.trainerClass &&
          trainer.coordinates.x === firstTrainer.coordinates.x &&
          trainer.coordinates.y === firstTrainer.coordinates.y &&
          trainer.rematchable === true,
      );

      console.log('Trainer group:', group, 'firstTrainer.trainerClass', firstTrainer.trainerClass);

      // Check if they're trainer pairs/twins (same name, class, adjacent coordinates)
      const areTrainerPairs =
        group.length === 2 &&
        group.every(
          (trainer) =>
            trainer.name === firstTrainer.name &&
            trainer.trainerClass === firstTrainer.trainerClass &&
            (trainer.trainerClass === 'TWINS' ||
              trainer.trainerClass === 'SR_AND_JR' ||
              trainer.trainerClass === 'ACE_DUO' ||
              trainer.name.includes('&')) && // Names with "&" are usually pairs
            // Check if coordinates are adjacent (within 1-2 tiles of each other)
            Math.abs(trainer.coordinates.x - firstTrainer.coordinates.x) <= 2 &&
            Math.abs(trainer.coordinates.y - firstTrainer.coordinates.y) <= 2 &&
            // But not exactly the same coordinates (that would be rematches)
            !(
              trainer.coordinates.x === firstTrainer.coordinates.x &&
              trainer.coordinates.y === firstTrainer.coordinates.y
            ),
        );

      if (areRematches) {
        // Group as rematches - sort by ID to get proper order
        const sortedRematches = group.sort((a, b) => {
          const aNum = parseInt(a.id.match(/\d+$/)?.[0] || '1');
          const bNum = parseInt(b.id.match(/\d+$/)?.[0] || '1');
          return aNum - bNum;
        });

        groupedTrainers.push({
          baseTrainer: sortedRematches[0], // First encounter
          rematches: sortedRematches.slice(1), // Subsequent rematches
          isGrouped: true,
          groupType: 'rematch',
        });
      } else if (areTrainerPairs) {
        // Group as trainer pairs/twins - combine their Pokémon into one encounter
        const sortedPair = group.sort((a, b) => {
          const aNum = parseInt(a.id.match(/\d+$/)?.[0] || '1');
          const bNum = parseInt(b.id.match(/\d+$/)?.[0] || '1');
          return aNum - bNum;
        });

        // Create a combined trainer with both teams
        const combinedTrainer = {
          ...sortedPair[0],
          pokemon: [...(sortedPair[0].pokemon || []), ...(sortedPair[1].pokemon || [])],
        };

        groupedTrainers.push({
          baseTrainer: combinedTrainer,
          rematches: [],
          isGrouped: true,
          groupType: 'double_battle',
        });
      } else {
        // Check if they're likely rematches even if rematchable flag is wrong
        // (same name, class, and sequential IDs with numbers)
        const allHaveNumbers = group.every((trainer) => /\d+$/.test(trainer.id));

        let hasSequentialIds = false;
        if (allHaveNumbers) {
          const numbers = group
            .map((trainer) => parseInt(trainer.id.match(/\d+$/)?.[0] || '0'))
            .sort((a, b) => a - b);
          hasSequentialIds = numbers.every((num, index) => {
            if (index === 0) return true; // First number can be anything
            return num === numbers[index - 1] + 1; // Each subsequent number should be previous + 1
          });
        }

        if (hasSequentialIds && allHaveNumbers && group.length > 1) {
          // Determine the type of grouping for this trainer set
          const groupType = determineGroupType(group);

          if (groupType === 'starter_variation') {
            // Group as starter variations - sort by ID
            const sortedVariations = group.sort((a, b) => {
              const aNum = parseInt(a.id.match(/\d+$/)?.[0] || '1');
              const bNum = parseInt(b.id.match(/\d+$/)?.[0] || '1');
              return aNum - bNum;
            });

            groupedTrainers.push({
              baseTrainer: sortedVariations[0], // First variation (often Chikorita team)
              rematches: sortedVariations.slice(1), // Other starter variations
              isGrouped: true,
              groupType: 'starter_variation',
            });
          } else {
            // These are likely rematches despite the rematchable flag being false
            const sortedRematches = group.sort((a, b) => {
              const aNum = parseInt(a.id.match(/\d+$/)?.[0] || '1');
              const bNum = parseInt(b.id.match(/\d+$/)?.[0] || '1');
              return aNum - bNum;
            });

            groupedTrainers.push({
              baseTrainer: sortedRematches[0], // First encounter
              rematches: sortedRematches.slice(1), // Subsequent rematches
              isGrouped: true,
              groupType: 'rematch',
            });
          }
        } else {
          // Different trainers (unrelated) - keep separate
          group.forEach((trainer) => {
            groupedTrainers.push({
              baseTrainer: trainer,
              rematches: [],
              isGrouped: false,
            });
          });
        }
      }
    }
  });

  return groupedTrainers;
}

// /**
//  * Get the unique trainer count (grouped trainers count as 1)
//  */
// export function getUniqueTrainerCount(trainers: LocationTrainer[]): number {
//   const groupedTrainers = groupRematchTrainers(trainers);
//   return groupedTrainers.length;
// }
