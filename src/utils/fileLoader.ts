// Server-side only file loader - only import fs on server side
let fs: typeof import('fs').promises | null = null;
let path: typeof import('path') | null = null;

// Dynamically import fs and path only on server side
if (typeof window === 'undefined') {
  fs = require('fs').promises;
  path = require('path');
}

/**
 * Robust file loader that works in both development and production
 * Server-side only - will throw error if called on client side
 */
export async function loadJsonFile<T>(relativePath: string): Promise<T | null> {
  // Ensure this is only called on server side
  if (typeof window !== 'undefined') {
    throw new Error('loadJsonFile can only be called on the server side');
  }

  if (!fs || !path) {
    throw new Error('File system modules not available');
  }

  // Use only the standard path from project root
  const filePath = path.join(process.cwd(), relativePath);

  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(
      `Failed to load file ${relativePath}:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

// Function to safely load JSON data
// Server-side only - will throw error if called on client side
export async function loadJsonData<T>(filePath: string): Promise<T | null> {
  // Ensure this is only called on server side
  if (typeof window !== 'undefined') {
    throw new Error('loadJsonData can only be called on the server side');
  }

  if (!fs) {
    throw new Error('File system module not available');
  }

  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
    return null;
  }
}
