// Create a normalized display name for the location
export function getDisplayLocationName(location: string): string {
  // Replace underscores/hyphens with spaces, trim, and capitalize each word
  // Normalize location names with special cases for floors and directions
  return location
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      // Handle floor abbreviations
      if (/^[Bb]\d+f$/.test(word)) {
        // B1f -> Basement First Floor
        const floorNum = word.match(/\d+/)?.[0];
        return `Basement ${floorNum ? ordinalSuffix(floorNum) : ''} Floor`;
      }
      if (/^\d+f$/.test(word)) {
        // 2f -> Second Floor
        const floorNum = word.match(/\d+/)?.[0];
        return `${floorNum ? ordinalSuffix(floorNum) : ''} Floor`;
      }
      // Handle directions
      if (/^(ne|nw|se|sw|ea|we|n|s|e|w)$/i.test(word)) {
        const dirMap: Record<string, string> = {
          n: 'North',
          s: 'South',
          e: 'East',
          w: 'West',
          ne: 'North East',
          nw: 'North West',
          se: 'South East',
          sw: 'South West',
          ea: 'East',
          we: 'West',
        };
        return dirMap[word.toLowerCase()] || word.toUpperCase();
      }
      // Capitalize normal words, keep 2-letter abbreviations uppercase
      if (word.length === 2 && /^[a-z]{2}$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  // Helper for ordinal suffixes (1 -> First, 2 -> Second, etc.)
  function ordinalSuffix(numStr: string) {
    const num = parseInt(numStr, 10);
    switch (num) {
      case 1:
        return 'First';
      case 2:
        return 'Second';
      case 3:
        return 'Third';
      case 4:
        return 'Fourth';
      case 5:
        return 'Fifth';
      default:
        return `${num}th`;
    }
  }
}
