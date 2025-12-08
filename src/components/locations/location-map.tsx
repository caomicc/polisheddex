'use client';

import { useState } from 'react';
import Image from 'next/image';
import { DetailCard } from '@/components/ui/detail-card';
import { cn } from '@/lib/utils';
import { Map, Maximize2, Info } from 'lucide-react';
import mapManifest from '@/../public/maps/manifest.json';

interface LocationMapProps {
  locationId: string;
  locationName?: string;
  className?: string;
}

type MapManifest = Record<string, string[]>;

/**
 * Get map image paths for a location ID
 * Handles the conversion from lowercase location ID to actual map filename
 */
function getMapImages(locationId: string): string[] {
  const manifest = mapManifest as MapManifest;
  const normalizedId = locationId.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (manifest[normalizedId]) {
    return manifest[normalizedId].map(name => `/maps/${name}.png`);
  }

  return [];
}

/** Map legend items with colors matching typical Polished Crystal maps */
const legendItems = [
  { color: '#58a858', label: 'C (Coordinate Event)', description: 'Event triggered on coordinates' },
  { color: '#3890f8', label: 'O (Object Event)', description: 'Event involving objects such as trainers' },
  { color: '#686868', label: 'B (Background Event)', description: 'Background Event such as signs and hidden items' },
  { color: '#f8d878', label: 'W (Warp Event)', description: 'Warps from location to location' },
  { color: '#a85820', label: 'P (Pokemon Event)', description: 'An interaction with a pokemon' },
  { color: '#f85858', label: 'I (Item Ball Event)', description: 'Visible items' },
  { color: '#f89030', label: 'F (Fruit Tree Event)', description: 'Fruit tree' },
];

function MapLegend({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="mt-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
      >
        <Info className="h-3.5 w-3.5" />
        <span>{isExpanded ? 'Hide' : 'Show'} Map Legend</span>
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border border-neutral-300 dark:border-neutral-600 flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                  title={item.description}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function LocationMap({ locationId, locationName, className }: LocationMapProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const mapImages = getMapImages(locationId);

  // If no map images found, show placeholder
  if (mapImages.length === 0 || imageError) {
    return (
      <DetailCard icon={Map} title="Map" className={className}>
        <div
          className={cn(
            'flex flex-col items-center justify-center py-12 rounded-lg',
            'bg-neutral-100 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-600'
          )}
        >
          <Map className="h-12 w-12 text-neutral-400 dark:text-neutral-500 mb-3" />
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">Map not available</p>
          {locationName && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">{locationName}</p>
          )}
        </div>
      </DetailCard>
    );
  }

  return (
    <DetailCard
      icon={Map}
      title="Map"
      className={className}
    >
      <div className={cn(
        'relative rounded-lg overflow-hidden bg-neutral-900',
        isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
      )}>
        {mapImages.map((imagePath, index) => (
          <div
            key={imagePath}
            className={cn(
              'relative transition-all duration-300',
              isZoomed ? 'max-h-none' : 'max-h-[400px]',
              index > 0 && 'mt-4'
            )}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <Image
              src={imagePath}
              alt={`${locationName || locationId} map${mapImages.length > 1 ? ` (${index + 1})` : ''}`}
              width={1200}
              height={800}
              className={cn(
                'w-full h-auto object-contain transition-all duration-300',
                !isZoomed && 'max-h-[400px]'
              )}
              style={{
                imageRendering: 'pixelated',
              }}
              onError={() => setImageError(true)}
              priority={index === 0}
            />
          </div>
        ))}

        {/* Expand hint overlay */}
        {!isZoomed && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-xs">
            <Maximize2 className="h-3 w-3" />
            <span>Click to expand</span>
          </div>
        )}
      </div>

      {mapImages.length > 1 && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
          {mapImages.length} map variants available
        </p>
      )}

      <MapLegend isExpanded={showLegend} onToggle={() => setShowLegend(!showLegend)} />
    </DetailCard>
  );
}
