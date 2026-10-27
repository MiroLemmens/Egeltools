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
function element() {
  return { style: {}, children: [], handlers: {}, textContent: '',
    setAttribute() {}, addEventListener(type, fn) { this.handlers[type] = fn; },
    append(...children) { children.forEach(child => { child.parent = this; this.children.push(child); }); },
    contains(child) { return this.children.includes(child); },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); },
  };
}
const body = element();
const context = vm.createContext({
  Map, Set, console,
  notifications: new Map(),
  notify: notice => context.notifications.set(notice.key, notice),
  removeNotification: key => context.notifications.delete(key),
  getCurrentTownId: () => selected,
  TRADE_CAPACITY_MARKER: { resources: new Set(['wood', 'stone', 'iron']), maximumOverfillForAfterMarker: 2000 },
  RESOURCE_NAMES: { wood: 'Wood', stone: 'Stone', iron: 'Iron' },
  getResourceCheckerServerTime: () => now,
  findTown: id => towns[id],
  getTownResources: town => town.stock,
  getTownStorageCapacity: () => 10000,
  getFirstMethodValue: town => town.name,
  switchToCelebrationTown: id => { selected = id; return true; },
  document: { body, createElement: element, getElementById: id => body.children.find(child => child.id === id) },
});
vm.runInContext(source.slice(start, end), context);
const readLiveArrivals = context.getTradeCapacityArrivals;
context.getTradeCapacityArrivals = () => arrivals;
let opened = 0;
context.setTradeOverviewOpen = () => { opened++; };
context.renderTradeOverview = () => {};
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
assert.equal(opened, 0, 'Alarms do not force the detailed tracker open');
assert.equal(context.notifications.size, 1, 'Warehouse alert uses the shared inbox');
assert.equal(context.notifications.get('warehouse:1').message, 'Warehouse reached the red line.');
assert.equal(body.children.length, 0, 'No separate notification window is created');
assert.equal(vm.runInContext('tradeCapacityNotices.has("1")', context), true);
context.selectTradeCapacityTown('1');
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
const alarmRows = context.getTradeOverviewRows(arrivals, now);
assert.equal(alarmRows.length, 2, 'Keep all alarms in the tracker, even after the final shipment');
assert.equal(alarmRows.find(row => row.townId === '2').count, 0);
assert.equal(alarmRows.find(row => row.townId === '2').nextArrivalAt, null);
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
towns[1].stock.wood = 9999; now = 512; tick();
assert.equal(vm.runInContext('tradeCapacityNotices.has("1")', context), false, 'Spending resources clears the alarm without a reload');
now = 600; towns[1].stock.wood = 9000;
arrivals = new Map([['g', trade('g', 610, 1000)]]);
tick();
now = 610; arrivals.clear(); tick();
now = 625; tick();
assert.equal(vm.runInContext('tradeCapacityNotices.has("1")', context), false, 'Alarm for a town that never filled expires');
const units = {
  slinger: { name: 'Slinger', resources: { wood: 55, stone: 100, iron: 40 } },
  sword: { name: 'Swordsman', resources: { wood: 95, stone: 0, iron: 85 } },
};
assert.equal(context.getTradeRatioUnits({ wood: 5500, stone: 10000, iron: 4000 }, units)[0].id, 'slinger');
assert.equal(context.getTradeRatioUnits({ wood: 282, stone: 513, iron: 205 }, units)[0].id, 'slinger', 'Allow rounded trade loads');
assert.equal(context.getTradeRatioUnits({ wood: 950, stone: 0, iron: 850 }, units)[0].id, 'sword');
assert.equal(context.getTradeRatioUnits({ wood: 950, stone: 10, iron: 850 }, units).length, 0, 'Do not match a zero-cost resource carrying a shipment');
assert.equal(context.getTradeRatioUnits({ wood: 1000, stone: 1000, iron: 1000 }, units).length, 0, 'Unknown ratios stay custom');
assert.equal(context.getTradeRatioUnits({ wood: 0, stone: 0, iron: 0 }, units).length, 0);
vm.runInContext("tradeCapacityNotices.clear()", context);
const overview = context.getTradeOverviewRows(new Map([
  ['a', trade('a', 410, 1000)], ['b', trade('b', 405, 2000)],
  ['c', trade('c', 403, 500, '2')], ['past', trade('past', 399, 1000)],
]), 400);
assert.equal(overview.length, 2);
assert.equal(overview[0].townId, '2', 'Soonest arrival sorts first');
assert.equal(overview[1].nextArrivalAt, 405);
assert.equal(overview[1].count, 2);
assert.equal(overview[1].total, 3000);
assert.equal(overview[1].incoming.wood, 3000);
assert.equal(context.formatTradeArrivalTime(406, 400), '0:00:06');
assert.equal(context.formatTradeArrivalTime(null, 400), 'No incoming trades');
console.log('Trade overview and selection checks passed');

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
context.getFirstMethodValue = town => town.name;
const liveRows = context.getTradeOverviewRows(liveArrivals, 400);
assert.equal(liveRows[0].count, 14);
assert.equal(liveRows[0].total, 157500);
console.log('Live Grepolis incoming-trade regression passed');
