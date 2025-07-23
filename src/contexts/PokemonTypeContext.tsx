'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PokemonType } from '@/types/types';

interface PokemonTypeContextValue {
  primaryType: PokemonType['name'] | null;
  secondaryType: PokemonType['name'] | null;
  setPokemonTypes: (primary: PokemonType['name'] | null, secondary?: PokemonType['name'] | null) => void;
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
const TYPE_COLORS: Record<PokemonType['name'], {
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  hover: string;
}> = {
  bug: {
    primary: 'var(--color-lime-400)', // lime-400
    secondary: 'var(--color-lime-900)', // lime-600
    text: 'var(--color-lime-950)',
    textSecondary: 'var(--color-lime-900)', // green-700
    hover: 'var(--color-lime-500)' // lime-500
  },
  dark: {
    primary: 'var(--color-gray-800)',
    secondary: 'var(--color-gray-900)',
    text: 'var(--color-gray-950)',
    textSecondary: 'var(--color-gray-400)',
    hover: 'var(--color-gray-700)'
  },
  dragon: {
    primary: 'var(--color-indigo-400)',
    secondary: 'var(--color-indigo-600)',
    text: 'var(--color-indigo-950)',
    textSecondary: 'var(--color-indigo-900)',
    hover: 'var(--color-indigo-500)'
  },
  electric: {
    primary: 'var(--color-yellow-400)',
    secondary: 'var(--color-yellow-600)',
    text: 'var(--color-yellow-950)',
    textSecondary: 'var(--color-yellow-800)',
    hover: 'var(--color-yellow-500)'
  },
  fairy: {
    primary: 'var(--color-pink-300)',
    secondary: 'var(--color-pink-700)',
    text: 'var(--color-pink-900)',
    textSecondary: 'var(--color-pink-800)',
    hover: 'var(--color-pink-500)'
  },
  fighting: {
    primary: 'var(--color-orange-400)',
    secondary: 'var(--color-orange-700)',
    text: 'var(--color-orange-950)',
    textSecondary: 'var(--color-orange-800)',
    hover: 'var(--color-orange-500)'
  },
  fire: {
    primary: 'var(--color-red-400)',
    secondary: 'var(--color-red-700)',
    text: 'var(--color-red-950)',
    textSecondary: 'var(--color-red-800)',
    hover: 'var(--color-red-500)'
  },
  flying: {
    primary: 'var(--color-sky-300)',
    secondary: 'var(--color-sky-700)',
    text: 'var(--color-sky-950)',
    textSecondary: 'var(--color-sky-800)',
    hover: 'var(--color-sky-400)'
  },
  ghost: {
    primary: 'var(--color-violet-300)',
    secondary: 'var(--color-violet-700)',
    text: 'var(--color-violet-950)',
    textSecondary: 'var(--color-violet-800)',
    hover: 'var(--color-violet-500)'
  },
  grass: {
    primary: 'var(--color-green-400)',
    secondary: 'var(--color-green-700)',
    text: 'var(--color-green-950)',
    textSecondary: 'var(--color-green-800)',
    hover: 'var(--color-green-500)'
  },
  ground: {
    primary: 'var(--color-orange-300)',
    secondary: 'var(--color-orange-700)',
    text: 'var(--color-orange-950)',
    textSecondary: 'var(--color-orange-800)',
    hover: 'var(--color-orange-400)'
  },
  ice: {
    primary: 'var(--color-cyan-300)',
    secondary: 'var(--color-cyan-700)',
    text: 'var(--color-cyan-950)',
    textSecondary: 'var(--color-cyan-800)',
    hover: 'var(--color-cyan-400)'
  },
  normal: {
    primary: 'var(--color-normal-300)', // custom normal color from globals.css
    secondary: 'var(--color-normal-500)', // stone-500
    text: 'var(--color-yellow-950)', // black
    textSecondary: 'var(--color-normal-700)', // stone-700
    hover: 'var(--color-normal-400)' // stone-400
  },
  poison: {
    primary: 'var(--color-purple-400)',
    secondary: 'var(--color-purple-700)',
    text: 'var(--color-purple-950)',
    textSecondary: 'var(--color-purple-800)',
    hover: 'var(--color-purple-500)'
  },
  psychic: {
    primary: 'var(--color-fuchsia-400)',
    secondary: 'var(--color-fuchsia-700)',
    text: 'var(--color-fuchsia-950)',
    textSecondary: 'var(--color-fuchsia-800)',
    hover: 'var(--color-fuchsia-500)'
  },
  rock: {
    primary: 'var(--color-gray-400)',
    secondary: 'var(--color-gray-600)',
    text: 'var(--color-gray-800)',
    textSecondary: 'var(--color-gray-700)',
    hover: 'var(--color-gray-500)'
  },
  steel: {
    primary: 'var(--color-slate-400)',
    secondary: 'var(--color-slate-600)',
    text: 'var(--color-slate-900)',
    textSecondary: 'var(--color-slate-700)',
    hover: 'var(--color-slate-500)'
  },
  water: {
    primary: 'var(--color-blue-400)',
    secondary: 'var(--color-blue-700)',
    text: 'var(--color-blue-950)',
    textSecondary: 'var(--color-blue-800)',
    hover: 'var(--color-blue-500)'
  },
};

interface PokemonTypeProviderProps {
  children: React.ReactNode;
}

export const PokemonTypeProvider: React.FC<PokemonTypeProviderProps> = ({ children }) => {
  const [primaryType, setPrimaryType] = useState<PokemonType['name'] | null>(null);
  const [secondaryType, setSecondaryType] = useState<PokemonType['name'] | null>(null);

  const setPokemonTypes = (primary: PokemonType['name'] | null, secondary?: PokemonType['name'] | null) => {
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
    const root = document.documentElement;

    if (primaryType) {
      const typeColors = TYPE_COLORS[primaryType];
      root.style.setProperty('--pokemon-theme-bg', typeColors.primary);
      root.style.setProperty('--pokemon-theme-text', typeColors.text);
      root.style.setProperty('--pokemon-theme-link', typeColors.textSecondary);
      root.style.setProperty('--pokemon-theme-hover', typeColors.hover);
    } else {
      // Clear custom properties
      root.style.removeProperty('--pokemon-theme-bg');
      root.style.removeProperty('--pokemon-theme-text');
      root.style.removeProperty('--pokemon-theme-link');
      root.style.removeProperty('--pokemon-theme-hover');
    }
  }, [primaryType, secondaryType]);

  const value: PokemonTypeContextValue = {
    primaryType,
    secondaryType,
    setPokemonTypes,
    clearPokemonTypes,
    getTypeBasedStyles,
  };

  return (
    <PokemonTypeContext.Provider value={value}>
      {children}
    </PokemonTypeContext.Provider>
  );
};
