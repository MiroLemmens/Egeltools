const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
let capacity = 2000, enabled = 'on', reserveNow = { wood: 15000 };
let farms, relations;
const setFarms = (entries) => {
  farms = new Map(entries.map(([id, give, receive]) => [id, { island_x: 1, island_y: 2, resource_demand: give, resource_offer: receive }]));
  relations = new Map(entries.map(([id, , , ratio]) => [id, { id: Number(id) * 10, relation_status: 1, trade_ratio: ratio }]));
};
const context = vm.createContext({
 localStorage: { getItem: () => enabled }, isCaptainActive: () => true,
 getIslandUtilityModelContext: () => ({ farmTownById: farms, relationByFarmTownId: relations }),
 resourceTradesInFlight: new Set(), RESOURCE_CHECKER: { resources: ['wood','stone','iron'] },
 ISLAND_UTILITIES: { minimumTradeAmount: 100, maximumTradeAmount: 3000 },
 getTownAvailableTradeCapacity: () => capacity, getTownStorageCapacity: () => 30000,
 getFirstMethodValue: (model, methods, attrs) => model[attrs[0]],
 combineCelebrationForecasts: () => ({ reserveNow }),
});
vm.runInContext(source.slice(source.indexOf('  const partyFarmTradesPending'), source.indexOf('  function makePartyFarmTradeList')), context);
// Values built inside the vm context carry its prototypes.
const plain = (value) => JSON.parse(JSON.stringify(value));
const town = { id: 1, islandX: 1, islandY: 2, resources: { wood: 18000, stone: 10000, iron: 15000 }, deficits: { stone: 5000 } };
setFarms([['5', 'wood', 'stone', 1.25]]);
assert.equal(context.buildPartyFarmTrades(town, {})[0].amount, 2000);
capacity = 6000;
assert.equal(context.buildPartyFarmTrades(town, {})[0].amount, 3000);
assert.equal(context.buildPartyFarmTrades(town, {})[0].received, 3750);
for (const ratio of [0.8, 0.81, 1]) {
  relations.get('5').trade_ratio = ratio;
  assert.equal(context.buildPartyFarmTrades(town, {}).length, 0, `ratio ${ratio} is not a positive exchange`);
}
relations.get('5').trade_ratio = 1.25;
town.resources.wood = 15099;
assert.equal(context.buildPartyFarmTrades(town, {}).length, 0);
town.resources.wood = 18000; capacity = 99;
assert.equal(context.buildPartyFarmTrades(town, {}).length, 0);
capacity = 2000; farms.get('5').island_x = 3;
assert.equal(context.buildPartyFarmTrades(town, {}).length, 0);
farms.get('5').island_x = 1; enabled = 'off';
assert.equal(context.buildPartyFarmTrades(town, {}).length, 0);
enabled = 'on';

// The best farm village for an exchange goes first; a second one only tops up
// the remainder after a full 3,000 trade.
setFarms([['5', 'wood', 'stone', 1.25], ['6', 'wood', 'stone', 1.5]]);
capacity = 10000; town.resources.wood = 30000;
let trades = context.buildPartyFarmTrades(town, {});
assert.deepEqual(plain(trades.map((trade) => [trade.farmId, trade.amount, trade.received])), [['6', 3000, 4500], ['5', 400, 500]]);
town.deficits = { stone: 3000 };
trades = context.buildPartyFarmTrades(town, {});
assert.deepEqual(plain(trades.map((trade) => [trade.farmId, trade.amount, trade.received])), [['6', 2000, 3000]]);

// A protected resource cannot be traded directly, so two positive exchanges
// are chained: wood -> stone -> iron for exactly the missing iron.
setFarms([['7', 'wood', 'stone', 1.25], ['8', 'stone', 'iron', 1.25]]);
reserveNow = { wood: 15000, stone: 10000, iron: 15000 };
town.deficits = { iron: 2000 };
trades = context.buildPartyFarmTrades(town, {});
assert.equal(trades.length, 1);
assert.deepEqual(plain(trades[0].steps.map((step) => [step.farmId, step.give, step.amount, step.receive, step.received])), [
  ['7', 'wood', 1280, 'stone', 1600],
  ['8', 'stone', 1600, 'iron', 2000],
]);
assert.equal(trades[0].receive, 'iron');
assert.equal(trades[0].received, 2000);
// The second step spends current stock, so it never sends more than the town holds.
town.resources.stone = 500;
assert.equal(context.buildPartyFarmTrades(town, {})[0].steps[1].amount, 500);
town.resources.stone = 0;
assert.equal(context.buildPartyFarmTrades(town, {}).length, 0);
town.resources.stone = 10000;
// A chain needs merchants for both steps.
capacity = 199;
assert.equal(context.buildPartyFarmTrades(town, {}).length, 0);
capacity = 10000;
// A negative exchange never joins a chain.
relations.get('7').trade_ratio = 0.9;
assert.equal(context.buildPartyFarmTrades(town, {}).length, 0);
relations.get('7').trade_ratio = 1.25;

const planned = context.buildPartyFarmTrades(town, {})[0];
assert.equal(context.isSamePartyFarmTrade(planned, context.buildPartyFarmTrades(town, {})[0]), true);
town.deficits = { iron: 1000 };
assert.equal(context.isSamePartyFarmTrade(planned, context.buildPartyFarmTrades(town, {})[0]), false, 'smaller chains need a refresh');
console.log('Farm village positive ratio, top-up, chain, reserve, capacity, island and toggle checks passed');
