const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const preview = { hidden: true, textContent: '' };
const calls = [];
const warnings = [];
let humanMessage = {
  success(message, extra) { calls.push(['success', message, extra, this === humanMessage]); return 'shown'; },
  error(message) { calls.push(['error', message]); },
};
const context = vm.createContext({
  APP: { name: 'EgelTools' },
  console: { warn: (...args) => warnings.push(args) },
  document: { getElementById: () => preview },
  window: { HumanMessage: humanMessage, clearTimeout: () => {}, setTimeout: () => 1 },
  DOMParser: class { parseFromString(text) { return { body: { textContent: text.replace(/<[^>]*>/g, '') } }; } },
});
vm.runInContext(source.slice(source.indexOf('  const notifications = new Map();'), source.indexOf('  function getTradeCapacityBoundary(')), context);
context.renderNotificationCenter = () => {};
const read = expression => vm.runInContext(expression, context);

assert.equal(context.mirrorGameStatusMessages(), true);
assert.equal(context.mirrorGameStatusMessages(), true, 'Re-running the mirror is idempotent');
assert.equal(humanMessage.success('Trade on the way', 42), 'shown', 'The game result is returned unchanged');
assert.deepEqual(calls, [['success', 'Trade on the way', 42, true]], 'The native status bar still receives the original call');
assert.equal(read('notifications.size'), 1);
let entry = read('[...notifications.values()][0]');
assert.equal(entry.title, 'Grepolis');
assert.equal(entry.message, 'Trade on the way');
assert.equal(entry.level, 'success');
assert.equal(preview.textContent, '', 'Mirrored game messages do not replay the EgelTools preview');
assert.equal(preview.hidden, true);

humanMessage.success('Trade on the way');
assert.equal(read('notifications.size'), 1, 'Repeated game messages group');
assert.equal(read('[...notifications.values()][0].count'), 2, 'One mirror per message even after wrapping twice');

humanMessage.error('<img class="icon"> Not enough <b>resources</b>.');
entry = read('[...notifications.values()].at(-1)');
assert.equal(entry.message, 'Not enough resources.', 'Other scripts\' markup is flattened to text');
assert.equal(entry.level, 'error');

humanMessage.success({ unexpected: true });
humanMessage.success('');
assert.equal(read('notifications.size'), 2, 'Non-text and empty messages are ignored');

// A later wrapper by another script must not produce a second mirror.
const ours = humanMessage.success;
humanMessage.success = function (message) { return ours.call(this, message); };
assert.equal(context.mirrorGameStatusMessages(), true);
humanMessage.success('Trade on the way');
assert.equal(read('[...notifications.values()].find((n) => n.message === "Trade on the way").count'), 3);

// A replaced HumanMessage object is wrapped again; a mirroring fault never breaks the game call.
context.window.HumanMessage = humanMessage = { success(message) { calls.push(['fresh', message]); return 'fresh'; } };
assert.equal(context.mirrorGameStatusMessages(), true);
context.DOMParser = class { parseFromString() { throw new Error('boom'); } };
assert.equal(humanMessage.success('Still shown'), 'fresh');
assert.equal(calls.at(-1)[1], 'Still shown');
assert.equal(warnings.length, 1, 'Mirror faults are logged, not thrown');

context.window.HumanMessage = undefined;
assert.equal(context.mirrorGameStatusMessages(), false, 'Missing HumanMessage is reported so init retries');
console.log('Game status mirror wrapping, flattening, grouping, idempotence and fault isolation checks passed');
