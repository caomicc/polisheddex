import { cn } from '@/lib/utils';
import React, { PropsWithChildren, ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';

type SectionCardProps = PropsWithChildren<{
  children: ReactNode;
  className?: string;
  headline: string | ReactNode;
}>;

const SectionCard: React.FC<SectionCardProps> = ({ ...props }: SectionCardProps) => {
  const { children, headline, className } = props;
  return (
    <Card
      className={cn(
        'bg-white dark:bg-gray-800 shadow-md rounded-lg p-4',
        'border border-gray-200 dark:border-gray-700',
        'transition-transform transform hover:scale-[1.01] active:scale-[0.95]',
        className,
      )}
    >
      <CardHeader className="sr-only">{headline}</CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default SectionCard;
