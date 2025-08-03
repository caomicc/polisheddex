'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TrainerCard from '@/components/trainer/TrainerCard';
import type { LocationTrainer } from '@/types/types';

interface EliteFourSectionProps {
  eliteFour: LocationTrainer[];
  showInMain?: boolean;
}

export default function EliteFourSection({ 
  eliteFour, 
  showInMain = true 
}: EliteFourSectionProps) {
  
  if (!showInMain || !eliteFour || eliteFour.length === 0) {
    return null;
  }

  // Group trainers by type (Elite 4 vs Champion)
  const eliteFourMembers = eliteFour.filter(trainer => 
    ['BRUNO', 'KAREN', 'KOGA', 'WILL'].includes(trainer.trainerClass)
  );
  
  const champion = eliteFour.find(trainer => 
    trainer.trainerClass === 'CHAMPION' || trainer.trainerClass === 'LANCE'
  );

  const others = eliteFour.filter(trainer => 
    !['BRUNO', 'KAREN', 'KOGA', 'WILL', 'CHAMPION', 'LANCE'].includes(trainer.trainerClass)
  );

  return (
    <div className="space-y-6">
      {/* Elite Four Members */}
      {eliteFourMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Elite Four
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {eliteFourMembers.length} Members
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {eliteFourMembers.map((trainer, index) => (
                <TrainerCard 
                  key={`${trainer.id}-${index}`} 
                  trainer={trainer}
                  showEliteFourBadge={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Champion */}
      {champion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Champion
              <Badge variant="default" className="bg-yellow-500 text-white dark:bg-yellow-600">
                Champion
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrainerCard 
              trainer={champion}
              showChampionBadge={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Other Trainers */}
      {others.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Other Trainers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {others.map((trainer, index) => (
                <TrainerCard key={`${trainer.id}-${index}`} trainer={trainer} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Elite Four Information */}
      <Card>
        <CardHeader>
          <CardTitle>About the Elite Four</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              The Elite Four are the strongest trainers in the Pokémon League, each specializing in different types. 
              Defeat all four members to earn the right to challenge the Champion.
            </p>
            
            {eliteFourMembers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Specialties:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {eliteFourMembers.map((trainer, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {trainer.trainerClass}
                      </Badge>
                      <span className="text-muted-foreground">
                        {getTrainerSpecialty(trainer.trainerClass)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getTrainerSpecialty(trainerClass: string): string {
  const specialties: Record<string, string> = {
    'BRUNO': 'Fighting-type',
    'KAREN': 'Dark-type', 
    'KOGA': 'Poison-type',
    'WILL': 'Psychic-type',
    'LANCE': 'Dragon-type',
  };
  
  return specialties[trainerClass] || 'Various types';
}