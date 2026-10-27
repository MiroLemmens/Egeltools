const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const start = source.indexOf('  function getResourceTownDistance(');
const end = source.indexOf('  function makeResourceTownLink(', start);
const context = vm.createContext({
  partyFarmTradesPending: new Set(),
  RESOURCE_CHECKER: { resources: ['wood', 'stone', 'iron'], minimumTradeAmount: 500 },
  resourceTradesInFlight: new Set(),
  getIncomingTradeResourcesByTown: () => ({ incomingByTown: new Map(), pendingOutgoingTownIds: new Set() }),
  reconcileTownTradeLocks: () => ({ locked: {} }),
  getTownStorageCapacity: () => 10000,
  getModelAttributes: (model) => model,
  window: { gpAjax: { ajaxPost() {} } },
});
vm.runInContext(source.slice(start, end), context);
const town = (id, x, wood, capacity = 10000, extra = {}) => ({
  id, name: id, position: { x, y: 0 }, resources: { wood, stone: 1000, iron: 1000 },
  model: { available_trade_capacity: capacity }, ...extra,
});
const target = town('target', 0, 0, 0, { deficits: { wood: 1800 } });
context.target = target;
context.minimums = { wood: 1000, stone: 1000, iron: 1000 };
context.towns = [target, town('far', 20, 5000), town('near', 1, 2000), town('near2', 2, 2000),
  town('locked', 0.1, 9000), town('reserved', 0.2, 9000, 10000, { partyForecast: { reserveNow: { wood: 9000 } } }),
  town('no-merchants', 0.3, 9000, 0), town('tiny', 0.4, 1499)];
let plan = vm.runInContext('buildResourceDonorPlan(target, towns, minimums)', context);
assert.deepEqual(Array.from(plan.donors, d => d.id), ['near', 'near2']);
assert.equal(Object.keys(plan.remaining).length, 0);
assert.equal(plan.donors[0].contributions.wood, 1000);
assert.equal(plan.donors[1].contributions.wood, 800);
context.towns = [target, town('partial', 1, 2000), town('complete', 1, 4000)];
plan = vm.runInContext('buildResourceDonorPlan(target, towns, minimums)', context);
assert.equal(plan.donors[0].id, 'complete', 'Equal routes prefer full coverage');
context.target = { ...target, deficits: { wood: 1200 } };
context.towns = [context.target, town('near', 1, 2000, 900), town('far', 20, 5000)];
plan = vm.runInContext('buildResourceDonorPlan(target, towns, minimums)', context);
assert.equal(plan.donors[0].contributions.wood, 700, 'Avoid a sub-500 remainder');
assert.equal(plan.donors[1].contributions.wood, 500);
for (const donor of plan.donors) {
  assert.ok(donor.total <= donor.tradeCapacity);
  assert.ok(Object.values(donor.contributions).every(amount => amount >= 500));
}
console.log('Party trades routing checks passed');

context.reservations = new Map();
context.target = { ...target, deficits: { wood: 1800 } };
context.towns = [context.target, town('donor', 1, 9000, 2500)];
const first = vm.runInContext('buildResourceDonorPlan(target, towns, minimums, reservations)', context);
const second = vm.runInContext('buildResourceDonorPlan({ ...target, id: "target2" }, towns, minimums, reservations)', context);
assert.equal(first.donors[0].total + second.donors[0].total, 2500,
  'All destinations share the merchant budget of one donor');
assert.equal(second.remaining.wood, 1100);
context.reservations = new Map();
context.towns = [context.target, town('donor', 1, 3000, 10000)];
vm.runInContext('buildResourceDonorPlan(target, towns, minimums, reservations)', context);
const exhausted = vm.runInContext('buildResourceDonorPlan({ ...target, id: "target2" }, towns, minimums, reservations)', context);
assert.equal(exhausted.donors.length, 0, 'All destinations also share the resource budget');

context.getIncomingTradeResourcesByTown = () => ({ incomingByTown: new Map([['target', { wood: 9500 }]]), pendingOutgoingTownIds: new Set() });
plan = vm.runInContext('buildResourceDonorPlan(target, towns, minimums)', context);
assert.equal(plan.donors[0].total, 500, 'Reserve warehouse room for all incoming deliveries');
assert.equal(plan.remaining.wood, 1300, 'Warehouse limits must not hide uncovered deficits');
context.getTownStorageCapacity = () => null;
assert.equal(vm.runInContext('buildResourceDonorPlan(target, towns, minimums)', context).donors.length, 0);
context.getTownStorageCapacity = () => 10000;
context.window.gpAjax = null;
assert.equal(vm.runInContext('buildResourceDonorPlan(target, towns, minimums)', context).donors.length, 0);
