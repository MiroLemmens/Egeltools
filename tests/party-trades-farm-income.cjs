const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/../EgelTools.user.js`, 'utf8');
const Game = { game_speed: 1 };
const relation = { expansion_stage: 6, town_id: 1, farm_town_id: 10 };
const context = vm.createContext({
 window: { Game, MM: { getModels: () => ({ FarmTownPlayerRelation: [relation], FarmTown: [{ id: 10, island_x: 5, island_y: 6 }] }) } },
 RESOURCE_CHECKER: { loyaltyClaimByFarmLevel: [0,28,34,40,45,51,57] },
 getModelArray: x => x || [],
 getFirstMethodValue: (model, methods, attrs) => attrs.map(key => model?.[key]).find(value => value != null),
});
vm.runInContext(source.slice(source.indexOf('  function getLoyaltyClaimIncomePerTown('), source.indexOf('  function addCelebrationForecasts(')), context);
const towns = [{ id: 1, islandX: 5, islandY: 6 }, { id: 2, islandX: 5, islandY: 6 }];
for (const speed of [1, 2, 3, 5, '3']) {
 Game.game_speed = speed;
 assert.equal(context.getLoyaltyClaimIncomePerTown(towns).get('1'), 57 * Number(speed));
}
for (const speed of [undefined, 0, -1, 'invalid', Infinity]) {
 Game.game_speed = speed;
 assert.equal(context.getLoyaltyClaimIncomePerTown(towns).get('1'), 57);
}
Game.game_speed = 3; delete relation.town_id;
const split = context.getLoyaltyClaimIncomePerTown(towns);
assert.equal(split.get('1'), 85.5);
assert.equal(split.get('2'), 85.5);
console.log('Farm income world speed and island allocation checks passed');
