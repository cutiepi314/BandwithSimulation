const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/buildings-model.js');
test('all 32 combinations select the cheapest healthy end-to-end route', () => {
  const keys = ['fiber', 'copper', 'radio', 'routera', 'routerb'];
  for (let mask = 0; mask < 32; mask++) {
    const state = Object.fromEntries(keys.map((key, i) => [key, !!(mask & (1 << i))]));
    const expected = !state.routera || !state.routerb ? null : state.fiber ? 'fiber' : state.copper ? 'copper' : state.radio ? 'radio' : null;
    assert.equal(M.route(state), expected, JSON.stringify(state));
    assert.equal(M.backups(state), expected ? M.links.filter(key => state[key]).length - 1 : 0);
  }
});
test('backup failure leaves fiber active and restoration prefers fiber again', () => {
  assert.equal(M.route({ ...M.healthy(), copper: false }), 'fiber');
  assert.equal(M.route({ ...M.healthy(), fiber: false }), 'copper');
  assert.equal(M.route(M.healthy()), 'fiber');
});
test('custom prices work for all six preference orders and all 32 failure states', () => {
  const permutations = [['fiber','copper','radio'],['fiber','radio','copper'],['copper','fiber','radio'],['copper','radio','fiber'],['radio','fiber','copper'],['radio','copper','fiber']];
  const keys = ['fiber','copper','radio','routera','routerb'];
  for (const order of permutations) {
    const costs = Object.fromEntries(order.map((key,i) => [key,(i+1)*7]));
    for (let mask=0;mask<32;mask++) {
      const state = Object.fromEntries(keys.map((key,i) => [key,!!(mask&(1<<i))]));
      const expected = state.routera && state.routerb ? order.find(key=>state[key]) || null : null;
      assert.equal(M.route(state,costs), expected, JSON.stringify({state,costs}));
    }
  }
});
test('ties are explicit and OSPF prices accept only supported integers', () => {
  const costs = {fiber:8,copper:8,radio:8};
  assert.equal(M.route(M.healthy(),costs), 'fiber');
  assert.equal(M.route({...M.healthy(),fiber:false},costs), 'copper');
  assert.match(M.explanation(M.healthy(),costs), /ECMP/);
  assert.ok(M.validCosts({fiber:1,copper:65535,radio:23}));
  for (const value of [0,-1,1.5,65536,NaN,Infinity,'10',undefined]) assert.equal(M.validCosts({fiber:value,copper:20,radio:30}),false);
  assert.equal(M.validCosts(null), false);
});
test('nine exercise outcomes derive from actual network states', () => {
  assert.deepEqual(M.scenarios.map(s => M.route(s.state)), ['fiber','copper','fiber','radio','copper','fiber','radio',null,'fiber']);
  assert.equal(M.route(M.scenarios[8].before), 'copper');
});
test('copper length includes the whole channel and handles the exact limit', () => {
  assert.deepEqual(M.cable([70,7,8,5]), { total:90, remaining:10, status:'within' });
  assert.equal(M.cable([80,7,8,5]).status, 'exact');
  assert.equal(M.cable([80.01,7,8,5]).status, 'over');
  assert.equal(M.cable([80.1,7,8,4.9]).status, 'exact');
  for (const values of [[-1,7,8,5],[NaN,0,0,0],[Infinity,0,0,0],[10001,0,0,0],[]]) assert.equal(M.cable(values), null);
});
