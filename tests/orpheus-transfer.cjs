const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const source = fs.readFileSync('EgelTools.user.js', 'utf8');
const code = source.slice(source.indexOf('  let orpheusTransferPending'), source.indexOf('  function createCultureOrpheusStatus'));
function setup(options = {}) {
  const calls = [], messages = [], questions = [];
  let timer;
  const hero = (id, town, travel = false) => ({
    town, travel, attacking: false,
    getId() { return id; }, getName() { return id; },
    getOriginTownId() { return this.town; }, getHomeTownId() { return this.town; },
    getArrivalAt() { return this.travel ? 200 : null; }, attacksTown() { return this.attacking; },
    execute(action, params, callbacks) {
      calls.push([id, action, params.target_town_id]);
      if (options.timeout === action) { timer(); return; }
      if (options.fail === action) { callbacks.error(); return; }
      this.town = action === 'assignToTown' ? params.target_town_id : null;
      this.travel = action === 'assignToTown';
      callbacks.success();
    },
  });
  const selected = hero(options.id || 'orpheus', options.origin === undefined ? 1 : options.origin, options.travel);
  const occupant = hero('Other <hero>', 2, options.incoming);
  const heroes = [selected, ...(options.occupant ? [occupant] : [])];
  const context = {
    document: { querySelectorAll: () => [] },
    window: {
      Game: { townId: 2 }, setTimeout(fn) { timer = fn; return 1; }, clearTimeout() {},
      MM: { getCollections: () => ({ PlayerHero: [heroes] }) },
      ConfirmationWindowFactory: { openSimpleConfirmation(title, question, yes, no) {
        questions.push(question);
        if (options.switchCity) context.window.Game.townId = 3;
        if (options.newOccupant) heroes.push(hero('New hero', 2));
        if (options.confirm !== false) yes(); else no();
      } },
    },
    isAdministratorActive: () => options.admin !== false,
    getModelArray: x => x,
    getFirstMethodValue(model, methods, attrs) {
      for (const method of methods) if (typeof model?.[method] === 'function') {
        const value = model[method](); if (value != null) return value;
      }
      for (const attr of attrs || []) if (model?.[attr] != null) return model[attr];
      return null;
    },
    normalizeResourceCheckerTimestamp: x => x || null, getResourceCheckerServerTime: () => 100,
    renderAdministratorOrpheus() {}, renderCelebrationFinder() {},
    showCelebrationMessage: message => messages.push(message),
  };
  vm.createContext(context); vm.runInContext(code, context);
  return { context, calls, messages, questions, selected, occupant };
}
async function run(options = {}) {
  const test = setup(options);
  if (options.attacking) test.selected.attacking = true;
  if (options.occupantAttacking) test.occupant.attacking = true;
  await test.context.moveCouncilHero(options.id || 'orpheus', 2);
  return test;
}
(async () => {
  assert.deepEqual((await run({ origin: null, admin: false, id: 'helen' })).calls, [['helen', 'assignToTown', 2]]);
  assert.deepEqual((await run()).calls, [['orpheus', 'unassignFromTown', 1], ['orpheus', 'assignToTown', 2]]);
  assert.deepEqual((await run({ travel: true })).calls, [['orpheus', 'cancelTownTravel', 1], ['orpheus', 'assignToTown', 2]]);
  assert.deepEqual((await run({ occupant: true, confirm: false })).calls, []);
  const replaced = await run({ occupant: true });
  assert.deepEqual(replaced.calls, [['Other <hero>', 'unassignFromTown', 2], ['orpheus', 'unassignFromTown', 1], ['orpheus', 'assignToTown', 2]]);
  assert.match(replaced.questions[0], /Other &lt;hero&gt;/);
  assert.deepEqual((await run({ occupant: true, incoming: true, travel: true })).calls,
    [['Other <hero>', 'cancelTownTravel', 2], ['orpheus', 'cancelTownTravel', 1], ['orpheus', 'assignToTown', 2]]);
  for (const options of [{ origin: 2 }, { origin: 2, travel: true }, { attacking: true },
    { occupant: true, switchCity: true }, { occupant: true, newOccupant: true }, { occupant: true, occupantAttacking: true }]) {
    assert.deepEqual((await run(options)).calls, []);
  }
  const failure = await run({ occupant: true, fail: 'unassignFromTown' });
  assert.equal(failure.calls.length, 1); assert.equal(failure.messages.length, 1);
  const timeout = await run({ timeout: 'unassignFromTown' });
  await timeout.context.moveCouncilHero('orpheus', 2);
  assert.equal(timeout.calls.length, 1); assert.match(timeout.messages[0], /refresh before retrying/);
  const double = setup();
  await Promise.all([double.context.moveCouncilHero('orpheus', 2), double.context.moveCouncilHero('orpheus', 2)]);
  assert.equal(double.calls.length, 2);
  const noAdmin = setup({ admin: false });
  await noAdmin.context.moveCultureOrpheus(2); assert.deepEqual(noAdmin.calls, []);
  const orpheus = setup({ occupant: true });
  await orpheus.context.moveCultureOrpheus(2); assert.equal(orpheus.calls.length, 3);
  console.log('Hero swaps: available, assigned, travelling, confirmation, state changes, failures, timeout, concurrency and Orpheus passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
