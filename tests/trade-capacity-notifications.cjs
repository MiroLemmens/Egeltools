const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const start = source.indexOf('  function getTradeCapacityBoundary(');
const end = source.indexOf('  function getBdLevelCheckData(', start);
let now = 100;
let arrivals = new Map();
let sounds = 0;
let selected;
const towns = { 1: { name: 'Alpha', stock: { wood: 9000, stone: 0, iron: 0 } }, 2: { name: 'Beta', stock: { wood: 9000, stone: 0, iron: 0 } } };
const context = vm.createContext({
  Map, Set, console,
  updateNotificationResources: () => {},
  notifications: new Map(),
  notify: notice => context.notifications.set(notice.key, notice),
  removeNotification: key => context.notifications.delete(key),
  getCurrentTownId: () => selected,
  TRADE_CAPACITY_MARKER: { resources: new Set(['wood', 'stone', 'iron']), maximumOverfillForAfterMarker: 2000 },
  getResourceCheckerServerTime: () => now,
  findTown: id => towns[id],
  getTownResources: town => town.stock,
  getTownStorageCapacity: () => 10000,
  getFirstMethodValue: town => town.name,
  switchToCelebrationTown: id => { selected = id; return true; },
});
vm.runInContext(source.slice(start, end), context);
const readLiveArrivals = context.getTradeCapacityArrivals;
context.getTradeCapacityArrivals = () => arrivals;
context.playTradeCapacitySound = () => { sounds++; };
const trade = (id, arrivalAt, wood, townId = '1') => ({ id, townId, arrivalAt, resources: { wood, stone: 0, iron: 0 } });
const tick = () => vm.runInContext('checkTradeCapacityArrivals()', context);
const boundary = (trades, stock = towns[1].stock) => context.getTradeCapacityBoundary(stock, 10000, trades);
assert.equal(boundary([trade('a', 110, 3000)]).position, 'after', 'Exactly 2000 overflow stays after');
assert.equal(boundary([trade('a', 110, 3001)]).completedTrade, null, 'Before first trade has no completed predecessor');
assert.equal(boundary([trade('a', 110, 500), trade('b', 130, 4000)]).completedTrade.id, 'a');
assert.equal(boundary([trade('a', 110, 500)]), null);
arrivals = new Map([['a', trade('a', 110, 1000)], ['b', trade('b', 130, 100)]]);
tick();
assert.equal(sounds, 0, 'No alert on initial load');
now = 110;
arrivals.delete('a');
towns[1].stock.wood = 10000;
tick();
assert.equal(sounds, 1, 'Alert when the marked shipment arrives');
assert.equal(context.notifications.size, 1, 'Warehouse alert uses the shared inbox');
assert.equal(context.notifications.get('warehouse:1').message, 'Warehouse reached the red line.');
assert.equal(context.notifications.get('warehouse:1').warehouse.stock.wood, 10000);
assert.equal(context.notifications.get('warehouse:1').warehouse.incoming.wood, 100);
assert.equal(context.notifications.get('warehouse:1').warehouse.resource, 'wood');
assert.equal(vm.runInContext('tradeCapacityNotices.has("1")', context), true);
context.notifications.get('warehouse:1').action();
assert.equal(selected, '1');
assert.equal(sounds, 2, 'Selecting the alerted town plays the alarm');
now = 111;
tick();
assert.equal(sounds, 2, 'Repeated polling does not repeat sound');
const originalNotice = context.notifications.get('warehouse:1');
context.notifications.delete('warehouse:1');
tick();
assert.equal(context.notifications.has('warehouse:1'), false, 'An inbox entry evicted by the history limit must not resurface every tick');
context.notifications.set('warehouse:1', originalNotice);
context.notifications.get('warehouse:1').onDismiss();
assert.equal(context.notifications.size, 0, 'Inbox dismissal clears the warehouse alarm');
tick();
assert.equal(vm.runInContext('tradeCapacityNotices.size', context), 0, 'Dismissed alarms stay dismissed');
now = 200;
towns[1].stock.wood = 9000;
arrivals = new Map([['c', trade('c', 210, 500)], ['d', trade('d', 230, 4000)], ['e', trade('e', 210, 1000, '2')]]);
tick();
now = 210;
arrivals.delete('c'); arrivals.delete('e');
towns[1].stock.wood = 9500; towns[2].stock.wood = 10000;
tick();
assert.equal(sounds, 3, 'Simultaneous town alerts play one chime');
assert.equal(context.notifications.size, 2, 'Both town alerts appear in the shared inbox');
assert.equal(context.notifications.has('warehouse:2'), true, 'Keep the alarm after the final shipment');
now = 300;
towns[1].stock.wood = 9000;
arrivals = new Map([['cancel', trade('cancel', 310, 1000)]]);
tick();
now = 305; arrivals.clear(); tick();
now = 311; tick();
assert.equal(sounds, 3, 'Cancelled shipment must not alert');
arrivals = new Map([['old', trade('old', 100, 1000)]]);
tick();
assert.equal(sounds, 3, 'Historical trades must not alert');
console.log('Trade capacity notification checks passed');

