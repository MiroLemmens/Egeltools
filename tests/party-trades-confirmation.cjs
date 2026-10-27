const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const button = (donor, target, status) => ({
  dataset: { tradeDonorId: donor, tradeTargetId: target, tradeStatus: status },
  disabled: false, textContent: 'Trade', setAttribute() {},
});
const buttons = [button('2', '1'), button('2', '3'), button('4', '1'), button('5', '6'), button('2', '7', 'Sent')];
buttons[4].disabled = true;
let pending = new Set();
let models = [];
const context = vm.createContext({
  partyFarmTradesPending: new Set(),
  resourceTradeConfirmations: new Map(), resourceTradesInFlight: new Set(['1:2']),
  resourceCheckerOpen: true, isAdministratorActive: () => true,
  RESOURCE_CHECKER: { panelId: 'trades' },
  document: { querySelectorAll: () => buttons },
  getIncomingTradeResourcesByTown: () => ({ pendingOutgoingTownIds: pending }),
  getResourceTradeModels: () => models,
  getFirstMethodValue: trade => trade.id,
  getTradeActivityTownId: (trade, incoming) => incoming ? trade.target : trade.donor,
  getTradeActivityResources: trade => trade.resources,
  resourceTradeAmountsMatch: (a, b) => ['wood', 'stone', 'iron'].every(key => (a[key] || 0) === (b[key] || 0)),
});
vm.runInContext(source.slice(source.indexOf('  function reconcileResourceTradeConfirmations('), source.indexOf('  async function sendResourceTrade(')), context);
context.updateResourceTradeButtons();
assert.deepEqual(buttons.map(b => b.disabled), [true, true, true, false, true]);
context.resourceTradesInFlight.clear();
pending = new Set(['2']);
context.updateResourceTradeButtons();
assert.deepEqual(buttons.map(b => b.disabled), [true, true, false, false, true]);
pending.clear();
context.updateResourceTradeButtons();
assert.deepEqual(buttons.map(b => b.disabled), [false, false, false, false, true]);
assert.equal(buttons[0].textContent, 'Trade', 'Ready buttons unlock without rebuilding the snapshot');
let confirmed = 0;
context.resourceTradeConfirmations.set('1:2', {
  donor: { id: 2, contributions: { wood: 500 } }, targetTown: { id: 1 }, knownTradeIds: new Set(['old']),
  confirm: response => { confirmed++; assert.equal(response.trade_id, 'new'); context.resourceTradeConfirmations.delete('1:2'); },
});
models = [{ id: 'old', donor: 2, target: 1, resources: { wood: 500 } },
  { id: 'wrong-source', donor: 3, target: 1, resources: { wood: 500 } },
  { id: 'wrong-target', donor: 2, target: 3, resources: { wood: 500 } },
  { id: 'wrong-amount', donor: 2, target: 1, resources: { wood: 600 } }];
context.reconcileResourceTradeConfirmations();
assert.equal(confirmed, 0, 'Old or unrelated deliveries cannot confirm a request');
models.push({ id: 'new', donor: 2, target: 1, resources: { wood: 500 } });
context.reconcileResourceTradeConfirmations();
context.reconcileResourceTradeConfirmations();
assert.equal(confirmed, 1, 'A new matching model confirms a lost callback exactly once');
console.log('Party trades confirmation and automatic button recovery checks passed');
