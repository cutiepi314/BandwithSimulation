(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BackupModel = api;
}(globalThis, function () {
  'use strict';
  // Archive-bit model: a change sets the bit, full and incremental backups clear it, differential leaves it set.
  function simulate({ sizes, changes, schedule }) {
    const versions = sizes.map(() => 1), bits = sizes.map(() => true), backups = [];
    let lastClear = null;
    schedule.forEach((requested, day) => {
      for (const i of changes[day] || []) { versions[i]++; bits[i] = true; }
      const type = lastClear === null ? 'full' : requested;
      const bitsBefore = bits.slice();
      const files = sizes.flatMap((_, i) => type === 'full' || bits[i] ? [i] : []);
      const parent = type === 'full' ? null : lastClear;
      if (type !== 'diff') { bits.fill(false); lastClear = day; }
      backups.push({ day, type, forced: type !== requested, files, versions: versions.slice(), parent,
        size: files.reduce((sum, i) => sum + sizes[i], 0), bitsBefore, bitsAfter: bits.slice() });
    });
    return backups;
  }
  function chain(backups, day) {
    const list = [];
    for (let d = day; d !== null; d = backups[d].parent) list.unshift(d);
    return list;
  }
  function restore(backups, day, corrupted = []) {
    const sets = chain(backups, day), missing = sets.filter(d => corrupted.includes(d));
    const source = backups[day].versions.map((_, i) => sets.reduce((found, d) => backups[d].files.includes(i) ? d : found, null));
    let latest = null;
    for (let d = day; d >= 0 && latest === null; d--) if (!chain(backups, d).some(x => corrupted.includes(x))) latest = d;
    return { sets, ok: missing.length === 0, missing, source, latest,
      readMB: sets.reduce((sum, d) => sum + backups[d].size, 0) };
  }
  function plan(strategy, days) {
    return Array.from({ length: days }, (_, day) => day === 0 || strategy === 'full' ? 'full' : strategy);
  }
  function compare({ sizes, changes, days }) {
    return Object.fromEntries(['full', 'inc', 'diff'].map(strategy => {
      const backups = simulate({ sizes, changes, schedule: plan(strategy, days) });
      return [strategy, { backups, totalMB: backups.reduce((sum, b) => sum + b.size, 0),
        restoreSets: backups.map(b => chain(backups, b.day).length) }];
    }));
  }
  return { simulate, chain, restore, plan, compare };
}));
