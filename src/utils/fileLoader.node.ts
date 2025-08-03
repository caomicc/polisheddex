import { promises as fs } from 'fs';
import path from 'path';

/**
 * Reads a file from the given path and returns its contents as a string.
 * @param filePath - The path to the file.
 * @returns The contents of the file as a string.
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    const absolutePath = path.resolve(filePath);
    const data = await fs.readFile(absolutePath, 'utf-8');
    return data;
  } catch (error) {
    console.error(`Error reading file at ${filePath}:`, error);
    throw error;
  }
}

/**
 * Writes data to a file at the given path.
 * @param filePath - The path to the file.
 * @param data - The data to write to the file.
 */
export async function writeFile(filePath: string, data: string): Promise<void> {
  try {
    const absolutePath = path.resolve(filePath);
    await fs.writeFile(absolutePath, data, 'utf-8');
  } catch (error) {
    console.error(`Error writing file at ${filePath}:`, error);
    throw error;
  }
}
