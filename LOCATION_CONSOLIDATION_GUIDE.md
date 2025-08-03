# Location Consolidation Implementation Guide

## Overview

The location consolidation system combines multiple related location files into single consolidated locations with area support. This reduces file count from 665 to 472 (28.9% reduction) while preserving all data and improving navigation.

## Key Components

### 1. Data Structure (`src/types/types.ts`)

#### LocationArea Interface
```typescript
interface LocationArea {
  id: string;           // e.g., "1f", "2f", "basement", "roof"
  displayName: string;  // e.g., "First Floor", "Second Floor"
  connections?: LocationConnection[];
  items?: LocationItem[];
  trainers?: LocationTrainer[];
  // ... other location data
}
```

#### Extended LocationData Interface
```typescript
interface LocationData {
  // ... existing fields
  areas?: LocationArea[];        // For multi-floor/multi-area locations
  eliteFour?: LocationTrainer[]; // For Indigo Plateau Elite 4 integration
  consolidatedFrom?: string[];   // Track which locations were merged
}
```

### 2. Consolidation Logic (`src/utils/locationConsolidator.ts`)

- **`consolidateLocations()`**: Main consolidation function
- **`getLocationArea()`**: Get specific area from consolidated location
- **`isConsolidatedLocation()`**: Check if location has areas
- **`getLocationAreaIds()`**: Get all area IDs
- **`getAreaDisplayName()`**: Get display name for area

### 3. URL & Navigation (`src/utils/locationUtils.ts`)

#### Key Functions:
- **`parseLocationKey()`**: Extract parent and area from location key
- **`getConsolidatedLocationKey()`**: Map old keys to consolidated parents
- **`buildLocationUrl()`**: Create URLs with area parameters
- **`getLocationRedirect()`**: Generate redirects for old URLs

#### URL Patterns:
- **Base location**: `/locations/celadon_dept_store`
- **Specific area**: `/locations/celadon_dept_store?area=1f`
- **Elite 4**: `/locations/indigo_plateau?area=brunos_room`

### 4. React Hooks (`src/utils/locationUrlState.ts`)

- **`useLocationUrlState()`**: Manage location URL state
- **`useConsolidatedLocationState()`**: Handle area navigation
- **`generateLocationBreadcrumbs()`**: Create breadcrumb navigation
- **`createAreaNavigation()`**: Generate area tab navigation

## Consolidated Location Types

### Multi-Floor Buildings
**Examples**: Department stores, hotels, towers, universities
```json
{
  "name": "celadon_dept_store",
  "areas": [
    { "id": "main", "displayName": "Main Area" },
    { "id": "1f", "displayName": "1st Floor" },
    { "id": "2f", "displayName": "2nd Floor" }
  ]
}
```

### Elite 4 Integration
**Location**: `indigo_plateau`
```json
{
  "name": "indigo_plateau",
  "eliteFour": [
    { "name": "Bruno", "trainerClass": "BRUNO" },
    { "name": "Karen", "trainerClass": "KAREN" }
  ],
  "areas": [
    { "id": "pokecenter_1f", "displayName": "Pokecenter First Floor" }
  ]
}
```

### Route Segments
**Examples**: Multi-part routes, route facilities
```json
{
  "name": "route_10",
  "areas": [
    { "id": "north", "displayName": "North" },
    { "id": "south", "displayName": "South" },
    { "id": "poke_center_1f", "displayName": "Poke Center First Floor" }
  ]
}
```

### Cave Systems  
**Examples**: Multi-floor caves, cave complexes
```json
{
  "name": "union_cave",
  "areas": [
    { "id": "1f", "displayName": "1st Floor" },
    { "id": "b_1f_north", "displayName": "B1F North" },
    { "id": "b_1f_south", "displayName": "B1F South" }
  ]
}
```

## UI Implementation Patterns

### Location Detail Page Structure
```typescript
function LocationDetailPage({ locationKey }: { locationKey: string }) {
  const { currentAreaId, setActiveArea, availableAreas } = useConsolidatedLocationState(locationData);
  
  return (
    <div>
      {/* Area Navigation Tabs */}
      {availableAreas.length > 0 && (
        <AreaTabs 
          areas={availableAreas} 
          activeArea={currentAreaId} 
          onAreaChange={setActiveArea} 
        />
      )}
      
      {/* Content for current area */}
      <LocationContent 
        locationData={locationData} 
        currentArea={currentAreaId} 
      />
    </div>
  );
}
```

### Area Navigation Component
```typescript
function AreaTabs({ areas, activeArea, onAreaChange }: AreaTabsProps) {
  const navigation = createAreaNavigation(locationData, activeArea);
  
  return (
    <nav>
      {navigation.map(nav => (
        <button 
          key={nav.id}
          className={nav.active ? 'active' : ''}
          onClick={() => onAreaChange(nav.id)}
        >
          {nav.label}
        </button>
      ))}
    </nav>
  );
}
```

### Breadcrumb Navigation
```typescript
function LocationBreadcrumbs({ locationKey, areaId }: BreadcrumbProps) {
  const breadcrumbs = generateLocationBreadcrumbs(
    locationKey, 
    locationData.displayName, 
    areaId, 
    areaDisplayName
  );
  
  return (
    <nav>
      {breadcrumbs.map(crumb => (
        <Link key={crumb.href} href={crumb.href}>
          {crumb.label}
        </Link>
      ))}
    </nav>
  );
}
```

## Data Access Patterns

### Getting Current Area Data
```typescript
const currentArea = getLocationArea(locationData, areaId);
const trainers = currentArea?.trainers || locationData.trainers || [];
const items = currentArea?.items || locationData.items || [];
```

### Elite 4 Access
```typescript
if (locationKey === 'indigo_plateau') {
  const eliteFour = locationData.eliteFour || [];
  const championTrainer = eliteFour.find(trainer => 
    trainer.trainerClass === 'CHAMPION'
  );
}
```

### Area-Specific Data
```typescript
function getAreaTrainers(locationData: LocationData, areaId?: string) {
  if (!areaId || areaId === 'main') {
    return locationData.trainers || [];
  }
  
  const area = getLocationArea(locationData, areaId);
  return area?.trainers || [];
}
```

## Migration & Redirects

### Old URL Redirect Mapping
The system automatically handles redirects from old individual location URLs:

- `brunos_room` → `/locations/indigo_plateau`
- `celadon_dept_store_1f` → `/locations/celadon_dept_store?area=1f`
- `route_10_north` → `/locations/route_10?area=north`

### Search Integration
Update search functionality to:
1. Search consolidated locations
2. Include area names in search results
3. Deep-link to specific areas when relevant

### Connection Updates
Location connections in consolidated locations need to:
1. Point to parent locations when appropriate
2. Include area parameters for deep navigation
3. Handle cross-area navigation within buildings

## Benefits

1. **Reduced Complexity**: 28.9% fewer location files to manage
2. **Better UX**: Logical grouping of related areas
3. **Easier Navigation**: Tab-based area switching
4. **Data Preservation**: All original data maintained
5. **SEO Friendly**: Clean URLs with area parameters
6. **Future Extensible**: Easy to add more consolidation patterns

## Extending the System

### Adding New Consolidation Patterns
1. Update `location-consolidation-mapping.json`
2. Add patterns to `parseLocationKey()` if needed
3. Update consolidation mapping in `getConsolidatedLocationKey()`
4. Test with extraction: `npm run extract`

### Custom Area Display
Extend `createAreaDisplayName()` in `locationConsolidator.ts` for special area naming patterns.

### Search Enhancement
Add area-aware search in location search components to find specific floors/areas within consolidated locations.