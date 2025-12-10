#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getGitInfo() {
  try {
    const sha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const date = execSync('git log -1 --format=%cI', { encoding: 'utf8' }).trim();
    return { sha, date };
  } catch {
    return { sha: 'unknown', date: new Date().toISOString() };
  }
}

const gitInfo = getGitInfo();
const buildInfo = {
  buildDate: new Date().toISOString(),
  gitCommitSha: gitInfo.sha,
  gitCommitDate: gitInfo.date,
};

const outputPath = join(__dirname, '..', 'public', 'build-info.json');
writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log('✓ Generated build-info.json');
console.log(`  Build date: ${buildInfo.buildDate}`);
console.log(`  Git commit: ${buildInfo.gitCommitSha.substring(0, 7)}`);
console.log(`  Commit date: ${buildInfo.gitCommitDate}`);
