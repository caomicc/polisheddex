const fs = require('fs');
const path = require('path');

// Test loading the location data
try {
  const locationsFile = path.join(process.cwd(), 'output/all_locations.json');
  const data = JSON.parse(fs.readFileSync(locationsFile, 'utf8'));
  
  console.log('🗺️ Location Data Test Results:');
  console.log(`📍 Total locations: ${Object.keys(data).length}`);
  
  // Test NPC trades
  const locationsWithTrades = Object.values(data).filter(loc => loc.npcTrades && loc.npcTrades.length > 0);
  console.log(`💱 Locations with NPC trades: ${locationsWithTrades.length}`);
  
  if (locationsWithTrades.length > 0) {
    console.log(`💱 Example trade location: ${locationsWithTrades[0].displayName}`);
    console.log(`   Trade: ${locationsWithTrades[0].npcTrades[0].traderName} wants ${locationsWithTrades[0].npcTrades[0].wantsPokemon} for ${locationsWithTrades[0].npcTrades[0].givesPokemon}`);
  }
  
  // Test events
  const locationsWithEvents = Object.values(data).filter(loc => loc.events && loc.events.length > 0);
  console.log(`⚡ Locations with events: ${locationsWithEvents.length}`);
  
  if (locationsWithEvents.length > 0) {
    const exampleLocation = locationsWithEvents[0];
    console.log(`⚡ Example event location: ${exampleLocation.displayName}`);
    console.log(`   Event: ${exampleLocation.events[0].type} - ${exampleLocation.events[0].description}`);
  }
  
  // Test connections
  const locationsWithConnections = Object.values(data).filter(loc => loc.connections && loc.connections.length > 0);
  console.log(`🔗 Locations with connections: ${locationsWithConnections.length}`);
  
  if (locationsWithConnections.length > 0) {
    const exampleLocation = locationsWithConnections[0];
    console.log(`🔗 Example connected location: ${exampleLocation.displayName}`);
    console.log(`   Connection: ${exampleLocation.connections[0].direction} to ${exampleLocation.connections[0].targetLocationDisplay}`);
  }
  
  console.log('✅ Location data test completed successfully!');
  
} catch (error) {
  console.error('❌ Error testing location data:', error);
}
