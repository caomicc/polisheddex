#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildInfo = {
  buildDate: new Date().toISOString(),
  gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  gitCommitDate: process.env.VERCEL_GIT_COMMIT_DATE || new Date().toISOString(),
};

const outputPath = path.join(__dirname, '..', 'public', 'build-info.json');

fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log('Build info generated:', buildInfo);
