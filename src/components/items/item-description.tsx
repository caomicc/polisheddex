import { DetailCard } from '@/components/ui/detail-card';

interface ItemDescriptionProps {
  description: string;
  className?: string;
}

export function ItemDescription({ description, className }: ItemDescriptionProps) {
  return (
    <DetailCard className={className}>
      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{description}</p>
    </DetailCard>
  );
}
