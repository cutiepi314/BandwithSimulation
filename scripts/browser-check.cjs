const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'tmp', 'browser');
fs.mkdirSync(output, { recursive: true });
const browserPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profile = path.join(output, `profile-${process.pid}`);
// Keep the sandboxed srcdoc in this CDP target so the harness can inspect it.
const child = spawn(browserPath, ['--headless=new', '--disable-gpu', '--disable-site-isolation-trials', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const pending = new Map();
const contexts = new Map();
const errors = [];
let sequence = 0;
async function until(fn, description, timeout = 15000) {
  const deadline = Date.now() + timeout;
  do { try { const value = await fn(); if (value) return value; } catch {} await delay(100); } while (Date.now() < deadline);
  throw Error('Timed out: ' + description);
}
function cdp(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 15000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
let contextId;
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, contextId, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.text + ': ' + (result.exceptionDetails.exception?.description || expression));
  return result.result.value;
}
async function select(id, value) { return evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change',{bubbles:true}));`); }
async function input(id, value) { return evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('input',{bubbles:true}));`); }
async function click(id) { return evaluate(`document.getElementById(${JSON.stringify(id)}).click()`); }
async function screenshot(name, width, height) {
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await delay(200);
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(shot.data, 'base64'));
}
(async () => {
  const activePort = await until(() => fs.existsSync(path.join(profile, 'DevToolsActivePort')) && fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0], 'headless browser startup');
  const pages = await (await fetch(`http://127.0.0.1:${activePort}/json/list`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const p = pending.get(message.id); pending.delete(message.id); message.error ? p.reject(Error(message.error.message)) : p.resolve(message.result); }
    if (message.method === 'Runtime.executionContextCreated') contexts.set(message.params.context.id, message.params.context);
    if (message.method === 'Runtime.executionContextDestroyed') contexts.delete(message.params.executionContextId);
    if (message.method === 'Runtime.executionContextsCleared') contexts.clear();
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  // The standalone file must work even when optional icon/tooltip CDNs are unavailable.
  await cdp('Network.setBlockedURLs', { urls: ['https://unpkg.com/*'] });
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: pathToFileURL(path.join(root, 'Animacia_priepustnosti_siete.html')).href });
  await until(async () => {
    for (const [id, context] of contexts) {
      if (!context.auxData?.isDefault) continue;
      try {
        const value = await cdp('Runtime.evaluate', { expression: '!!window.EncapsulationLab && !!window.SwitchingLab && !!window.SpeedLab', contextId: id, returnByValue: true });
        if (value.result?.value) { contextId = id; return true; }
      } catch { contexts.delete(id); }
    }
  }, 'embedded lab initialized');
  assert.equal(await evaluate("document.getElementById('encapsulation-panel').hidden"), true);
  assert.equal(await evaluate("document.querySelectorAll('#net-stations .station').length"), 5);
  await click('encapsulation-tab');
  assert.equal(await evaluate("document.getElementById('throughput-panel').hidden"), true);
  assert.equal(await evaluate("document.getElementById('enc-error').hidden"), true);
  assert.equal(await evaluate("document.getElementById('enc-metric-frame').textContent"), '64 B');
  for (let i = 0; i < 14; i++) {
    await evaluate(`document.querySelector('#enc-sender-stack [data-step="${i}"] , #enc-receiver-stack [data-step="${i}"]').click()`);
    assert.equal(await evaluate('window.EncapsulationLab.getState().step'), i);
    assert.match(await evaluate("document.getElementById('enc-step-count').textContent"), new RegExp(`Krok ${i + 1} / 14`));
  }
  const combinations = [];
  for (const link of ['ethernet', 'wifi']) for (const transport of ['tcp', 'udp']) for (const ip of ['ipv4', 'ipv6']) for (const encoding of ['utf8', 'utf16le', 'ascii']) {
    await select('enc-link', link); await select('enc-transport', transport); await select('enc-ip-version', ip); await select('enc-text-encoding', encoding);
    assert.equal(await evaluate("document.getElementById('enc-error').hidden"), true, `${link}/${transport}/${ip}/${encoding}`);
    combinations.push([link, transport, ip, encoding, await evaluate("document.getElementById('enc-metric-frame').textContent")]);
  }
  await select('enc-text-encoding', 'utf8'); await input('enc-message', 'Ahoj, sieť 👋');
  const utf8 = await evaluate("document.getElementById('enc-metric-payload').textContent");
  await select('enc-text-encoding', 'utf16le');
  assert.notEqual(await evaluate("document.getElementById('enc-metric-payload').textContent"), utf8);
  await select('enc-text-encoding', 'ascii');
  assert.equal(await evaluate("document.getElementById('enc-error').hidden"), false);
  assert.equal(await evaluate("document.getElementById('enc-journey').hasAttribute('inert')"), true);
  await select('enc-text-encoding', 'utf8');
  await input('enc-dest-port', '70000'); assert.equal(await evaluate("document.getElementById('enc-error').hidden"), false);
  await input('enc-dest-port', '443'); assert.equal(await evaluate("document.getElementById('enc-error').hidden"), true);
  await select('enc-link', 'ethernet'); await select('enc-transport', 'tcp'); await select('enc-ip-version', 'ipv4');
  await evaluate("document.querySelector('#enc-sender-stack [data-step=\"5\"]').click()");
  for (const part of ['link', 'ip', 'transport', 'payload', 'fcs']) {
    await evaluate(`document.querySelector('[data-part="${part}"]').click()`);
    const count = await evaluate("document.querySelectorAll('#enc-fields button').length");
    for (let i = 0; i < count; i++) {
      await evaluate(`document.querySelectorAll('#enc-fields button')[${i}].click()`);
      assert.ok(await evaluate("document.getElementById('enc-bytes').textContent.length > 0"));
    }
  }
  await select('enc-signal-source', 'payload');
  const paths = new Set();
  for (const code of ['nrz', 'manchester', '4b5b', 'bpsk', 'qpsk']) {
    await select('enc-signal-code', code);
    paths.add(await evaluate("document.querySelector('#enc-signal-view path').getAttribute('d')"));
  }
  assert.equal(paths.size, 5);
  await select('enc-byte-format', 'binary');
  await click('enc-reset'); await click('enc-play');
  assert.equal(await evaluate('window.EncapsulationLab.getState().playing'), true);
  await delay(2650); assert.equal(await evaluate('window.EncapsulationLab.getState().step'), 1);
  await click('throughput-tab'); assert.equal(await evaluate('window.EncapsulationLab.getState().playing'), false);
  await screenshot('throughput-desktop', 1440, 1000);
  await click('encapsulation-tab');
  await input('enc-message', 'Ahoj'); await select('enc-byte-format', 'hex'); await select('enc-signal-code', 'manchester');
  await evaluate("document.querySelector('#enc-sender-stack [data-step=\"5\"]').click()");
  await screenshot('lab-desktop', 1440, 1450);
  await screenshot('lab-mobile', 390, 1100);
  const overflow = await evaluate('document.documentElement.scrollWidth > innerWidth + 1');
  assert.equal(overflow, false, 'No page-level mobile overflow');
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
  await screenshot('lab-dark', 1440, 1450);
  await click('switching-tab');
  assert.equal(await evaluate("document.getElementById('encapsulation-panel').hidden"),true);
  assert.equal(await evaluate("document.getElementById('sw-mac-table').textContent.includes('Zatiaľ')"),true);
  const expectedPorts=['Fa0/2, Fa0/3, Fa0/4','Fa0/1','Fa0/1, Fa0/3, Fa0/4','Fa0/2','Fa0/1, Fa0/3, Fa0/4'];
  for (let frame=0;frame<5;frame++) {
    for(let phase=0;phase<3;phase++) await click('sw-next');
    assert.match(await evaluate("document.getElementById('sw-step-title').textContent"),new RegExp(expectedPorts[frame]));
    assert.equal(await evaluate('window.SwitchingLab.getState().table.length'),Math.min(frame+1,4));
    if(frame<4) await click('sw-next');
  }
  await click('sw-prev'); assert.equal(await evaluate('window.SwitchingLab.getState().phase'),2);
  await click('sw-next'); await click('sw-age');
  assert.equal(await evaluate('window.SwitchingLab.getState().table.length'),0);
  await click('sw-lesson'); await click('sw-play');
  assert.equal(await evaluate('window.SwitchingLab.getState().playing'),true);
  await click('encapsulation-tab'); assert.equal(await evaluate('window.SwitchingLab.getState().playing'),false);
  await click('switching-tab');
  await evaluate("document.querySelector('[data-sw-topic=basics]').click()");
  await click('sw-demo-vlan');
  for(let i=0;i<3;i++) await click('sw-next');
  assert.equal(await evaluate("document.getElementById('sw-step-title').textContent"),'Výstup: Fa0/2');
  await click('sw-lesson');
  for(let i=0;i<3;i++) await click('sw-next');
  await screenshot('switching-dark',1440,1200);
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'}]});
  await screenshot('switching-desktop',1440,1200);
  await screenshot('switching-mobile',390,1100);
  for(const name of ['forwarding','buffers','basics','exercise']) {
    await evaluate(`document.querySelector('[data-sw-topic="${name}"]').click()`);
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth + 1'),false,`${name} mobile overflow`);
  }
  const solutions=['Fa0/2, Fa0/3, Fa0/4','Fa0/1','Fa0/3','Fa0/2, Fa0/3, Fa0/4','Fa0/1, Fa0/2, Fa0/3','Fa0/4'];
  for(let i=0;i<6;i++) {
    await evaluate(`Array.from(document.querySelectorAll('#sw-answers button')).find(b=>b.textContent.startsWith(${JSON.stringify(solutions[i])})).click()`);
    assert.match(await evaluate("document.getElementById('sw-exercise-feedback').textContent"),/Správne/);
    if(i<5) await click('sw-exercise-next');
  }
  assert.match(await evaluate("document.getElementById('sw-exercise-feedback').textContent"),/6 zo 6/);
  await evaluate("document.querySelector('[data-sw-topic=forwarding]').click()");
  await select('sw-corrupt','bad'); await input('sw-forward-time','150');
  assert.equal(await evaluate("document.getElementById('sw-tx-bar').style.width"),'0%');
  await select('sw-method','cut'); await input('sw-forward-time','50');
  assert.equal(await evaluate("document.getElementById('sw-tx-bar').style.width"),'42%');
  await click('sw-forward-play'); await click('throughput-tab');
  assert.equal(await evaluate('window.SwitchingLab.getState().playing'),false);
  await click('switching-tab');
  await evaluate("document.querySelector('[data-sw-topic=buffers]').click()");
  await click('sw-buffer-tick');
  assert.equal(await evaluate("document.getElementById('sw-buffer-dropped').textContent"),'6');
  await select('sw-buffer-mode','shared'); await click('sw-buffer-tick');
  assert.equal(await evaluate("document.getElementById('sw-buffer-waiting').textContent"),'10');
  assert.equal(await evaluate("document.getElementById('sw-buffer-dropped').textContent"),'0');
  await click('sw-buffer-tick'); assert.equal(await evaluate("document.getElementById('sw-buffer-dropped').textContent"),'3');
  await select('sw-buffer-load','0'); for(let i=0;i<16;i++) await click('sw-buffer-tick');
  assert.equal(await evaluate("document.getElementById('sw-buffer-waiting').textContent"),'0');
  await screenshot('switching-buffers',1440,1100);
  // Keyboard tab order reaches the fourth primary tab and wraps to the first.
  await evaluate("document.getElementById('switching-tab').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))");
  assert.equal(await evaluate("document.getElementById('speed-tab').getAttribute('aria-selected')"),'true');
  assert.equal(await evaluate('window.SpeedLab.getState().path.seconds'),80);
  assert.equal(await evaluate('window.SpeedLab.getState().path.goodput'),100);
  await evaluate("document.querySelector('[data-sp-preset=upgrade]').click()");
  assert.equal(await evaluate('window.SpeedLab.getState().path.seconds'),8);
  await evaluate("document.querySelector('[data-sp-preset=disk]').click()");
  assert.equal(await evaluate('window.SpeedLab.getState().path.goodput'),320);
  await input('sp-efficiency','90');
  assert.equal(await evaluate('window.SpeedLab.getState().path.goodput'),288);
  await input('sp-file','0');assert.equal(await evaluate("document.getElementById('sp-path-error').hidden"),false);
  assert.equal(await evaluate("document.getElementById('sp-transfer-play').disabled"),true);
  await input('sp-file','1000');await input('sp-efficiency','100');
  await evaluate("document.querySelector('[data-sp-preset=bottleneck]').click()");
  await click('sp-transfer-play');assert.equal(await evaluate('window.SpeedLab.getState().playing'),true);
  await delay(250);assert.ok(await evaluate('window.SpeedLab.getState().transferred')>0);
  await click('throughput-tab');assert.equal(await evaluate('window.SpeedLab.getState().playing'),false);
  await click('speed-tab');
  await screenshot('speed-bottleneck-desktop',1440,1250);
  await screenshot('speed-bottleneck-mobile',390,1250);
  assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth + 1'),false);
  for(const name of ['sharing','duplex','timing','practice']) {
    await evaluate(`document.querySelector('[data-sp-topic="${name}"]').click()`);
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth + 1'),false,`${name} speed-lab mobile overflow`);
  }
  await evaluate("document.querySelector('[data-sp-topic=sharing]').click()");
  assert.match(await evaluate("document.getElementById('sp-clients').textContent"),/250/);
  await select('sp-uplink','10000');
  assert.match(await evaluate("document.getElementById('sp-clients').textContent"),/250/);
  await select('sp-server','10000');
  assert.equal(await evaluate("document.getElementById('sp-sharing-explanation').textContent.includes('125 MB/s')"),true);
  await click('sp-preset-two');await click('sp-queue-step');
  assert.deepEqual(await evaluate('window.SpeedLab.getState().queue'),{queued:16,sent:125,dropped:59,elapsed:1});
  await click('sp-queue-drain');await click('sp-queue-step');
  assert.equal(await evaluate('window.SpeedLab.getState().queue.queued'),0);
  await click('sp-queue-play');await click('encapsulation-tab');assert.equal(await evaluate('window.SpeedLab.getState().playing'),false);
  await click('speed-tab');await click('sp-preset-four');
  await screenshot('speed-sharing-desktop',1440,1250);
  await evaluate("document.querySelector('[data-sp-topic=duplex]').click()");
  assert.match(await evaluate("document.getElementById('sp-negotiated').textContent"),/100 Mb\/s/);
  await select('sp-pc-cap','10,100,1000');assert.match(await evaluate("document.getElementById('sp-port-status').textContent"),/a-1000/);
  await select('sp-duplex-mode','half');assert.equal(await evaluate("document.getElementById('sp-duplex-rate').value"),'100');
  const beforeLane=await evaluate("document.getElementById('sp-lane-out').textContent");
  await click('sp-duplex-step');assert.notEqual(await evaluate("document.getElementById('sp-lane-out').textContent"),beforeLane);
  await select('sp-duplex-mode','mismatch');assert.match(await evaluate("document.getElementById('sp-duplex-explanation').textContent"),/mismatch/);
  await click('sp-duplex-play');assert.equal(await evaluate("document.getElementById('speed-lab').classList.contains('sp-duplex-moving')"),true);
  await click('switching-tab');assert.equal(await evaluate('window.SpeedLab.getState().playing'),false);
  assert.equal(await evaluate("document.getElementById('speed-lab').classList.contains('sp-duplex-moving')"),false);
  await click('speed-tab');await select('sp-duplex-mode','full');await select('sp-duplex-rate','1000');
  await screenshot('speed-duplex-desktop',1440,1250);
  await evaluate("document.querySelector('[data-sp-topic=timing]').click()");
  assert.match(await evaluate("document.getElementById('sp-serialization').textContent"),/120 μs/);
  await select('sp-timing-rate','1000');assert.match(await evaluate("document.getElementById('sp-serialization').textContent"),/12 μs/);
  await screenshot('speed-timing-desktop',1440,1250);
  await evaluate("document.querySelector('[data-sp-topic=practice]').click()");
  for(const [i,answer] of [0,1,2,0,1,2,0,1,2].entries()) {
    await evaluate(`document.querySelectorAll('#sp-quiz-answers button')[${answer}].click()`);
    assert.match(await evaluate("document.getElementById('sp-quiz-feedback').textContent"),/Správne/);
    if(i<8)await click('sp-quiz-next');
  }
  assert.match(await evaluate("document.getElementById('sp-quiz-feedback').textContent"),/9 z 9/);
  await screenshot('speed-practice-desktop',1440,1250);
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'},{name:'prefers-reduced-motion',value:'reduce'}]});
  await evaluate("document.querySelector('[data-sp-topic=path]').click()");
  await screenshot('speed-bottleneck-dark',1440,1250);
  await evaluate("document.getElementById('speed-tab').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))");
  assert.equal(await evaluate("document.getElementById('throughput-tab').getAttribute('aria-selected')"),'true');
  const duplicateIds=await evaluate("(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.filter((id,i)=>ids.indexOf(id)!==i)})()");
  assert.deepEqual(duplicateIds,[],'IDs remain unique across all labs');
  assert.deepEqual(errors, [], 'No browser runtime exceptions');
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ combinations, runtimeErrors: errors, stages: 14, signalSchemes: 5, mobileOverflow: overflow }, null, 2));
  console.log(`PASS: all four labs; bottleneck upgrades, disk and overhead limits, fair sharing, queue conservation, negotiation, duplex, frame timing, nine quiz answers, four-tab keyboard navigation, animation pausing and mobile layouts. Screenshots: ${output}`);
})().catch(async error => {
  console.error(error);
  console.error('Runtime errors:', errors);
  console.error('Contexts:', [...contexts.values()].map(c=>({id:c.id,origin:c.origin,name:c.name,auxData:c.auxData})));
  for (const [id] of contexts) { try { console.error('Context',id,await cdp('Runtime.evaluate',{contextId:id,expression:"JSON.stringify({ready:document.readyState,enc:typeof window.EncapsulationLab,sw:typeof window.SwitchingLab,scripts:document.scripts.length,encElements:!!document.getElementById('encapsulation-lab'),swElements:!!document.getElementById('switching-lab'),lastScript:document.scripts[document.scripts.length-1]?.outerHTML.slice(0,100),tail:document.body?.innerHTML.slice(-100)})",returnByValue:true})); } catch {} }
  if (socket?.readyState === 1) {
    try { console.error('Page:', await cdp('Runtime.evaluate',{expression:"JSON.stringify({title:document.title,ready:document.readyState,frames:document.querySelectorAll('iframe').length,srcdoc:document.querySelector('iframe')?.srcdoc.length})",returnByValue:true})); await screenshot('failure',1440,1000); } catch {}
  }
  process.exitCode = 1;
}).finally(() => { socket?.close(); child.kill(); });
