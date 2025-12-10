'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DetailCard } from '@/components/ui/detail-card';
import { cn } from '@/lib/utils';
import { Map, X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import mapManifest from '@/../public/maps/manifest.json';

interface LocationChild {
  id: string;
  name: string;
}

interface LocationChildMapsProps {
  children: LocationChild[];
  parentName?: string;
  className?: string;
}

type MapManifest = Record<string, string[]>;

/**
 * Get map image path for a location ID
 */
function getMapImage(locationId: string): string | null {
  const manifest = mapManifest as MapManifest;
  const normalizedId = locationId.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (manifest[normalizedId] && manifest[normalizedId].length > 0) {
    return `/maps/${manifest[normalizedId][0]}.png`;
  }

  return null;
}

export function LocationChildMaps({ children, parentName, className }: LocationChildMapsProps) {
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Filter to only children that have maps
  const childrenWithMaps = children.filter((child) => {
    const mapPath = getMapImage(child.id);
    return mapPath !== null && !imageErrors.has(child.id);
  });

  // If no children have maps, don't render
  if (childrenWithMaps.length === 0) {
    return null;
  }

  const handleImageError = (childId: string) => {
    setImageErrors((prev) => new Set([...prev, childId]));
  };

  const expandedChildData = expandedChild
    ? childrenWithMaps.find((c) => c.id === expandedChild)
    : null;

  return (
    <>
      <DetailCard
        icon={Map}
        title={`${parentName || 'Location'} Maps`}
        className={className}
      >
        {/* Gallery grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {childrenWithMaps.map((child) => {
            const mapPath = getMapImage(child.id);
            if (!mapPath) return null;

            return (
              <div key={child.id} className="group">
                {/* Floor label */}


                {/* Map thumbnail */}
                <div
                  className="relative rounded-lg overflow-hidden bg-neutral-900 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  onClick={() => setExpandedChild(child.id)}
                >
                  <Image
                    src={mapPath}
                    alt={`${child.name} map`}
                    width={600}
                    height={400}
                    className="w-full h-auto object-contain aspect-square object-cover"
                    style={{
                      imageRendering: 'pixelated',
                    }}
                    onError={() => handleImageError(child.id)}
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-3 py-1.5 rounded-md">
                      Click to expand
                    </span>
                  </div>
                </div>
                 <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {child.name}
                  </span>
                  <Link
                    href={`/locations/${child.id}`}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Details
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floor count */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 text-center">
          {childrenWithMaps.length} floor{childrenWithMaps.length !== 1 ? 's' : ''} available
        </p>
      </DetailCard>

      {/* Expanded modal overlay */}
      {expandedChild && expandedChildData && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedChild(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] overflow-auto bg-neutral-900 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-neutral-900/95 backdrop-blur border-b border-neutral-700">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-white">
                  {expandedChildData.name}
                </span>
                <Link
                  href={`/locations/${expandedChildData.id}`}
                  className="flex items-center gap-1 text-sm text-blue-400 hover:underline"
                >
                  View details
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
              <button
                onClick={() => setExpandedChild(null)}
                className="p-2 rounded-lg hover:bg-neutral-700 transition-colors text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Expanded map */}
            <div className="p-4">
              <Image
                src={getMapImage(expandedChildData.id) || ''}
                alt={`${expandedChildData.name} map`}
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
                style={{
                  imageRendering: 'pixelated',
                }}
                priority
              />
            </div>

            {/* Navigation between floors */}
            {childrenWithMaps.length > 1 && (() => {
              const currentIndex = childrenWithMaps.findIndex(c => c.id === expandedChild);
              const prevChild = currentIndex > 0 ? childrenWithMaps[currentIndex - 1] : null;
              const nextChild = currentIndex < childrenWithMaps.length - 1 ? childrenWithMaps[currentIndex + 1] : null;
              
              return (
                <div className="sticky bottom-0 flex items-center justify-between p-4 bg-neutral-900/95 backdrop-blur border-t border-neutral-700">
                  <button
                    onClick={() => prevChild && setExpandedChild(prevChild.id)}
                    disabled={!prevChild}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors',
                      prevChild
                        ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                        : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  
                  <span className="text-sm text-neutral-400">
                    {currentIndex + 1} / {childrenWithMaps.length}
                  </span>
                  
                  <button
                    onClick={() => nextChild && setExpandedChild(nextChild.id)}
                    disabled={!nextChild}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors',
                      nextChild
                        ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                        : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                    )}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
