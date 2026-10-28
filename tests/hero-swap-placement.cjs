const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const source = fs.readFileSync('EgelTools.user.js', 'utf8');
const code = source.slice(source.indexOf('  function getCouncilLocalRect'), source.indexOf('  function createCouncilHeroSwapButton'));

// Minimal DOM stand-ins: offsets are relative to offsetParent, like the real layout engine's.
function element(classes, offset, options = {}) {
  const node = {
    nodeType: 1, classList: { contains: (name) => classes.split(' ').includes(name) },
    offsetLeft: offset[0], offsetTop: offset[1], offsetWidth: offset[2], offsetHeight: offset[3],
    offsetParent: null, childNodes: [], children: [], parent: null,
    getBoundingClientRect() { return { left: 0, top: 0, width: this.offsetWidth, height: this.offsetHeight }; },
    contains(other) { for (let n = other; n; n = n.parent) if (n === node) return true; return false; },
    querySelector(selector) { return node.querySelectorAll(selector)[0] || null; },
    querySelectorAll(selector) {
      const names = selector.split(',').map((part) => part.trim().slice(1)), out = [];
      const walk = (n) => n.children.forEach((c) => { if (names.some((name) => c.classList.contains(name))) out.push(c); walk(c); });
      walk(node); return out;
    },
  };
  for (const child of options.children || []) {
    child.parent = node; node.childNodes.push(child);
    if (child.nodeType === 1) { node.children.push(child); child.offsetParent = options.positioned === false ? null : node; }
  }
  return node;
}
const text = (content, rect) => ({ nodeType: 3, textContent: content, rect, parent: null });
// Offsets of elements whose parent is not positioned fall through to the row.
function flatten(root) {
  const fix = (n, parent) => n.children.forEach((c) => { if (c.offsetParent === null) c.offsetParent = parent; fix(c, c.offsetParent); });
  fix(root, root);
}
function setup(scale = 1) {
  const context = { document: { createRange: () => ({ node: null, selectNodeContents(n) { this.node = n; },
    getBoundingClientRect() { const r = this.node.rect; return { left: r[0] * scale, top: r[1] * scale, right: (r[0] + r[2]) * scale, bottom: (r[1] + r[3]) * scale, width: r[2] * scale, height: r[3] * scale }; } }) } };
  vm.createContext(context); vm.runInContext(code, context);
  return context;
}
const own = () => element('egeltools-hero-swap button_new square', [0, 0, 29, 29]);
const button = (cls, offset) => element(`${cls} button_new double_border`, offset, { children: [element('left', [0, 0, 6, 29])] });
const infoColumn = () => element('info', [470, 20, 180, 50], { children: [
  element('pb_exp', [0, 5, 120, 20], { children: [element('indicator', [2, 2, 10, 16])] }),
  element('btn_send_resources button_new square', [130, 5, 29, 29]),
] });
function row(locationsChildren, extra = [], options = {}) {
  const mine = own();
  const locations = element('locations', [215, 30, 160, 29], { children: locationsChildren });
  const node = element('hero_slot', [0, 0, 700, 90], { children: [
    element('decoration decoration-top', [0, 0, 700, 4]),
    element('portrait hero123x87', [5, 2, 123, 87], { children: [element('level', [2, 70, 50, 14])] }),
    element('hero_caption', [150, 8, 300, 18], { children: [text('Ajax (', [150, 8, 40, 18]), element('gp_town_link', [40, 0, 90, 18]), text(')', [280, 8, 6, 18])] }),
    locations, element('hero_type', [460, 32, 24, 24], { children: [element('war', [0, 0, 24, 24])] }), infoColumn(), ...extra, mine,
  ] });
  if (options.flatLocations) node.children.forEach((c) => { if (c === locations) c.children.forEach((b) => { b.offsetParent = node; b.offsetLeft += 215; b.offsetTop += 30; }); });
  flatten(node);
  node.getBoundingClientRect = () => ({ left: 0, top: 0, width: 700 * (options.scale || 1), height: 90 });
  return { node, mine };
}
const place = (context, fixture) => { const r = context.getCouncilHeroButtonPlacement(fixture.node, fixture.mine); return r && { ...r }; };

const context = setup();
// Free space right of the 160px Unassign/Assign button: 215 + 160 + 6, centered on its 29px height.
assert.deepEqual(place(context, row([button('btn_hero_unassign', [0, 0, 160, 29])])), { left: 381, top: 30 });
// Offsets inside a positioned .locations box and offsets flattened onto the row give the same answer.
assert.deepEqual(place(context, row([button('btn_hero_not_assigned', [0, 0, 160, 29])], [], { flatLocations: true })), { left: 381, top: 30 });
// A second native button in the cluster (Cancel) extends the anchor instead of being covered.
assert.deepEqual(place(context, row([button('btn_hero_unassign', [0, 0, 100, 29]), button('btn_hero_cancel', [106, 0, 80, 29])])), { left: 407, top: 30 });
// A travel timer text run right of the button blocks that side, so the button moves to the left side.
assert.deepEqual(place(context, row([button('btn_hero_cancel', [0, 0, 160, 29]), text('00:12:34', [380, 35, 60, 18])])), { left: 180, top: 30 });
// The same timer measured under 50% UI scaling still blocks the right side.
assert.deepEqual(place(setup(0.5), row([button('btn_hero_cancel', [0, 0, 160, 29]), text('00:12:34', [380, 35, 60, 18])], [], { scale: 0.5 })), { left: 180, top: 30 });
// A leaf element placed right of the cluster blocks it too; the hero_type icon further right does not.
assert.deepEqual(place(context, row([button('btn_hero_unassign', [0, 0, 160, 29])], [element('spinner', [385, 34, 20, 20])])), { left: 180, top: 30 });
// A travelling hero (live markup): arrival bar plus square Cancel button. The control sits right of
// Cancel, centered on the group, and the timer text inside the bar is not treated as an obstacle.
const travelling = () => element('on_the_way_town', [0, 0, 160, 29], { children: [
  element('pb_on_the_way_town_ajax single-progressbar double_border', [0, 4, 120, 20], { children: [
    element('border_l', [0, 0, 4, 20]), element('progress', [4, 2, 112, 16], { children: [element('indicator', [0, 0, 100, 16])] }),
    element('caption', [4, 0, 112, 20], { children: [text('Aankomst: 01:58:04', [225, 34, 100, 18])] }),
  ] }),
  element('btn_cancel_town_travel ajax button_new square remove', [126, 3, 23, 23]),
] });
assert.deepEqual(place(context, row([travelling()])), { left: 370, top: 30 });
// The same group when something occupies the right side: the control moves left of the arrival bar.
assert.deepEqual(place(context, row([travelling()], [element('spinner', [372, 34, 20, 20])])), { left: 180, top: 30 });
// No native button: the .locations box itself anchors the control.
assert.deepEqual(place(context, row([])), { left: 381, top: 30 });
// Hidden native buttons are ignored like missing ones.
assert.deepEqual(place(context, row([button('btn_hero_unassign', [0, 0, 0, 0])])), { left: 381, top: 30 });
// Without a .locations box there is nothing to anchor to.
assert.equal(place(context, { node: element('hero_slot', [0, 0, 700, 90], { children: [own()] }), mine: own() }), null);
console.log('Hero swap placement: cluster anchoring, offset chains, timer and obstacle avoidance, UI scaling and fallbacks passed');
