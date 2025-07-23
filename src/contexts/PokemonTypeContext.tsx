'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PokemonType } from '@/types/types';

interface PokemonTypeContextValue {
  primaryType: PokemonType['name'] | null;
  secondaryType: PokemonType['name'] | null;
  setPokemonTypes: (
    primary: PokemonType['name'] | null,
    secondary?: PokemonType['name'] | null,
  ) => void;
  clearPokemonTypes: () => void;
  getTypeBasedStyles: () => {
    backgroundColor?: string;
    textColor?: string;
    linkColor?: string;
    hoverColor?: string;
  };
}

const PokemonTypeContext = createContext<PokemonTypeContextValue | undefined>(undefined);

export const usePokemonType = () => {
  const context = useContext(PokemonTypeContext);
  if (context === undefined) {
    throw new Error('usePokemonType must be used within a PokemonTypeProvider');
  }
  return context;
};

// Type color mappings based on your globals.css
const TYPE_COLORS: Record<
  PokemonType['name'],
  {
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    textTertiary?: string; // Optional tertiary text color for breadcrumbs
    hover: string;
    navHover?: string; // Optional hover color for navigation links
    pageBackground?: string; // Optional background color for pages
    tabBackground?: string; // Optional background color for tabs
  }
> = {
  bug: {
    primary: 'var(--color-slate-200)', // lime-400
    secondary: 'var(--color-lime-900)', // lime-600
    text: 'var(--color-lime-950)',
    textSecondary: 'var(--color-lime-900)', // green-700
    textTertiary: 'var(--color-lime-800)', // lime-800
    hover: 'var(--color-lime-500)', // lime-500
    navHover: 'var(--color-lime-100)', // lime-600
    pageBackground: 'color-mix(in oklab, var(--color-bug) 10%, transparent)',
    tabBackground: 'var(--color-lime-100)',
  },
  dark: {
    primary: 'var(--color-gray-800)',
    secondary: 'var(--color-gray-900)',
    text: 'var(--color-gray-950)',
    textSecondary: 'var(--color-gray-400)',
    textTertiary: 'var(--color-gray-500)', // gray-500 for breadcrumbs
    hover: 'var(--color-gray-700)',
    navHover: 'var(--color-gray-100)', // gray-600
    pageBackground: 'color-mix(in oklab, var(--color-dark) 10%, transparent)',
    tabBackground: 'var(--color-gray-100)',
  },
  dragon: {
    primary: 'var(--color-indigo-400)',
    secondary: 'var(--color-indigo-600)',
    text: 'var(--color-indigo-950)',
    textSecondary: 'var(--color-indigo-900)',
    textTertiary: 'var(--color-indigo-800)', // indigo-800
    hover: 'var(--color-indigo-500)',
    navHover: 'var(--color-indigo-100)', // indigo-600
    pageBackground: '@apply bg-dragon-page',
    tabBackground: 'var(--color-indigo-100)',
  },
  electric: {
    primary: 'var(--color-yellow-400)',
    secondary: 'var(--color-yellow-600)',
    text: 'var(--color-yellow-950)',
    textSecondary: 'var(--color-yellow-800)',
    textTertiary: 'var(--color-yellow-700)', // yellow-700
    hover: 'var(--color-yellow-500)',
    navHover: 'var(--color-yellow-100)', // yellow-600
    pageBackground: 'var(--color-yellow-50)',
    tabBackground: 'var(--color-yellow-100)',
  },
  fairy: {
    primary: 'var(--color-pink-300)',
    secondary: 'var(--color-pink-700)',
    text: 'var(--color-pink-900)',
    textSecondary: 'var(--color-pink-800)',
    textTertiary: 'var(--color-pink-600)', // pink-600
    hover: 'var(--color-pink-500)',
    navHover: 'var(--color-pink-100)', // pink-600
    pageBackground: 'var(--color-pink-50)',
    tabBackground: 'var(--color-pink-100)',
  },
  fighting: {
    primary: 'var(--color-orange-400)',
    secondary: 'var(--color-orange-700)',
    text: 'var(--color-orange-950)',
    textSecondary: 'var(--color-orange-800)',
    textTertiary: 'var(--color-orange-600)', // orange-600
    hover: 'var(--color-orange-500)',
    navHover: 'var(--color-orange-100)', // orange-600
    pageBackground: 'color-mix(in oklab, var(--color-fighting) 10%, transparent)',
    tabBackground: 'var(--color-orange-100)',
  },
  fire: {
    primary: 'var(--color-red-400)',
    secondary: 'var(--color-red-700)',
    text: 'var(--color-red-950)',
    textSecondary: 'var(--color-red-800)',
    textTertiary: 'var(--color-red-600)', // red-600
    hover: 'var(--color-red-500)', // red-500
    navHover: 'var(--color-red-100)', // red-600
    pageBackground: 'color-mix(in oklab, var(--color-fire) 10%, transparent)',
    tabBackground: 'var(--color-red-100)',
  },
  flying: {
    primary: 'var(--color-sky-300)',
    secondary: 'var(--color-sky-700)',
    text: 'var(--color-sky-950)',
    textSecondary: 'var(--color-sky-800)',
    hover: 'var(--color-sky-400)',
    navHover: 'var(--color-sky-100)', // sky-600
    pageBackground: 'var(--color-sky-50)', // sky-50
    tabBackground: 'var(--color-sky-100)',
  },
  ghost: {
    primary: 'var(--color-violet-300)',
    secondary: 'var(--color-violet-700)',
    text: 'var(--color-violet-950)',
    textSecondary: 'var(--color-violet-800)',
    hover: 'var(--color-violet-500)',
    navHover: 'var(--color-violet-100)', // violet-600
    pageBackground: 'var(--color-violet-50)',
    tabBackground: 'var(--color-violet-100)',
  },
  grass: {
    primary: 'var(--color-emerald-400)',
    secondary: 'var(--color-emerald-700)',
    text: 'var(--color-emerald-950)',
    textSecondary: 'var(--color-emerald-800)',
    hover: 'var(--color-emerald-500)',
    navHover: 'var(--color-emerald-100)',
    pageBackground: 'color-mix(in oklab, var(--color-grass) 5%, transparent)', // grass uses 5% opacity
    tabBackground: 'var(--color-emerald-100)',
  },
  ground: {
    primary: 'var(--color-orange-300)',
    secondary: 'var(--color-orange-700)',
    text: 'var(--color-orange-950)',
    textSecondary: 'var(--color-orange-800)',
    hover: 'var(--color-orange-400)',
    navHover: 'var(--color-orange-100)', // orange-600
    pageBackground: 'color-mix(in oklab, var(--color-ground) 10%, transparent)',
    tabBackground: 'var(--color-orange-100)',
  },
  ice: {
    primary: 'var(--color-cyan-300)',
    secondary: 'var(--color-cyan-700)',
    text: 'var(--color-cyan-950)',
    textSecondary: 'var(--color-cyan-800)',
    hover: 'var(--color-cyan-400)',
    navHover: 'var(--color-cyan-100)', // cyan-600
    pageBackground: 'var(--color-cyan-50)',
    tabBackground: 'var(--color-cyan-100)',
  },
  normal: {
    primary: 'var(--color-normal-300)', // custom normal color from globals.css
    secondary: 'var(--color-normal-500)', // stone-500
    text: 'var(--color-normal-900)', // black
    textSecondary: 'var(--color-normal-800)', // stone-700
    hover: 'var(--color-normal-700)', // stone-400
    navHover: 'var(--color-normal-400)', // stone-600
    pageBackground: 'var(--color-normal-50)',
    tabBackground: 'var(--color-normal-100)',
  },
  poison: {
    primary: 'var(--color-purple-400)',
    secondary: 'var(--color-purple-700)',
    text: 'var(--color-purple-950)',
    textSecondary: 'var(--color-purple-800)',
    hover: 'var(--color-purple-500)',
    navHover: 'var(--color-purple-100)', // purple-600
    pageBackground: 'var(--color-purple-50)',
    tabBackground: 'var(--color-purple-100)',
  },
  psychic: {
    primary: 'var(--color-fuchsia-400)',
    secondary: 'var(--color-fuchsia-700)',
    text: 'var(--color-fuchsia-950)',
    textSecondary: 'var(--color-fuchsia-800)',
    hover: 'var(--color-fuchsia-500)',
    navHover: 'var(--color-fuchsia-100)', // fuchsia-600
    pageBackground: 'var(--color-fuchsia-50)',
    tabBackground: 'var(--color-fuchsia-100)',
  },
  rock: {
    primary: 'var(--color-gray-400)',
    secondary: 'var(--color-gray-600)',
    text: 'var(--color-gray-800)',
    textSecondary: 'var(--color-gray-700)',
    hover: 'var(--color-gray-500)',
    navHover: 'var(--color-gray-100)', // gray-600
    pageBackground: 'var(--color-gray-50)', // gray-50
    tabBackground: 'var(--color-gray-100)',
  },
  steel: {
    primary: 'var(--color-slate-400)',
    secondary: 'var(--color-slate-600)',
    text: 'var(--color-slate-900)',
    textSecondary: 'var(--color-slate-700)',
    hover: 'var(--color-slate-500)',
    navHover: 'var(--color-slate-100)', // slate-600
    pageBackground: 'var(--color-slate-50)',
    tabBackground: 'var(--color-slate-100)',
  },
  water: {
    primary: 'var(--color-blue-400)', // background
    secondary: 'var(--color-blue-900)', // pokemon-theme-link pokemon-breadcrumb-active, pokemon-themed-link
    text: 'var(--color-blue-950)', // pokemon-hero-text
    textSecondary: 'var(--color-blue-900)', // theme-link
    hover: 'var(--color-blue-800)', //theme-hover (breadcrumb hover)
    navHover: 'var(--color-blue-300)', // pokemon-themed-link:hover
    pageBackground: 'color-mix(in oklab, var(--color-water) 10%, transparent)',
    tabBackground: 'var(--color-blue-100)',
  },
};

