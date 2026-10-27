const fs = require('fs'), vm = require('vm'), assert = require('assert');
const source = fs.readFileSync('EgelTools.user.js', 'utf8');
const code = source.slice(source.indexOf('  function parseHelenaTravelTime'), source.indexOf('  function renderHelenaTiming'));
const Game = { game_speed: 3, constants: { game_config: { revolt_delay_seconds: 28800, conquest_time_hours: 8 } } };
const context = vm.createContext({ window: { Game } });
vm.runInContext(code, context);
assert.equal(context.parseHelenaTravelTime('~ 12:34:56'), 45296);
assert.equal(context.parseHelenaTravelTime('0:60:00'), null);
assert.equal(context.parseHelenaTravelTime(''), null);
assert.equal(context.calculateHelenaEnd(1000, 600, 12, 1), 42424);
assert.equal(context.calculateHelenaEnd(1000, 600, 12, 20), 38320);
assert.equal(context.calculateHelenaEnd(1000, 600, 24, 20), 75040);
for (const args of [[1000, null, 12, 1], [1000, 0, 12, 1], [1000, 600, 0, 1], [1000, 600, 12, 21]]) {
  assert.equal(context.calculateHelenaEnd(...args), null);
}
console.log('Helena travel parsing, level bonuses, revolt/siege durations, and unavailable data checks passed');

// Actual NL137 configuration: native values already include speed 3.
assert.equal(context.getHelenaBaseHours('revolt'), 8);
assert.equal(context.getHelenaBaseHours('siege'), 8);
assert.equal(context.calculateHelenaEnd(1000, 600, context.getHelenaBaseHours('revolt'), 20), 26080);
Game.game_speed = 5;
assert.equal(context.getHelenaBaseHours('revolt'), 8, 'Native world overrides must not be divided by speed again');
Game.constants.game_config = { revolt_delay_seconds: 43200, conquest_time_hours: 0 };
assert.equal(context.getHelenaBaseHours('revolt'), 12);
assert.equal(context.getHelenaBaseHours('siege'), 24, 'Match native zero conquest duration handling');
delete Game.constants;
for (const speed of [1, 2, 3, 4, 5]) {
  Game.game_speed = speed;
  assert.equal(context.getHelenaBaseHours('revolt'), 24 / speed);
  assert.equal(context.getHelenaBaseHours('siege'), 24 / speed);
}
for (const speed of [undefined, null, '', 0, -1, 'invalid', Infinity]) {
  Game.game_speed = speed;
  assert.equal(context.getHelenaBaseHours('revolt'), null);
}
console.log('Native world duration, speed fallback, missing data, and no double scaling checks passed');

const renderCode = source.slice(source.indexOf('  function renderHelenaTiming'), source.indexOf('  function init()'));
function renderSiege(shipCount, withHelena, version = 'old') {
  const result = { textContent: '' }, base = { textContent: '' };
  let removed = false;
  const panel = { querySelector: selector => ({ '.egeltools-helena-result': result, '.egeltools-helena-base': base })[selector], remove() { removed = true; } };
  const host = { querySelector: selector => ({ '.egeltools-helena-timing': panel, '.way_duration': { textContent: '0:10:00' }, 'input[name="colonize_ship"]': { value: shipCount }, '.attack_type_wrapper': {} })[selector] };
  const hero = { getId: () => 'helen', getHomeTownId: () => 1, getLevel: () => 20 };
  const game = { townId: 1, features: { command_version: version }, constants: { game_config: { conquest_time_hours: 8, revolt_delay_seconds: 28800 } } };
  Object.assign(context, {
    window: { Game: game, MM: { getCollections: () => ({ PlayerHero: [withHelena ? [hero] : []] }) } },
    document: { querySelectorAll: () => [host] },
    localStorage: { getItem: () => { throw Error('Old saved conquest mode must not be read'); } }, getResourceCheckerServerTime: () => 1000,
    getModelArray: x => x,
    getFirstMethodValue: (model, methods) => { for (const method of methods) if (typeof model[method] === 'function') return model[method](); },
    formatPartyLockTime: () => '8h',
  });
  vm.runInContext(renderCode, context);
  context.renderHelenaTiming();
  return { result, base, removed };
}
let siege = renderSiege(1, false);
assert.equal(siege.removed, false);
assert.equal(siege.base.textContent, '');
assert.equal(siege.result.textContent, `Siege ends: ${new Date(30400 * 1000).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} (local)`);
assert.match(siege.result.title, /colony ship lands successfully/);
assert.equal(renderSiege(0, true).removed, true);
siege = renderSiege(1, true);
assert.equal(siege.result.textContent, `Siege ends: ${new Date(26080 * 1000).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} (local)`);
console.log('Siege colony-ship gating, end-time display, and estimates with/without Helena checks passed');

assert.equal(context.getHelenaConquestMode(), 'siege');
context.window.Game.features.command_version = 'new';
assert.equal(context.getHelenaConquestMode(), 'revolt');
context.window.Game.features.command_version = undefined;
assert.equal(context.getHelenaConquestMode(), null);
assert.equal(renderSiege(1, true, undefined).removed, false); // default argument is old
assert.equal(renderSiege(1, true, 'unknown').removed, true);
assert.equal(renderSiege(1, true, null).removed, true);
assert.equal(renderSiege(1, false, 'new').removed, true, 'A CS must not turn a revolt world into siege mode');
const revolt = renderSiege(0, true, 'new');
assert.equal(revolt.removed, false);
assert.match(revolt.result.title, /Base duration: 8h/);
assert.match(revolt.result.textContent, /^F2 starts:/);
console.log('Automatic siege/revolt detection, unknown configuration, and stale preference checks passed');
