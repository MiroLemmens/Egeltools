const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const context = vm.createContext({ console, window: {} });
function load(name) {
  const start = source.indexOf(`  function ${name}(`);
  const end = source.indexOf('\n  function ', start + 1);
  vm.runInContext(source.slice(start, end), context);
}
for (const name of ['getModelArray', 'getModelAttributes', 'getFirstMethodValue',
  'getTradeActivityTownId', 'getTradeActivityResources', 'normalizeResourceCheckerTimestamp',
  'getResourceTradeModels', 'getTradeCapacityArrivals']) load(name);
context.TRADE_CAPACITY_MARKER = { resources: new Set(['wood', 'stone', 'iron']) };
context.findTown = id => [1, 2, 3].includes(Number(id));
const shipment = { attributes: { id: 42, origin_town_id: 1, destination_town_id: 2,
  arrival_at: 200, wood: 1000, stone: 500, iron: 0 } };
// Grepolis keeps other towns in TownAgnosticCollection.fragments; the public
// Trade collection and model registry expose the selected working copy.
const workingCopy = { models: [] };
const fragments = { 1: { models: [shipment] }, 2: { models: [shipment] }, 3: { models: [] } };
context.window.MM = {
  getModels: () => ({ Trade: {} }),
  getCollections: () => ({ Trade: [workingCopy] }),
  getTownAgnosticCollectionsByName: name => name === 'Trade' ? [{ fragments }] : null,
};
assert.equal(context.getTradeCapacityArrivals().size, 1,
  'Incoming shipment to town 2 remains visible while town 3 is selected');
workingCopy.models = [shipment];
assert.equal(context.getTradeCapacityArrivals().size, 1, 'Selected copy and both endpoints are deduplicated');
workingCopy.models = [];
assert.equal(context.getTradeCapacityArrivals().get('42').townId, '2', 'Switching away preserves the destination');
fragments[1].models = [];
fragments[2].models = [];
assert.equal(context.getTradeCapacityArrivals().size, 0, 'Removed or cancelled shipments do not remain cached');
delete context.window.MM.getTownAgnosticCollectionsByName;
workingCopy.models = [shipment];
assert.equal(context.getTradeCapacityArrivals().size, 1, 'Legacy collection fallback still works');
console.log('All-town incoming trade checks passed');
