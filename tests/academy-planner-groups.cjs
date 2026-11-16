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

// Athens is in Offense and Defense. Sparta is in Defense but the Recruit Optimizer
// pinned it to 'none' (written before the group links had loaded). Thebes left
// Offense but keeps a stale 'grepo:7' pin. Corinth only has a custom group. Argos
// is in Offense. Links to the virtual groups -1 and -2 must be ignored.
function town(id, name) { return { getId: () => id, getName: () => name }; }
const towns = { 1: town(1, 'Athens'), 2: town(2, 'Sparta'), 3: town(3, 'Thebes'), 4: town(4, 'Corinth'), 5: town(5, 'Argos') };
const link = (id, town_id, group_id) => [id, { attributes: { id, town_id, group_id } }];
const TownGroup = {
  7: { attributes: { id: 7, name: 'Offense' } },
  8: { attributes: { id: 8, name: 'Defense' } },
  '-1': { attributes: { id: -1, name: 'All towns' } },
};
const links = Object.fromEntries([link(1, 1, 7), link(2, 1, 8), link(3, 2, 8), link(4, 5, 7), link(5, 1, -1), link(6, 3, -2)]);
const targets = {
  cityTargetGroups: { 2: 'none', 3: 'grepo:7', 4: 'custom:raid' },
  cityCustomGroups: { 4: 'raid' },
  customGroups: { raid: { name: 'Raiders', targets: {} } },
};

function build({ models, collections = {} }) {
  const storage = {
    egeltools_academy_templates_v1: JSON.stringify({ version: 2, groups: {}, cities: {}, cityGroups: {} }),
    grepo_unit_targets_scoped_v2: JSON.stringify(targets),
  };
  const calls = { getModels: 0 };
  const context = {
    console,
    CFG: { storageKey: 'egeltools_academy_templates_v1' },
    state: { researchIds: new Set() },
    t: key => key,
    lang: () => 'en',
    localStorage: { getItem: key => storage[key] ?? null, setItem() {} },
    window: {
      GameData: { researches: {} },
      ITowns: { getTowns: () => towns },
      MM: { getModels: () => { calls.getModels += 1; return models; }, getCollections: () => collections },
      dispatchEvent() {},
    },
    CustomEvent: class {},
  };
  vm.createContext(context);
  vm.runInContext(slice('  const blank=', '  function styles('), context);
  context.calls = calls;
  return context;
}

// Arrays made inside the vm have the context's own prototypes, so copy them out before comparing.
const groupsOf = (ctx, id) => [...ctx.overviewGroups(String(id))];
const rows = (ctx, filter, sort) => Array.from(ctx.overviewRows(filter, sort), row => `${row.gid}:${row.town.getName()}`);

const ctx = build({ models: { TownGroup, TownGroupTown: links } });
assert.deepEqual(groupsOf(ctx, 1), ['grepo:7', 'grepo:8'], 'a town in two groups is listed under both');
assert.deepEqual(groupsOf(ctx, 2), ['grepo:8'], "a 'none' pin does not hide the town's live group");
assert.deepEqual(groupsOf(ctx, 3), ['none'], 'a stale group pin does not keep the town in a group it left');
assert.deepEqual(groupsOf(ctx, 4), ['custom:raid'], 'a custom group assignment counts as a group');
assert.deepEqual(groupsOf(ctx, 5), ['grepo:7']);
assert.equal(ctx.groupId('2'), 'none', 'the template assignment still follows the stored pin');
assert.equal(ctx.groupId('3'), 'grepo:7', 'the template assignment still follows the stored pin');
assert.equal(ctx.groupId('1'), 'grepo:7', 'without a pin the template follows the first group link');
assert.equal(ctx.groupId('5'), 'grepo:7');

assert.deepEqual(rows(ctx, 'grepo:8', 'town'), ['grepo:8:Athens', 'grepo:8:Sparta'], 'filtering by Defense shows every Defense town');
assert.deepEqual(rows(ctx, 'grepo:7', 'town'), ['grepo:7:Argos', 'grepo:7:Athens'], 'filtering by Offense does not show the town that left it');
assert.deepEqual(rows(ctx, 'none', 'town'), ['none:Thebes'], 'No group lists only towns without any group');
assert.deepEqual(rows(ctx, 'custom:raid', 'town'), ['custom:raid:Corinth']);
assert.deepEqual(rows(ctx, 'all', 'town'), [
  'grepo:7:Argos', 'grepo:7:Athens', 'custom:raid:Corinth', 'grepo:8:Sparta', 'none:Thebes',
], 'sorting by town lists every town once');
assert.deepEqual(rows(ctx, 'all', 'group'), [
  'grepo:8:Athens', 'grepo:8:Sparta', 'none:Thebes', 'grepo:7:Argos', 'grepo:7:Athens', 'custom:raid:Corinth',
], 'sorting by group lists a town under each of its groups, sections ordered by name');

ctx.calls.getModels = 0;
ctx.batch(() => { ctx.overviewRows('all', 'group'); ctx.overviewRows('grepo:8', 'town'); });
assert.ok(ctx.calls.getModels <= 3, `one pass scans the models a bounded number of times, scanned ${ctx.calls.getModels}`);

const viaCollections = build({ models: { TownGroup }, collections: { TownGroupTown: [{ models: Object.values(links) }] } });
assert.deepEqual(groupsOf(viaCollections, 1), ['grepo:7', 'grepo:8'], 'links held in MM collections are read too');
assert.deepEqual(groupsOf(viaCollections, 2), ['grepo:8']);

const legacy = build({ models: { TownGroup, SomethingElse: links } });
assert.deepEqual(groupsOf(legacy, 1), ['grepo:7', 'grepo:8'], 'without a TownGroupTown bucket every model with town and group ids is scanned');

const noGame = build({ models: {} });
assert.deepEqual(groupsOf(noGame, 1), ['none'], 'without group data every town is listed under No group');
assert.deepEqual(rows(noGame, 'all', 'group').length, 5);

console.log('academy-planner-groups: ok');
