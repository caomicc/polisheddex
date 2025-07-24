# TM/HM Extraction Summary

## Overview
The extraction process now includes TM/HM data extraction and integration with both location and item data.

## What's Extracted

### TM/HM Location Data
- **Source**: `polishedcrystal/data/moves/tmhm_moves.asm`
- **Output**: Integrated into `output/all_locations.json`
- **Data includes**:
  - TM/HM number (e.g., "TM01", "HM01")
  - Move name (formatted for display)
  - Location where the TM/HM can be obtained

### TM/HM Item Data
- **Source**: `polishedcrystal/data/moves/tmhm_moves.asm` + `output/pokemon_move_descriptions.json`
- **Output**: Integrated into `output/items_data.json`
- **Data includes**:
  - Item ID (e.g., "tm01", "hm01")
  - Display name (e.g., "TM01 Dynamicpunch")
  - Move description, type, power, PP, accuracy, category
  - Structured location data

## Integration Points

### In Location Data (`all_locations.json`)
Each location that has TM/HMs available now includes a `tmhms` array:
```json
{
  "location_name": {
    "id": 123,
    "name": "location_name",
    "displayName": "Location Name",
    // ... other location properties
    "tmhms": [
      {
        "tmNumber": "TM01",
        "moveName": "Dynamicpunch",
        "location": "Chuck"
      }
    ]
  }
}
```

### In Item Data (`items_data.json`)
Each TM/HM is now a full item entry:
```json
{
  "tm01": {
    "id": "tm01",
    "name": "TM01 Dynamicpunch",
    "description": "An attack that confuses the foe.",
    "tmNumber": "TM01",
    "moveName": "Dynamicpunch",
    "type": "Fighting",
    "power": 100,
    "pp": 5,
    "accuracy": 50,
    "category": "Physical",
    "location": {
      "area": "Chuck's Gym",
      "details": "Gym Leader"
    }
  }
}
```

## Extraction Statistics (Latest Run)
- ✅ **41 TM/HM locations** extracted successfully
- ✅ **70+ TMs** and **8 HMs** integrated into item data
- ✅ Location data includes TM/HM availability
- ✅ Item data includes complete TM/HM details with move info

## Functions Added
- `extractTMHMLocations()` in `extract_locations.ts`
- `formatMoveName()` helper function for consistent move name formatting
- Extended `LocationData` type to include `tmhms` property

## Usage
TM/HM extraction runs automatically as part of the standard extraction process:
```bash
npm run extract > log.out
```

This will extract Pokemon data, location data (including TM/HMs), and generate all output files.

## Location Normalization Improvements

### Issue Identified
Location keys were inconsistent, causing duplicate entries for the same logical location (e.g., 6 different "Sprout Tower" entries).

### Solution Implemented
Enhanced `normalizeLocationKey()` function with comprehensive patterns:

- **Basement floors**: `B1F`, `b_1f_f`, `b1f` → `b1f`
- **Regular floors**: `Tower1 F`, `tower2_f`, `tower3f` → `tower_1f`, `tower_2f`, `tower_3f`
- **CamelCase**: `SproutTower1F` → `sprout_tower_1f`
- **Space handling**: Consistent underscore conversion

### Results
- **Before**: 720 total locations with many duplicates
- **After**: 659 unique locations (61 duplicates consolidated)
- **Sprout Tower**: Now correctly shows 4 entries:
  - `sprout_tower` (base location)
  - `sprout_tower_1f` (floor 1)
  - `sprout_tower_2f` (floor 2) 
  - `sprout_tower_3f` (floor 3)

### Next Steps for UI
If location search still shows duplicates, the issue may be in the frontend search/display logic rather than data extraction.
