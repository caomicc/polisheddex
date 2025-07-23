function normalizeLocationKey(input) {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/(\w)1(\s+f|\s*$)/i, '$1_1f')
    .replace(/\s*b\s*1\s*f?\s*$/i, '_b1f')
    .replace(/\s*b\s*2\s*f?\s*$/i, '_b2f')
    .replace(/\s*1\s*f?\s*$/i, '_1f')
    .replace(/\s*2\s*f?\s*$/i, '_2f')
    .replace(/[\s\-\.]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const testCases = [
  'Burned Tower',
  'Burned Tower B1 F',
  'Burned Tower B1f',
  'Burned Tower1 F',
  'Burned Tower 1f',
];

console.log('Normalization results:');
testCases.forEach((test) => {
  console.log(JSON.stringify(test) + ' -> ' + JSON.stringify(normalizeLocationKey(test)));
});
