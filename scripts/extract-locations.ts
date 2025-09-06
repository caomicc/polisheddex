export default async function extractLocations() {
  console.log('🗺️  Location extraction is not yet implemented.');
  console.log('   Using existing location data from output/ directory.');
  return;
}

// Allow running this script directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  extractLocations();
}
