(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpeedModel = api;
}(globalThis, function () {
  'use strict';
  function path({ links, diskMBps = 0, efficiency = 100, fileMB = 1000 }) {
    const linkLimit = Math.min(...links);
    const limit = Math.min(linkLimit, diskMBps > 0 ? diskMBps * 8 : Infinity);
    const goodput = limit * efficiency / 100;
    return { linkLimit, limit, goodput, megabytes: goodput / 8, seconds: fileMB * 8 / goodput,
      bottlenecks: links.flatMap((rate,i) => rate === limit ? [i] : []), diskLimited: diskMBps > 0 && diskMBps * 8 === limit };
  }
  function sharing({ clients, demand, uplink, server, bufferMB }) {
    const offered = clients * demand;
    const capacity = Math.min(uplink, server);
    const excess = Math.max(0, offered - capacity);
    return { offered, capacity, excess, perClient: Math.min(demand, capacity / clients),
      growthMB: excess / 8, fillSeconds: excess > 0 ? bufferMB * 8 / excess : Infinity };
  }
  // Fluid-rate teaching model. Arrivals and output service occur throughout dt.
  function queueStep(state, config, dt) {
    const r = sharing(config), arriving = r.offered * dt / 8;
    const sent = Math.min(state.queued + arriving, r.capacity * dt / 8);
    const backlog = Math.max(0, state.queued + arriving - sent);
    const dropped = Math.max(0, backlog - config.bufferMB);
    return { queued: Math.min(config.bufferMB, backlog), sent: state.sent + sent,
      dropped: state.dropped + dropped, elapsed: state.elapsed + dt };
  }
  function negotiate(a,b) { const common = a.filter(n=>b.includes(n)); return common.length ? Math.max(...common) : null; }
  function timing({ bytes, rate, propagation, processing, queue }) {
    const serializationUs = bytes * 8 / rate;
    const oneWay = serializationUs / 1000 + propagation + processing + queue;
    return { serializationUs, oneWay, rtt: oneWay * 2 };
  }
  return { path, sharing, queueStep, negotiate, timing };
}));
