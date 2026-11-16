const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');

// Towns as the Trade times list sees them: id, name, island and exact map position.
const towns = [
  { id: 101, name: 'Athens', island_x: 436, island_y: 445, x: 55818, y: 56980 },
  { id: 103, name: 'Sparta', island_x: 436, island_y: 445, x: 55821, y: 56984 },
  { id: 102, name: 'Thèbes', island_x: 437, island_y: 445, x: 55936, y: 56980 },
  // Impossible in Grepolis, but a different town on the same spot still needs a merchant.
  { id: 104, name: 'Twin', island_x: 436, island_y: 445, x: 55818, y: 56980 },
];
const attribute = (object, names) => names.map((name) => object?.[name]).find((value) => value != null) ?? null;
const context = vm.createContext({
  window: { Game: { game_speed: 2 }, ITowns: { getTowns: () => towns } },
  localStorage: { getItem: () => null },
  isCaptainActive: () => false,
  isAdministratorActive: () => true,
  getModelArray: (value) => value,
  reconcileTownTradeLocks: () => ({}),
  getFirstMethodValue: (town, methods, attributes) => attribute(town, attributes),
  getTownCoordinateSources: (town) => [town],
  getTownCoordinateValue: (sources, methods, attributes) => Number(attribute(sources[0], attributes) ?? Number.NaN),
  getTownMapPosition: (town) => (town ? { x: town.x, y: town.y } : null),
  getTownMarketplaceLevel: () => 20,
  getTownDistanceCapacityLimit: () => 0,
  getTownAvailableTradeCapacity: () => null,
  findTown: (id) => towns.find((town) => town.id === id),
});
for (const name of ['getTradeWorldSpeed', 'calculateTownTradeDuration', 'getTownDistanceSorterData']) {
  const start = source.indexOf(`  function ${name}(`);
  const end = source.indexOf('\n  function ', start + 1);
  vm.runInContext(source.slice(start, end), context);
}

const result = context.getTownDistanceSorterData(101);
assert.equal(result.referenceName, 'Athens');
assert.deepEqual(result.distances.map((town) => town.id), [101, 104, 103, 102]);
const [athens, twin, sparta, thebes] = result.distances;
// The town the times are measured from stays listed to anchor the keyboard
// navigation; no trade travels to it, so it shows no merchant setup time.
assert.equal(athens.isReference, true);
assert.equal(athens.tradeDuration, 0);
// Any other town, even on the same spot, needs the merchant setup: 112.5 s / speed 2.
assert.equal(twin.isReference, false);
assert.equal(twin.tradeDuration, 56);
// Sparta is 5.0 away on the same island: (112.5 + 5 * 50 / 60) / 2 = 58.3 s.
assert.equal(sparta.tradeDuration, 58);
// Thèbes is 118.0 away on the next island: (112.5 + 118 * 50 / 60) / 2 = 105.4 s.
assert.equal(thebes.sameIsland, false);
assert.equal(thebes.tradeDuration, 105);

// Without a known world speed the reference row still reads zero while the others are unavailable.
context.window.Game.game_speed = undefined;
const unknownSpeed = context.getTownDistanceSorterData(101);
assert.equal(unknownSpeed.distances[0].tradeDuration, 0);
assert.equal(unknownSpeed.distances[1].tradeDuration, null);
console.log('Trade times: the town the times are measured from shows no merchant setup time');
