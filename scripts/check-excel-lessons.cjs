const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'tmp', 'excel-lessons-browser-review');
const downloadDir = path.join(output, 'downloads-' + process.pid);
fs.mkdirSync(downloadDir, { recursive: true });
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
    const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 15000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function click(selector) { return evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); }
async function ready() { await until(() => evaluate("document.getElementById('address-demo')?.rows.length === 8 && document.getElementById('pixel-preview')?.rows.length === 19"), 'Excel guide initialized'); }
async function screenshot(name, target) {
  if (target) await evaluate(`document.querySelector(${JSON.stringify(target)}).scrollIntoView({block:'start',behavior:'instant'})`);
  await pause(200);
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(shot.data, 'base64'));
}
function hash(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
(async () => {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
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
const expectedDownloads = {"DAT_LVL0_H05_Vlastna_kalkulacka_cvicenie.xlsx":"9719eb1e90d1e7939926c176d1072547bcddf1903c2f6c27300b9c6564b61d8e","DAT_LVL0_H02_Praca_s_datami_formatovanie_cvicenie.xlsx":"ab87426fccd35c6d60465ddf7d2d9b811ada6a87afc0a66d9d4e802a588e5410","DAT_LVL0_H02_Praca_s_datami_formatovanie.pptx":"9a9bc0e17e4302baf8b76560ee9f5d6c142d4ad9bdc0833c94f015bc35603bca","DAT_LVL0_H05_Vlastna_kalkulacka_cvicenie.pptx":"40911531a2d29bdee4d42efc083ce684605e76b9b4e6c67deaef5449b34e43ec"};
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'light'}]});
  await cdp('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloadDir});
  await cdp('Page.navigate',{url:base+'/index.html'});
  await until(()=>evaluate("!!document.querySelector('a.link.excel')"),'home Excel link');
  await click('a.link.excel'); await ready();
  assert.equal(await evaluate("document.querySelectorAll('.lesson-nav a').length"),3);
  assert.match(await evaluate("document.querySelector('.lesson-nav a[aria-current=page]').textContent"),/1\. hodina/);
  assert.equal(await evaluate("document.querySelectorAll('#cvicenie .step[id^=krok-]').length"),10);
  const h02='excel-formatovanie.html',h05='excel-vlastna-kalkulacka.html';
  const pageReady = lesson => until(()=>evaluate('document.body.dataset.lesson==='+JSON.stringify(lesson)+" && document.querySelectorAll('[data-tab]').length===3"),lesson+' initialized');
  const text = id => evaluate('document.getElementById('+JSON.stringify(id)+').textContent');
  const input = async(id,value)=>evaluate('document.getElementById('+JSON.stringify(id)+').value='+JSON.stringify(value)+';document.getElementById('+JSON.stringify(id)+").dispatchEvent(new Event('input',{bubbles:true}))");
  const select = async(id,value)=>evaluate('document.getElementById('+JSON.stringify(id)+').value='+JSON.stringify(value)+';document.getElementById('+JSON.stringify(id)+").dispatchEvent(new Event('change',{bubbles:true}))");
  const normalizedResult = async()=> (await text('calculator-result')).replace(/\s/g,'');
  const downloadFiles = async()=>{
    await click('#files-tab');
    const files=await evaluate("[...document.querySelectorAll('a[download]')].map(a=>({href:a.getAttribute('href'),name:a.download}))");
    assert.equal(files.length,2);
    for(const file of files){
      assert.equal(hash(path.join(root,file.href)),expectedDownloads[file.name]);
      await click('a[download="'+file.name+'"]');
      await until(()=>fs.existsSync(path.join(downloadDir,file.name))&&!fs.existsSync(path.join(downloadDir,file.name+'.crdownload')),'download '+file.name);
      assert.equal(hash(path.join(downloadDir,file.name)),expectedDownloads[file.name]);
    }
  };
  await click('.lesson-nav a[href="'+h02+'"]'); await pageReady('h02');
  assert.match(await evaluate("document.querySelector('.lesson-nav a[aria-current=page]').textContent"),/2\. hodina.*H02/s);
  assert.equal(await evaluate("document.getElementById('cvicenie').hidden"),true);
  const originalValues=await text('format-example');
  await click('[data-format-demo=plain]');
  assert.equal(await evaluate("document.getElementById('format-example').classList.contains('formatted')"),false);
  assert.equal(await text('format-example'),originalValues);
  await click('[data-format-demo=formatted]');
  assert.equal(await evaluate("document.getElementById('format-example').classList.contains('formatted')"),true);
  await screenshot('h02-intro-desktop-light');
  await evaluate("document.getElementById('intro-tab').focus()");
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  assert.equal(await evaluate("document.getElementById('cvicenie').hidden"),false);
  assert.equal(await evaluate("document.querySelectorAll('#cvicenie .step[id^=krok-]').length"),7);
  assert.equal(await evaluate("document.querySelectorAll('.lesson-reference img').length"),5);
  const pictures=await evaluate("[...document.querySelectorAll('.lesson-reference img')].map(i=>i.getAttribute('src'))");
  for(const picture of pictures) assert.equal((await fetch(base+'/'+picture)).status,200,picture);
  await click('[data-check=step-1]'); await click('[data-check=step-2]');
  assert.equal(await text('check-count'),'2 / 7');
  await cdp('Page.reload'); await pageReady('h02');
  assert.equal(await text('check-count'),'2 / 7');
  assert.equal(await evaluate("document.getElementById('cvicenie').hidden"),false);
  await click('#reset-checks'); assert.equal(await text('check-count'),'0 / 7');
  await screenshot('h02-formatting-desktop-light','#krok-3');
  await downloadFiles();
  await click('[data-theme-choice=dark]');
  assert.equal(await evaluate('getComputedStyle(document.body).backgroundColor'),'rgb(16, 23, 26)');
  await click('#intro-tab'); await evaluate('window.scrollTo(0,0)'); await screenshot('h02-intro-desktop-dark');
  await click('.lesson-nav a[href="'+h05+'"]'); await pageReady('h05');
  assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark');
  assert.match(await evaluate("document.querySelector('.lesson-nav a[aria-current=page]').textContent"),/3\. hodina.*H05/s);
  await until(()=>evaluate("document.querySelectorAll('#calculator-inputs input').length===3"),'pizza calculator');
  assert.match(await normalizedResult(),/7,5pizze/);
  await click('[data-preset="31"]'); assert.match(await normalizedResult(),/9,6875pizze/); assert.match(await normalizedResult(),/10ks/);
  await input('calc-input-2','0'); assert.equal(await evaluate("document.getElementById('calculator-result').dataset.error"),'true');
  await select('calculator-case','pizza'); await input('calc-input-0','1.5'); assert.match(await text('calculator-result'),/celé číslo/);
  await select('calculator-case','coffee');
  assert.match(await normalizedResult(),/28ľudí/); assert.match(await normalizedResult(),/42šálok/); assert.match(await normalizedResult(),/336g/); assert.match(await normalizedResult(),/6,3l/);
  await click('[data-preset="60"]'); assert.match(await normalizedResult(),/63šálok/); assert.match(await normalizedResult(),/504g/); assert.match(await normalizedResult(),/9,45l/);
  await input('calc-input-1','70'); assert.match(await text('calculator-result'),/od 0 do 1/);
  await select('calculator-case','trip'); assert.match(await normalizedResult(),/939,4€/); assert.match(await normalizedResult(),/33,55€/);
  await click('[data-preset="24"]'); assert.match(await normalizedResult(),/871,2€/); assert.match(await normalizedResult(),/36,3€/);
  await input('calc-input-0','0'); assert.equal(await evaluate("document.getElementById('calculator-result').dataset.error"),'true');
  await input('calc-input-0',''); assert.match(await text('calculator-result'),/Vyplň všetky/);
  await input('calc-input-0','-1'); assert.equal(await evaluate("document.getElementById('calculator-result').dataset.error"),'true');
  await select('calculator-case','pizza');
  await screenshot('h05-calculator-desktop-dark','#ukazka-prepoctu');
  await click('#exercise-tab');
  assert.equal(await evaluate("document.querySelectorAll('#cvicenie .step[id^=krok-]').length"),12);
  for(const reference of ['=E9*E10/E11','=G10-G9','=E13*E11','=E32/F28','=E18/E9']) assert.ok((await evaluate('document.body.textContent')).includes(reference),reference);
  await click('[data-check=step-1]'); assert.equal(await text('check-count'),'1 / 9');
  await cdp('Page.reload'); await pageReady('h05'); assert.equal(await text('check-count'),'1 / 9');
  await downloadFiles();
  await cdp('Page.navigate',{url:base+'/'+h02+'#krok-6'}); await pageReady('h02');
  assert.equal(await evaluate("document.getElementById('cvicenie').hidden"),false);
  assert.equal(await text('check-count'),'0 / 7');
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
  await screenshot('h02-reference-mobile-dark','#krok-6');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await click('[data-theme-choice=light]'); await click('#intro-tab'); await evaluate('window.scrollTo(0,0)'); await screenshot('h02-intro-mobile-light');
  assert.equal(await evaluate('getComputedStyle(document.body).backgroundColor'),'rgb(244, 246, 249)');
  await click('.lesson-nav a[href="'+h05+'"]'); await pageReady('h05');
  await select('calculator-case','coffee'); await click('[data-preset="60"]');
  assert.match(await normalizedResult(),/9,45l/);
  await screenshot('h05-inputs-mobile-light','#ukazka-prepoctu');
  await screenshot('h05-results-mobile-light','#calculator-result');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await click('[data-theme-choice=dark]'); await click('#files-tab'); await screenshot('h05-downloads-mobile-dark','#subory-na-stiahnutie');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await cdp('Page.navigate',{url:base+'/'+h05+'#krok-10'}); await pageReady('h05');
  assert.equal(await evaluate("document.getElementById('cvicenie').hidden"),false);
  await click('#reset-checks'); assert.equal(await text('check-count'),'0 / 9');
  await cdp('Page.navigate',{url:pathToFileURL(path.join(root,h02)).href}); await pageReady('h02');
  await click('[data-format-demo=plain]'); assert.equal(await evaluate("document.getElementById('format-example').classList.contains('formatted')"),false);
  await cdp('Page.navigate',{url:pathToFileURL(path.join(root,h05)).href}); await pageReady('h05');
  await until(()=>evaluate("document.querySelectorAll('#calculator-inputs input').length===3"),'offline calculator');
  await click('[data-preset="31"]'); assert.match(await normalizedResult(),/9,6875pizze/);
  assert.deepEqual(errors,[]);
  console.log('Passed: ordered H01/H02/H05 navigation, preserved first lesson, all new steps and references, 5 images, formatting demo, pizza/coffee/trip recalculation and invalid inputs, independent checklists/reset, 4 downloads identical to supplied originals, keyboard tabs, deep links, light/dark themes, mobile layouts and offline loading. No JS exceptions.');
  console.log('Screenshots: '+output);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{socket?.close();child?.kill();server?.close();});
