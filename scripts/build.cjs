const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, 'src', name), 'utf8');
const escapeAttribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const replaceOnce = (source, token, value) => {
  if (source.split(token).length !== 2) throw new Error(`Expected one ${token}`);
  return source.replace(token, () => value);
};

let inner = read('visualization.html');
inner = replaceOnce(inner, '<!-- NETWORK_LAB_TABS -->', read('tabs.html'));
inner = replaceOnce(inner, '<!-- ENCAPSULATION_PANEL -->',
  '<script>\n' + read('encapsulation-model.js') + '\n</script>\n' + read('encapsulation.html'));
inner = replaceOnce(inner, '<!-- NETWORK_LAB_CONTROLLER -->', '<script>\n' + read('tabs.js') + '\n</script>');
inner = replaceOnce(inner, '<!-- SWITCHING_PANEL -->', '<script>\n' + read('switching-model.js') + '\n</script>\n' + read('switching.html') + '\n<script>\n' + read('switching.js') + '\n</script>');
const shell = read('standalone-shell.html');
let checked = 0;
for (const doc of [inner, shell]) {
  for (const [, attributes, source] of doc.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\btype=["']application\/json/.test(attributes) || /\bsrc=/.test(attributes)) continue;
    new vm.Script(source, { filename: `inline-script-${++checked}.js` });
  }
}
const output = replaceOnce(shell, '__NETWORK_LAB_SRCDOC__', escapeAttribute(inner));
const embedded = output.match(/data-srcdoc="([^"]*)"/);
if (!embedded || !embedded[1].trimEnd().endsWith('&lt;/html&gt;')) throw new Error('Embedded page is truncated');
fs.writeFileSync(path.join(root, 'Animacia_priepustnosti_siete.html'), output, 'utf8');
console.log(`Built standalone HTML; ${checked} inline scripts passed syntax checks.`);
