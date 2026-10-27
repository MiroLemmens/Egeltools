const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const extract = (name, next) => source.slice(source.indexOf(`  ${name}`), source.indexOf(`  ${next}`, source.indexOf(`  ${name}`)));
let reads = 0;
const body = { scrollTop: 0, scrollHeight: 0, clientHeight: 0, replaceChildren() {}, append() {} };
const panel = { dataset: {}, querySelector: () => body };
const context = vm.createContext({
  partyFarmTradesPending: new Set(),
  localStorage: { getItem: () => null },
  isAdministratorActive: () => true,
  createResourceCheckerPanel: () => panel,
  createResourceCheckerButton: () => ({ setAttribute() {} }),
  RESOURCE_CHECKER: { resources: ['wood', 'stone', 'iron'], minimumTradeAmount: 500 },
  resourceCheckerOpen: true,
  document: { createElement: () => ({}) },
  getResourceCheckerWindowMinutes: () => 90,
  getResourceCheckerData: () => { reads++; return { shortages: [], towns: [], minimums: {} }; },
  clampResourceCheckerPanel() {},
});
vm.runInContext(extract('function renderResourceChecker(', 'function setResourceCheckerOpen('), context);
vm.runInContext('renderResourceChecker(); renderResourceChecker();', context);
assert.equal(reads, 1, 'Background renders must preserve the snapshot');
vm.runInContext('resourceCheckerOpen = false; renderResourceChecker(); resourceCheckerOpen = true; renderResourceChecker();', context);
assert.equal(reads, 1, 'Reopening must preserve the snapshot');
vm.runInContext('renderResourceChecker(true)', context);
assert.equal(reads, 2, 'Explicit refresh must read current data');
vm.runInContext(extract('function setResourceCheckerOpen(', 'function initResourceChecker('), context);
context.createResourceCheckerButton = () => ({ setAttribute() {} });
vm.runInContext('setResourceCheckerOpen(true)', context);
assert.equal(reads, 3, 'Opening must calculate a fresh plan');
let posts = 0;
let sent;
let callback;
let remembered = 0;
let capacity = 1000;
let timeout;
let failure;
const button = { disabled: false, dataset: { tradeAmounts: '{"wood":500}' }, setAttribute() {} };
Object.assign(context, {
  document: { querySelector: () => button },
  resourceTradesInFlight: new Set(),
  resourceTradeConfirmations: new Map(),
  reconcileResourceTradeConfirmations() {},
  updateResourceTradeButtons() {},
  getResourceCheckerData: () => { throw new Error('Must not recalculate on send'); },
  buildResourceDonorPlan: () => { throw new Error('Must not rebuild on send'); },
  getTownAvailableTradeCapacity: () => capacity,
  getTownResources: () => ({ wood: 1000, stone: 1000, iron: 1000 }),
  getTownStorageCapacity: () => 10000,
  reconcileTownTradeLocks: () => ({}),
  getIncomingTradeResourcesByTown: () => ({ incomingByTown: new Map(), pendingOutgoingTownIds: new Set() }),
  getResourceTradeModelIds: () => new Set(),
  rememberResourceTradeAwaitingModel: () => remembered++,
  showCelebrationMessage() {},
  window: { ITowns: { getTown: id => ({ id }) }, setTimeout: fn => { timeout = fn; return 1; }, clearTimeout() {}, gpAjax: { ajaxPost: (controller, action, data, flag, done, failed) => {
    posts++; sent = data; callback = done; failure = failed;
  } } },
});
vm.runInContext(extract('async function sendResourceTrade(', 'function formatPartyLockTime('), context);
(async () => {
  await vm.runInContext('sendResourceTrade(1, 2)', context);
  assert.equal(posts, 1, 'Outdated snapshot must remain sendable');
  assert.equal(sent.wood, 500, 'Send exactly the displayed amount');
  assert.equal(sent.town_id, 2);
  assert.equal(button.textContent, 'Sending…');
  await vm.runInContext('sendResourceTrade(1, 2)', context);
  assert.equal(posts, 1, 'Prevent duplicate in-flight requests');
  callback({ success: false });
  assert.equal(button.disabled, false, 'Failed trades can be retried');
  await vm.runInContext('sendResourceTrade(1, 2)', context);
  assert.equal(posts, 2);
  callback({ success: true });
  assert.equal(button.textContent, 'Sent');
  assert.equal(remembered, 1);
  await vm.runInContext('sendResourceTrade(1, 2)', context);
  assert.equal(posts, 2, 'Sent trades cannot be submitted twice');
  button.disabled = false;
  capacity = 499;
  await vm.runInContext('sendResourceTrade(1, 2)', context);
  assert.equal(posts, 2, 'Reject a stale proposal exceeding live merchant capacity');
  assert.equal(button.disabled, false);
  capacity = 1000;
  context.resourceTradesInFlight.add('3:2');
  await vm.runInContext('sendResourceTrade(1, 2)', context);
  assert.equal(posts, 2, 'Serialize sends from the same city to different destinations');
  context.resourceTradesInFlight.clear();
  await vm.runInContext('sendResourceTrade(1, 2)', context);
  failure();
  assert.equal(button.textContent, 'Check trades');
  assert.equal(context.resourceTradesInFlight.size, 1, 'Transport errors retain reservations');
  button.disabled = false; // Simulate panel refresh.
  const beforeRetry = posts;
  await vm.runInContext('sendResourceTrade(1, 2)', context);
  assert.equal(posts, beforeRetry, 'Refresh cannot resend an uncertain shipment');
  callback({ success: false });
  await vm.runInContext('sendResourceTrade(1, 2)', context);
  timeout();
  assert.equal(button.textContent, 'Check trades', 'Missing callbacks cannot leave Sending stuck');
  assert.equal(context.resourceTradesInFlight.size, 1);
  callback({ success: true });
  assert.equal(remembered, 2, 'Late confirmation reconciles an uncertain shipment');
  callback({ success: true });
  assert.equal(remembered, 2, 'Duplicate callbacks cannot record another shipment');
  assert.equal(context.resourceTradesInFlight.size, 0);

  const rejected = async (amounts = '{"wood":500}', target = 1, donor = 2) => {
    button.disabled = false;
    button.dataset.tradeAmounts = amounts;
    const before = posts;
    await context.sendResourceTrade(target, donor);
    assert.equal(posts, before, 'Unsafe shipment must not reach the server');
  };
  for (const amounts of ['{}', 'null', '[]', 'broken', '{"wood":500.5}', '{"wood":499}', '{"wood":-500}', '{"wood":"500"}', '{"gold":500}']) await rejected(amounts);
  await rejected('{"wood":500}', 2, 2);
  context.getTownStorageCapacity = () => null;
  await rejected();
  context.getTownStorageCapacity = () => 1499;
  await rejected();
  context.getTownStorageCapacity = () => 10000;
  context.getIncomingTradeResourcesByTown = () => ({ incomingByTown: new Map([['1', { wood: 8501 }]]), pendingOutgoingTownIds: new Set() });
  await rejected();
  context.getIncomingTradeResourcesByTown = () => ({ incomingByTown: new Map(), pendingOutgoingTownIds: new Set() });
  context.reconcileTownTradeLocks = () => ({ 2: {} });
  await rejected();
  context.reconcileTownTradeLocks = () => ({});
  context.resourceTradesInFlight.add('1:3');
  await rejected();
  context.resourceTradesInFlight.clear();
  const service = context.window.gpAjax;
  context.window.gpAjax = null;
  await rejected();
  context.window.gpAjax = service;
  button.disabled = false;
  await context.sendResourceTrade(1, 2);
  callback({});
  assert.equal(button.textContent, 'Sent', 'Success callback without a success field must release the request');
  assert.equal(context.resourceTradesInFlight.size, 0);
  assert.equal(context.resourceTradeConfirmations.size, 0);
  button.disabled = false;
  await context.sendResourceTrade(1, 2);
  callback();
  assert.equal(button.textContent, 'Sent', 'Success callback may omit its payload');
  assert.equal(context.resourceTradesInFlight.size, 0);
  console.log('Party trades snapshot checks passed');
})();
