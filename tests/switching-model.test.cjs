const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/switching-model.js');

test('presentation sequence learns source only and preserves the destination during flooding', () => {
  let table=[];
  const expected=[['unknown',[2,3,4],1],['known',[1],2],['unknown',[1,3,4],3],['known',[2],4],['broadcast',[1,3,4],4]];
  M.lesson.forEach(([source,destination],i) => {
    const before=JSON.stringify(table), r=M.process(table,{source,destination});
    assert.equal(JSON.stringify(table),before,'Input table is not mutated');
    assert.deepEqual([r.kind,r.ports,r.table.length],expected[i]);
    assert.equal(r.destination,destination==='broadcast' ? M.BROADCAST : M.mac(destination));
    table=r.table;
  });
});
test('six exercise frames match the presentation solutions', () => {
  let table=[];
  const outputs=[[2,3,4],[1],[3],[2,3,4],[1,2,3],[4]];
  for (const [i,[source,destination]] of M.exercise.entries()) {
    const r=M.process(table,{source,destination});
    assert.deepEqual(r.ports,outputs[i]); table=r.table;
  }
  assert.equal(table.length,4);
});
test('VLAN scopes learning and flooding, and same-ingress destination is filtered', () => {
  const table=M.process([],{source:3,destination:1},[1,1,2,2]).table;
  const unicast=M.process(table,{source:1,destination:3},[1,1,2,2]);
  assert.equal(unicast.kind,'unknown'); assert.deepEqual(unicast.ports,[2]);
  assert.deepEqual(M.process(table,{source:4,destination:'broadcast'},[1,1,2,2]).ports,[3]);
  assert.deepEqual(M.process([],{source:1,destination:1}).ports,[]);
  assert.equal(M.process([],{source:1,destination:1}).kind,'filtered');
});
test('refresh delays expiry, and a moved source updates its port', () => {
  const first=M.process([],{source:1,destination:3},undefined,0).table;
  const refreshed=M.process(first,{source:1,destination:3},undefined,200).table;
  assert.equal(M.age(refreshed,499).length,1);
  assert.equal(M.age(refreshed,500).length,0);
  const stale=[{...first[0],port:2}];
  assert.equal(M.process(stale,{source:1,destination:3}).table[0].port,1);
  assert.equal(stale[0].port,2);
});
test('equal total memory gives shared buffering more room for a burst, but neither absorbs sustained overload', () => {
  const empty=()=>({queues:[[],[],[],[]],sent:0,dropped:0});
  const port=M.bufferTick(empty(),10,1,'port');
  const shared=M.bufferTick(empty(),10,1,'shared');
  assert.equal(port.queues[3].length,4); assert.equal(port.dropped,6);
  assert.equal(shared.queues[3].length,10); assert.equal(shared.dropped,0);
  const next=M.bufferTick(shared,10,1,'shared');
  assert.equal(next.queues[3].length,16); assert.equal(next.dropped,3); assert.equal(next.sent,1);
  let drained=next;
  for(let i=0;i<16;i++) drained=M.bufferTick(drained,0,1,'shared');
  assert.equal(drained.queues.flat().length,0); assert.equal(drained.sent,17); assert.equal(drained.dropped,3);
});
