// Manual mapping of mart items to locations
// This replaces the complex extraction logic with a simple, maintainable constant

export const MART_ITEMS_MAPPING: Record<string, string[]> = {
  // Johto Region
  cherrygrovecity: ['pokeball', 'potion', 'antidote', 'parlyzheal', 'awakening'],
  violetcity: ['pokeball', 'potion', 'antidote', 'parlyzheal', 'awakening', 'pokegear'],
  azaleatown: [
    'charcoal',
    'pokeball',
    'greatball',
    'potion',
    'superpotion',
    'escaperope',
    'repel',
    'flowermail',
    'portmail',
    'slowpoketail',
  ],

  // Goldenrod Department Store
  goldenroddeptstore2f: [
    'pokeball',
    'greatball',
    'luxuryball',
    'timerball',
    'quickball',
    'levelball',
    'lureball',
    'moonball',
    'friendball',
    'loveball',
    'heavyball',
    'fastball',
    'sportball',
    'parkball',
    'repeatball',
    'netball',
    'diveball',
    'nestball',
    'premierball',
    'duskball',
    'healball',
  ],
  goldenroddeptstore3f: [
    'xattack',
    'xdefend',
    'xspeed',
    'xspatk',
    'xspdef',
    'xaccuracy',
    'direhit',
    'guardspec',
  ],
  goldenroddeptstore4f: ['protein', 'iron', 'carbos', 'calcium', 'zinc', 'hpup'],
  goldenroddeptstore5f: [], // TM mart - items vary
  goldenroddeptstore6f: [], // No mart items
  goldenroddeptstoreb1f: [], // No mart items (regular items found here)
  goldenroddeptstore1f: [], // No mart items
  goldenroddeptstoreoof: [], // No mart items
  goldenroddeptstoreelevator: [], // No mart items

  goldenrodharbor: [
    'pokeball',
    'greatball',
    'potion',
    'superpotion',
    'antidote',
    'parlyzheal',
    'awakening',
    'burnheal',
    'iceheal',
    'fullheal',
  ],

  ecruteakcity: [
    'pokeball',
    'greatball',
    'potion',
    'superpotion',
    'antidote',
    'parlyzheal',
    'awakening',
    'burnheal',
    'iceheal',
  ],
  olivinecity: [
    'greatball',
    'superpotion',
    'hyperpotion',
    'antidote',
    'parlyzheal',
    'awakening',
    'burnheal',
    'iceheal',
    'fullheal',
  ],
  cianwoodcity: ['ultraball', 'hyperpotion', 'maxpotion', 'fullheal', 'revive', 'maxrevive'],
  mahoganytownmart1: ['tinymushroom', 'slowpoketail', 'greatball', 'superpotion'],
  mahoganytownmart2: ['ragecandybar'],

  // Kanto Region
  vermilioncity: [
    'pokeball',
    'greatball',
    'ultraball',
    'potion',
    'superpotion',
    'hyperpotion',
    'revive',
  ],
  lavendertown: ['greatball', 'potion', 'superpotion', 'maxrepel', 'escaperope', 'revive'],
  celadoncity2f1: ['greatball', 'hyperpotion', 'maxpotion', 'fullheal', 'revive', 'maxrevive'],
  celadoncity2f2: ['pokedoll', 'firestoen', 'thunderstone', 'waterstone', 'leafstone'],
  celadoncity3f: [], // TM mart
  celadoncity4f: [
    'xattack',
    'xdefend',
    'xspeed',
    'xspatk',
    'xspdef',
    'xaccuracy',
    'direhit',
    'guardspec',
    'protein',
    'iron',
    'carbos',
    'calcium',
    'zinc',
    'hpup',
  ],
  celadoncity5f1: ['protein', 'iron', 'carbos', 'calcium', 'zinc', 'hpup'],
  celadoncity5f2: [
    'xattack',
    'xdefend',
    'xspeed',
    'xspatk',
    'xspdef',
    'xaccuracy',
    'direhit',
    'guardspec',
  ],

  saffronCity: [
    'greatball',
    'ultraball',
    'hyperpotion',
    'maxpotion',
    'fullheal',
    'revive',
    'maxrevive',
  ],
  fuchsiacity: [
    'ultraball',
    'greatball',
    'superpotion',
    'hyperpotion',
    'maxpotion',
    'fullheal',
    'revive',
  ],
  pewetercity: ['pokeball', 'potion', 'antidote', 'burnheal', 'awakening', 'parlyzheal'],
  viridianity: ['ultraball', 'hyperpotion', 'maxpotion', 'fullheal', 'revive', 'maxrevive'],

  // Special Locations
  indigoplateua: ['ultraball', 'maxpotion', 'fullrestore', 'maxrevive', 'fullheal'],
  mtmoon: ['pokeball', 'potion', 'escaperope', 'repel'],
  undergroundwarehouse: ['energypowder', 'energyroot', 'healpowder', 'revivaherb'],
  yellowforest: ['pokeball', 'greatball', 'potion', 'superpotion', 'honey'],

  // Orange Islands
  shamoutiisland1: ['pokeball', 'greatball', 'potion', 'superpotion', 'antidote'],
  shamoutiisland1souvenir: ['ragecandybar', 'pewtercrunchies', 'olivineeclair'],
  shamoutiisland2: ['ultraball', 'hyperpotion', 'maxpotion', 'fullheal', 'revive'],

  // Battle Frontier
  battletower1: ['pokeball', 'greatball', 'ultraball', 'maxpotion', 'fullrestore'],
  battletower2: ['xattack', 'xdefend', 'xspeed', 'xspatk', 'xspdef', 'xaccuracy'],
  battletower3: ['protein', 'iron', 'carbos', 'calcium', 'zinc', 'hpup'],
  battlefactory1: ['pokeball', 'greatball', 'ultraball', 'hyperpotion', 'maxpotion'],
  battlefactory2: ['xattack', 'xdefend', 'xspeed', 'direhit', 'guardspec'],
  battlefactory3: ['protein', 'iron', 'carbos', 'calcium', 'zinc', 'hpup'],
};

// Helper function to get mart items for a location
export const getMartItems = (locationKey: string): string[] => {
  return MART_ITEMS_MAPPING[locationKey] || [];
};

// Helper function to get item count for a location (includes both mart and regular items)
export const getMartItemCount = (locationKey: string): number => {
  return getMartItems(locationKey).length;
};
