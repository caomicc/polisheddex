#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { LocationData } from './src/types/types.js';
import {
  getConsolidatedLocationKey,
  getLocationRedirect,
  // parseLocationKey
} from './src/utils/locationUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MigrationReport {
  summary: {
    originalCount: number;
    consolidatedCount: number;
    reductionCount: number;
    reductionPercentage: number;
  };
  consolidationGroups: {
    parentLocation: string;
    childLocations: string[];
    dataTypes: string[];
    totalTrainers: number;
    totalItems: number;
  }[];
  redirectMappings: Record<string, string>;
  potentialIssues: {
    type: 'missing_data' | 'broken_connection' | 'duplicate_redirect';
    location: string;
    description: string;
  }[];
  stats: {
    eliteFourLocations: number;
    multiFloorBuildings: number;
    routeSegments: number;
    gymLeaderIntegrations: number;
  };
}

/**
 * Main migration script
 */
async function runMigration() {
  console.log('🔄 Starting Location Consolidation Migration...\n');

  try {
    // Step 1: Backup current location files
    await backupLocationFiles();

    // Step 2: Validate consolidation mapping
    const mapping = loadConsolidationMapping();

    console.log(
      `📋 Loaded consolidation mapping with ${Object.keys(mapping.consolidationGroups).length} groups`,
    );
    console.log(mapping);

    // Step 3: Load location data
    const originalLocations = await loadOriginalLocations();
    const consolidatedLocations = await loadConsolidatedLocations();

    console.log(
      `📁 Loaded ${Object.keys(originalLocations).length} original locations and ${Object.keys(consolidatedLocations).length} consolidated locations`,
    );
    console.log(
      `   Original locations: ${Object.keys(originalLocations).slice(0, 5).join(', ')}...`,
    );
    console.log(
      `   Consolidated locations: ${Object.keys(consolidatedLocations).slice(0, 5).join(', ')}...`,
    );

    // Step 4: Generate migration report
    const report = generateMigrationReport(originalLocations, consolidatedLocations, mapping);

    // Step 5: Save report
    await saveMigrationReport(report);

    // Step 6: Generate redirect map
    await generateRedirectMap(report.redirectMappings);

    // Step 7: Validate data integrity
    await validateDataIntegrity(originalLocations, consolidatedLocations);

    console.log('✅ Migration completed successfully!');
    console.log(
      `📊 Reduced from ${report.summary.originalCount} to ${report.summary.consolidatedCount} locations (${report.summary.reductionPercentage}% reduction)`,
    );

    if (report.potentialIssues.length > 0) {
      console.log(
        `⚠️  Found ${report.potentialIssues.length} potential issues - check migration-report.json`,
      );
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Backup current location files
 */
async function backupLocationFiles(): Promise<void> {
  console.log('💾 Creating backup of current location files...');

  const backupDir = path.join(__dirname, 'location-backup');
  const locationsDir = path.join(__dirname, 'output/locations');

  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Copy all location files
  if (fs.existsSync(locationsDir)) {
    const files = fs.readdirSync(locationsDir);
    let backedUpCount = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const sourcePath = path.join(locationsDir, file);
        const backupPath = path.join(backupDir, file);
        fs.copyFileSync(sourcePath, backupPath);
        backedUpCount++;
      }
    }

    console.log(`   ✅ Backed up ${backedUpCount} location files to ${backupDir}`);
  }

  // Backup all_locations.json
  const allLocationsPath = path.join(__dirname, 'output/all_locations.json');
  if (fs.existsSync(allLocationsPath)) {
    fs.copyFileSync(allLocationsPath, path.join(backupDir, 'all_locations.json'));
    console.log('   ✅ Backed up all_locations.json');
  }
}

/**
 * Load consolidation mapping
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadConsolidationMapping(): any {
  const mappingPath = path.join(__dirname, 'location-consolidation-mapping.json');
  if (!fs.existsSync(mappingPath)) {
    throw new Error('Consolidation mapping file not found');
  }
  return JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
}

/**
 * Load original location data (from backup or current)
 */
async function loadOriginalLocations(): Promise<Record<string, LocationData>> {
  const backupPath = path.join(__dirname, 'location-backup/all_locations.json');
  const currentPath = path.join(__dirname, 'output/all_locations.json');

  const dataPath = fs.existsSync(backupPath) ? backupPath : currentPath;

  if (!fs.existsSync(dataPath)) {
    throw new Error('No location data found');
  }

  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

/**
 * Load consolidated location data
 */
async function loadConsolidatedLocations(): Promise<Record<string, LocationData>> {
  const allLocationsPath = path.join(__dirname, 'output/all_locations.json');

  if (!fs.existsSync(allLocationsPath)) {
    throw new Error('Consolidated location data not found - run extraction first');
  }

  return JSON.parse(fs.readFileSync(allLocationsPath, 'utf8'));
}

/**
 * Generate comprehensive migration report
 */
function generateMigrationReport(
  originalLocations: Record<string, LocationData>,
  consolidatedLocations: Record<string, LocationData>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapping: any,
): MigrationReport {
  console.log('📊 Generating migration report...');

  const originalCount = Object.keys(originalLocations).length;
  const consolidatedCount = Object.keys(consolidatedLocations).length;
  const reductionCount = originalCount - consolidatedCount;
  const reductionPercentage = Math.round((reductionCount / originalCount) * 100);

  // Generate consolidation groups info
  const consolidationGroups = Object.entries(
    mapping.consolidationGroups as Record<string, string[]>,
  ).map(([parent, children]) => {
    const parentData = consolidatedLocations[parent];
    console.log(`Processing consolidation group for parent: ${parentData}`);
    const dataTypes: string[] = [];

    let totalTrainers = 0;
    let totalItems = 0;

    if (parentData) {
      if (parentData.trainers && parentData.trainers.length > 0) {
        dataTypes.push('trainers');
        totalTrainers += parentData.trainers.length;
      }
      if (parentData.eliteFour && parentData.eliteFour.length > 0) {
        dataTypes.push('elite_four');
        totalTrainers += parentData.eliteFour.length;
      }
      if (parentData.areas) {
        dataTypes.push('areas');
        totalTrainers += parentData.areas.reduce(
          (sum, area) => sum + (area.trainers?.length || 0),
          0,
        );
        totalItems += parentData.areas.reduce((sum, area) => sum + (area.items?.length || 0), 0);
      }
      if (parentData.items && parentData.items.length > 0) {
        dataTypes.push('items');
        totalItems += parentData.items.length;
      }
      if (parentData.connections && parentData.connections.length > 0) {
        dataTypes.push('connections');
      }
    }

    return {
      parentLocation: parent,
      childLocations: children,
      dataTypes,
      totalTrainers,
      totalItems,
    };
  });

  // Generate redirect mappings
  const redirectMappings: Record<string, string> = {};

  Object.keys(originalLocations).forEach((locationKey) => {
    const redirect = getLocationRedirect(locationKey);
    if (redirect) {
      redirectMappings[locationKey] = redirect;
    }
  });

  // Find potential issues
  const potentialIssues: MigrationReport['potentialIssues'] = [];

  // Check for missing data
  Object.entries(mapping.consolidationGroups as Record<string, string[]>).forEach(
    ([parent, children]) => {
      if (!consolidatedLocations[parent]) {
        potentialIssues.push({
          type: 'missing_data',
          location: parent,
          description: `Consolidated parent location ${parent} not found in output`,
        });
      }

      children.forEach((child) => {
        if (
          originalLocations[child] &&
          !consolidatedLocations[parent]?.consolidatedFrom?.includes(child)
        ) {
          potentialIssues.push({
            type: 'missing_data',
            location: child,
            description: `Child location ${child} data may not be properly merged into ${parent}`,
          });
        }
      });
    },
  );

  // Check for broken connections
  Object.values(consolidatedLocations).forEach((location) => {
    location.connections.forEach((connection) => {
      const targetKey = getConsolidatedLocationKey(connection.targetLocation);
      if (!consolidatedLocations[targetKey]) {
        potentialIssues.push({
          type: 'broken_connection',
          location: location.name,
          description: `Connection to ${connection.targetLocation} may be broken after consolidation`,
        });
      }
    });
  });

  // Calculate stats
  const stats = {
    eliteFourLocations: Object.values(consolidatedLocations).filter(
      (loc) => loc.eliteFour && loc.eliteFour.length > 0,
    ).length,
    multiFloorBuildings: Object.values(consolidatedLocations).filter(
      (loc) => loc.areas && loc.areas.length > 1,
    ).length,
    routeSegments: consolidationGroups.filter((group) => group.parentLocation.startsWith('route_'))
      .length,
    gymLeaderIntegrations: Object.keys(mapping.gymLeaderIntegrations || {}).length,
  };

  return {
    summary: {
      originalCount,
      consolidatedCount,
      reductionCount,
      reductionPercentage,
    },
    consolidationGroups,
    redirectMappings,
    potentialIssues,
    stats,
  };
}

/**
 * Save migration report to file
 */
async function saveMigrationReport(report: MigrationReport): Promise<void> {
  const reportPath = path.join(__dirname, 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Also create a human-readable summary
  const summaryPath = path.join(__dirname, 'migration-summary.md');
  const summaryContent = generateSummaryMarkdown(report);
  fs.writeFileSync(summaryPath, summaryContent);

  console.log(`📄 Migration report saved to ${reportPath}`);
  console.log(`📄 Human-readable summary saved to ${summaryPath}`);
}

/**
 * Generate human-readable migration summary
 */
function generateSummaryMarkdown(report: MigrationReport): string {
  return `# Location Consolidation Migration Report

## Summary

- **Original Locations**: ${report.summary.originalCount}
- **Consolidated Locations**: ${report.summary.consolidatedCount}
- **Reduction**: ${report.summary.reductionCount} locations (${report.summary.reductionPercentage}%)

## Statistics

- **Elite Four Locations**: ${report.stats.eliteFourLocations}
- **Multi-Floor Buildings**: ${report.stats.multiFloorBuildings}
- **Route Segments Consolidated**: ${report.stats.routeSegments}
- **Gym Leader Integrations**: ${report.stats.gymLeaderIntegrations}

## Major Consolidation Groups

${report.consolidationGroups
  .filter((group) => group.childLocations.length >= 3)
  .map(
    (group) => `
### ${group.parentLocation}
- **Child Locations**: ${group.childLocations.length}
- **Total Trainers**: ${group.totalTrainers}
- **Total Items**: ${group.totalItems}
- **Data Types**: ${group.dataTypes.join(', ')}
`,
  )
  .join('')}

## Redirect Mappings

${Object.entries(report.redirectMappings)
  .slice(0, 20)
  .map(([old, new_]) => `- \`${old}\` → \`${new_}\``)
  .join('\n')}

${Object.keys(report.redirectMappings).length > 20 ? `\n... and ${Object.keys(report.redirectMappings).length - 20} more redirects` : ''}

## Potential Issues

${report.potentialIssues.length === 0 ? 'No issues detected! ✅' : ''}

${report.potentialIssues
  .map(
    (issue) => `
### ${issue.type} - ${issue.location}
${issue.description}
`,
  )
  .join('')}

## Next Steps

1. Review any potential issues listed above
2. Test consolidated location pages in development
3. Update any hardcoded location references in code
4. Deploy with redirect handling enabled
5. Monitor for broken links after deployment

---
*Generated on ${new Date().toISOString()}*
`;
}

/**
 * Generate redirect map for server/deployment
 */
async function generateRedirectMap(redirectMappings: Record<string, string>): Promise<void> {
  console.log('🔀 Generating redirect configurations...');

  // Next.js redirects format
  const nextjsRedirects = Object.entries(redirectMappings).map(([source, destination]) => ({
    source: `/locations/${source}`,
    destination,
    permanent: true,
  }));

  const nextjsConfigPath = path.join(__dirname, 'location-redirects.js');
  const nextjsConfig = `// Next.js redirects configuration
// Add these to your next.config.js redirects array

module.exports = ${JSON.stringify(nextjsRedirects, null, 2)};
`;

  fs.writeFileSync(nextjsConfigPath, nextjsConfig);

  // Apache .htaccess format
  const htaccessPath = path.join(__dirname, 'location-redirects.htaccess');
  const htaccessContent = `# Apache redirects for consolidated locations
# Add these to your .htaccess file

${Object.entries(redirectMappings)
  .map(([source, destination]) => `Redirect 301 /locations/${source} ${destination}`)
  .join('\n')}
`;

  fs.writeFileSync(htaccessPath, htaccessContent);

  console.log(`   ✅ Next.js redirects saved to ${nextjsConfigPath}`);
  console.log(`   ✅ Apache redirects saved to ${htaccessPath}`);
}

/**
 * Validate data integrity between original and consolidated data
 */
async function validateDataIntegrity(
  originalLocations: Record<string, LocationData>,
  consolidatedLocations: Record<string, LocationData>,
): Promise<void> {
  console.log('🔍 Validating data integrity...');

  let totalTrainersOriginal = 0;
  let totalTrainersConsolidated = 0;
  let totalItemsOriginal = 0;
  let totalItemsConsolidated = 0;

  // Count original data
  Object.values(originalLocations).forEach((location) => {
    totalTrainersOriginal += location.trainers?.length || 0;
    totalItemsOriginal += location.items?.length || 0;
  });

  // Count consolidated data
  Object.values(consolidatedLocations).forEach((location) => {
    totalTrainersConsolidated += location.trainers?.length || 0;
    totalTrainersConsolidated += location.eliteFour?.length || 0;
    totalItemsConsolidated += location.items?.length || 0;

    if (location.areas) {
      location.areas.forEach((area) => {
        totalTrainersConsolidated += area.trainers?.length || 0;
        totalItemsConsolidated += area.items?.length || 0;
      });
    }
  });

  console.log(
    `   Trainers: ${totalTrainersOriginal} → ${totalTrainersConsolidated} ${totalTrainersOriginal === totalTrainersConsolidated ? '✅' : '⚠️'}`,
  );
  console.log(
    `   Items: ${totalItemsOriginal} → ${totalItemsConsolidated} ${totalItemsOriginal <= totalItemsConsolidated ? '✅' : '⚠️'}`,
  );

  if (totalTrainersOriginal !== totalTrainersConsolidated) {
    console.log('   ⚠️  Trainer count mismatch - review consolidation logic');
  }
}

/**
 * Run validation only (without migration)
 */
async function runValidation() {
  console.log('🔍 Running validation checks only...\n');

  try {
    const originalLocations = await loadOriginalLocations();
    const consolidatedLocations = await loadConsolidatedLocations();

    await validateDataIntegrity(originalLocations, consolidatedLocations);

    console.log('✅ Validation completed');
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

/**
 * Restore from backup
 */
async function restoreBackup() {
  console.log('🔄 Restoring from backup...\n');

  const backupDir = path.join(__dirname, 'location-backup');
  const locationsDir = path.join(__dirname, 'output/locations');

  if (!fs.existsSync(backupDir)) {
    console.error('❌ No backup found');
    process.exit(1);
  }

  // Restore location files
  const backupFiles = fs.readdirSync(backupDir);
  let restoredCount = 0;

  for (const file of backupFiles) {
    if (file.endsWith('.json')) {
      const backupPath = path.join(backupDir, file);
      const restorePath = path.join(locationsDir, file);
      fs.copyFileSync(backupPath, restorePath);
      restoredCount++;
    }
  }

  console.log(`✅ Restored ${restoredCount} location files`);
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case '--validate':
    runValidation();
    break;
  case '--restore':
    restoreBackup();
    break;
  case '--help':
    console.log(`
Location Migration Script

Usage:
  npx tsx migrate-locations.ts [command]

Commands:
  (none)        Run full migration with backup and validation
  --validate    Run validation checks only
  --restore     Restore from backup
  --help        Show this help

Examples:
  npx tsx migrate-locations.ts                 # Full migration
  npx tsx migrate-locations.ts --validate      # Validation only
  npx tsx migrate-locations.ts --restore       # Restore backup
`);
    break;
  default:
    runMigration();
    break;
}
