import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LocationData, LocationArea, LocationTrainer } from '../types/types.ts';
import { formatDisplayName } from './stringUtils.ts';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ConsolidationMapping {
  consolidationGroups: Record<string, string[]>;
  gymLeaderIntegrations: Record<string, string[]>;
  standaloneLocations: string[];
  deleteLocations: string[];
}

/**
 * Load the consolidation mapping configuration
 */
function loadConsolidationMapping(): ConsolidationMapping {
  const mappingPath = path.join(__dirname, '../../location-consolidation-mapping.json');
  console.log(`🗂️  Looking for consolidation mapping at: ${mappingPath}`);
  if (!fs.existsSync(mappingPath)) {
    console.warn(`⚠️  Consolidation mapping not found at ${mappingPath}, using original structure`);
    return {
      consolidationGroups: {},
      gymLeaderIntegrations: {},
      standaloneLocations: [],
      deleteLocations: [],
    };
  }

  return JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
}

/**
 * Create a display name for floor/area IDs
 */
function createAreaDisplayName(areaId: string): string {
  if (areaId.match(/^\d+f$/)) {
    const floor = areaId.replace('f', '');
    const ordinal = getOrdinal(parseInt(floor));
    return `${ordinal} Floor`;
  }
  
  if (areaId.startsWith('b_') && areaId.endsWith('f')) {
    const floor = areaId.replace('b_', '').replace('f', '');
    const ordinal = getOrdinal(parseInt(floor));
    return `Basement ${ordinal} Floor`;
  }
  
  if (areaId === 'roof') return 'Roof';
  if (areaId === 'basement') return 'Basement';
  if (areaId === 'outside') return 'Outside';
  if (areaId === 'entrance') return 'Entrance';
  
  // For other cases, format as title case
  return formatDisplayName(areaId);
}

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 */
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Extract area ID from location name
 */
function extractAreaId(locationName: string, parentName: string): string {
  const suffix = locationName.replace(parentName + '_', '');
  return suffix || 'main';
}

/**
 * Consolidate locations according to the mapping configuration
 */
