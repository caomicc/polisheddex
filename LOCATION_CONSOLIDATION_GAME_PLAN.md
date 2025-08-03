# Location Consolidation Game Plan

## Current State Analysis

**Problem Overview:**
The polished-dex project currently has 665 location JSON files, many of which represent stub pages with minimal information, duplicated locations due to normalization issues, and unnecessarily granular subdivisions that should be consolidated.

**Key Issues Identified:**

1. **Duplication from Poor Normalization:**
   - Examples: `route_9.json` exists (no space variant found, but pattern suggests potential duplication)
   - Inconsistent naming conventions between files

2. **Over-Granular Multi-Floor Locations:**
   - Department stores: `celadon_dept_store_1f.json`, `celadon_dept_store_2f.json`, etc. (6 floors total)
   - Hotels: `celadon_hotel_1f.json`, `celadon_hotel_2f.json`, etc.
   - Universities: Multiple `celadon_university_*` rooms (10+ individual rooms)
   - Towers: `tin_tower_1f.json` through `tin_tower_10f.json` plus roof
   - Caves: Multiple floor variations for same location

3. **Elite 4 Fragmentation:**
   - Individual rooms: `brunos_room.json`, `karens_room.json`, `lances_room.json`, `wills_room.json`
   - Should consolidate to `indigo_plateau.json` with Elite 4 data integrated

4. **Stub Pages with Minimal Content:**
   - Many files contain only basic metadata (id, name, connections) with no trainers, items, or encounters
   - Individual gym leader files: `falkner.json`, `bugsy.json`, etc. should be part of their respective gym locations

## Consolidation Strategy

### Phase 1: Identify Consolidation Categories

#### A. Multi-Floor Buildings → Single Location
**Target Pattern:** Buildings with 2+ floors that serve the same functional purpose
**Action:** Merge into single location file with floor data as subsections

**Examples to Consolidate:**
- `celadon_dept_store_*` → `celadon_dept_store.json`
- `celadon_hotel_*` → `celadon_hotel.json`  
- `celadon_university_*` → `celadon_university.json`
- `tin_tower_*` → `tin_tower.json`
- `battle_tower_*` → `battle_tower.json`
- `radio_tower_*` → `radio_tower.json`
- Multi-floor caves: `union_cave_*`, `ice_path_*`, etc.

#### B. Elite 4 & Gym Leader Integration
**Target Pattern:** Individual trainer room files that should be part of larger locations
**Action:** Merge trainer data into parent location files

**Examples to Consolidate:**
- `brunos_room.json`, `karens_room.json`, `lances_room.json`, `wills_room.json` → `indigo_plateau.json`
- Individual gym leader files → respective gym location files
- `kogas_room.json` → integrate with appropriate location

#### C. Related Sub-Areas → Parent Location
**Target Pattern:** Small sub-areas that are parts of larger locations
**Action:** Merge as subsections of parent location

**Examples to Consolidate:**
- Route segments: `route_10_north.json`, `route_10_south.json` → `route_10.json`
- Coast areas: `route_32_coast.json`, `route_34_coast.json` → parent route files
- Gate files that serve single routes: merge into route files

### Phase 2: Data Structure Design

#### New Consolidated Location Schema
```typescript
interface ConsolidatedLocationData {
  id: number;
  name: string;
  displayName: string;
  region: 'johto' | 'kanto' | 'orange';
  x: number;
  y: number;
  flyable: boolean;
  connections: LocationConnection[];
  
  // New consolidated fields
  areas?: LocationArea[];  // For multi-floor/multi-area locations
  eliteFour?: TrainerData[];  // For Indigo Plateau
  gymLeader?: TrainerData;    // Integrated gym leader data
  
  // Existing fields
  trainers?: TrainerData[];
  items?: ItemData[];
  tmhms?: TMHMData[];
  wildPokemon?: EncounterData[];
}

interface LocationArea {
  id: string;           // e.g., "1f", "2f", "basement", "roof"
  displayName: string;  // e.g., "First Floor", "Second Floor"
  trainers?: TrainerData[];
  items?: ItemData[];
  connections?: LocationConnection[];
}
```

