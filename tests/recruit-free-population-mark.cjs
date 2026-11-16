const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const store = new Map();
const context = vm.createContext({
  RECRUIT_TOTAL_CACHE_KEY: 'cache',
  localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
  scheduleRecruitCacheDriveUpload: () => {},
  invalidateRecruitRenderContext: () => {},
});
vm.runInContext(source.slice(source.indexOf('  function readRecruitTotalCache'), source.indexOf('  let recruitCacheDriveUploadTimer')), context);
vm.runInContext(source.slice(source.indexOf('  function writeRecruitTotalCache'), source.indexOf('  let recruitCacheRefreshArmed')), context);
vm.runInContext(source.slice(source.indexOf('  function reconcileRecruitCacheWithOverview'), source.indexOf('  function cachedFinalTotal')), context);

const cacheTown = { name: 'A', freePopulation: 100, trained: { sword: 50 }, queued: {}, totals: { sword: 50 } };
store.set('cache', JSON.stringify({ towns: { 1: cacheTown } }));
const overview = buildable => ({ json: { data: { towns: [{ id: 1, name: 'A', buildable_units: buildable, units: [{ id: 'sword', total: 30 }], orders: {} }] } } });
const read = () => JSON.parse(store.get('cache'));

// Lower free population marks the town and keeps the cached totals and free population.
let result = context.reconcileRecruitCacheWithOverview(overview(80));
assert.equal(result.marksChanged, true);
assert.equal(read().towns[1].totals.sword, 50);
assert.equal(read().towns[1].freePopulation, 100);
assert.deepEqual({ ...read().freePopulationMarks[1], markedAt: 0 }, { cachedFreePopulation: 100, serverFreePopulation: 80, markedAt: 0 });

// The same snapshot again changes nothing.
assert.equal(context.reconcileRecruitCacheWithOverview(overview(80)).marksChanged, false);

// Equal or higher free population clears the mark without touching the totals.
result = context.reconcileRecruitCacheWithOverview(overview(100));
assert.equal(result.marksChanged, true);
assert.equal(read().freePopulationMarks[1], undefined);
assert.equal(read().towns[1].totals.sword, 50);
context.reconcileRecruitCacheWithOverview(overview(120));
assert.equal(read().freePopulationMarks[1], undefined);
assert.equal(read().towns[1].freePopulation, 100);
console.log('Recruit overview free population mark checks passed');
