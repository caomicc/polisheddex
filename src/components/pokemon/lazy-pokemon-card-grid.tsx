'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import PokemonCard from './pokemon-card';
import { PokemonCardSkeleton } from './pokemon-card-skeleton';
import { formatPokemonUrlWithForm } from '@/utils/pokemonFormUtils';
import { PokemonManifest } from '@/types/new';
import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';

interface LazyPokemonCardGridProps {
  pokemonData: PokemonManifest[];
  showForms?: boolean;
  itemsPerPage?: number;
}

// Memoized card component to prevent unnecessary re-renders
const MemoizedPokemonCard = React.memo(PokemonCard);

function LazyPokemonCardGrid({
  pokemonData,
  itemsPerPage = 24,
  showForms = false,
}: LazyPokemonCardGridProps) {
  const [visibleItems, setVisibleItems] = useState(itemsPerPage);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { showFaithful } = useFaithfulPreference();

  const version = showFaithful ? 'faithful' : 'polished';

  // Sort Pokemon by dexNo for consistent ordering
  const sortedPokemonData = useMemo(() => {
    return [...pokemonData].sort((a, b) => a.dexNo - b.dexNo);
  }, [pokemonData]);

  // Create intersection observer to detect when user scrolls near bottom
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && visibleItems < sortedPokemonData.length) {
            setIsLoading(true);
            // Use requestAnimationFrame for smooth loading
            requestAnimationFrame(() => {
              setVisibleItems((prev) => Math.min(prev + itemsPerPage, sortedPokemonData.length));
              setIsLoading(false);
            });
          }
        },
        {
          rootMargin: '200px', // Load items when they're 200px away from viewport for smoother experience
          threshold: 0.1, // Trigger when 10% of the element is visible
        },
      );

      if (node) observerRef.current.observe(node);
    },
    [isLoading, visibleItems, sortedPokemonData.length, itemsPerPage],
  );

  // Reset visible items when data changes (e.g., filtering)
  useEffect(() => {
    setVisibleItems(itemsPerPage);
    setIsLoading(false);
  }, [sortedPokemonData, itemsPerPage]);

  // Clean up observer on unmount
  useEffect(() => {
    const currentObserver = observerRef.current;
    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, []);

  const visiblePokemon = pokemonData.slice(0, visibleItems);

  // Calculate total cards accounting for forms
  const totalCards = pokemonData.reduce((acc, pokemon) => {
    const forms = Object.keys(pokemon.versions[version] || {});
    const formsToShow = showForms ? forms : forms.includes('plain') ? ['plain'] : forms.slice(0, 1);
    return acc + formsToShow.length;
  }, 0);

  // Calculate visible cards
  const visibleCards = visiblePokemon.reduce((acc, pokemon) => {
    const forms = Object.keys(pokemon.versions[version] || {});
    const formsToShow = showForms ? forms : forms.includes('plain') ? ['plain'] : forms.slice(0, 1);
    return acc + formsToShow.length;
  }, 0);

  const hasMore = visibleItems < pokemonData.length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-4">
        {visiblePokemon.flatMap((pokemon, pokemonIdx) => {
          // Get all forms for the current version
          const forms = Object.keys(pokemon.versions[version] || {});
          const formsToShow = showForms
            ? forms
            : forms.includes('plain')
              ? ['plain']
              : forms.slice(0, 1);

          return formsToShow.map((form, formIdx) => {
            const combinedIdx = pokemonIdx * formsToShow.length + formIdx;
            const isLastItem = combinedIdx === visibleCards - 1;

            return (
              <Link
                className="rounded-xl"
                key={`${pokemon.id}-${form}-${combinedIdx}`}
                href={formatPokemonUrlWithForm(pokemon.id, form)}
              >
                <div ref={isLastItem && hasMore ? lastElementRef : null}>
                  <MemoizedPokemonCard pokemon={{ ...pokemon, formName: form }} />
                </div>
              </Link>
            );
          });
        })}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mt-4">
          {Array.from({ length: Math.min(itemsPerPage, totalCards - visibleCards) }, (_, i) => (
            <PokemonCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && pokemonData.length > itemsPerPage && (
        <div className="text-center py-8 text-xs text-muted-foreground">
          Showing all {totalCards} cards from {pokemonData.length} Pokémon
        </div>
      )}

      {/* Empty state */}
      {pokemonData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No Pokémon found</p>
          <p className="text-sm mt-2">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </>
  );
}

// Memoize the entire component to prevent unnecessary re-renders when parent re-renders
export default React.memo(LazyPokemonCardGrid, (prevProps, nextProps) => {
  // Custom comparison to prevent re-render if data is the same
  return (
    prevProps.pokemonData.length === nextProps.pokemonData.length &&
    prevProps.itemsPerPage === nextProps.itemsPerPage &&
    prevProps.showForms === nextProps.showForms &&
    prevProps.pokemonData === nextProps.pokemonData
  );
});
