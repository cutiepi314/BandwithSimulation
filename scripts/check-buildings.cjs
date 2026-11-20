const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'tmp', 'buildings-browser-review');
fs.mkdirSync(output, { recursive: true });
const profile = path.join(output, 'profile-' + process.pid);
let socket, child, server;
let sequence = 0;
const pending = new Map();
const errors = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, description, timeout = 20000) {
  const end = Date.now() + timeout;
  do { try { const value = await fn(); if (value) return value; } catch {} await pause(100); } while (Date.now() < end);
  throw Error('Timed out: ' + description);
}
function cdp(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, method==='Page.captureScreenshot' ? 45000 : 15000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function click(selector) { return evaluate(`{ const element = document.querySelector(${JSON.stringify(selector)}); if (typeof element.click === 'function') element.click(); else element.dispatchEvent(new MouseEvent('click', { bubbles: true })); }`); }
async function screenshot(name, target) {
  if (target) await evaluate(`document.querySelector(${JSON.stringify(target)}).scrollIntoView({block:'start',behavior:'instant'})`);
  await pause(200);
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(shot.data, 'base64'));
}
(async () => {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
  server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  child = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  const port = await until(() => fs.existsSync(path.join(profile, 'DevToolsActivePort')) && fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0], 'headless Edge');
  const pages = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const p = pending.get(message.id); pending.delete(message.id); message.error ? p.reject(Error(message.error.message)) : p.resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  await cdp('Network.setBlockedURLs', { urls: ['https://*'] });
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  const systemTheme = async value => cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value }] });
  await systemTheme('light');
  await cdp('Page.navigate', { url: base + '/index.html' });
  await until(() => evaluate("!!document.querySelector('a[href=\"/prepoj-dve-budovy.html\"]')"), 'home card');
  await click('[data-theme-choice=dark]');
  await click('a[href="/prepoj-dve-budovy.html"]');
  await until(() => evaluate("!!document.querySelector('#diagram svg')"), 'buildings initialized');
  const scheme = () => evaluate('document.documentElement.dataset.colorScheme');
  assert.equal(await scheme(), 'dark', 'inherits the homepage preference');
  assert.equal(await evaluate("document.querySelector('[data-theme-choice=dark]').getAttribute('aria-pressed')"), 'true');
  assert.equal(await evaluate('getComputedStyle(document.body).backgroundColor'), 'rgb(13, 20, 32)');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('#diagram .node .device-body')).fill"), 'rgb(37, 62, 98)');
  await screenshot('free-desktop-dark');
  await click('#diagram [role=button][data-info=poe]');
  assert.equal(await evaluate("getComputedStyle(document.getElementById('signal-demo')).backgroundColor"), 'rgb(23, 33, 48)');
  await screenshot('explanation-desktop-dark'); await click('#close-info');
  await click('[data-theme-choice=light]');
  assert.equal(await scheme(), 'light');
  await systemTheme('dark');
  assert.equal(await scheme(), 'light', 'explicit light overrides dark system');
  await click('[data-theme-choice=auto]');
  assert.equal(await scheme(), 'dark');
  await systemTheme('light');
  await until(async () => await scheme() === 'light', 'system theme change event');
  assert.equal(await scheme(), 'light', 'auto follows live system changes');
  await click('[data-theme-choice=dark]');
  await cdp('Page.reload');
  await until(() => evaluate("!!document.querySelector('#diagram svg')"), 'theme reload');
  assert.equal(await scheme(), 'dark', 'preference survives reload');
  await click('[data-theme-choice=auto]');
  assert.equal(await evaluate("localStorage.getItem('pvalo-theme')"), null);
  assert.equal(await scheme(), 'light');
  const text = id => evaluate(`document.getElementById(${JSON.stringify(id)}).textContent`);
  const toggle = key => click(`[data-toggle="${key}"]`);
  const settled = () => until(async () => !(await text('communication')).includes('Hľadám'), 'route convergence');
  const restore = async () => { await click('#restore'); await settled(); };
  const route = async name => { await settled(); assert.match(await text('route-name'), new RegExp(name)); };
  assert.match(await text('route-name'), /Optika/);
  assert.match(await text('backup-count'), /2/);
  assert.equal(await evaluate("document.getElementById('animations').checked"), false);
  assert.equal(await evaluate("document.querySelectorAll('#diagram .packet').length"), 0);
  assert.equal(await evaluate("document.querySelectorAll('#diagram [aria-label^=\"PC \" ]').length"), 6);
  await evaluate('window.scrollTo(0,0)');
  await screenshot('free-desktop');
  await toggle('copper'); await route('Optika');
  assert.match(await text('backup-count'), /1/);
  await toggle('fiber'); assert.match(await text('communication'), /Hľadám/); await route('Rádio');
  await toggle('copper'); await route('Medený');
  await toggle('fiber'); await route('Optika');
  await toggle('routera'); await settled();
  assert.match(await text('communication'), /nefunguje/);
  assert.match(await text('backup-count'), /0/);
  assert.match(await text('state-explanation'), /Miestna komunikácia/);
  await click('#send-packet'); assert.match(await text('packet-result'), /nedorazil/);
  await restore(); await toggle('fiber'); await toggle('copper'); await toggle('radio'); await settled();
  assert.match(await text('communication'), /nefunguje/);
  await restore();
  assert.equal(await evaluate("document.querySelectorAll('#diagram .device-router ellipse').length"), 2);
  assert.equal(await evaluate("document.querySelectorAll('#diagram .device-access .device-port').length"), 16);
  assert.equal(await evaluate("document.body.textContent.includes('L3')"), false);
  const setPrice = async (key,value) => evaluate(`document.getElementById('cost-'+${JSON.stringify(key)}).value=${JSON.stringify(value)}`);
  await setPrice('fiber','50'); await setPrice('radio','5'); await click('#apply-costs');
  await route('Rádio'); assert.match(await text('legend-radio'), /cena 5/);
  assert.match(await text('ospf-example'), /ip ospf cost 50/); assert.match(await text('ospf-example'), /ip ospf cost 5/);
  await cdp('Page.reload'); await until(() => evaluate("!!document.querySelector('#diagram svg')"), 'custom price reload');
  await route('Rádio'); assert.equal(await evaluate("document.getElementById('cost-radio').value"),'5');
  for(const invalid of ['','0','1.5','65536']) {
    await setPrice('radio',invalid); await click('#apply-costs');
    assert.match(await text('cost-feedback'), /celé číslo/); await route('Rádio');
  }
  await setPrice('radio','20'); await setPrice('fiber','20'); await click('#apply-costs'); await route('Optika');
  assert.match(await text('cost-order'), /ECMP/); assert.match(await text('state-explanation'), /ECMP/);
  await click('#default-costs'); await route('Optika');
  for (const key of ['pc','access','router','sfp','poe','antenna','copper','fiber','radio','radio-wire','lan','building']) {
    await click(`#diagram [role=button][data-info="${key}"]`);
    assert.equal(await evaluate("document.getElementById('info').hidden"), false);
    assert.ok((await text('info-body')).length > 40);
    assert.equal(await evaluate("document.querySelectorAll('#signal-demo svg').length"), 1);
    assert.equal(await evaluate("document.querySelectorAll('#signal-demo animateMotion').length"), 0);
    if (key==='radio-wire') assert.equal(await evaluate("document.getElementById('signal-demo').dataset.medium"),'copper');
    assert.match(await text('signal-caption'), /Animácie sú vypnuté/);
    await click('#close-info');
  }
  // A real pointer click on the cable, rather than its label, opens the signal view.
  await evaluate("document.getElementById('diagram').scrollIntoView({block:'center'})");
  const point = await evaluate("(()=>{const p=document.querySelector('#diagram .route-hit[data-info=fiber]');const v=p.getPointAtLength(p.getTotalLength()/2);const q=new DOMPoint(v.x,v.y).matrixTransform(p.getScreenCTM());return {x:q.x,y:q.y};})()");
  await cdp('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
  await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
  assert.equal(await evaluate("document.getElementById('signal-demo').dataset.medium"),'fiber');
  assert.equal(await evaluate("document.getElementById('info').hidden"),false);
  await screenshot('fiber-inspector-desktop','#info'); await click('#close-info');
  await evaluate("document.querySelector('#diagram [data-info=access]').focus()");
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.equal(await evaluate("document.getElementById('info').hidden"), false);
  await click('#close-info');
  await setPrice('radio','5'); await click('#apply-costs'); await route('Rádio');
  await click('#predict-tab');
  assert.equal(await evaluate("document.getElementById('cost-radio').value"),'30');
  assert.equal(await evaluate("document.getElementById('cost-radio').disabled"),true);
  assert.equal(await evaluate("document.getElementById('diagram-content').hidden"), true);
  assert.equal(await evaluate("document.getElementById('verify').disabled"), true);
  await click('[name=prediction][value=copper]'); await click('#verify'); await settled();
  assert.match(await text('quiz-feedback'), /Tentoraz nie/);
  await click('#retry'); assert.match(await text('quiz-feedback'), /Nápoveda/);
  assert.equal(await evaluate("document.getElementById('diagram-content').hidden"), true);
  await click('[name=prediction][value=fiber]'); await click('#verify'); await settled();
  assert.match(await text('quiz-feedback'), /Správne/);
  await click('#next-question');
  for (const answer of ['copper','fiber','radio','copper','fiber','radio','none','fiber']) {
    await click(`[name=prediction][value=${answer}]`); await click('#verify'); await settled();
    assert.match(await text('quiz-feedback'), /Správne/);
    await click('#next-question');
  }
  assert.match(await text('quiz-summary'), /8 \/ 9/);
  assert.match(await text('quiz-summary'), /Výber podľa ceny/);
  assert.match(await text('quiz-badge'), /9\/9/);
  await screenshot('quiz-desktop');
  await click('#length-tab');
  await route('Rádio'); assert.equal(await evaluate("document.getElementById('cost-radio').value"),'5');
  await click('#default-costs'); await route('Optika');
  assert.match(await text('length-result'), /90 m/);
  const input = async (id, value) => evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('input',{bubbles:true}))`);
  await input('length-distance', '80'); assert.match(await text('length-result'), /Presne 100 m/);
  await input('length-distance', '80.01'); assert.match(await text('length-result'), /prekročený/);
  await input('length-distance', ''); assert.match(await text('length-result'), /Zadaj všetky/);
  await input('length-distance', '-1'); assert.match(await text('length-result'), /Zadaj všetky/);
  await input('length-distance', '70');
  await click('#challenge-tab');
  for (const chosen of ['copper','fiber','radio']) {
    await restore();
    for (const other of ['copper','fiber','radio'].filter(k=>k!==chosen)) await toggle(other);
    await settled(); await click('#send-packet');
    await until(async () => (await text('packet-result')).includes('odpoveď dorazili'), 'packet reply');
  }
  assert.match(await text('challenge-badge'), /3\/3/);
  assert.equal(await evaluate("document.getElementById('discussion').hidden"), false);
  await screenshot('challenge-desktop');
  await cdp('Page.reload');
  await until(() => evaluate("!!document.querySelector('#diagram svg')"), 'reload');
  assert.match(await text('challenge-badge'), /3\/3/);
  assert.match(await text('quiz-badge'), /9\/9/);
  await click('#challenge-tab'); await restore(); await click('#send-packet');
  await until(async () => (await text('packet-result')).includes('odpoveď dorazili'), 'all-links packet');
  // An interrupted packet must not earn credit for an isolated path.
  await click('#erase'); await click('#challenge-tab'); await toggle('fiber'); await toggle('radio'); await settled();
  await click('#animations'); await click('#send-packet'); await toggle('copper'); await settled();
  assert.match(await text('challenge-badge'), /0\/3/);
  assert.equal(await evaluate("document.querySelectorAll('#diagram .packet').length"), 0);
  await restore();
  assert.equal(await evaluate("document.querySelectorAll('#diagram .packet').length"), 2);
  for (const key of ['fiber','copper','radio']) {
    await click(`#diagram .route-hit[data-info=${key}]`);
    assert.equal(await evaluate("document.getElementById('signal-demo').dataset.medium"),key);
    assert.ok(await evaluate("document.querySelectorAll('#signal-demo animateMotion').length > 0"));
    if (key==='fiber') {
      assert.equal(await evaluate("getComputedStyle(document.querySelector('#signal-demo .fiber-lamp')).animationName"),'optical-light');
      const before = await evaluate("document.querySelector('#signal-demo .light-pulse').getCTM().e");
      await pause(180);
      assert.notEqual(await evaluate("document.querySelector('#signal-demo .light-pulse').getCTM().e"),before,'light pulse visibly moves');
    }
    await screenshot('signal-'+key+'-desktop','#info');
  }
  assert.equal(await evaluate("document.querySelectorAll('#signal-demo .radio-ring').length"),3);
  await click('#animations');
  assert.equal(await evaluate("document.querySelectorAll('#diagram .packet').length"), 0);
  assert.equal(await evaluate("document.querySelectorAll('#signal-demo animateMotion').length"),0);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('#signal-demo .radio-ring')).animationName"),'none');
  await click('#close-info');
  await evaluate("document.getElementById('free-tab').focus()");
  await cdp('Input.dispatchKeyEvent', { type:'keyDown', key:'End', code:'End', windowsVirtualKeyCode:35 });
  await cdp('Input.dispatchKeyEvent', { type:'keyUp', key:'End', code:'End', windowsVirtualKeyCode:35 });
  assert.equal(await evaluate("document.getElementById('challenge-tab').getAttribute('aria-selected')"), 'true');
  await cdp('Emulation.setDeviceMetricsOverride', { width:390, height:1000, deviceScaleFactor:1, mobile:true });
  await click('#free-tab');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.equal(await evaluate("document.querySelector('#diagram svg').getAttribute('viewBox')"), '0 0 420 1080');
  await evaluate('window.scrollTo(0,0)'); await screenshot('free-mobile');
  await screenshot('diagram-mobile', '#diagram');
  await click('[data-theme-choice=dark]');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await evaluate('window.scrollTo(0,0)'); await screenshot('free-mobile-dark');
  await screenshot('diagram-mobile-dark', '#diagram');
  await click('#diagram .route-hit[data-info=fiber]'); await screenshot('fiber-inspector-mobile-dark','#info');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
  await click('#close-info');
  for (const tab of ['predict','length','challenge']) {
    await click(`#${tab}-tab`);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, tab+' mobile overflow');
  }
  await click('#erase');
  assert.equal(await evaluate("localStorage.getItem('pvalo-buildings-v1')"), null);
  assert.equal(await evaluate("localStorage.getItem('pvalo-theme')"), 'dark', 'progress reset preserves display preference');
  assert.match(await text('quiz-badge'), /0\/9/); assert.match(await text('challenge-badge'), /0\/3/);
  await cdp('Page.navigate', { url: pathToFileURL(path.join(root, 'prepoj-dve-budovy.html')).href });
  await until(() => evaluate("!!document.querySelector('#diagram svg')"), 'file URL');
  assert.match(await text('route-name'), /Optika/);
  assert.deepEqual(errors, []);
  console.log('Passed: drawn routers/switches/devices, inline signal demos, real pointer clicks on cables, moving/blinking optical signals, copper/radio animations, custom OSPF prices/validation/ties/persistence, quiz price isolation, IOS configuration examples; light/dark/auto themes, all 9 predictions/retry/scoring, failover and shared router failures, 3 independent packet tests, local reset, motion settings, 390px layouts and offline loading. No JavaScript exceptions.');
  console.log('Screenshots: ' + output);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { socket?.close(); child?.kill(); server?.close(); });
