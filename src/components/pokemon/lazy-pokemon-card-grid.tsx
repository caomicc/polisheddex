'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { BaseData } from '@/types/types';
import PokemonCard from './pokemon-card';
import { PokemonCardSkeleton } from './pokemon-card-skeleton';
import { formatPokemonUrlWithForm } from '@/utils/pokemonFormUtils';

interface LazyPokemonCardGridProps {
  pokemonData: BaseData[];
  itemsPerPage?: number;
}

// Memoized card component to prevent unnecessary re-renders
const MemoizedPokemonCard = React.memo(PokemonCard);

function LazyPokemonCardGrid({ pokemonData, itemsPerPage = 24 }: LazyPokemonCardGridProps) {
  const [visibleItems, setVisibleItems] = useState(itemsPerPage);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Create intersection observer to detect when user scrolls near bottom
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && visibleItems < pokemonData.length) {
            setIsLoading(true);
            // Use requestAnimationFrame for smooth loading
            requestAnimationFrame(() => {
              setVisibleItems((prev) => Math.min(prev + itemsPerPage, pokemonData.length));
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
    [isLoading, visibleItems, pokemonData.length, itemsPerPage],
  );

  // Reset visible items when data changes (e.g., filtering)
  useEffect(() => {
    setVisibleItems(itemsPerPage);
    setIsLoading(false);
  }, [pokemonData, itemsPerPage]);

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
  const hasMore = visibleItems < pokemonData.length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4">
        {visiblePokemon.map((pokemon, idx) => {
          const isLastItem = idx === visibleItems - 1;
          return (
            <Link
              className="rounded-xl"
              key={`${pokemon.name}-${pokemon.form || 'base'}-${idx}`}
              href={formatPokemonUrlWithForm(
                pokemon.name,
                pokemon.form ? pokemon.form.toString() : 'plain',
              )}
            >
              <div ref={isLastItem && hasMore ? lastElementRef : null}>
                <MemoizedPokemonCard pokemon={pokemon} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mt-4">
          {Array.from(
            { length: Math.min(itemsPerPage, pokemonData.length - visibleItems) },
            (_, i) => (
              <PokemonCardSkeleton key={`skeleton-${i}`} />
            ),
          )}
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && pokemonData.length > itemsPerPage && (
        <div className="text-center py-8 text-xs text-muted-foreground">
          Showing all {pokemonData.length} Pokémon
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
    prevProps.pokemonData === nextProps.pokemonData
  );
});
