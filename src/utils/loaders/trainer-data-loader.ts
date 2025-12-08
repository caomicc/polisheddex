// Trainer data loader for the new data format

import { promises as fs } from 'fs';
import path from 'path';
import { ComprehensiveTrainerData, TrainerManifest } from '@/types/new';

let trainersManifest: TrainerManifest[] | null = null;

/**
 * Load trainers manifest once and cache it (server-side only)
 */
export async function loadTrainersManifest(): Promise<TrainerManifest[]> {
  if (trainersManifest) {
    return trainersManifest;
  }

  try {
    const manifestPath = path.join(process.cwd(), 'public/new/trainer_manifest.json');
    const manifestData = await fs.readFile(manifestPath, 'utf-8');
    trainersManifest = JSON.parse(manifestData);
    return trainersManifest || [];
  } catch (error) {
    console.error('Error loading trainers manifest:', error);
    return [];
  }
}

/**
 * Get trainer data by ID from individual file (server-side only)
 */
export async function getTrainerData(trainerId: string): Promise<ComprehensiveTrainerData | null> {
  try {
    const trainerPath = path.join(process.cwd(), `public/new/trainers/${trainerId}.json`);
    const trainerData = await fs.readFile(trainerPath, 'utf-8');
    return JSON.parse(trainerData);
  } catch (error) {
    console.error(`Error loading trainer data for ${trainerId}:`, error);
    return null;
  }
}

/**
 * Get multiple trainers by their IDs
 */
export async function getTrainersData(trainerIds: string[]): Promise<ComprehensiveTrainerData[]> {
  const trainers: ComprehensiveTrainerData[] = [];
  
  for (const trainerId of trainerIds) {
    const trainerData = await getTrainerData(trainerId);
    if (trainerData) {
      trainers.push(trainerData);
    }
  }
  
  return trainers;
}

/**
 * Get all trainer IDs from the manifest
 */
export async function getAllTrainerIds(): Promise<string[]> {
  const manifest = await loadTrainersManifest();
  return manifest.map(trainer => trainer.id);
}
