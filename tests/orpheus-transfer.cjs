const fs = require('fs'), vm = require('vm'), assert = require('assert');
const source = fs.readFileSync('EgelTools.user.js','utf8');
const code = source.slice(source.indexOf('  let orpheusTransferPending'), source.indexOf('  function createCultureOrpheusStatus'));
async function run(confirm, travel, occupant, incoming = false) {
 const calls=[];
 const hero={getId:()=> 'orpheus', getArrivalAt:()=>travel?200:0,getOriginTownId:()=>1,execute(a,p,c){calls.push([a,p.target_town_id]); if(a==='cancelTownTravel') this.getOriginTownId=()=>null;c.success();}};
 const other={getName:()=> 'Other',getHomeTownId:()=>incoming?null:2,getTargetTownId:()=>incoming?2:null,getAssignmentArrivalAt:()=>incoming?200:0,getId:()=> 'other',execute(a,p,c){calls.push([a,p.target_town_id]);c.success();}};
 const context={window:{setTimeout,clearTimeout,MM:{getCollections:()=>({PlayerHero:[[hero,...(occupant?[other]:[])]]})},ConfirmationWindowFactory:{openSimpleConfirmation(t,q,yes,no){(confirm?yes:no)();}}},getCultureOrpheus:()=>hero,isAdministratorActive:()=>true,getModelArray:x=>x,getFirstMethodValue:(x,methods)=>{for(const m of methods) if(typeof x?.[m]==='function'){const v=x[m]();if(v!=null)return v;}return null;},normalizeResourceCheckerTimestamp:x=>x||null,getResourceCheckerServerTime:()=>100,renderAdministratorOrpheus(){},renderCelebrationFinder(){},showCelebrationMessage(m){throw Error(m);}};
 vm.createContext(context);vm.runInContext(code,context);await context.moveCultureOrpheus(2);return calls;
}
(async()=>{
 assert.deepStrictEqual(await run(false,true,true),[]);
 assert.deepStrictEqual(await run(true,true,true),[['cancelTownTravel',1],['unassignFromTown',2],['assignToTown',2]]);
 assert.deepStrictEqual(await run(true,false,false),[['unassignFromTown',1],['assignToTown',2]]);
 assert.deepStrictEqual(await run(false,false,true,true),[]);
 assert.deepStrictEqual(await run(true,false,true,true),[['unassignFromTown',1],['cancelTownTravel',2],['assignToTown',2]]);
 console.log('Orpheus cancellation, native confirmation, and action ordering checks passed');
})();
