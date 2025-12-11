'use client';

import { DetailCard } from '@/components/ui/detail-card';
import NewTrainerCard from '@/components/trainer/new-trainer-card';
import { ComprehensiveTrainerData } from '@/types/new';
import { Users } from 'lucide-react';

interface LocationTrainersCardProps {
  trainers: ComprehensiveTrainerData[];
  className?: string;
}

export function LocationTrainersCard({ trainers, className }: LocationTrainersCardProps) {
  if (!trainers || trainers.length === 0) {
    return null;
  }

  return (
    <DetailCard icon={Users} title="Trainers" className={className}>
      <div className="space-y-3">
        {trainers.map((trainer) => (
          <NewTrainerCard
            key={trainer.id}
            trainer={trainer}
            showTeam={1}
            showAllTeams={true}
          />
        ))}
      </div>
    </DetailCard>
  );
}
