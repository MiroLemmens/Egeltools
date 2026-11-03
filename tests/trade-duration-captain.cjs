const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
let captain = false;
const context = vm.createContext({ window: { Game: { game_speed: 2 } }, isCaptainActive: () => captain });
vm.runInContext(source.slice(source.indexOf('  function getTradeWorldSpeed'), source.indexOf('  function formatTownTradeDuration')), context);

// Speed 2, distance 300: same island 2 * 300 * 5 / 6 = 500 s;
// other island 2 * (2700 / 8 + 300 * 5 / 4) = 1425 s.
assert.equal(context.calculateTownTradeDuration(300, true), 500);
assert.equal(context.calculateTownTradeDuration(300, false), 1425);
// The Captain halves only trades to other islands.
captain = true;
assert.equal(context.calculateTownTradeDuration(300, true), 500);
assert.equal(context.calculateTownTradeDuration(300, false), 712);
assert.equal(context.calculateTownTradeDuration(-1, false), null);
context.window.Game.game_speed = undefined;
assert.equal(context.calculateTownTradeDuration(300, false), null);
console.log('Trade duration world speed and same-island Captain checks passed');
