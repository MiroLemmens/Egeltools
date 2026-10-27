const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('EgelTools.user.js', 'utf8');
const context = vm.createContext({});
vm.runInContext(source.slice(source.indexOf('  function updateMovementListPlaceholders('), source.indexOf('  function initMovementTools(')), context);
const nodes = Object.fromEntries(['.item.no_results', '.item.processing_movements'].map(selector => {
  const classes = new Set();
  return [selector, { innerText: 'Native placeholder', classes,
    classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); } },
    remove() { throw new Error('Native town-switch dependency must remain attached'); },
  }];
}));
const dropdown = { querySelector(selector) { return nodes[selector]; } };
const processing = nodes['.item.processing_movements'];
for (const empty of [true, true, false, true, false]) {
  context.updateMovementListPlaceholders(dropdown, empty);
  assert.equal(dropdown.querySelector('.item.processing_movements'), processing);
  assert.equal(dropdown.querySelector('.item.processing_movements').innerText, 'Native placeholder');
  assert.equal(processing.classes.has('egeltools-movement-placeholder-hidden'), empty);
  assert.equal(nodes['.item.no_results'].classes.has('egeltools-movement-placeholder-hidden'), !empty);
}
context.updateMovementListPlaceholders({ querySelector() { return null; } }, true);
assert.match(source, /\.egeltools-movement-placeholder-hidden\s*\{ display:none !important; \}/);
assert.doesNotMatch(source, /EgelTools list state|emptyStates/);
console.log('Native movement placeholders survive empty/populated transitions and remain readable during town switching.');