selected = '2'; tick();
assert.equal(sounds, 4, 'Native town selection also alerts');
tick();
assert.equal(sounds, 4, 'Staying in the selected town does not repeat the alarm');
now = 500;
arrivals = new Map([['f', trade('f', 510, 1000)]]);
towns[1].stock.wood = 9000;
tick();
now = 510; arrivals.clear();
tick();
assert.equal(vm.runInContext('tradeCapacityNotices.has("1")', context), true, 'Alarm survives stock lagging the arrival');
towns[1].stock.wood = 10000; now = 511; tick();
assert.equal(vm.runInContext('tradeCapacityNotices.has("1")', context), true, 'Full warehouse keeps the alarm');
towns[1].stock.wood = 9999; towns[1].stock.stone = 10000; now = 512; tick();
assert.equal(vm.runInContext('tradeCapacityNotices.has("1")', context), false, 'Spending the dominant resource clears the alarm even if a smaller resource stays full');
now = 600; towns[1].stock.wood = 9000;
arrivals = new Map([['g', trade('g', 610, 1000)]]);
tick();
now = 610; arrivals.clear(); tick();
now = 625; tick();
assert.equal(vm.runInContext('tradeCapacityNotices.has("1")', context), false, 'Alarm for a town that never filled expires');
vm.runInContext('tradeCapacityNotices.clear()', context);
const atLine = (trades, townId = '1') => context.isTradeCapacityTownAtLine(townId,
  new Map(trades.map(trade => [trade.id, trade])), 700);
towns[1].stock = { wood: 9000, stone: 10000, iron: 0 };
assert.equal(atLine([trade('large', 710, 3001)]), true, 'A red line before the first delivery alerts on selection');
assert.equal(atLine([trade('later', 720, 4000), trade('first', 710, 500)]), false, 'Sort by arrival before checking which delivery reaches the line');
assert.equal(atLine([trade('past', 699, 4000)]), false, 'Past deliveries cannot trigger a selection alert');
assert.equal(atLine([trade('other-town', 710, 4000, '2')]), false, 'Other towns cannot trigger this town’s alert');
assert.equal(atLine([trade('small', 710, 100)]), false, 'A full unrelated resource does not trigger an alert');
towns[1].stock.wood = 10000;
assert.equal(atLine([trade('incoming', 710, 100)]), true, 'A full incoming resource alerts');
assert.equal(atLine([]), false, 'No alert without incoming trades or an existing notice');
assert.equal(atLine([], 'missing'), false, 'Unavailable towns do not alert');
const mixed = { id: 'mixed', townId: '1', arrivalAt: 710, resources: { wood: 5000, stone: 100, iron: 0 } };
towns[1].stock = { wood: 0, stone: 10000, iron: 0 };
assert.equal(boundary([mixed]), null, 'Ignore a full smaller incoming resource when the largest will not fill');
assert.equal(atLine([mixed]), false, 'Selection follows the same dominant-only rule');
towns[1].stock = { wood: 10000, stone: 9990, iron: 0 };
const fullDominant = boundary([mixed]);
assert.equal(fullDominant.resource, 'wood', 'Never skip an already-full dominant resource');
assert.equal(fullDominant.position, 'before');
assert.equal(fullDominant.index, 0);
assert.equal(fullDominant.completedTrade, null);
assert.equal(atLine([mixed]), true);
const summed = [
 { ...mixed, id: 'first', resources: { wood: 100, stone: 2000, iron: 0 } },
 { ...mixed, id: 'second', resources: { wood: 3000, stone: 0, iron: 0 } },
];
towns[1].stock = { wood: 9000, stone: 9500, iron: 0 };
assert.equal(boundary(summed).resource, 'wood', 'Choose by total incoming across all shipments, not the earliest overflow');
assert.equal(boundary(summed).index, 1, 'Ignore the smaller resource overflowing in an earlier shipment');
assert.equal(context.getDominantIncomingResource([]).resource, null);
console.log('Trade selection and dominant-resource checks passed');

// Reproduce the live Grepolis predicate: isReturning() is true for inbound
// deliveries to the selected town, despite its misleading name.
context.getModelAttributes = model => model.attributes;
context.getFirstMethodValue = (model, methods, keys) => {
  for (const method of methods) if (typeof model?.[method] === 'function') {
    const value = model[method](); if (value != null) return value;
  }
  for (const key of keys) if (model.attributes?.[key] != null) return model.attributes[key];
  return null;
};
context.getTradeActivityTownId = model => model.attributes.destination_town_id;
context.getTradeActivityResources = model => ({wood: model.attributes.wood, stone: model.attributes.stone, iron: model.attributes.iron});
context.normalizeResourceCheckerTimestamp = value => value || null;
const liveTrades = Array.from({length: 14}, (_, index) => ({
  attributes: {id: index + 1, destination_town_id: 1, arrival_at: 500 + index, wood: 3750, stone: 1875, iron: 5625},
  isReturning: () => true,
}));
context.getResourceTradeModels = () => [
  ...liveTrades, liveTrades[0],
  {attributes: {id: 99, destination_town_id: 1, arrival_at: 500, wood: 0, stone: 0, iron: 0}},
  {attributes: {id: 100, destination_town_id: 1, arrival_at: 500, wood: 100, stone: 0, iron: 0, returning: true}},
];
const liveArrivals = readLiveArrivals();
assert.equal(liveArrivals.size, 14, 'Count all 14 incoming deliveries, deduplicate, and ignore empty/explicit returns');
console.log('Live Grepolis incoming-trade regression passed');
