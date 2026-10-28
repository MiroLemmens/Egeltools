const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('EgelTools.user.js', 'utf8');
function element(attrs = {}) {
  return { dataset: {}, style: {}, children: [], getAttribute: key => attrs[key],
    querySelector() { return this.children[0]; }, append(child) { this.children.push(child); },
    replaceChildren() { this.children = []; }, setAttribute() {}, remove() {} };
}
const rows = [element({ name: '1' }), element({ 'data-townid': '2' }), element({ name: '3' })];
const powers = { 1: [{ power_id: 'narcissism', town_id: 1, end_at: 200 }],
  2: [{ power_id: 'town_protection', end_at: 200 }, { power_id: 'spartan_training', end_at: 50 }],
  3: [{ power_id: 'help_of_the_nereids', end_at: 200 }, { power_id: 'ritual_7', end_at: 200 },
    { power_id: 'wedding', end_at: 200 }] };
const context = {
  document: { querySelectorAll: () => rows, createElement: () => element() },
  window: { GameData: { powers: { ritual_7: { name: 'Gepassioneerde bevolking' } } },
    MM: { getCollections: () => ({ CastedPowers: { 1: { models: powers[1] } } }) },
    ITowns: { getTown: id => ({ getCastedPowers: () => powers[1], casted_powers_collection: { models: powers[id] } }) } },
  getResourceCheckerServerTime: () => 100,
  normalizeResourceCheckerTimestamp: value => value,
  getModelAttributes: model => model.attributes || model,
};
vm.createContext(context);
for (const name of ['getModelArray', 'getFirstMethodValue', 'renderTownSpellIndicators']) {
  const start = source.indexOf(`  function ${name}(`);
  const end = source.indexOf('\n  function ', start + 1);
  vm.runInContext(source.slice(start, end), context);
}
context.renderTownSpellIndicators();
assert.equal(rows[0].children[0]?.dataset.spells, 'narcissism');
assert.equal(rows[1].children[0]?.dataset.spells, 'town_protection', 'unselected town must show its own active spells');
assert.equal(rows[2].children[0]?.dataset.spells, 'help_of_the_nereids,ritual_7',
  'Nereids and Passionate Population match by ID or game name; untracked spells stay hidden');
assert.deepEqual(rows[2].children[0].children.map(icon => icon.title),
  ['Help from the Nereids active', 'Gepassioneerde bevolking active']);
console.log('Town spells: selected and unselected towns, expiry filtering, ritual effects passed');
