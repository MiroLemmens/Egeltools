const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const extract = (from, to) => source.slice(source.indexOf(`  function ${from}(`), source.indexOf(`  function ${to}(`));
const costs = { party: { wood: 15000, stone: 18000, iron: 15000 }, theater: { wood: 10000, stone: 12000, iron: 10000 } };
const zero = { wood: 0, stone: 0, iron: 0 };
const context = vm.createContext({
  partyFarmTradesPending: new Set(),
  localStorage: { getItem: () => null },
  CELEBRATION_COSTS: costs,
  CELEBRATION_FINDER: { partyStorageRequired: 18000, theaterStorageRequired: 12000, academyPartyLevel: 30 },
  RESOURCE_CHECKER: { resources: Object.keys(zero), loyaltyClaimInterval: 780, partyWindowSeconds: 5400 },
  getTownStorageCapacity: town => town.storage,
  getModelAttributes: town => town,
  getActiveCityPartyEndTimes: type => new Map(type === 'theater' ? [['running', { endAt: 1600 }]] : []),
  getLoyaltyClaimIncomePerTown: () => new Map(),
  getIncomingTradeResourcesByTown: () => ({ incomingByTown: new Map(), pendingOutgoingTownIds: new Set() }),
  getResourceCheckerServerTime: () => 1000,
  getTownProductionPerHour: () => zero,
});
vm.runInContext(extract('canTownHostCityParty', 'getMissingCelebrationResources'), context);
vm.runInContext(extract('addCelebrationForecasts', 'getResourceCheckerData'), context);
const model = { storage: 12000, buildings: () => ({ academy: 30, theater: 1 }) };
assert.equal(context.canTownHostCityParty(model, 'theater'), true);
assert.equal(context.canTownHostCityParty(model), false);
assert.equal(context.canTownHostCityParty({ ...model, storage: 11999 }, 'theater'), false);
assert.equal(context.canTownHostCityParty({ ...model, buildings: () => ({ academy: 29, theater: 1 }) }, 'theater'), false);
assert.equal(context.canTownHostCityParty({ ...model, buildings: () => ({ academy: 30, theater: 0 }) }, 'theater'), false);
const theater = { id: 'idle', model, theaterCapable: true, partyCapable: false, resources: { ...zero } };
const both = { ...theater, id: 'both', partyCapable: true, model: { ...model, storage: 30000 }, resources: { ...costs.party } };
const running = { ...theater, id: 'running' };
context.addCityPartyForecasts([theater, both, running]);
assert.equal(theater.partyForecast.type, 'theater');
assert.equal(theater.partyForecast.shortfall.stone, 12000);
assert.equal(running.partyForecast.active, true);
assert.equal(running.partyForecast.secondsRemaining, 600);
assert.equal(both.partyForecast.shortfall.stone, 12000, 'Stock for one celebration cannot also fund the other');
assert.equal(both.partyForecast.reserveNow.stone, 30000, 'Donors protect both celebrations');
const later = { ...running.partyForecast, futureIncome: { wood: 6000, stone: 6000, iron: 6000 } };
const combined = context.combineCelebrationForecasts(both, [both.celebrationForecasts[0], later]);
assert.equal(combined.shortfall.stone, 6000, 'Use production once across successive deadlines');
const near = { ...theater, id: 'near', name: 'Z' };
const far = { ...theater, id: 'far', name: 'A' };
running.name = 'Running';
const plans = new Map([['near', { donors: [{ distance: 2 }] }], ['far', { donors: [{ distance: 20 }] }], ['running', { donors: [{ distance: 1 }] }]]);
assert.deepEqual([running, far, near].sort((a, b) => context.compareResourceTradeTargets(a, b, plans)).map(t => t.id), ['near', 'far', 'running']);
console.log('Party trades theater and priority checks passed');

context.localStorage.getItem = () => 'on';
context.addCityPartyForecasts([theater, both, running]);
assert.equal(theater.partyForecast, null);
assert.equal(running.partyForecast, null);
assert.equal(both.partyForecast.reserveNow.stone, 18000);
assert.equal(both.partyForecast.shortfall.stone, undefined);
