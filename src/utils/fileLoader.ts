// import fs from 'fs';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Robust file loader that works in both development and production
 */
export async function loadJsonFile<T>(relativePath: string): Promise<T | null> {
  const possiblePaths = [
    // Standard path from project root
    path.join(process.cwd(), relativePath),
    // Alternative path in case of deployment differences
    path.join(process.cwd(), '..', relativePath),
    // Path relative to the current file
    path.resolve(__dirname, '..', '..', '..', relativePath),
  ];

  // console.log(`Attempting to load file: ${relativePath}`);
  // console.log(`Process cwd: ${process.cwd()}`);
  // console.log(`__dirname: ${__dirname}`);

  for (const filePath of possiblePaths) {
    try {
      console.log(`Trying path: ${filePath}`);
      await fs.access(filePath); // Check if file exists
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data) as T;
      console.log(`Successfully loaded file from: ${filePath}`);
      return parsed;
    } catch (error) {
      console.log(
        `Failed to load from ${filePath}:`,
        error instanceof Error ? error.message : String(error),
      );
      continue;
    }
  }

  console.error(`Failed to load file ${relativePath} from any path`);
  return null;
}

// Function to safely load JSON data
export async function loadJsonData<T>(filePath: string): Promise<T | null> {
  try {
    // if not promises as fs, needs fs.promises.readFile
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
    return null;
  }
}
