const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const preview = {};
let timer;
let renders = 0;
let dismissals = 0;
const context = vm.createContext({
  APP: { name: 'EgelTools' },
  document: { getElementById: () => preview },
  window: { clearTimeout: () => { timer = null; }, setTimeout: fn => { timer = fn; return 1; } },
});
vm.runInContext(source.slice(source.indexOf('  const notifications = new Map();'), source.indexOf('  function getTradeCapacityBoundary(')), context);
context.renderNotificationCenter = () => { renders++; };
const read = expression => vm.runInContext(expression, context);
context.notify({ title: 'Done', message: 'Trade sent.' });
context.notify({ title: 'Done', message: 'Trade sent.' });
assert.equal(read('notifications.size'), 1, 'Identical events group together');
assert.equal(read('[...notifications.values()][0].count'), 2);
assert.equal(read('[...notifications.values()][0].unread'), true);
context.notify({ key: 'warehouse:7', title: '<Town>', message: 'Warehouse reached the red line.', onDismiss: () => { dismissals++; context.removeNotification('warehouse:7'); } });
assert.equal(preview.textContent, '<Town> · Warehouse reached the red line.');
context.removeNotification('warehouse:7', true);
assert.equal(dismissals, 1, 'Acknowledgement fires once even when the feature clears its notification');
assert.equal(read('notifications.has("warehouse:7")'), false);
context.notify({ key: 'resolved', title: 'Resolved', onDismiss: () => { dismissals++; } });
context.removeNotification('resolved');
assert.equal(dismissals, 1, 'Automatic resolution does not acknowledge unrelated feature actions');
read('notificationCenterOpen = true');
context.notify({ title: 'Visible' });
assert.equal(preview.hidden, true, 'No preview when the inbox is already open');
assert.equal(read('[...notifications.values()].at(-1).unread'), false);
read('notificationCenterOpen = false');
for (let i = 0; i < 75; i++) context.notify({ key: `event:${i}`, title: `Event ${i}` });
assert.equal(read('notifications.size'), 50, 'History is bounded');
assert.equal(read('notifications.has("event:24")'), false);
assert.equal(read('notifications.has("event:25")'), true);
assert.equal(preview.textContent, 'Event 74', 'Only the newest preview remains');
timer();
assert.equal(preview.hidden, true, 'Preview expires');
assert.ok(renders > 0);
console.log('Notification grouping, unread state, bounded history, acknowledgement and preview checks passed');
