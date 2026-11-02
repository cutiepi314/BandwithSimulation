const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/backup-model.js');
const sizes=[20,15,400,250,60,120,1,900];
const changes=[[],[0,6],[1,3],[0,4],[3,6],[5],[2]];
const week=strategy=>M.simulate({sizes,changes,schedule:M.plan(strategy,7)});

test('full backups copy everything, incremental only the daily change, differential everything since the full',()=>{
  assert.deepEqual(week('full').map(b=>b.size),[1766,1766,1766,1766,1766,1766,1766]);
  assert.deepEqual(week('inc').map(b=>b.size),[1766,21,265,80,251,120,400]);
  assert.deepEqual(week('diff').map(b=>b.size),[1766,21,286,346,346,466,866]);
  const r=M.compare({sizes,changes,days:7});
  assert.equal(r.full.totalMB,12362);assert.equal(r.inc.totalMB,2903);assert.equal(r.diff.totalMB,4097);
});
test('restore needs one set, the whole incremental chain, or the full plus the last differential',()=>{
  assert.deepEqual(M.restore(week('full'),6).sets,[6]);
  assert.deepEqual(M.restore(week('inc'),6).sets,[0,1,2,3,4,5,6]);
  assert.deepEqual(M.restore(week('diff'),6).sets,[0,6]);
  assert.equal(M.restore(week('diff'),6).readMB,2632);
  assert.deepEqual(M.compare({sizes,changes,days:7}).inc.restoreSets,[1,2,3,4,5,6,7]);
});
test('archive bit: differential keeps it set, incremental and full clear it',()=>{
  const diff=week('diff'),inc=week('inc');
  assert.equal(diff[1].bitsAfter[0],true);assert.equal(inc[1].bitsAfter[0],false);
  assert.ok(week('full')[3].bitsAfter.every(bit=>!bit));
  assert.deepEqual(diff[2].bitsBefore.map(Number),[1,1,0,1,0,0,1,0]);
});
test('the first backup is always full and mixed plans restore every file to its latest version',()=>{
  const forced=M.simulate({sizes,changes,schedule:['inc','inc']});
  assert.equal(forced[0].type,'full');assert.equal(forced[0].forced,true);
  const mixed=M.simulate({sizes,changes,schedule:['full','inc','diff','inc','diff','full','diff']});
  assert.deepEqual(mixed[3].files,[0,1,3,4]);assert.deepEqual(M.chain(mixed,3),[0,1,3]);assert.deepEqual(M.chain(mixed,4),[0,1,3,4]);
  for(const backups of [mixed,week('full'),week('inc'),week('diff')]) for(const b of backups){
    const r=M.restore(backups,b.day);
    r.source.forEach((d,i)=>assert.equal(backups[d].versions[i],b.versions[i],`day ${b.day} file ${i}`));
  }
});
test('a damaged backup breaks only the chains that contain it',()=>{
  const inc=M.restore(week('inc'),6,[2]);
  assert.equal(inc.ok,false);assert.deepEqual(inc.missing,[2]);assert.equal(inc.latest,1);
  const diff=M.restore(week('diff'),6,[2]);
  assert.equal(diff.ok,true);assert.equal(diff.latest,6);
  assert.equal(M.restore(week('diff'),6,[0]).latest,null);
});
