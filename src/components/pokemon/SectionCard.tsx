import { cn } from '@/lib/utils';
import React, { PropsWithChildren, ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { usePokemonType } from '@/contexts/PokemonTypeContext';

type SectionCardProps = PropsWithChildren<{
  children: ReactNode;
  className?: string;
  headline: string | ReactNode;
}>;

const SectionCard: React.FC<SectionCardProps> = ({ ...props }: SectionCardProps) => {
  const { children, headline, className } = props;
  const { primaryType } = usePokemonType();
  const hasPokemonTheme = primaryType !== null;

  return (
    <Card
      className={cn(
        'bg-white/60 backdrop-blur-xl dark:bg-gray-800 rounded-xl p-4',
        'border-none shadow-lg',
        hasPokemonTheme && 'pokemon-section-card',
        className,
      )}
    >
      <CardHeader className="sr-only">{headline}</CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default SectionCard;
