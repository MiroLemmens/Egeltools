const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('EgelTools.user.js', 'utf8');
const storage = new Map();
const town = (id, wood) => ({ getId: () => id, getName: () => `Town ${id}`, resources: { wood, stone: 0, iron: 0 } });
const context = {
  APP: { name: 'EgelTools' },
  console: { info() {}, warn() {} },
  window: { Game: { world_id: 'w1', player_id: 'p1' } },
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key) },
  TOWN_DISTANCE_SORTER: { tradeLockStoragePrefix: 'egeltools_trade_locks', tradeLockSpendRatio: 0.5 },
  getTownResources: model => model?.resources || null,
  getTownStorageCapacity: () => 10000,
};
vm.createContext(context);
for (const name of ['getModelArray', 'getFirstMethodValue', 'getTradeLockStorageKey', 'loadTownTradeLocks',
  'saveTownTradeLocks', 'reconcileTownTradeLocks']) {
  const start = source.indexOf(`  function ${name}(`);
  const end = source.indexOf('\n  function ', start + 1);
  vm.runInContext(source.slice(start, end), context);
}
const key = 'egeltools_trade_locks_w1_p1';
storage.set(key, JSON.stringify({ 1: { name: 'Town 1', peakResources: { wood: 1000, stone: 0, iron: 0 } } }));

// A locked town gaining resources must raise its saved peak instead of throwing.
let locks = context.reconcileTownTradeLocks([town(1, 3000)]);
assert.equal(locks[1].peakResources.wood, 3000);
assert.equal(locks[1].storageCapacity, 10000);
assert.equal(JSON.parse(storage.get(key))[1].peakResources.wood, 3000, 'raised peak must be saved');

// Spending more than half the warehouse from that peak releases the lock.
locks = context.reconcileTownTradeLocks([town(1, 1000)]);
assert.equal(locks[1].peakResources.wood, 3000);
locks = context.reconcileTownTradeLocks([town(1, 3000)]);
storage.set(key, JSON.stringify({ 1: { ...locks[1], peakResources: { wood: 9000, stone: 0, iron: 0 } } }));
locks = context.reconcileTownTradeLocks([town(1, 2000)]);
assert.equal(locks[1], undefined);
assert.equal(storage.has(key), false);
console.log('Town trade locks: peak growth, persistence and release passed');
