const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const extract = (name, next) => source.slice(source.indexOf(`  function ${name}(`), source.indexOf(`  function ${next}(`));
const body = { scrollTop: 35, innerHTML: '' };
const orders = { swords: { getUnitId: () => 'sword', getCount: () => 12 } };
const context = vm.createContext({
  window: { MM: { getModels: () => ({ UnitOrder: orders }) }, GameData: { units: { sword: { population: 1, name: 'Swordsman' } } } },
  document: { getElementById: () => body },
  UNIT_QUEUE: { bodyId: 'queue' },
  APP: { name: 'EgelTools' },
  console,
});
vm.runInContext('let unitQueueList = [];', context);
vm.runInContext(extract('getQueuedUnits', 'getRecruitmentUnitId'), context);
vm.runInContext(extract('refreshUnitQueue', 'makePanelDraggable'), context);
vm.runInContext(extract('renderUnitQueueWindow', 'createUnitQueueWindow'), context);
vm.runInContext('renderUnitQueueWindow()', context);
assert.ok(body.innerHTML.includes('Swordsman'), 'Existing orders must render without Party trades state');
assert.ok(!body.innerHTML.includes('No land units in the queue'));
assert.equal(body.scrollTop, 35);
delete orders.swords;
vm.runInContext('renderUnitQueueWindow()', context);
assert.ok(body.innerHTML.includes('No land units in the queue'), 'Refresh must read the current queue');
console.log('Unit queue rendering checks passed');
