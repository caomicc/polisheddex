import { DetailCard } from '@/components/ui/detail-card';
import { HelpCircle } from 'lucide-react';

interface ItemUsageCardProps {
  usage: string;
  className?: string;
}

export function ItemUsageCard({ usage, className }: ItemUsageCardProps) {
  return (
    <DetailCard icon={HelpCircle} title="How to Use" className={className}>
      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{usage}</p>
    </DetailCard>
  );
}
