const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
let captain = false;
const context = vm.createContext({ window: { Game: { game_speed: 2 } }, isCaptainActive: () => captain });
vm.runInContext(source.slice(source.indexOf('  function getTradeWorldSpeed'), source.indexOf('  function formatTownTradeDuration')), context);

// Speed 2, distance 300: (112.5 + 300 * 50 / 60) / 2 = 181.25 s on or off the island.
assert.equal(context.calculateTownTradeDuration(300, true), 181);
assert.equal(context.calculateTownTradeDuration(300, false), 181);
assert.equal(context.calculateTownTradeDuration(0, true), 56);
// The Captain halves only trades to other islands.
captain = true;
assert.equal(context.calculateTownTradeDuration(300, true), 181);
assert.equal(context.calculateTownTradeDuration(300, false), 90);
assert.equal(context.calculateTownTradeDuration(-1, false), null);

// Reported on a speed 4 world: the game showed 00:07:25 where EgelTools 1.2.105-1.2.121
// showed 00:22:15, three times as long. Distance 2001 gives the game's 445 s.
captain = false;
context.window.Game.game_speed = 4;
assert.equal(context.calculateTownTradeDuration(2001, false), 445);

context.window.Game.game_speed = undefined;
assert.equal(context.calculateTownTradeDuration(300, false), null);
console.log('Trade duration world speed and same-island Captain checks passed');
