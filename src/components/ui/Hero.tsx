'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { usePokemonType } from '@/contexts/PokemonTypeContext';

type HeroProps = React.PropsWithChildren & {
  className?: string;
  headline?: string | React.ReactNode;
  description?: string | React.ReactNode;
  breadcrumbs?: React.ReactNode;
  style?: React.CSSProperties;
  image?: string;
};

export const Hero: React.FC<HeroProps> = ({ ...props }) => {
  const { className, headline, description, breadcrumbs, children, style, image } = props;
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
        backgroundColor: typeStyles.backgroundColor,
        color: typeStyles.textColor,
        ...style,
      };
    }
    return style;
  }, [hasPokemonTheme, typeStyles, style]);

  return (
    <div
      ref={heroRef}
      className={cn(
        'relative flex flex-col text-left min-h-[200px] lg:min-h-[250px] justify-end p-4 md:p-8 pt-22 bg-gray-900 dark:bg-gray-800 rounded-xl mb-8 gap-1 max-w-4xl md:mx-auto shadow-lg',
        className,
      )}
      style={combinedStyle}
    >
      <div
        className="mb-1"
        style={hasPokemonTheme ? { color: `${typeStyles.textColor} !important` } : undefined}
      >
        {breadcrumbs}
      </div>
      <div className="flex items-center gap-4 mb-2">
        {image && (
          <div className="dark:bg-white/80 p-2 w-12 md:w-20 h-12 md:h-20 z-0 md:z-10 rounded-lg">
            <img
              src={image ?? ''}
              alt={`Accent Image to accompany hero`}
              className="mx-auto relative top-1/2 -translate-y-1/2"
            />
          </div>
        )}
        {/* Headline */}
        {headline && (
          <h1
            className="text-2xl md:text-4xl font-bold capitalize"
            style={hasPokemonTheme ? { color: typeStyles.textColor } : undefined}
          >
            {headline}
          </h1>
        )}
      </div>
      {description && (
        <p
          className="text-lg text-gray-300 dark:text-gray-400"
          style={hasPokemonTheme ? { color: `${typeStyles.textColor}CC` } : undefined}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
};
