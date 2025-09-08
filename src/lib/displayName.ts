//This function converts keys for in-game data to a
//display-friendly format by removing underscores, dashes, apostrophes, and periods.

const displayName = (str: string) => {
  // Handle floor suffixes like B1F, B2F, 1F, 2F, etc.
  return str
    .replace(/^Route(\d)/g, 'Route $1')
    .replace(/([a-zA-Z])Gate$/g, '$1 Gate')
    .replace(/F(North|South)$/g, 'F $1')
    .replace(/([a-zA-Z])([B]?\d+F)$/g, '$1 $2')
    .replace(/(\d)(?!F(?![a-zA-Z])|$)([a-zA-Z])/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ');
};

export default displayName;
