'use client';

import React from 'react';
import NewTrainerCard from '@/components/trainer/new-trainer-card';
import { ComprehensiveTrainerData } from '@/types/new';

interface LocationTrainersSectionProps {
  trainers: ComprehensiveTrainerData[];
}

export default function LocationTrainersSection({ trainers }: LocationTrainersSectionProps) {
  if (!trainers || trainers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4">Trainers</h2>
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
    </div>
  );
}