interface PokemonTypeProviderProps {
  children: React.ReactNode;
}

export const PokemonTypeProvider: React.FC<PokemonTypeProviderProps> = ({ children }) => {
  const [primaryType, setPrimaryType] = useState<PokemonType['name'] | null>(null);
  const [secondaryType, setSecondaryType] = useState<PokemonType['name'] | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize after first render to prevent hydration mismatch
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const setPokemonTypes = (
    primary: PokemonType['name'] | null,
    secondary?: PokemonType['name'] | null,
  ) => {
    setPrimaryType(primary);
    setSecondaryType(secondary || null);
  };

  const clearPokemonTypes = () => {
    setPrimaryType(null);
    setSecondaryType(null);
  };

  const getTypeBasedStyles = () => {
    if (!primaryType) {
      return {
        // backgroundColor: 'transparent',
        textColor: 'inherit',
        linkColor: 'inherit',
        hoverColor: 'rgba(0, 0, 0, 0.1)',
      };
    }

    const typeColors = TYPE_COLORS[primaryType];

    return {
      // backgroundColor: typeColors.primary,
      textColor: typeColors.text,
      linkColor: typeColors.textSecondary,
      hoverColor: typeColors.hover,
    };
  };

  // Update CSS custom properties when types change
  useEffect(() => {
    // Only update after initialization to prevent flashing
    if (!isInitialized) return;

    const root = document.documentElement;

    if (primaryType) {
      const typeColors = TYPE_COLORS[primaryType];
      // Use requestAnimationFrame to ensure smooth transitions
      requestAnimationFrame(() => {
        root.style.setProperty(
          '--pokemon-page-bg',
          typeColors.pageBackground || 'var(--color-slate-100)',
        ); // Default to white if no page background defined
        root.style.setProperty('--pokemon-theme-bg', typeColors.primary);
        root.style.setProperty('--pokemon-theme-text', typeColors.text);
        root.style.setProperty('--pokemon-theme-link', typeColors.textSecondary);
        root.style.setProperty('--pokemon-theme-hover', typeColors.hover);
        // Breadcrumb colors - active is full text color, inactive is semi-transparent
        root.style.setProperty('--pokemon-theme-breadcrumb-active', typeColors.textSecondary);
        root.style.setProperty('--pokemon-theme-breadcrumb-inactive', `${typeColors.textTertiary}`); // 80% opacity
        // Navigation hover color
        root.style.setProperty(
          '--pokemon-theme-nav-hover',
          typeColors.navHover || typeColors.hover,
        );
        // Tab background color
        root.style.setProperty(
          '--pokemon-tab-bg',
          typeColors.tabBackground || 'var(--color-slate-200)',
        );
      });
    } else {
      // Clear custom properties with smooth transition
      requestAnimationFrame(() => {
        root.style.removeProperty('--pokemon-theme-bg');
        root.style.removeProperty('--pokemon-theme-text');
        root.style.removeProperty('--pokemon-theme-link');
        root.style.removeProperty('--pokemon-theme-hover');
        root.style.removeProperty('--pokemon-theme-breadcrumb-active');
        root.style.removeProperty('--pokemon-theme-breadcrumb-inactive');
        root.style.removeProperty('--pokemon-theme-nav-hover');
        root.style.removeProperty('--pokemon-tab-bg');
        root.style.removeProperty('--pokemon-page-bg');
      });
    }
  }, [primaryType, secondaryType, isInitialized]);

  const value: PokemonTypeContextValue = {
    primaryType,
    secondaryType,
    setPokemonTypes,
    clearPokemonTypes,
    getTypeBasedStyles,
  };

  return <PokemonTypeContext.Provider value={value}>{children}</PokemonTypeContext.Provider>;
};
