import { cn } from '@/lib/utils';
import React, { PropsWithChildren, ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
// import { usePokemonType } from '@/contexts/PokemonTypeContext';

type SectionCardProps = PropsWithChildren<{
  children: ReactNode;
  className?: string;
  headline: string | ReactNode;
  primaryType?: string | null;
  secondaryType?: string | null;
}>;

const SectionCard: React.FC<SectionCardProps> = ({ ...props }: SectionCardProps) => {
  const { children, headline, className } = props;
  // const { primaryType } = usePokemonType();
  // const hasPokemonTheme = primaryType && primaryType !== 'normal';

  return (
    <Card
      className={cn(
        'shadow-input row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-neutral-200 bg-neutral-100 p-4 transition duration-200 dark:border-white/[0.2] dark:bg-black dark:shadow-none',
        // hasPokemonTheme && 'pokemon-section-card',
        // `shadow-${primaryType?.toLowerCase()}`,
        className,
      )}
    >
      <CardHeader className="sr-only">{headline}</CardHeader>
      <CardContent className="px-0 gap-2 flex flex-col p-4 bg-white">{children}</CardContent>
    </Card>
  );
};

export default SectionCard;
