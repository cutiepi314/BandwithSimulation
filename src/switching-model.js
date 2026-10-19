(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SwitchingModel = api;
}(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const BROADCAST = 'FF:FF:FF:FF:FF:FF';
  const mac = n => '02:00:00:00:00:0' + n;
  const lesson = [[1,3],[3,1],[2,4],[4,2],[2,'broadcast']];
  const exercise = [[1,3],[3,1],[2,3],[1,4],[4,'broadcast'],[3,4]];
  function process(table, frame, vlans = [1,1,1,1], now = 0) {
    const next = table.map(row => ({ ...row }));
    const vlan = vlans[frame.source - 1];
    const source = mac(frame.source);
    const destination = frame.destination === 'broadcast' ? BROADCAST : mac(frame.destination);
    const found = next.find(row => row.mac === source && row.vlan === vlan);
    const learned = !found;
    if (found) { found.port = frame.source; found.seen = now; }
    else next.push({ vlan, mac: source, port: frame.source, seen: now });
    next.sort((a,b) => a.vlan - b.vlan || a.mac.localeCompare(b.mac));
    const target = next.find(row => row.mac === destination && row.vlan === vlan);
    const kind = destination === BROADCAST ? 'broadcast' : !target ? 'unknown' : target.port === frame.source ? 'filtered' : 'known';
    const ports = kind === 'known' ? [target.port] : kind === 'filtered' ? [] : vlans.flatMap((v,i) => v === vlan && i + 1 !== frame.source ? [i+1] : []);
    return { table: next, source, destination, vlan, kind, ports, learned, ingress: frame.source };
  }
  function age(table, now, timeout = 300) { return table.filter(row => now - row.seen < timeout).map(row => ({...row})); }
  // Equal-size frames; one tick equals one frame's serialization time at 10 Mb/s.
  function bufferTick(state, incoming, output, mode, port = 4) {
    const queues = state.queues.map(q => q.slice());
    let sent = 0, dropped = 0;
    for (let i=0;i<4;i++) sent += queues[i].splice(0, output).length;
    for (let i=0;i<incoming;i++) {
      const available = mode === 'shared' ? queues.reduce((n,q) => n + q.length, 0) < 16 : queues[port-1].length < 4;
      if (available) queues[port-1].push(port); else dropped++;
    }
    return { queues, sent: state.sent + sent, dropped: state.dropped + dropped };
  }
  return { BROADCAST, mac, lesson, exercise, process, age, bufferTick };
}));
