(function (root) {
  'use strict';
  const links = ['fiber', 'copper', 'radio'];
  const labels = { fiber: 'Optika', copper: 'Medený Ethernet', radio: 'Rádio', none: 'Komunikácia nefunguje' };
  const costs = { fiber: 10, copper: 20, radio: 30 };
  const healthy = () => ({ fiber: true, copper: true, radio: true, routera: true, routerb: true });
  function validCosts(values) { return !!values && links.every(key => Number.isInteger(values[key]) && values[key] >= 1 && values[key] <= 65535); }
  function route(state, preferences = costs) {
    if (!state.routera || !state.routerb) return null;
    return links.filter(key => state[key]).sort((a,b) => preferences[a] - preferences[b] || links.indexOf(a) - links.indexOf(b))[0] || null;
  }
  function backups(state, preferences = costs) { return route(state, preferences) ? links.filter(key => state[key]).length - 1 : 0; }
  function explanation(state, preferences = costs) {
    if (!state.routera || !state.routerb) return 'Spoločný router má poruchu. Všetky tri cesty ním musia prejsť. Miestna komunikácia PC cez prístupový switch môže pokračovať.';
    const chosen = route(state, preferences);
    if (!chosen) return 'Všetky tri spoje majú poruchu. Medzi budovami nie je dostupná žiadna cesta. Miestne siete môžu ďalej fungovať.';
    const tied = links.some(key => key !== chosen && state[key] && preferences[key] === preferences[chosen]);
    return labels[chosen] + ' má ' + (tied ? 'rovnakú najnižšiu cenu ako ďalší spoj' : 'najnižšiu cenu zo všetkých funkčných ciest') + ' (' + preferences[chosen] + '). ' + (tied ? 'Pri zhode model rozhoduje v poradí optika, meď, rádio. Reálne OSPF môže použiť viac rovnocenných ciest (ECMP).' : 'Ostatné funkčné spoje zostávajú ako záloha.');
  }
  const scenarios = [
    ['Všetky spoje fungujú. Ktorý sa použije?', {}, 'Vyberie sa najnižšia cena: 10 je menej než 20 a 30.', 'Výber podľa ceny'],
    ['Vypadne optika.', { fiber: false }, 'Optika nefunguje. Porovnaj ceny dvoch zostávajúcich spojov.', 'Prepnutie na zálohu'],
    ['Vypadne iba meď, optika zostane funkčná.', { copper: false }, 'Porucha záložného spoja nemení zdravú preferovanú cestu.', 'Porucha záložného spoja'],
    ['Vypadnú optika aj meď.', { fiber: false, copper: false }, 'Zostáva jediný funkčný spoj. Aj drahšia cesta môže zachrániť spojenie.', 'Prepnutie na rádio'],
    ['Zostane funkčná iba meď.', { fiber: false, radio: false }, 'Vyberáme iba medzi funkčnými spojmi.', 'Samostatná medená cesta'],
    ['Zostane funkčná iba optika.', { copper: false, radio: false }, 'Na prenos stačí jedna úplná funkčná cesta.', 'Samostatná optická cesta'],
    ['Zostane funkčné iba rádio.', { fiber: false, copper: false }, 'Káble majú poruchu, bezdrôtový spoj je zdravý.', 'Samostatná rádiová cesta'],
    ['Vypadne router v budove A.', { routera: false }, 'Každá z troch ciest vedie cez spoločný router.', 'Spoločný bod poruchy'],
    ['Po výpadku sa optika obnoví.', {}, 'Obnovená cesta s cenou 10 sa opäť uprednostní pred cestou s cenou 20.', 'Návrat preferovanej cesty']
  ].map(([title, changes, hint, topic], index) => ({ title, state: { ...healthy(), ...changes }, hint, topic, before: index === 8 ? { ...healthy(), fiber: false } : healthy() }));
  function cable(values) {
    if (values.length !== 4 || values.some(n => !Number.isFinite(n) || n < 0 || n > 10000)) return null;
    const total = Math.round(values.reduce((sum, n) => sum + n, 0) * 1e9) / 1e9;
    return { total, remaining: Math.round((100 - total) * 1e9) / 1e9, status: total > 100 ? 'over' : total === 100 ? 'exact' : 'within' };
  }
  const api = { links, labels, costs, validCosts, healthy, route, backups, explanation, scenarios, cable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BuildingsModel = api;
})(typeof window === 'undefined' ? globalThis : window);
