const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
let ratio = 1, capacity = 2000, enabled = 'on';
const farm = { island_x: 1, island_y: 2, resource_demand: 'wood', resource_offer: 'stone' };
const relation = { id: 10, relation_status: 1 };
const context = vm.createContext({
 localStorage: { getItem: () => enabled }, isCaptainActive: () => true,
 getIslandUtilityModelContext: () => ({ farmTownById: new Map([['5', farm]]), relationByFarmTownId: new Map([['5', relation]]) }),
 resourceTradesInFlight: new Set(), RESOURCE_CHECKER: { resources: ['wood','stone','iron'] },
 ISLAND_UTILITIES: { minimumTradeAmount: 100, maximumTradeAmount: 3000 },
 getTownAvailableTradeCapacity: () => capacity, getTownStorageCapacity: () => 30000,
 getFirstMethodValue: (model, methods, attrs) => attrs[0] === 'trade_ratio' ? ratio : model[attrs[0]],
 combineCelebrationForecasts: () => ({ reserveNow: { wood: 15000 } }),
});
vm.runInContext(source.slice(source.indexOf('  const partyFarmTradesPending'), source.indexOf('  function makePartyFarmTradeList')), context);
const town = { id: 1, islandX: 1, islandY: 2, resources: { wood: 18000, stone: 10000, iron: 15000 }, deficits: { stone: 5000 } };
assert.equal(context.buildPartyFarmTrades(town, {})[0].amount, 2000);
capacity = 6000;
assert.equal(context.buildPartyFarmTrades(town, {})[0].amount, 3000);
ratio = 0.8;
assert.equal(context.buildPartyFarmTrades(town, {}).length, 0);
ratio = 0.81;
assert.equal(context.buildPartyFarmTrades(town, {})[0].received, 2430);
town.resources.wood = 15099;
assert.equal(context.buildPartyFarmTrades(town, {}).length, 0);
town.resources.wood = 18000; capacity = 99;
assert.equal(context.buildPartyFarmTrades(town, {}).length, 0);
capacity = 2000; farm.island_x = 3;
assert.equal(context.buildPartyFarmTrades(town, {}).length, 0);
farm.island_x = 1; enabled = 'off';
assert.equal(context.buildPartyFarmTrades(town, {}).length, 0);
console.log('Farm village ratio, reserves, capacity, island and toggle checks passed');
