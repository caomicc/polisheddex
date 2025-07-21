'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import LocationCard from './LocationCard';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
// import { cn } from '@/lib/utils';

// Define the interface for location props used within this component
interface LocationData {
  area: string;
  urlName?: string; // Add urlName for proper routing
  displayName: string;
  types: string[] | string;
  pokemonCount?: number;
  hasHiddenGrottoes?: boolean;
  region?: string;
  flyable?: boolean;
  connections?: Array<{
    direction: string;
    targetLocation: string;
    targetLocationDisplay: string;
    offset: number;
  }>;
  coordinates?: { x: number; y: number };
}

interface LocationSearchProps {
  locations: LocationData[];
}

type SortOption = 'landmark' | 'alphabetical' | 'pokemon-count' | 'hidden-grotto' | 'region';

const LocationSearch: React.FC<LocationSearchProps> = ({ locations }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyGrottoes, setShowOnlyGrottoes] = useState(false);
  const [showOnlyPokemon, setShowOnlyPokemon] = useState(false);
  const [showOnlyFlyable, setShowOnlyFlyable] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('landmark');

  // Get all Pokémon types for filters
  // const locationTypes = [
  //   'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting',
  //   'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost',
  //   'Dragon', 'Dark', 'Steel', 'Fairy'
  // ];

  // Get unique regions from locations
  const availableRegions = useMemo(() => {
    const regions = new Set(
      locations
        .map(loc => loc.region)
        .filter((region): region is string => Boolean(region))
    );
    return Array.from(regions).sort();
  }, [locations]);

  // Apply filters
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = loc.area.toLowerCase().includes(query) ||
                           loc.displayName?.toLowerCase().includes(query);

      // Filter by type if types are selected
      let matchesType = selectedTypes.length === 0;
      if (!matchesType) {
        const locTypes = Array.isArray(loc.types) ? loc.types : [loc.types];
        matchesType = locTypes.some(type =>
          selectedTypes.includes(typeof type === 'string' ? type : '')
        );
      }

      // Filter for hidden grottoes if that option is selected
      const matchesGrotto = !showOnlyGrottoes || loc.hasHiddenGrottoes;

      // Filter for locations with Pokemon if that option is selected
      const matchesPokemon = !showOnlyPokemon || (loc.pokemonCount && loc.pokemonCount > 0);

      // Filter for flyable locations if that option is selected
      const matchesFlyable = !showOnlyFlyable || loc.flyable;

      // Filter by region if a specific region is selected
      const matchesRegion = selectedRegion === 'all' || loc.region === selectedRegion;

      return matchesSearch && matchesType && matchesGrotto && matchesPokemon && matchesFlyable && matchesRegion;
    });
  }, [locations, searchQuery, selectedTypes, showOnlyGrottoes, showOnlyPokemon, showOnlyFlyable, selectedRegion]);

  // Apply sorting
  const sortedLocations = useMemo(() => {
    return [...filteredLocations].sort((a, b) => {
      if (sortOption === 'landmark') {
        // Preserve the original order from the data source (already in logical order)
        // The data comes pre-sorted in logical/canonical order from the extraction
        return 0; // Keep original order
      } else if (sortOption === 'alphabetical') {
        return a.displayName?.localeCompare(b.displayName || '') || a.area.localeCompare(b.area);
      } else if (sortOption === 'pokemon-count') {
        return (b.pokemonCount || 0) - (a.pokemonCount || 0);
      } else if (sortOption === 'hidden-grotto') {
        // Sort by hidden grotto status first, then alphabetically
        if (a.hasHiddenGrottoes === b.hasHiddenGrottoes) {
          return a.displayName?.localeCompare(b.displayName || '') || a.area.localeCompare(b.area);
        }
        return a.hasHiddenGrottoes ? -1 : 1;
      } else if (sortOption === 'region') {
        // Sort by region first, then alphabetically
        const regionA = a.region || 'zzz'; // Push undefined regions to end
        const regionB = b.region || 'zzz';
        if (regionA === regionB) {
          return a.displayName?.localeCompare(b.displayName || '') || a.area.localeCompare(b.area);
        }
        return regionA.localeCompare(regionB);
      }
      return 0;
    });
  }, [filteredLocations, sortOption]);

  // const handleTypeToggle = (type: string) => {
  //   setSelectedTypes(prev =>
  //     prev.includes(type)
  //       ? prev.filter(t => t !== type)
  //       : [...prev, type]
  //   );
  // };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTypes([]);
    setShowOnlyGrottoes(false);
    setShowOnlyPokemon(false);
    setShowOnlyFlyable(false);
    setSelectedRegion('all');
    setSortOption('landmark');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Search input */}
        <div className="grid w-full items-center gap-3">
          <Label htmlFor="location-search">Search Locations</Label>
          <Input
            id="location-search"
            placeholder="Search by location name..."
            className="bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter and sort controls */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Region filter */}
          <div>
            <Label htmlFor="region-filter" className="text-sm">Region</Label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger id="region-filter" className="bg-white">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {availableRegions.map(region => (
                  <SelectItem key={region} value={region}>
                    {region.charAt(0).toUpperCase() + region.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort options */}
          <div>
            <Label htmlFor="sort-options" className="text-sm">Sort by</Label>
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger id="sort-options" className="bg-white">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landmark">Landmark Order (In-Game Progression)</SelectItem>
                <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
                <SelectItem value="region">Region</SelectItem>
                <SelectItem value="pokemon-count">Pokémon Count (High to Low)</SelectItem>
                <SelectItem value="hidden-grotto">Hidden Grottoes First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Checkbox filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-pokemon"
              checked={showOnlyPokemon}
              onCheckedChange={() => setShowOnlyPokemon(!showOnlyPokemon)}
            />
            <Label htmlFor="has-pokemon" className="text-sm font-medium cursor-pointer">
              Has Pokémon encounters
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="flyable"
              checked={showOnlyFlyable}
              onCheckedChange={() => setShowOnlyFlyable(!showOnlyFlyable)}
            />
            <Label htmlFor="flyable" className="text-sm font-medium cursor-pointer">
              Flyable locations
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hidden-grotto"
              checked={showOnlyGrottoes}
              onCheckedChange={() => setShowOnlyGrottoes(!showOnlyGrottoes)}
            />
            <Label htmlFor="hidden-grotto" className="text-sm font-medium cursor-pointer">
              Has Hidden Grottoes
            </Label>
          </div>
        </div>
        <div>
          {(searchQuery || selectedTypes.length > 0 || showOnlyGrottoes || showOnlyPokemon || showOnlyFlyable || selectedRegion !== 'all' || sortOption !== 'landmark') && (
            <Button
              variant="default"
              size="sm"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Type filters */}
        {/* <div className="space-y-2">
          <Label className="text-sm">Filter by Type</Label>
          <div className="flex flex-wrap gap-2">
            {locationTypes.map(type => (
              <Badge
                key={type}
                variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer",
                  selectedTypes.includes(type) && `bg-${type.toLowerCase()}-100`
                )}
                onClick={() => handleTypeToggle(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div> */}

        {/* Clear filters button */}

      </div>

      {/* Results */}
      {sortedLocations.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No locations found matching your search.</p>
      ) : (
        <div className="">
          <ul className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {sortedLocations.map((loc) => (
              <li key={loc.area}>
                <LocationCard location={loc} />
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};

export default LocationSearch;
