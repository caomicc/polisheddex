'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
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
export const TYPE_COLORS: Record<
  PokemonType['name'],
  {
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    hover: string;
    sectionCardBg: string; // Optional background color for section cards
    textTertiary: string; // Optional tertiary text color for breadcrumbs
    navHover: string; // Optional hover color for navigation links
    pageBackground: string; // Optional background color for pages
    tabBackground: string; // Optional background color for tabs
    statBarBackground: string; // Optional background color for stat bars
    grid: string; // Grid color for dark mode
    dark?: {
      primary: string;
      secondary: string;
      text: string;
      textSecondary: string;
      hover: string;
      sectionCardBg: string; // Optional background color for section cards
      textTertiary: string; // Optional tertiary text color for breadcrumbs
      navHover: string; // Optional hover color for navigation links
      pageBackground: string; // Optional background color for pages
      tabBackground: string; // Optional background color for tabs
      statBarBackground: string; // Optional background color for stat bars
      grid: string; // Grid color for light mode
    };
  }
> = {
  bug: {
    primary: 'var(--color-lime-200)', // lime-400
    secondary: 'var(--color-lime-900)', // lime-600
    text: 'var(--color-lime-950)',
    textSecondary: 'var(--color-lime-900)', // green-700
    textTertiary: 'var(--color-lime-800)', // lime-800
    hover: 'var(--color-lime-500)', // lime-500
    navHover: 'var(--color-lime-100)', // lime-600
    pageBackground: '#fbfef6',
    tabBackground: 'var(--color-lime-100)',
    sectionCardBg: 'var(--color-lime-200)',
    statBarBackground: 'var(--color-lime-800)',
    grid: 'var(--color-lime-100)',
    dark: {
      primary: 'rgba(132, 204, 22, 0.1)',
      secondary: 'var(--color-lime-600)',
      text: 'var(--color-lime-100)',
      textSecondary: 'var(--color-lime-200)',
      textTertiary: 'var(--color-lime-300)',
      hover: 'var(--color-lime-300)',
      navHover: 'var(--color-lime-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(32, 46, 10, 1)',
      sectionCardBg: 'rgba(132, 204, 22, 0.1)',
      statBarBackground: 'rgba(132, 204, 22, 0.1)',
      grid: 'var(--color-lime-950)',
    },
  },
  dark: {
    primary: 'var(--color-gray-300)',
    secondary: 'var(--color-gray-900)',
    text: 'var(--color-gray-950)',
    textSecondary: 'var(--color-gray-400)',
    textTertiary: 'var(--color-gray-500)', // gray-500 for breadcrumbs
    hover: 'var(--color-gray-700)',
    navHover: 'var(--color-gray-100)', // gray-600
    pageBackground: 'color-mix(in oklab, var(--color-dark) 5%, transparent)',
    tabBackground: 'var(--color-gray-200)',
    sectionCardBg: 'var(--color-gray-200)', // gray-200 for section cards
    statBarBackground: 'var(--color-gray-950)',
    grid: 'var(--color-gray-200)',
    dark: {
      primary: 'rgba(75, 85, 99, 0.1)',
      secondary: 'var(--color-gray-600)',
      text: 'var(--color-gray-100)',
      textSecondary: 'var(--color-gray-300)',
      textTertiary: 'var(--color-gray-400)',
      hover: 'var(--color-gray-300)',
      navHover: 'var(--color-gray-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(46, 46, 79, 1)',
      sectionCardBg: 'rgba(75, 85, 99, 0.1)',
      statBarBackground: 'rgba(75, 85, 99, 0.1)',
      grid: 'var(--color-gray-900)',
    },
  },
  dragon: {
    primary: 'var(--color-indigo-200)',
    secondary: 'var(--color-indigo-600)',
    text: 'var(--color-indigo-950)',
    textSecondary: 'var(--color-indigo-900)',
    textTertiary: 'var(--color-indigo-800)', // indigo-800
    hover: 'var(--color-indigo-500)',
    navHover: 'var(--color-indigo-100)', // indigo-600
    pageBackground: '@apply bg-dragon-page',
    tabBackground: 'var(--color-indigo-100)',
    sectionCardBg: 'var(--color-indigo-200)', // indigo-200 for section cards
    statBarBackground: 'var(--color-indigo-950)',
    grid: 'var(--color-indigo-50)',
    dark: {
      primary: 'rgba(99, 102, 241, 0.1)',
      secondary: 'var(--color-indigo-600)',
      text: 'var(--color-indigo-100)',
      textSecondary: 'var(--color-indigo-200)',
      textTertiary: 'var(--color-indigo-300)',
      hover: 'var(--color-indigo-300)',
      navHover: 'var(--color-indigo-800)',
      pageBackground: 'transparent',
      tabBackground: '#1e1b42',
      sectionCardBg: 'rgba(99, 102, 241, 0.1)',
      statBarBackground: 'rgba(99, 102, 241, 0.1)',
      grid: 'rgba(99, 102, 241, 0.1)',
    },
  },
  electric: {
    primary: 'var(--color-amber-200)',
    secondary: 'var(--color-amber-600)',
    text: 'var(--color-amber-950)',
    textSecondary: 'var(--color-amber-800)',
    textTertiary: 'var(--color-amber-700)', // yellow-700
    hover: 'var(--color-amber-500)',
    navHover: 'var(--color-amber-100)', // yellow-600
    pageBackground: 'var(--color-amber-50)',
    tabBackground: 'var(--color-amber-100)',
    sectionCardBg: 'var(--color-amber-100)', // yellow-200 for section cards
    statBarBackground: 'var(--color-amber-700)',
    grid: 'var(--color-amber-100)',
    dark: {
      primary: 'rgba(245, 158, 11, 0.1)',
      secondary: 'var(--color-amber-600)',
      text: 'var(--color-amber-100)',
      textSecondary: 'var(--color-amber-200)',
      textTertiary: 'var(--color-amber-300)',
      hover: 'var(--color-amber-300)',
      navHover: 'var(--color-amber-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(61, 40, 4, 1)',
      sectionCardBg: 'rgba(245, 158, 11, 0.1)',
      statBarBackground: 'rgba(245, 158, 11, 0.1)',
      grid: 'rgba(245, 158, 11, 0.1)',
    },
  },
  fairy: {
    primary: 'var(--color-pink-200)',
    secondary: 'var(--color-pink-700)',
    text: 'var(--color-pink-900)',
    textSecondary: 'var(--color-pink-800)',
    textTertiary: 'var(--color-pink-600)', // pink-600
    hover: 'var(--color-pink-500)',
    navHover: 'var(--color-pink-100)', // pink-600
    pageBackground: 'var(--color-pink-50)',
    tabBackground: 'var(--color-pink-100)',
    sectionCardBg: 'var(--color-pink-200)', // pink-200 for section cards
    statBarBackground: 'var(--color-pink-900)',
    grid: 'var(--color-pink-100)',
    dark: {
      primary: 'rgba(244, 114, 182, 0.1)',
      secondary: 'var(--color-pink-600)',
      text: 'var(--color-pink-100)',
      textSecondary: 'var(--color-pink-200)',
      textTertiary: 'var(--color-pink-300)',
      hover: 'var(--color-pink-300)',
      navHover: 'var(--color-pink-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(45, 9, 28, 1)',
      sectionCardBg: 'rgba(244, 114, 182, 0.1)',
      statBarBackground: 'rgba(244, 114, 182, 0.1)',
      grid: 'rgba(244, 114, 182, 0.1)',
    },
  },
  fighting: {
    primary: 'var(--color-orange-200)',
    secondary: 'var(--color-orange-700)',
    text: 'var(--color-orange-950)',
    textSecondary: 'var(--color-orange-800)',
    textTertiary: 'var(--color-orange-600)', // orange-600
    hover: 'var(--color-orange-500)',
    navHover: 'var(--color-orange-100)', // orange-600
    pageBackground: 'color-mix(in oklab, var(--color-fighting) 10%, transparent)',
    tabBackground: 'var(--color-orange-100)',
    sectionCardBg: 'var(--color-orange-200)', // orange-200 for section cards
    statBarBackground: 'var(--color-orange-950)',
    grid: 'var(--color-orange-100)',
    dark: {
      primary: 'rgba(251, 146, 60, 0.1)',
      secondary: 'var(--color-orange-600)',
      text: 'var(--color-orange-100)',
      textSecondary: 'var(--color-orange-200)',
      textTertiary: 'var(--color-orange-300)',
      hover: 'var(--color-orange-300)',
      navHover: 'var(--color-orange-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(46, 27, 11, 1)',
      sectionCardBg: 'rgba(251, 146, 60, 0.1)',
      statBarBackground: 'rgba(251, 146, 60, 0.1)',
      grid: 'rgba(251, 146, 60, 0.1)',
    },
  },
  fire: {
    primary: 'var(--color-red-200)',
    secondary: 'var(--color-red-700)',
    text: 'var(--color-red-950)',
    textSecondary: 'var(--color-red-800)',
    textTertiary: 'var(--color-red-600)', // red-600
    hover: 'var(--color-red-500)', // red-500
    navHover: 'var(--color-red-100)', // red-600
    pageBackground: 'color-mix(in oklab, var(--color-fire) 10%, transparent)',
    tabBackground: 'var(--color-red-100)',
    sectionCardBg: 'var(--color-red-100)', // red-200 for section cards
    statBarBackground: 'var(--color-red-950)',
    grid: 'var(--color-red-100)',
    dark: {
      primary: 'rgba(239, 68, 68, 0.1)',
      secondary: 'var(--color-red-100)',
      text: 'var(--color-red-50)',
      textSecondary: 'var(--color-red-300)',
      textTertiary: 'var(--color-red-200)',
      hover: 'var(--color-red-100)',
      navHover: 'var(--color-red-300)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(50, 9, 9, 1)',
      sectionCardBg: 'rgba(239, 68, 68, 0.1)',
      statBarBackground: 'rgba(239, 68, 68, 0.1)',
      grid: 'rgba(239, 68, 68, 0.1)',
    },
  },
  flying: {
    primary: 'var(--color-sky-300)',
    secondary: 'var(--color-sky-700)',
    text: 'var(--color-sky-950)',
    textSecondary: 'var(--color-sky-800)',
    textTertiary: 'var(--color-sky-600)', // sky-600
    hover: 'var(--color-sky-400)',
    navHover: 'var(--color-sky-100)', // sky-600
    pageBackground: 'var(--color-sky-50)', // sky-50
    tabBackground: 'var(--color-sky-100)',
    sectionCardBg: 'var(--color-sky-200)', // sky-200 for section cards
    statBarBackground: 'var(--color-sky-950)',
    grid: 'var(--color-sky-300)',
    dark: {
      primary: 'rgba(56, 189, 248, 0.1)',
      secondary: 'var(--color-sky-600)',
      text: 'var(--color-sky-100)',
      textSecondary: 'var(--color-sky-200)',
      textTertiary: 'var(--color-sky-300)',
      hover: 'var(--color-sky-300)',
      navHover: 'var(--color-sky-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(56, 189, 248, 0.1)',
      sectionCardBg: 'rgba(56, 189, 248, 0.1)',
      statBarBackground: 'rgba(56, 189, 248, 0.1)',
      grid: 'rgba(56, 189, 248, 0.1)',
    },
  },
  ghost: {
    primary: 'var(--color-violet-200)',
    secondary: 'var(--color-violet-700)',
    text: 'var(--color-violet-950)',
    textSecondary: 'var(--color-violet-800)',
    textTertiary: 'var(--color-violet-600)', // violet-600
    hover: 'var(--color-violet-500)',
    navHover: 'var(--color-violet-100)', // violet-600
    pageBackground: 'var(--color-violet-50)',
    tabBackground: 'var(--color-violet-100)',
    sectionCardBg: 'var(--color-violet-200)', // violet-200 for section cards
    statBarBackground: 'var(--color-violet-950)',
    grid: 'var(--color-violet-100)',
    dark: {
      primary: 'rgba(139, 92, 246, 0.1)',
      secondary: 'var(--color-violet-600)',
      text: 'var(--color-violet-100)',
      textSecondary: 'var(--color-violet-200)',
      textTertiary: 'var(--color-violet-300)',
      hover: 'var(--color-violet-300)',
      navHover: 'var(--color-violet-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(34, 23, 61, 1)',
      sectionCardBg: 'rgba(139, 92, 246, 0.1)',
      statBarBackground: 'rgba(139, 92, 246, 0.1)',
      grid: 'rgba(139, 92, 246, 0.1)',
    },
  },
  grass: {
    primary: 'var(--color-emerald-200)',
    secondary: 'var(--color-emerald-700)',
    text: 'var(--color-emerald-950)',
    textSecondary: 'var(--color-emerald-800)',
    textTertiary: 'var(--color-emerald-600)', // emerald-600
    hover: 'var(--color-emerald-500)',
    navHover: 'var(--color-emerald-100)',
    pageBackground: 'var(--color-emerald-50)',
    tabBackground: 'var(--color-emerald-100)',
    sectionCardBg: 'var(--color-emerald-100)', // emerald-200 for section cards
    statBarBackground: 'var(--color-emerald-900)',
    grid: 'var(--color-emerald-100)',
    dark: {
      primary: 'rgba(52, 211, 153, 0.1)',
      secondary: 'var(--color-emerald-600)',
      text: 'var(--color-emerald-100)',
      textSecondary: 'var(--color-emerald-200)',
      textTertiary: 'var(--color-emerald-300)',
      hover: 'var(--color-emerald-300)',
      navHover: 'var(--color-emerald-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(35, 55, 47, 1)',
      sectionCardBg: 'rgba(52, 211, 153, 0.1)',
      statBarBackground: 'rgba(52, 211, 153, 0.1)',
      grid: 'rgba(52, 211, 153, 0.1)',
    },
  },
  ground: {
    primary: 'var(--color-orange-200)',
    secondary: 'var(--color-orange-700)',
    text: 'var(--color-orange-950)',
    textSecondary: 'var(--color-orange-800)',
    textTertiary: 'var(--color-orange-600)', // orange-600
    hover: 'var(--color-orange-400)',
    navHover: 'var(--color-orange-100)', // orange-600
    pageBackground: 'color-mix(in oklab, var(--color-ground) 10%, transparent)',
    tabBackground: 'var(--color-orange-100)',
    sectionCardBg: 'var(--color-orange-200)', // orange-200 for section cards
    statBarBackground: 'var(--color-orange-900)',
    grid: 'var(--color-orange-100)',
    dark: {
      primary: 'rgba(251, 146, 60, 0.1)',
      secondary: 'var(--color-orange-600)',
      text: 'var(--color-orange-100)',
      textSecondary: 'var(--color-orange-200)',
      textTertiary: 'var(--color-orange-300)',
      hover: 'var(--color-orange-300)',
      navHover: 'var(--color-orange-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(57, 35, 18, 1)',
      sectionCardBg: 'rgba(251, 146, 60, 0.1)',
      statBarBackground: 'rgba(251, 146, 60, 0.1)',
      grid: 'rgba(251, 146, 60, 0.1)',
    },
  },
  ice: {
    primary: 'var(--color-cyan-200)',
    secondary: 'var(--color-cyan-700)',
    text: 'var(--color-cyan-950)',
    textSecondary: 'var(--color-cyan-800)',
    textTertiary: 'var(--color-cyan-600)', // cyan-600
    hover: 'var(--color-cyan-400)',
    navHover: 'var(--color-cyan-100)', // cyan-600
    pageBackground: 'var(--color-cyan-50)',
    tabBackground: 'var(--color-cyan-100)',
    sectionCardBg: 'var(--color-cyan-200)', // cyan-200 for section cards
    statBarBackground: 'var(--color-cyan-950)',
    grid: 'var(--color-cyan-100)',
    dark: {
      primary: 'var(--color-cyan-400)',
      secondary: 'var(--color-cyan-600)',
      text: 'var(--color-cyan-100)',
      textSecondary: 'var(--color-cyan-200)',
      textTertiary: 'var(--color-cyan-300)',
      hover: 'var(--color-cyan-300)',
      navHover: 'var(--color-cyan-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(11, 51, 57, 1)',
      sectionCardBg: 'rgba(34, 211, 238, 0.1)',
      statBarBackground: 'rgba(34, 211, 238, 0.1)',
      grid: 'rgba(34, 211, 238, 0.1)',
    },
  },
  normal: {
    primary: 'var(--color-normal-300)', // custom normal color from globals.css
    secondary: 'var(--color-normal-500)', // stone-500
    text: 'var(--color-normal-900)', // black
    textSecondary: 'var(--color-normal-800)', // stone-700
    textTertiary: 'var(--color-normal-600)', // stone-600
    hover: 'var(--color-normal-700)', // stone-400
    navHover: 'var(--color-normal-400)', // stone-600
    pageBackground: 'var(--color-normal-50)',
    tabBackground: 'var(--color-normal-100)',
    sectionCardBg: 'var(--color-normal-200)', // stone-200 for section cards
    statBarBackground: 'var(--color-normal-800)',
    grid: 'var(--color-normal-100)',
    dark: {
      primary: 'rgba(223, 203, 170, 0.1)',
      secondary: 'var(--color-normal-600)',
      text: 'var(--color-normal-200)',
      textSecondary: 'var(--color-normal-300)',
      textTertiary: 'var(--color-normal-400)',
      hover: 'var(--color-normal-300)',
      navHover: 'var(--color-normal-700)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(53, 47, 35, 1)',
      sectionCardBg: 'rgba(223, 203, 170, 0.1)',
      statBarBackground: 'rgba(223, 203, 170, 0.1)',
      grid: 'rgba(223, 203, 170, 0.1)',
    },
  },
  poison: {
    primary: 'var(--color-purple-200)',
    secondary: 'var(--color-purple-700)',
    text: 'var(--color-purple-950)',
    textSecondary: 'var(--color-purple-800)',
    textTertiary: 'var(--color-purple-600)', // purple-600
    hover: 'var(--color-purple-500)',
    navHover: 'var(--color-purple-100)', // purple-600
    pageBackground: 'var(--color-purple-50)',
    tabBackground: 'var(--color-purple-100)',
    sectionCardBg: 'var(--color-purple-200)', // purple-200 for section cards
    statBarBackground: 'var(--color-purple-900)',
    grid: 'var(--color-purple-100)',
    dark: {
      primary: 'rgba(168, 85, 247, 0.1)',
      secondary: 'var(--color-purple-600)',
      text: 'var(--color-purple-100)',
      textSecondary: 'var(--color-purple-200)',
      textTertiary: 'var(--color-purple-300)',
      hover: 'var(--color-purple-300)',
      navHover: 'var(--color-purple-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(36, 17, 55, 1)',
      sectionCardBg: 'rgba(168, 85, 247, 0.1)',
      statBarBackground: 'rgba(168, 85, 247, 0.1)',
      grid: 'rgba(168, 85, 247, 0.1)',
    },
  },
  psychic: {
    primary: 'var(--color-fuchsia-200)',
    secondary: 'var(--color-fuchsia-700)',
    text: 'var(--color-fuchsia-950)',
    textSecondary: 'var(--color-fuchsia-800)',
    textTertiary: 'var(--color-fuchsia-600)', // fuchsia-600
    hover: 'var(--color-fuchsia-500)',
    navHover: 'var(--color-fuchsia-100)', // fuchsia-600
    pageBackground: 'var(--color-fuchsia-50)',
    tabBackground: 'var(--color-fuchsia-100)',
    sectionCardBg: 'var(--color-fuchsia-200)', // fuchsia-200 for section cards
    statBarBackground: 'var(--color-fuchsia-900)',
    grid: 'var(--color-fuchsia-100)',
    dark: {
      primary: 'rgba(232, 121, 249, 0.1)',
      secondary: 'var(--color-fuchsia-600)',
      text: 'var(--color-fuchsia-100)',
      textSecondary: 'var(--color-fuchsia-200)',
      textTertiary: 'var(--color-fuchsia-300)',
      hover: 'var(--color-fuchsia-300)',
      navHover: 'var(--color-fuchsia-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(44, 7, 49, 1)',
      sectionCardBg: 'rgba(232, 121, 249, 0.1)',
      statBarBackground: 'rgba(232, 121, 249, 0.1)',
      grid: 'rgba(232, 121, 249, 0.1)',
    },
  },
  rock: {
    primary: 'var(--color-gray-200)',
    secondary: 'var(--color-gray-600)',
    text: 'var(--color-gray-800)',
    textSecondary: 'var(--color-gray-700)',
    textTertiary: 'var(--color-gray-600)', // gray-600
    hover: 'var(--color-gray-500)',
    navHover: 'var(--color-gray-100)', // gray-600
    pageBackground: 'var(--color-gray-50)', // gray-50
    tabBackground: 'var(--color-gray-100)',
    sectionCardBg: 'var(--color-gray-200)', // gray-200 for section cards
    statBarBackground: 'var(--color-gray-900)',
    grid: '',
    dark: {
      primary: 'rgba(107, 114, 128, 0.1)',
      secondary: 'var(--color-gray-600)',
      text: 'var(--color-gray-200)',
      textSecondary: 'var(--color-gray-300)',
      textTertiary: 'var(--color-gray-400)',
      hover: 'var(--color-gray-300)',
      navHover: 'var(--color-gray-700)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(25, 30, 40, 1)',
      sectionCardBg: 'rgba(107, 114, 128, 0.1)',
      statBarBackground: 'rgba(107, 114, 128, 0.1)',
      grid: 'rgba(107, 114, 128, 0.1)',
    },
  },
  steel: {
    primary: 'var(--color-slate-200)',
    secondary: 'var(--color-slate-600)',
    text: 'var(--color-slate-900)',
    textSecondary: 'var(--color-slate-700)',
    textTertiary: 'var(--color-slate-600)', // slate-600
    hover: 'var(--color-slate-500)',
    navHover: 'var(--color-slate-100)', // slate-600
    pageBackground: 'var(--color-slate-50)',
    tabBackground: 'var(--color-slate-100)',
    sectionCardBg: 'var(--color-slate-200)', // slate-200 for section cards
    statBarBackground: 'var(--color-slate-400)',
    grid: '',
    dark: {
      primary: 'rgba(100, 116, 139, 0.1)',
      secondary: 'var(--color-slate-600)',
      text: 'var(--color-slate-200)',
      textSecondary: 'var(--color-slate-300)',
      textTertiary: 'var(--color-slate-400)',
      hover: 'var(--color-slate-300)',
      navHover: 'var(--color-slate-700)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(52, 55, 59, 1)',
      sectionCardBg: 'rgba(100, 116, 139, 0.1)',
      statBarBackground: 'rgba(100, 116, 139, 0.1)',
      grid: 'rgba(100, 116, 139, 0.1)',
    },
  },
  water: {
    primary: 'var(--color-blue-200)', // background
    secondary: 'var(--color-blue-900)', // pokemon-theme-link pokemon-breadcrumb-active, pokemon-themed-link
    text: 'var(--color-blue-950)', // pokemon-hero-text
    textSecondary: 'var(--color-blue-900)', // theme-link
    textTertiary: 'var(--color-blue-800)', // blue-800 for breadcrumbs
    hover: 'var(--color-blue-800)', //theme-hover (breadcrumb hover)
    navHover: 'var(--color-blue-300)', // pokemon-themed-link:hover
    pageBackground: 'color-mix(in oklab, var(--color-water) 10%, transparent)',
    tabBackground: 'var(--color-blue-100)',
    sectionCardBg: 'var(--color-blue-200)', // blue-200 for section cards
    statBarBackground: 'var(--color-blue-900)',
    grid: 'var(--color-blue-100)',
    dark: {
      primary: 'rgba(59, 130, 246, 0.1)',
      secondary: 'var(--color-blue-600)',
      text: 'var(--color-blue-100)',
      textSecondary: 'var(--color-blue-200)',
      textTertiary: 'var(--color-blue-300)',
      hover: 'var(--color-blue-300)',
      navHover: 'var(--color-blue-800)',
      pageBackground: 'transparent',
      tabBackground: 'rgba(9, 31, 67, 1)',
      sectionCardBg: 'rgba(59, 130, 246, 0.1)',
      statBarBackground: 'rgba(59, 130, 246, 0.1)',
      grid: 'rgba(59, 130, 246, 0.1)',
    },
  },
};

