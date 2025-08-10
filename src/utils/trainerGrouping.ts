import { LocationTrainer } from '@/types/types';

export interface GroupedTrainer {
  baseTrainer: LocationTrainer;
  rematches: LocationTrainer[];
  isGrouped: boolean;
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
      const areRematches = group.every((trainer) => 
        trainer.name === firstTrainer.name &&
        trainer.trainerClass === firstTrainer.trainerClass &&
        trainer.coordinates.x === firstTrainer.coordinates.x &&
        trainer.coordinates.y === firstTrainer.coordinates.y &&
        trainer.rematchable === true
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
        });
      } else {
        // Different trainers (like starter-dependent rivals) - keep separate
        group.forEach((trainer) => {
          groupedTrainers.push({
            baseTrainer: trainer,
            rematches: [],
            isGrouped: false,
          });
        });
      }
    }
  });

  return groupedTrainers;
}

/**
 * Get the unique trainer count (grouped trainers count as 1)
 */
export function getUniqueTrainerCount(trainers: LocationTrainer[]): number {
  const groupedTrainers = groupRematchTrainers(trainers);
  return groupedTrainers.length;
}