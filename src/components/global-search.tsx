'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { getCookiePreference } from '@/lib/faithful-cookie';
import {
  loadSearchData,
  filterSearchItems,
  groupSearchResults,
  getEntityTypeLabel,
  type SearchItem,
  type SearchEntityType,
} from '@/lib/search-data';
import { useRecentSearches, type RecentSearch } from '@/hooks/useRecentSearches';
import { useDebounce } from '@/hooks/useDebounce';
import { IconX } from '@tabler/icons-react';
import { ArrowRight } from 'lucide-react';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [searchData, setSearchData] = React.useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showFaithful, setShowFaithful] = React.useState(false);
  const debouncedQuery = useDebounce(query, 150);

  const { recentSearches, addRecent, clearRecents } = useRecentSearches();

  // Load search data when dialog opens
  React.useEffect(() => {
    if (open && searchData.length === 0) {
      setIsLoading(true);
      loadSearchData()
        .then((data) => {
          setSearchData(data);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, searchData.length]);

  // Read faithful preference from cookie when dialog opens
  React.useEffect(() => {
    if (open) {
      setShowFaithful(getCookiePreference());
    }
  }, [open]);

  // Reset query when dialog closes
  React.useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  // Filter and group results
  const filteredItems = React.useMemo(() => {
    return filterSearchItems(searchData, debouncedQuery, showFaithful);
  }, [searchData, debouncedQuery, showFaithful]);

  const groupedResults = React.useMemo(() => {
    return groupSearchResults(filteredItems, 5);
  }, [filteredItems]);

  // Check if we have any results
  const hasResults = Object.values(groupedResults).some((group) => group.length > 0);

  // Handle selection
  const handleSelect = (item: SearchItem) => {
    const name = showFaithful ? item.faithfulName : item.polishedName;
    const recent: RecentSearch = {
      id: item.id,
      name,
      href: item.href,
      type: item.type,
    };
    addRecent(recent);
    onOpenChange(false);
    router.push(item.href);
  };

  // Handle recent search selection
  const handleRecentSelect = (recent: RecentSearch) => {
    addRecent(recent); // Move to top
    onOpenChange(false);
    router.push(recent.href);
  };

  const getName = (item: SearchItem) => {
    return showFaithful ? item.faithfulName : item.polishedName;
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search PolishedDex"
      description="Search for Pokémon, moves, items, locations, and abilities"
    >
      <CommandInput
        placeholder="Search Pokémon, moves, items..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <CommandEmpty>Loading search data...</CommandEmpty>
        )}

        {!isLoading && !debouncedQuery && recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((recent) => (
                <CommandItem
                  key={`${recent.type}-${recent.id}`}
                  value={`recent-${recent.id}`}
                  onSelect={() => handleRecentSelect(recent)}
                  // className="flex items-center gap-2"
                >
                  {/* <IconClock className="h-4 w-4 text-muted-foreground" />
                  <span className="mr-1">{entityIcons[recent.type]}</span>
                  <span>{recent.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {getEntityTypeLabel(recent.type)}
                  </span> */}
                   {recent.name} ({getEntityTypeLabel(recent.type)})
                </CommandItem>
              ))}
              <CommandItem
                onSelect={clearRecents}
                // className="flex items-center gap-2 text-muted-foreground"
              >
                <IconX className="h-4 w-4" />
                <span>Clear recent searches</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {!isLoading && debouncedQuery && !hasResults && (
          <CommandEmpty>No results found for &ldquo;{debouncedQuery}&rdquo;</CommandEmpty>
        )}

        {!isLoading &&
          debouncedQuery &&
          hasResults &&
          (Object.entries(groupedResults) as [SearchEntityType, SearchItem[]][]).map(
            ([type, items]) =>
              items.length > 0 && (
                <CommandGroup key={type} heading={getEntityTypeLabel(type)}>
                  {items.map((item) => (
                    <CommandItem
                      key={`${type}-${item.id}`}
                      value={`${type}-${item.id}-${getName(item)}`}
                      onSelect={() => handleSelect(item)}
                    >
                      <ArrowRight /> {getName(item)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
          )}

        {!isLoading && !debouncedQuery && recentSearches.length === 0 && (
          <CommandEmpty>Start typing to search...</CommandEmpty>
        )}
      </CommandList>
    </CommandDialog>
  );
}
