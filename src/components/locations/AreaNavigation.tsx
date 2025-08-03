'use client';

import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LocationArea } from '@/types/types';

interface AreaNavigationProps {
  areas: LocationArea[];
  currentAreaId?: string;
  onAreaChange: (areaId: string) => void;
  locationName: string;
}

export function AreaNavigation({ 
  areas, 
  currentAreaId, 
  onAreaChange, 
  locationName 
}: AreaNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!areas || areas.length === 0) {
    return null;
  }

  const currentArea = areas.find(area => area.id === currentAreaId);
  const mainAreaLabel = 'Overview';
  const currentLabel = currentAreaId && currentAreaId !== 'main' 
    ? currentArea?.displayName || currentAreaId 
    : mainAreaLabel;

  // Desktop: Horizontal tabs
  // Mobile: Dropdown selector
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <nav className="flex space-x-8" aria-label="Area navigation">
          <button
            onClick={() => onAreaChange('main')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
              (!currentAreaId || currentAreaId === 'main')
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
            )}
          >
            {mainAreaLabel}
          </button>
          
          {areas.map((area) => (
            <button
              key={area.id}
              onClick={() => onAreaChange(area.id)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                currentAreaId === area.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              )}
            >
              {area.displayName}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="relative">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between py-2 px-3 text-left text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
          >
            <span className="block truncate font-medium">
              {currentLabel}
            </span>
            <ChevronDownIcon 
              className={cn(
                'h-5 w-5 text-gray-400 transition-transform',
                isExpanded && 'rotate-180'
              )} 
            />
          </button>

          {isExpanded && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-300 dark:border-gray-600">
              <div className="py-1">
                <button
                  onClick={() => {
                    onAreaChange('main');
                    setIsExpanded(false);
                  }}
                  className={cn(
                    'block w-full text-left px-3 py-2 text-sm',
                    (!currentAreaId || currentAreaId === 'main')
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  {mainAreaLabel}
                </button>
                
                {areas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => {
                      onAreaChange(area.id);
                      setIsExpanded(false);
                    }}
                    className={cn(
                      'block w-full text-left px-3 py-2 text-sm',
                      currentAreaId === area.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    {area.displayName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}