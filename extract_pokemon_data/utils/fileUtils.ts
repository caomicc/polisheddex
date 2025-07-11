/**
 * File utility functions for reading, writing, and processing data files
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Reads a file synchronously and returns its content
 * @param filePath Path to the file to read
 * @param encoding Optional encoding (defaults to utf8)
 * @returns File content as a string
 */
export function readFileSync(filePath: string, encoding: BufferEncoding = 'utf8'): string {
  return fs.readFileSync(filePath, encoding);
}

/**
 * Writes JSON data to a file synchronously
 * @param filePath Path to write the file
 * @param data Data to stringify and write
 * @param indent Optional indentation (defaults to 2 spaces)
 */
export function writeJSONSync(filePath: string, data: unknown, indent = 2): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, indent));
  console.log(`Data written to ${filePath}`);
}

/**
 * Gets all files in a directory
 * @param dirPath Path to the directory
 * @param extensions Optional array of file extensions to filter by
 * @returns Array of file names (not full paths)
 */
export function getFilesInDir(dirPath: string, extensions?: string[]): string[] {
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory does not exist: ${dirPath}`);
    return [];
  }

  const files = fs.readdirSync(dirPath);

  if (extensions && extensions.length > 0) {
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return extensions.includes(ext);
    });
  }

  return files;
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath Path to the directory
 * @returns True if the directory exists or was created
 */
export function ensureDirectoryExists(dirPath: string): boolean {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      return true;
    } catch (err) {
      console.error(`Failed to create directory: ${dirPath}`, err);
      return false;
    }
  }
  return true;
}

/**
 * Checks if a file exists
 * @param filePath Path to check
 * @returns True if the file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}