### Phase 3: Implementation Steps

#### Step 1: Create Location Hierarchy Mapping
**AI Prompt Context:**
```
Create a mapping file that categorizes all 665 locations into:
1. CONSOLIDATE: Locations to merge (with target parent)
2. KEEP: Locations to keep as standalone 
3. DELETE: Stub locations with no valuable data

Format as JSON:
{
  "consolidationGroups": {
    "celadon_dept_store": [
      "celadon_dept_store_1f",
      "celadon_dept_store_2f", 
      // ... etc
    ]
  },
  "standaloneLocations": ["new_bark_town", "route_1", ...],
  "deleteLocations": ["location_with_no_data", ...]
}
```

#### Step 2: Modify Location Extractor Logic
**AI Prompt Context:**
```
Update extract_locations.ts to:
1. Read the consolidation mapping from Step 1
2. During location processing, check if current location should be consolidated
3. If consolidating, collect all related location data and merge into parent structure
4. Skip generating individual files for locations marked for consolidation
5. Use new ConsolidatedLocationData schema

Key changes needed in extractAllLocations():
- Add consolidation logic before file generation
- Merge trainer, item, and connection data from child locations
- Generate area subsections for multi-floor locations
```

#### Step 3: Update String Normalization
**AI Prompt Context:**
```
Update src/utils/locationUtils.ts normalizeLocationKey() function to:
1. Handle consolidated location routing (e.g., route_9_1f → route_9)
2. Add mapping for old location keys to new consolidated keys
3. Ensure URL compatibility for consolidated locations
4. Add area/floor parameter support for deep linking

Add function: getLocationAreaFromKey(locationKey: string) to extract area info
```

#### Step 4: Update UI Components
**AI Prompt Context:**
```
Update location display components to handle consolidated locations:
1. Location detail pages should show area tabs/sections for multi-area locations
2. Breadcrumb navigation should show Parent > Area structure
3. Search should find consolidated locations and deep-link to specific areas
4. Connection navigation should work with new area structure

Files to update:
- Location detail components
- Navigation components  
- Search functionality
- URL routing logic
```

#### Step 5: Create Migration Script
**AI Prompt Context:**
```
Create migration script that:
1. Backs up current /output/locations directory
2. Runs new extraction with consolidation logic
3. Validates that no important data was lost during consolidation
4. Generates report showing:
   - Number of files before/after
   - List of consolidated locations
   - Any data conflicts or losses
   - Redirect mapping for old URLs
```

### Phase 4: Validation & Testing

#### Data Integrity Checks
- Verify all trainer data preserved during consolidation
- Ensure all items and TM/HM locations maintained
- Confirm connection mappings still work
- Test that wild Pokémon encounter data is complete

#### URL Compatibility
- Create redirect mapping for old location URLs
- Test that all internal links still resolve
- Verify search functionality works with consolidated locations

#### Performance Testing
- Measure page load times before/after consolidation
- Verify reduced file system overhead
- Test that consolidated location pages don't become too large

## Expected Outcomes

**File Reduction:** ~665 files → ~200-300 files (60-70% reduction)

**Key Consolidations:**
- ~50 multi-floor buildings → ~15 consolidated buildings
- 8 Elite 4/Champion rooms → 1 Indigo Plateau location
- ~20 gym leader files → integrated into gym locations  
- ~100 route segments/gates → ~50 consolidated routes
- Remove ~100+ stub files with minimal data

**Benefits:**
- Cleaner navigation structure
- Reduced maintenance overhead
- Better user experience with comprehensive location pages
- Easier data management for future updates
- More logical URL structure

## Implementation Priority

1. **High Priority:** Elite 4 consolidation (immediate impact)
2. **High Priority:** Multi-floor building consolidation (major file reduction)
3. **Medium Priority:** Route segment consolidation (URL cleanup)
4. **Low Priority:** Stub file removal (maintenance improvement)

This game plan provides a systematic approach to consolidating the location structure while preserving all valuable data and improving the overall user experience.