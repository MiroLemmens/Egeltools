const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const storage = new Map();
const context = vm.createContext({
  RESOURCE_CHECKER: { resources: ['wood', 'stone', 'iron'], donorFloorKey: 'floor', donorFloor: 5000 },
  localStorage: { getItem: key => storage.get(key) ?? null },
});
vm.runInContext(source.slice(
  source.indexOf('  function getResourceCheckerDonorFloor('),
  source.indexOf('  function makeResourceIcon('),
), context);
assert.equal(context.getResourceCheckerDonorFloor(), 5000, 'Keep 5,000 of each resource without a saved preference');
assert.deepEqual({ ...context.getResourceCheckerMinimums() }, { wood: 5000, stone: 5000, iron: 5000 });
storage.set('floor', '0');
assert.equal(context.getResourceCheckerDonorFloor(), 0, 'Zero lets source towns spend everything beyond their celebration reserves');
storage.set('floor', '12000');
assert.deepEqual({ ...context.getResourceCheckerMinimums() }, { wood: 12000, stone: 12000, iron: 12000 });
for (const invalid of ['', ' ', '-1', '1.5', 'invalid', 'Infinity', '9007199254740992']) {
  storage.set('floor', invalid);
  assert.equal(context.getResourceCheckerDonorFloor(), 5000, `Invalid preference ${JSON.stringify(invalid)} falls back to 5,000`);
}
console.log('Party trades source floor checks passed');
