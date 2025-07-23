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
        'bg-white/90 backdrop-blur-xl dark:bg-gray-800 rounded-2xl p-4',
        'border-2 shadow-2xl',
        hasPokemonTheme && 'pokemon-section-card',
        `shadow-${primaryType?.toLowerCase()}`,
        className,
      )}
    >
      <CardHeader className="sr-only">{headline}</CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default SectionCard;
