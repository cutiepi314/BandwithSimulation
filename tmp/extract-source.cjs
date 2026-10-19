const fs = require('node:fs');
const html = fs.readFileSync('Animacia_priepustnosti_siete.html', 'utf8');
const match = /data-srcdoc="([^"]*)"/.exec(html);
if (!match) throw Error('Missing srcdoc');
const decode = input => input.replace(/&(#x[0-9a-f]+|#\d+|quot|apos|lt|gt|amp);/gi, (_, entity) => entity[0] === '#'
  ? String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10))
  : ({ quot: '"', apos: "'", lt: '<', gt: '>', amp: '&' })[entity.toLowerCase()]);
let inner = decode(match[1]);
inner = inner.replace('<html lang="en"', '<html lang="sk"');
inner = inner.replace('<title>Animácia priepustnosti siete</title>', '<title>Sieťové laboratórium</title>');
inner = inner.replace('<div id="net-flow-sk">', '<!-- NETWORK_LAB_TABS -->\n<section id="throughput-panel" role="tabpanel" aria-labelledby="throughput-tab">\n<div id="net-flow-sk">');
inner = inner.replace('<script src="https://unpkg.com/@floating-ui/core', '</section>\n<section id="encapsulation-panel" role="tabpanel" aria-labelledby="encapsulation-tab" hidden>\n<!-- ENCAPSULATION_PANEL -->\n</section>\n<!-- NETWORK_LAB_CONTROLLER -->\n<script src="https://unpkg.com/@floating-ui/core');
inner = inner.replace("const observer = new ResizeObserver(() => { draw(performance.now()); }); observer.observe(el('flow-area'));", "window.NetworkFlow = { pause() { playing = false; updateLabels(); }, redraw() { draw(performance.now()); } };\n    const observer = new ResizeObserver(() => { draw(performance.now()); }); observer.observe(el('flow-area'));");
let shell = html.slice(0, match.index) + 'data-srcdoc="__NETWORK_LAB_SRCDOC__"' + html.slice(match.index + match[0].length);
shell = shell.replace('<html lang="en"', '<html lang="sk"').replaceAll('Animácia priepustnosti siete', 'Sieťové laboratórium');
fs.mkdirSync('src', {recursive: true});
fs.writeFileSync('src/visualization.html', inner);
fs.writeFileSync('src/standalone-shell.html', shell);
console.log('Preserved existing visualization and standalone bootstrap as editable source.');
