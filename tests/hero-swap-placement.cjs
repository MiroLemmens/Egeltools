const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const source = fs.readFileSync('EgelTools.user.js', 'utf8');
const code = source.slice(source.indexOf('  function getCouncilHeroButtonPlacement'), source.indexOf('  function renderCouncilHeroButtons'));
const context = {};
vm.createContext(context); vm.runInContext(code, context);
// Results come from the vm realm, so copy them before comparing with strict equality.
const getCouncilHeroButtonPlacement = (...args) => {
  const result = context.getCouncilHeroButtonPlacement(...args);
  return result && { ...result };
};

const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
const element = (bounds, children = []) => ({ getBoundingClientRect: () => bounds, contains: (other) => children.includes(other) });
const row = (elements) => ({ getBoundingClientRect: () => rect(100, 50, 600, 70), querySelectorAll: () => elements });

const assign = element(rect(302, 73, 120, 24));
const upgrade = element(rect(520, 78, 16, 16));
const hidden = element(rect(0, 0, 0, 0));
const inner = element(rect(300, 80, 200, 20));
const own = element(rect(430, 73, 34, 24), [inner]);

// The widest visible native button anchors the control, 6px to its right and centered on its height.
assert.deepEqual(getCouncilHeroButtonPlacement(row([upgrade, assign, hidden]), null, '.button_new', 40), { left: 328, top: 35 });
// The script's own button and its children never anchor themselves, even when wider.
assert.deepEqual(getCouncilHeroButtonPlacement(row([assign, own, inner]), own, '.button_new', 40), { left: 328, top: 35 });
// Small square buttons such as the upgrade arrow are ignored by the width threshold.
assert.equal(getCouncilHeroButtonPlacement(row([upgrade, hidden]), null, '.button_new', 40), null);
assert.deepEqual(getCouncilHeroButtonPlacement(row([upgrade]), null, '.button_new', 1), { left: 442, top: 36 });
assert.equal(getCouncilHeroButtonPlacement(row([]), null, '.button_new', 40), null);
console.log('Hero swap placement: widest native button, own-button exclusion, width threshold and empty rows passed');
