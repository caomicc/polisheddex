/**
 * Test page to demonstrate the enhanced trainer display
 */
import TrainerCard from '@/components/trainer/TrainerCard';
import { LocationTrainer, TrainerPokemon } from '@/types/types';

// Sample trainer data for demonstration
const sampleTrainer: LocationTrainer = {
  id: 'sage_nico',
  name: 'Nico',
  trainerClass: 'SAGE',
  spriteType: 'sage',
  coordinates: { x: 7, y: 6 },
  pokemon: [
    {
      level: 10,
      species: 'bellsprout',
      moves: ['vine_whip', 'growth']
    } as TrainerPokemon,
    {
      level: 10,
      species: 'bellsprout',
      moves: ['vine_whip', 'growth']
    } as TrainerPokemon,
    {
      level: 12,
      species: 'hoothoot',
      moves: ['tackle', 'growl', 'foresight', 'peck']
    } as TrainerPokemon
  ],
  seenText: "We stand guard in this tower, night and day.",
  beatenText: "You have a promising aura about you.",
};

const sampleTrainerWithItems: LocationTrainer = {
  id: 'cooltrainerm_alex',
  name: 'Alex',
  trainerClass: 'COOLTRAINERM',
  spriteType: 'ace_trainer_m',
  coordinates: { x: 12, y: 8 },
  baseReward: 2500,
  items: ['Full Heal', 'X Attack'],
  rematchable: true,
  pokemon: [
    {
      level: 35,
      species: 'alakazam',
      nickname: 'Einstein',
      item: 'twisted_spoon',
      ability: 'synchronize',
      nature: 'modest',
      gender: 'male',
      shiny: true,
      moves: ['psychic', 'thunder_punch', 'shadow_ball', 'recover']
    } as TrainerPokemon,
    {
      level: 33,
      species: 'machamp',
      item: 'black_belt',
      ability: 'guts',
      nature: 'adamant',
      gender: 'male',
      moves: ['dynamic_punch', 'rock_slide', 'earthquake', 'rest']
    } as TrainerPokemon
  ],
  seenText: "I've been training for years. Let's see what you've got!",
  beatenText: "Wow! Your training has really paid off.",
  afterText: "I need to train harder to match your skill level.",
};

export default function TrainerTestPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-slate-900 dark:text-slate-100">
          Enhanced Trainer Display Test
        </h1>

        <div className="max-w-4xl mx-auto space-y-8">
          <section className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
            <h2 className="text-lg font-semibold mb-3 text-red-800 dark:text-red-200 flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">⚔️</span>
              Basic Trainer (Sprout Tower)
            </h2>
            <div className="space-y-4">
              <TrainerCard trainer={sampleTrainer} />
            </div>
          </section>

          <section className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
            <h2 className="text-lg font-semibold mb-3 text-red-800 dark:text-red-200 flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">⚔️</span>
              Advanced Trainer (with Items & Rewards)
            </h2>
            <div className="space-y-4">
              <TrainerCard trainer={sampleTrainerWithItems} />
            </div>
          </section>

          <section className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border-l-4 border-slate-500">
            <h2 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">
              Trainer Display Features
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
              <li>Enhanced visual design with gradients and better spacing</li>
              <li>Accessible markup with proper ARIA labels and semantic HTML</li>
              <li>Responsive grid layout for Pokémon teams</li>
              <li>Pokémon nickname display with fallback to species name</li>
              <li>Shiny indicator with visual sparkle emoji</li>
              <li>Held items and abilities with color coding</li>
              <li>Move lists with proper wrapping and tooltips</li>
              <li>Trainer rewards and items display</li>
              <li>Rematchable indicator for trainers that can be fought again</li>
              <li>Collapsible battle dialogue section</li>
              <li>Focus management for keyboard navigation</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
