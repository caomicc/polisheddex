import { DetailCard } from '@/components/ui/detail-card';
import { FileText } from 'lucide-react';

interface AbilityDescriptionCardProps {
  description: string;
  className?: string;
}

export function AbilityDescriptionCard({ description, className }: AbilityDescriptionCardProps) {
  if (!description) {
    return null;
  }

  return (
    <DetailCard icon={FileText} title="Effect" className={className}>
      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{description}</p>
    </DetailCard>
  );
}
