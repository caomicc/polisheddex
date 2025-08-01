import { cn } from '@/lib/utils';
import React, { PropsWithChildren, ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { usePokemonType } from '@/contexts/PokemonTypeContext';

type SectionCardProps = PropsWithChildren<{
  children: ReactNode;
  className?: string;
  headline: string | ReactNode;
  primaryType?: string | null;
  secondaryType?: string | null;
}>;

const SectionCard: React.FC<SectionCardProps> = ({ ...props }: SectionCardProps) => {
  const { children, headline, className } = props;
  const { primaryType } = usePokemonType();
  const hasPokemonTheme = primaryType && primaryType !== 'normal';

  return (
    <Card
      className={cn(
        'bg-white/90 backdrop-blur-xl dark:bg-black/5 rounded-2xl py-6 md:py-8 md:px-4',
        'border-2 shadow-2xl',
        hasPokemonTheme && 'pokemon-section-card',
        `shadow-${primaryType?.toLowerCase()}`,
        className,
      )}
    >
      <CardHeader className="sr-only">{headline}</CardHeader>
      <CardContent className="px-2 md:px-6 gap-2 flex flex-col">{children}</CardContent>
    </Card>
  );
};

export default SectionCard;
