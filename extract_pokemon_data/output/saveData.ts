/**
 * Output handlers for saving extracted Pokémon data
 */

import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_PATHS } from '../data/constants.js';

/**
 * Save data to a JSON file
 * @param data Data to save
 * @param outputPath Path to save the file
 * @param pretty Whether to pretty-print the JSON (default: true)
 */
export function saveJsonData<T>(data: T, outputPath: string, pretty = true): void {
  try {
    const indent = pretty ? 2 : 0;
    const json = JSON.stringify(data, null, indent);
    fs.writeFileSync(outputPath, json, 'utf8');
    console.log(`Data successfully written to ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`Error writing data to ${outputPath}:`, error);
  }
}

/**
 * Save data to a standard output path
 * @param data Data to save
 * @param dataType Type of data being saved
 * @param pretty Whether to pretty-print the JSON (default: true)
 */
export function saveStandardOutput<T>(data: T, dataType: keyof typeof OUTPUT_PATHS, pretty = true): void {
  const outputPath = OUTPUT_PATHS[dataType];
  if (!outputPath) {
    console.error(`Unknown data type: ${dataType}`);
    return;
  }

  saveJsonData(data, outputPath, pretty);
}

/**
 * Combine multiple data files into a single consolidated JSON
 * @param outputPath Path to save the combined file
 * @param dataSources Record of data types to include
 * @param pretty Whether to pretty-print the JSON (default: true)
 */
export function combineDataFiles<T extends Record<string, unknown>>(
  outputPath: string,
  dataSources: T,
  pretty = true
): void {
  try {
    const combinedData = { ...dataSources };
    saveJsonData(combinedData, outputPath, pretty);
    console.log(`Combined data successfully written to ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`Error combining data files:`, error);
  }
}