export function consolidateLocations(locations: Record<string, LocationData>): Record<string, LocationData> {
  console.log('🔄 Starting location consolidation...');
  
  const mapping = loadConsolidationMapping();
  const consolidatedLocations: Record<string, LocationData> = {};
  const processedLocations = new Set<string>();
  
  // Process consolidation groups
  for (const [parentName, childNames] of Object.entries(mapping.consolidationGroups)) {
    console.log(`📁 Consolidating ${parentName}: ${childNames.length} locations`);
    
    const parentLocation = locations[parentName];
    if (!parentLocation) {
      console.warn(`⚠️  Parent location ${parentName} not found, skipping consolidation group`);
      continue;
    }
    
    // Create consolidated location starting with parent data
    const consolidated: LocationData = {
      ...parentLocation,
      areas: [],
      consolidatedFrom: [parentName, ...childNames],
    };
    
    // Add parent as main area if it has meaningful data
    if (parentLocation.trainers?.length || parentLocation.items?.length || parentLocation.connections?.length) {
      consolidated.areas!.push({
        id: 'main',
        displayName: 'Main Area',
        trainers: parentLocation.trainers || [],
        items: parentLocation.items || [],
        connections: parentLocation.connections || [],
        tmhms: parentLocation.tmhms || [],
        events: parentLocation.events || [],
        npcTrades: parentLocation.npcTrades || [],
      });
    }
    
    // Process child locations
    for (const childName of childNames) {
      const childLocation = locations[childName];
      if (!childLocation) {
        console.warn(`⚠️  Child location ${childName} not found`);
        continue;
      }
      
      const areaId = extractAreaId(childName, parentName);
      const areaDisplayName = createAreaDisplayName(areaId);
      
      // Special handling for Elite 4 rooms
      if (parentName === 'indigo_plateau' && childName.includes('room')) {
        if (!consolidated.eliteFour) {
          consolidated.eliteFour = [];
        }
        if (childLocation.trainers) {
          consolidated.eliteFour.push(...childLocation.trainers);
        }
      } else {
        // Regular area consolidation
        const area: LocationArea = {
          id: areaId,
          displayName: areaDisplayName,
          trainers: childLocation.trainers || [],
          items: childLocation.items || [],
          connections: childLocation.connections || [],
          tmhms: childLocation.tmhms || [],
          events: childLocation.events || [],
          npcTrades: childLocation.npcTrades || [],
        };
        
        consolidated.areas!.push(area);
      }
      
      // Merge top-level data from child locations
      if (childLocation.tmhms) {
        consolidated.tmhms = [...(consolidated.tmhms || []), ...childLocation.tmhms];
      }
      if (childLocation.items) {
        consolidated.items = [...(consolidated.items || []), ...childLocation.items];
      }
      
      processedLocations.add(childName);
    }
    
    // Update trainer and Pokemon counts
    const totalTrainers = (consolidated.eliteFour?.length || 0) + 
                         (consolidated.trainers?.length || 0) + 
                         (consolidated.areas?.reduce((sum, area) => sum + (area.trainers?.length || 0), 0) || 0);
    consolidated.trainerCount = totalTrainers;
    consolidated.hasTrainers = totalTrainers > 0;
    
    consolidatedLocations[parentName] = consolidated;
    processedLocations.add(parentName);
  }
  
  // Process gym leader integrations
  for (const [gymName, gymLeaderNames] of Object.entries(mapping.gymLeaderIntegrations)) {
    const gymLocation = consolidatedLocations[gymName] || locations[gymName];
    if (!gymLocation) {
      console.warn(`⚠️  Gym location ${gymName} not found`);
      continue;
    }
    
    for (const leaderName of gymLeaderNames) {
      const leaderLocation = locations[leaderName];
      if (leaderLocation?.trainers?.[0]) {
        // Convert first trainer to gym leader
        const leader = leaderLocation.trainers[0];
        gymLocation.gymLeader = {
          name: leader.name,
          trainerClass: leader.trainerClass,
          badge: '', // Will need to be populated from other data
          region: gymLocation.region,
          pokemon: leader.pokemon,
          coordinates: leader.coordinates,
        };
        
        if (!consolidatedLocations[gymName]) {
          consolidatedLocations[gymName] = gymLocation;
        }
        processedLocations.add(leaderName);
      }
    }
  }
  
  // Add standalone locations
  for (const locationName of mapping.standaloneLocations) {
    if (!processedLocations.has(locationName) && locations[locationName]) {
      consolidatedLocations[locationName] = locations[locationName];
      processedLocations.add(locationName);
    }
  }
  
  // Add any remaining unprocessed locations (fallback)
  for (const [locationName, locationData] of Object.entries(locations)) {
    if (!processedLocations.has(locationName) && !mapping.deleteLocations.includes(locationName)) {
      consolidatedLocations[locationName] = locationData;
    }
  }
  
  const originalCount = Object.keys(locations).length;
  const consolidatedCount = Object.keys(consolidatedLocations).length;
  const reduction = ((originalCount - consolidatedCount) / originalCount * 100).toFixed(1);
  
  console.log(`✅ Consolidation complete: ${originalCount} → ${consolidatedCount} locations (${reduction}% reduction)`);
  
  return consolidatedLocations;
}

/**
 * Get area from consolidated location by area ID
 */
export function getLocationArea(locationData: LocationData, areaId?: string): LocationArea | null {
  if (!areaId || areaId === 'main' || !locationData.areas) {
    return null; // Return null for main area - use base location data
  }
  
  return locationData.areas.find(area => area.id === areaId) || null;
}

/**
 * Check if a location is consolidated (has areas)
 */
export function isConsolidatedLocation(locationData: LocationData): boolean {
  return Boolean(locationData.areas && locationData.areas.length > 0);
}

/**
 * Get all area IDs from a consolidated location
 */
export function getLocationAreaIds(locationData: LocationData): string[] {
  if (!locationData.areas) return [];
  return locationData.areas.map(area => area.id);
}

/**
 * Get area display name by ID
 */
export function getAreaDisplayName(locationData: LocationData, areaId: string): string {
  if (!areaId || areaId === 'main') return locationData.displayName;
  
  const area = getLocationArea(locationData, areaId);
  return area ? area.displayName : locationData.displayName;
}