interface PokemonTypeProviderProps {
  children: React.ReactNode;
}

export const PokemonTypeProvider: React.FC<PokemonTypeProviderProps> = ({ children }) => {
  const [primaryType, setPrimaryType] = useState<PokemonType['name'] | null>(null);
  const [secondaryType, setSecondaryType] = useState<PokemonType['name'] | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { theme, resolvedTheme } = useTheme();

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
    if (!isInitialized) return;

    const root = document.documentElement;

    const applyTheme = () => {
      if (primaryType) {
        // Use next-themes resolvedTheme for accurate dark mode detection
        const isDarkMode = resolvedTheme === 'dark';

        const typeColors =
          isDarkMode && TYPE_COLORS[primaryType].dark
            ? TYPE_COLORS[primaryType].dark!
            : TYPE_COLORS[primaryType];

        root.style.setProperty(
          '--pokemon-page-bg',
          typeColors.pageBackground || 'var(--color-slate-100)',
        );
        root.style.setProperty('--pokemon-theme-bg', typeColors.primary);
        root.style.setProperty('--pokemon-theme-text', typeColors.text);
        root.style.setProperty('--pokemon-theme-link', typeColors.textSecondary);
        root.style.setProperty('--pokemon-theme-hover', typeColors.hover);
        root.style.setProperty('--pokemon-theme-breadcrumb-active', typeColors.textSecondary);
        root.style.setProperty('--pokemon-theme-breadcrumb-inactive', `${typeColors.textTertiary}`);
        root.style.setProperty(
          '--pokemon-theme-nav-hover',
          typeColors.navHover || typeColors.hover,
        );
        root.style.setProperty(
          '--pokemon-tab-bg',
          typeColors.tabBackground || 'var(--color-neutral-200)',
        );
        root.style.setProperty('--pokemon-section-card-bg', typeColors.sectionCardBg);
        root.style.setProperty(
          '--pokemon-theme-stat-bar-bg',
          typeColors.statBarBackground || 'var(--color-neutral-200)',
        );
        root.style.setProperty('--pokemon-theme-grid', typeColors.grid);
      } else {
        root.style.removeProperty('--pokemon-theme-bg');
        root.style.removeProperty('--pokemon-theme-text');
        root.style.removeProperty('--pokemon-theme-link');
        root.style.removeProperty('--pokemon-theme-hover');
        root.style.removeProperty('--pokemon-theme-breadcrumb-active');
        root.style.removeProperty('--pokemon-theme-breadcrumb-inactive');
        root.style.removeProperty('--pokemon-theme-nav-hover');
        root.style.removeProperty('--pokemon-tab-bg');
        root.style.removeProperty('--pokemon-page-bg');
        root.style.removeProperty('--pokemon-theme-card-bg');
        root.style.removeProperty('--pokemon-section-card-bg');
        root.style.removeProperty('--pokemon-theme-stat-bar-bg');
        root.style.removeProperty('--pokemon-theme-grid');
      }
    };

    // Apply theme immediately
    applyTheme();
  }, [primaryType, secondaryType, isInitialized, resolvedTheme]);

  const value: PokemonTypeContextValue = {
    primaryType,
    secondaryType,
    setPokemonTypes,
    clearPokemonTypes,
    getTypeBasedStyles,
  };

  return <PokemonTypeContext.Provider value={value}>{children}</PokemonTypeContext.Provider>;
};
