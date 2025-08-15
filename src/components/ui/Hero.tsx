'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { usePokemonType } from '@/contexts/PokemonTypeContext';
import { PokemonSprite } from '../pokemon/pokemon-sprite';

type HeroProps = React.PropsWithChildren & {
  className?: string;
  headline?: string | React.ReactNode;
  description?: string | React.ReactNode;
  breadcrumbs?: React.ReactNode;
  types?: React.ReactNode;
  style?: React.CSSProperties;
  image?: string;
  form?: string; // Optional form prop for specific Pokemon forms
};

export const Hero: React.FC<HeroProps> = ({ ...props }) => {
  const { className, headline, description, breadcrumbs, children, style, image, types, form } =
    props;
  const heroRef = React.useRef<HTMLDivElement>(null);
  const { primaryType, getTypeBasedStyles } = usePokemonType();

  React.useEffect(() => {
    const heroElement = heroRef.current;
    if (!heroElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Dispatch a custom event when hero visibility changes
        window.dispatchEvent(
          new CustomEvent('heroVisibilityChange', {
            detail: { isVisible: entry.isIntersecting },
          }),
        );
      },
      { threshold: 0.1 },
    );

    observer.observe(heroElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Get Pokemon type-based styles
  const typeStyles = getTypeBasedStyles();
  const hasPokemonTheme = primaryType !== null;

  // Combine the provided style with type-based styling
  const combinedStyle = React.useMemo(() => {
    if (hasPokemonTheme) {
      return {
        // backgroundColor: typeStyles.backgroundColor,
        // color: typeStyles.textColor,
        ...style,
      };
    }
    return style;
  }, [style, hasPokemonTheme]);

  return (
    <div
      ref={heroRef}
      className={cn(
        'relative flex flex-col text-left justify-end py-4 rounded-3xl mb-0 gap-1 max-w-4xl md:mx-auto gap-3 mt-18',
        // 'p-4 transition duration-200 dark:border-white/[0.2] dark:bg-black shadow-md dark:shadow-none',
        className,
      )}
      style={combinedStyle}
    >
      {breadcrumbs ? (
        <div
          className="mb-1"
          style={hasPokemonTheme ? { color: `${typeStyles.textColor} !important` } : undefined}
        >
          {breadcrumbs}
        </div>
      ) : null}
      <div className="flex items-center gap-4">
        {image && (
          <div>
            <PokemonSprite
              src={image ?? ''}
              primaryType={primaryType ?? undefined}
              alt={`Accent Image to accompany hero`}
              className="mx-auto relative "
              pokemonName={headline?.toString().toLowerCase() || 'egg'}
              type="animated"
              form={form || undefined}
            />
          </div>
        )}
        {/* Headline */}
        <div className="flex-1 flex flex-col gap-2">
          {headline && (
            <h1
              className="
                text-slate-700 md:text-4xl lg:text-5xl dark:text-slate-300 text-2xl font-bold capitalize"
            >
              {headline}
            </h1>
          )}
          {types && <div>{types}</div>}
        </div>
      </div>
      {description && (
        <p
          className="text-lg"
          style={hasPokemonTheme ? { color: `${typeStyles.textColor}CC` } : undefined}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
};

export default Hero;
