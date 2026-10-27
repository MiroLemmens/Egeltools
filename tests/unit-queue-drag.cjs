const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const listeners = new Map();
let startDrag;
const handle = { addEventListener: (type, listener) => { startDrag = listener; } };
const panel = {
  style: {},
  querySelector: () => handle,
  getBoundingClientRect() {
    // Model the queue's initial 50% positioning and translate(-50%, -50%).
    const centered = this.style.transform !== 'none';
    return {
      left: parseFloat(this.style.left ?? '600') - (centered ? 215 : 0),
      top: parseFloat(this.style.top ?? '400') - (centered ? 150 : 0),
      width: 430,
      height: 300,
    };
  },
};
const context = vm.createContext({
  panel,
  window: {
    innerWidth: 1200,
    innerHeight: 800,
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type) => listeners.delete(type),
  },
});
vm.runInContext(source.slice(
  source.indexOf('  function makePanelDraggable('),
  source.indexOf('  function closeUnitQueueWindow('),
), context);
vm.runInContext('makePanelDraggable(panel)', context);
const pointer = (clientX, clientY) => ({
  button: 0, pointerId: 1, clientX, clientY,
  target: { closest: () => null }, preventDefault() {},
});

for (let attempt = 0; attempt < 2; attempt += 1) {
  const before = panel.getBoundingClientRect();
  const down = pointer(before.left + 80, before.top + 15);
  startDrag(down);
  assert.deepEqual(panel.getBoundingClientRect(), before, 'Starting a drag must preserve the visible position');
  listeners.get('pointermove')(pointer(down.clientX + 40, down.clientY + 30));
  assert.equal(panel.getBoundingClientRect().left, before.left + 40);
  assert.equal(panel.getBoundingClientRect().top, before.top + 30);
  listeners.get('pointerup')(down);
  assert.equal(listeners.size, 0, 'Ending a drag must remove its listeners');
}

startDrag(pointer(panel.getBoundingClientRect().left + 80, panel.getBoundingClientRect().top + 15));
listeners.get('pointermove')(pointer(2000, 2000));
assert.equal(panel.getBoundingClientRect().left, 770);
assert.equal(panel.getBoundingClientRect().top, 500);
listeners.get('pointermove')(pointer(-100, -100));
assert.equal(panel.getBoundingClientRect().left, 0);
assert.equal(panel.getBoundingClientRect().top, 0);
listeners.get('pointercancel')(pointer(0, 0));
assert.equal(listeners.size, 0);
console.log('Unit queue dragging checks passed');
