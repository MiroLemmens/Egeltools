const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('EgelTools.user.js', 'utf8');
const planner = source.slice(source.indexOf('/* EgelTools Academy Planner'));
function slice(startMarker, endMarker) {
  const start = planner.indexOf(startMarker);
  const end = planner.indexOf(endMarker, start + 1);
  assert.ok(start >= 0 && end > start, `missing academy planner region ${startMarker}`);
  return planner.slice(start, end);
}

const researchIds = [...Array.from({ length: 28 }, (_, i) => `r${i}`), 'booty', 'take_over'];
const researches = Object.fromEntries(researchIds.map((id, i) => [id, {
  name: id, research_points: 4, resources: { wood: 100, stone: 100, iron: 100 },
  building_dependencies: { academy: i % 25 },
}]));
function town(id) {
  const done = Object.fromEntries(researchIds.filter((_, i) => (i + id) % 3 === 0).map(key => [key, true]));
  const poor = id % 4 === 0;
  return {
    getId: () => id, getName: () => `Town ${id}`,
    getResearches: () => ({ attributes: done, get: key => done[key] }),
    getBuildings: () => ({ getBuildingLevel: key => (key === 'academy' ? (id % 5 === 0 ? 5 : 30) : 1) }),
    getResources: () => ({ wood: poor ? 10 : 5000, stone: 5000, iron: 5000 }),
  };
}
const towns = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [i + 1, town(i + 1)]));
const noise = Object.fromEntries(Array.from({ length: 3000 }, (_, i) => [i, { attributes: { id: i, unrelated: true } }]));
const groupLinks = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [i, { attributes: { town_id: i + 1, group_id: i % 2 ? 7 : 8 } }]));
const models = {
  Noise: noise, TownGroupTown: groupLinks,
  TownGroup: { 7: { attributes: { id: 7, name: 'Offense' } }, 8: { attributes: { id: 8, name: 'Defense' } } },
  ResearchOrder: { 1: { attributes: { town_id: 3, type: 'r4' } }, 2: { attributes: { town_id: 3, type: 'booty_bpv' } } },
};
const calls = { getItem: 0, getModels: 0 };
const storage = {
  egeltools_academy_templates_v1: JSON.stringify({
    version: 2,
    groups: { 'grepo:7': { name: 'Offense', researches: ['r1', 'r3', 'r4', 'r20', 'booty_bpv'] } },
    cities: { 2: { researches: ['r0'] } },
    cityGroups: {},
  }),
  grepo_unit_targets_scoped_v2: JSON.stringify({ cityTargetGroups: { 2: 'none', 3: 'grepo:7', 4: 'grepo:7' } }),
};
const context = {
  console,
  CFG: { storageKey: 'egeltools_academy_templates_v1' },
  state: { researchIds: new Set() },
  t: key => key,
  lang: () => 'en',
  localStorage: { getItem: key => { calls.getItem += 1; return storage[key] ?? null; }, setItem() {} },
  window: {
    GameData: { researches },
    ITowns: { getTowns: () => towns },
    MM: { getModels: () => { calls.getModels += 1; return models; }, getCollections: () => ({}) },
    dispatchEvent() {},
  },
  CustomEvent: class {},
};
vm.createContext(context);
vm.runInContext(slice('  const blank=', '  function styles('), context);
vm.runInContext(slice('  function townResources(', '  const esc='), context);

const grid = () => Object.values(towns).map(t => researchIds.map(id => context.status(t, id)));
calls.getItem = 0;
calls.getModels = 0;
const unbatched = grid();
const unbatchedCalls = { ...calls };
calls.getItem = 0;
calls.getModels = 0;
const batched = context.batch(grid);
assert.equal(JSON.stringify(batched), JSON.stringify(unbatched), 'a cached pass must produce the same statuses as uncached lookups');
assert.ok(calls.getItem <= 2, `a pass reads each storage key once, read ${calls.getItem} times`);
assert.ok(calls.getModels <= 3, `a pass scans MM models a bounded number of times, scanned ${calls.getModels} times`);
assert.ok(unbatchedCalls.getModels > 100, 'the fixture exercises the per-cell lookups');

const cell = (townId, id) => batched[townId - 1][researchIds.indexOf(id)];
assert.equal(cell(6, 'r3'), 'done', 'group template research that is researched');
assert.equal(cell(6, 'r1'), 'missing', 'group template research that is affordable');
assert.equal(cell(6, 'r6'), 'wrong', 'researched outside the template');
assert.equal(cell(6, 'r5'), 'ignored', 'not researched and not in the template');
assert.equal(cell(1, 'r1'), 'ignored', 'a town in a group without a template');
assert.equal(cell(4, 'r1'), 'insufficient', 'an explicit group assignment with too little wood');
assert.equal(cell(5, 'r20'), 'unavailable', 'academy level below the requirement');
assert.equal(cell(2, 'r0'), 'missing', 'town template when the town is assigned to no group');
assert.equal(cell(3, 'r4'), 'done', 'a queued research counts as done');
assert.equal(cell(3, 'booty'), 'done', 'a queued research alias counts as done');
const mark = (townId, id) => context.batch(() => context.markClass(towns[townId], id, context.status(towns[townId], id)));
assert.equal(mark(6, 'r1'), 'ao-green', 'an affordable required research is a green + button');
assert.equal(mark(6, 'r5'), 'ao-green', 'an affordable research outside the template is a green + button');
assert.equal(mark(4, 'r1'), 'ao-gray', 'a required research the town cannot afford is a grey + button');
assert.equal(mark(4, 'r6'), 'ao-gray', 'a research outside the template the town cannot afford is a grey + button');
assert.equal(mark(6, 'r3'), 'ao-green', 'researched template research stays green');
assert.equal(mark(6, 'r6'), 'ao-red', 'research outside the template stays red');
assert.equal(mark(5, 'r20'), 'ao-black', 'research above the academy level stays black');
assert.equal(context.batch(() => context.researchQueued(towns[3], 'booty')), true);
assert.equal(context.researchQueued(towns[1], 'r4'), false);
assert.equal(context.researchPoints(towns[1]), 30 * 4 + 12 - 10 * 4);
assert.equal(JSON.stringify([...context.groups()]), JSON.stringify([['grepo:7', 'Offense'], ['grepo:8', 'Defense']]));

storage.grepo_unit_targets_scoped_v2 = JSON.stringify({ cityTargetGroups: { 1: 'none' } });
assert.equal(context.groupId(1), 'none', 'lookups outside a pass read fresh storage');
assert.equal(context.batch(() => context.groupId(1)), 'none', 'each pass starts with fresh storage');

console.log('academy-planner-cache: ok');
