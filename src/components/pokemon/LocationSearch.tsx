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
  types: string[] | string;
  pokemonCount?: number;
  hasHiddenGrottoes?: boolean;
}

interface LocationSearchProps {
  locations: LocationData[];
}

type SortOption = 'alphabetical' | 'pokemon-count' | 'hidden-grotto';

const LocationSearch: React.FC<LocationSearchProps> = ({ locations }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyGrottoes, setShowOnlyGrottoes] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('alphabetical');

  // Get all Pokémon types for filters
  // const locationTypes = [
  //   'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting',
  //   'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost',
  //   'Dragon', 'Dark', 'Steel', 'Fairy'
  // ];

  // Apply filters
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = loc.area.toLowerCase().includes(query);

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

      return matchesSearch && matchesType && matchesGrotto;
    });
  }, [locations, searchQuery, selectedTypes, showOnlyGrottoes]);

  // Apply sorting
  const sortedLocations = useMemo(() => {
    return [...filteredLocations].sort((a, b) => {
      if (sortOption === 'alphabetical') {
        return a.area.localeCompare(b.area);
      } else if (sortOption === 'pokemon-count') {
        return (b.pokemonCount || 0) - (a.pokemonCount || 0);
      } else if (sortOption === 'hidden-grotto') {
        // Sort by hidden grotto status first, then alphabetically
        if (a.hasHiddenGrottoes === b.hasHiddenGrottoes) {
          return a.area.localeCompare(b.area);
        }
        return a.hasHiddenGrottoes ? -1 : 1;
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
    setSortOption('alphabetical');
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
          {/* Hidden Grotto filter */}

          <div>
            <Label htmlFor="sort-options" className="text-sm">Sort by</Label>
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger id="sort-options" className="bg-white">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
                <SelectItem value="pokemon-count">Pokémon Count (High to Low)</SelectItem>
                <SelectItem value="hidden-grotto">Hidden Grottoes First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 md:mt-[13px]">
            <Checkbox
              id="hidden-grotto"
              checked={showOnlyGrottoes}
              onCheckedChange={() => setShowOnlyGrottoes(!showOnlyGrottoes)}
            />
            <Label htmlFor="hidden-grotto" className="text-sm font-medium cursor-pointer">
              Show only Hidden Grotto locations
            </Label>
          </div>

          {/* Sort options */}

        </div>
        <div>
          {(searchQuery || selectedTypes.length > 0 || showOnlyGrottoes || sortOption !== 'alphabetical') && (
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
          {/* <p className="text-sm text-gray-500 mb-4">{sortedLocations.length} location{sortedLocations.length !== 1 ? 's' : ''} found</p> */}
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
