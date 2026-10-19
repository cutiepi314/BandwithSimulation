const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../src/speed-model.js');
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);

test('a serial path is limited by the slow link, then by the next constraint after an upgrade',()=>{
  const r=M.path({links:[1000,100,1000]});
  assert.equal(r.linkLimit,100);assert.equal(r.goodput,100);assert.equal(r.megabytes,12.5);assert.equal(r.seconds,80);assert.deepEqual(r.bottlenecks,[1]);
  const upgrade=M.path({links:[1000,1000,1000]});
  assert.equal(upgrade.seconds,8);assert.deepEqual(upgrade.bottlenecks,[0,1,2]);
  const disk=M.path({links:[1000,1000,1000],diskMBps:40});
  assert.equal(disk.goodput,320);assert.equal(disk.diskLimited,true);assert.deepEqual(disk.bottlenecks,[]);
  const overhead=M.path({links:[1000,100,1000],efficiency:90});
  assert.equal(overhead.goodput,90);near(overhead.seconds,8000/90);
});
test('four clients split the common uplink and a faster uplink can expose the server limit',()=>{
  const c={clients:4,demand:1000,uplink:1000,server:1000,bufferMB:16};
  assert.equal(M.sharing(c).perClient,250);
  assert.equal(M.sharing({...c,uplink:10000}).perClient,250);
  assert.equal(M.sharing({...c,uplink:10000,server:10000}).perClient,1000);
  assert.equal(M.sharing({...c,demand:100}).perClient,100);
});
test('two 800 Mb/s inputs accumulate 75 MB/s on a 1 Gb/s output; bigger buffers delay overflow',()=>{
  const c={clients:2,demand:800,uplink:1000,server:1000,bufferMB:16};
  const r=M.sharing(c);assert.equal(r.offered,1600);assert.equal(r.growthMB,75);near(r.fillSeconds,16/75);
  assert.equal(M.sharing({...c,bufferMB:64}).capacity,r.capacity);
  near(M.sharing({...c,bufferMB:64}).fillSeconds,r.fillSeconds*4);
});
test('queue conserves data through overload and draining, including fractional time steps',()=>{
  const c={clients:2,demand:800,uplink:1000,server:1000,bufferMB:16};
  const initial={queued:0,sent:0,dropped:0,elapsed:0};
  const filled=M.queueStep(initial,c,1);
  assert.deepEqual(filled,{queued:16,sent:125,dropped:59,elapsed:1});
  assert.deepEqual(initial,{queued:0,sent:0,dropped:0,elapsed:0});
  const drained=M.queueStep(filled,{...c,demand:0},1);
  assert.equal(drained.queued,0);assert.equal(drained.sent,141);assert.equal(drained.dropped,59);
  near(drained.sent+drained.dropped+drained.queued,200);
  let fine=initial;for(let i=0;i<10;i++)fine=M.queueStep(fine,c,.1);
  near(fine.queued,filled.queued);near(fine.sent,filled.sent);near(fine.dropped,filled.dropped);
});
test('auto negotiation selects only a shared supported speed',()=>{
  assert.equal(M.negotiate([10,100],[10,100,1000]),100);
  assert.equal(M.negotiate([10,100,1000],[10,100,1000]),1000);
  assert.equal(M.negotiate([100,2500],[10,100,1000]),100);
  assert.equal(M.negotiate([2500],[1000]),null);
});
test('1500 bytes serialize in 120 or 12 microseconds; other latency components survive a speed upgrade',()=>{
  const c={bytes:1500,rate:100,propagation:10,processing:1,queue:0};
  const slow=M.timing(c),fast=M.timing({...c,rate:1000});
  assert.equal(slow.serializationUs,120);assert.equal(fast.serializationUs,12);
  near(slow.rtt,22.24);near(fast.rtt,22.024);
  near(M.timing({...c,queue:50}).oneWay,61.12);
});
