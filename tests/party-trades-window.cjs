const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const start = source.indexOf('  function getResourceCheckerWindowMinutes(');
const end = source.indexOf('  function getResourceTownDistance(', start);
const storage = new Map();
const models = [
  { id: 'idle', active: false, secondsRemaining: 0 },
  { id: 'soon', active: true, secondsRemaining: 30 * 60 },
  { id: 'boundary', active: true, secondsRemaining: 90 * 60 },
  { id: 'later', active: true, secondsRemaining: 120 * 60 },
];
const context = vm.createContext({
  partyFarmTradesPending: new Set(),
  RESOURCE_CHECKER: { partyWindowMinutesKey: 'window', partyWindowSeconds: 5400 },
  localStorage: { getItem: key => storage.get(key) ?? null },
  isAdministratorActive: () => true,
  window: { ITowns: { getTowns: () => models } },
  getModelArray: models => models,
  getResourceCheckerMinimums: () => ({ wood: 15000 }),
  getFirstMethodValue: (town, methods, props) => town[props[0]] ?? town.id,
  getTownResources: () => ({ wood: 0 }),
  getTownIslandCoordinates: () => ({ x: 1, y: 1 }),
  canTownHostCityParty: () => true,
  getTownMapPosition: () => ({ x: 1, y: 1 }),
  addCityPartyForecasts: towns => towns.forEach(town => {
    town.celebrationForecasts = [{ ...town.model, endAt: 10000, shortfall: { wood: 15000 } }];
  }),
  combineCelebrationForecasts: (town, forecasts) => forecasts[0] ?? null,
});
vm.runInContext(source.slice(start, end), context);
const minutes = () => context.getResourceCheckerWindowMinutes();
const ids = () => Array.from(context.getResourceCheckerData().shortages, town => town.id);
assert.equal(minutes(), 90, 'Use 90 minutes without a saved preference');
assert.deepEqual(ids(), ['idle', 'soon', 'boundary'], 'Include the default cutoff boundary');
storage.set('window', '30');
assert.equal(minutes(), 30);
assert.deepEqual(ids(), ['idle', 'soon'], 'A smaller window excludes later celebrations');
storage.set('window', '120');
assert.deepEqual(ids(), ['idle', 'soon', 'boundary', 'later'], 'A larger window includes later celebrations');
for (const invalid of ['', '0', '-1', '1.5', 'invalid', 'Infinity', '9007199254740991']) {
  storage.set('window', invalid);
  assert.equal(minutes(), 90, `Invalid preference ${invalid} falls back to 90`);
}
console.log('Party trades configurable time-window checks passed');
