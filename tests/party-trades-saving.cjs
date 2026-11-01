const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
let speed = 6, donorDuration = 10000, production = { wood: 0, stone: 1000, iron: 0 };
const context = vm.createContext({
  RESOURCE_CHECKER: { resources: ['wood', 'stone', 'iron'], loyaltyClaimInterval: 780, minimumRelativeTradeSaving: 0.1 },
  getTradeWorldSpeed: () => speed,
  getTownProductionPerHour: () => production,
  calculateTownTradeDuration: () => donorDuration,
});
vm.runInContext(source.slice(
  source.indexOf('  function getFarmingVillageTradeDurationSeconds('),
  source.indexOf('  function compareResourceTradeTargets('),
), context);

const idle = { islandX: 1, islandY: 1, partyForecast: { secondsRemaining: 0 }, deficits: { stone: 3000 } };
const donor = (amount) => ({ plan: { donors: [{ islandX: 2, islandY: 2, distance: 50, contributions: { stone: amount } }] } });
const farmTrade = { give: 'wood', receive: 'stone', amount: 2400, received: 3000 };

assert.equal(context.getFarmingVillageTradeDurationSeconds(), 120);
speed = 3;
assert.equal(context.getFarmingVillageTradeDurationSeconds(), 240);
speed = 6;
assert.equal(context.estimatePartyTradeReadySeconds(idle, 0), 10800, 'own production needs three hours');
assert.equal(context.estimatePartyTradeReadySeconds({ ...idle, deficits: { stone: 900 } }, 300), 1560, 'production plus the second claim');
production = { wood: 0, stone: 0, iron: 0 };
assert.equal(context.estimatePartyTradeReadySeconds({ ...idle, deficits: { stone: 900 } }, 300), 2340, 'three farm village claims');
production = { wood: 0, stone: 1000, iron: 0 };

// A farm village trade arriving after two minutes saves almost the whole wait.
let result = context.evaluatePartyTradeSaving(idle, null, [farmTrade], 0);
assert.equal(result.proposedReady, 120);
assert.equal(result.meaningful, true);
// A city trade arriving at 10,000 s instead of the own 10,800 s saves only 7.4%.
result = context.evaluatePartyTradeSaving(idle, donor(3000).plan, [], 0);
assert.equal(result.proposedReady, 10000);
assert.equal(result.meaningful, false);
donorDuration = 9000;
assert.equal(context.evaluatePartyTradeSaving(idle, donor(3000).plan, [], 0).meaningful, true, '16.7% saving');

// During a celebration the saving is measured on the wait after its end.
const active = { ...idle, partyForecast: { secondsRemaining: 3600 }, deficits: { stone: 2000 } };
donorDuration = 3000;
assert.equal(context.evaluatePartyTradeSaving(active, donor(2000).plan, [], 0).meaningful, true, 'arrives before the end');
donorDuration = 10000;
result = context.evaluatePartyTradeSaving(active, donor(2000).plan, [], 0);
assert.equal(result.currentReady, 10800);
assert.equal(result.meaningful, true, '800 of 7,200 s after the end is 11.1%');
donorDuration = 10200;
assert.equal(context.evaluatePartyTradeSaving(active, donor(2000).plan, [], 0).meaningful, false, '8.3% saving');

// Partial plans still wait for the remainder from production.
donorDuration = 9000;
result = context.evaluatePartyTradeSaving(idle, donor(1000).plan, [], 0);
assert.equal(result.proposedReady, 9000);
assert.equal(context.evaluatePartyTradeSaving(idle, donor(100).plan, [], 0).meaningful, false);

// A town that never fills itself, or an unknown trade duration, keeps its trades.
production = { wood: 0, stone: 0, iron: 0 };
assert.equal(context.evaluatePartyTradeSaving(idle, donor(3000).plan, [], 0).meaningful, true);
production = { wood: 0, stone: 1000, iron: 0 };
donorDuration = null;
assert.equal(context.evaluatePartyTradeSaving(idle, donor(3000).plan, [], 0).meaningful, true);
assert.equal(context.evaluatePartyTradeSaving(idle, { donors: [] }, [], 0).meaningful, false);

// The intermediate resource a chain returns also counts.
const chain = { give: 'wood', receive: 'iron', amount: 1280, received: 2000, steps: [
  { give: 'wood', receive: 'stone', amount: 1280, received: 1600 },
  { give: 'stone', receive: 'iron', amount: 1200, received: 2000 },
] };
result = context.evaluatePartyTradeSaving({ ...idle, deficits: { stone: 400, iron: 2000 } }, null, [chain], 0);
assert.equal(result.proposedReady, 120);
console.log('Party trade saving filter checks passed');
