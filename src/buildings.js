(() => {
  'use strict';
  const M = window.BuildingsModel;
  const V = window.BuildingsVisuals;
  const $ = id => document.getElementById(id);
  const colorPreference = matchMedia('(prefers-color-scheme: dark)');
  const themeButtons = document.querySelectorAll('[data-theme-choice]');
  function applyTheme(choice) {
    const root = document.documentElement;
    if (choice === 'light' || choice === 'dark') root.dataset.theme = choice;
    else { choice = 'auto'; delete root.dataset.theme; }
    root.dataset.colorScheme = choice === 'auto' ? (colorPreference.matches ? 'dark' : 'light') : choice;
    themeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === choice)));
  }
  themeButtons.forEach(button => button.addEventListener('click', () => {
    const choice = button.dataset.themeChoice;
    applyTheme(choice);
    try { choice === 'auto' ? localStorage.removeItem('pvalo-theme') : localStorage.setItem('pvalo-theme', choice); } catch {}
  }));
  colorPreference.addEventListener('change', () => applyTheme(document.documentElement.dataset.theme || 'auto'));
  window.addEventListener('storage', event => {
    if (event.key === 'pvalo-theme' || event.key === null) applyTheme(event.newValue);
  });
  applyTheme(document.documentElement.dataset.theme || 'auto');
  const storageKey = 'pvalo-buildings-v1';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 650px)');
  let state = M.healthy(), active = 'fiber', switching = false, mode = 'free';
  let routeTimer, packetTimer, revision = 0, packetBusy = false, question = 0, revealed = false, retrying = false;
  let first = Array(9).fill(null), solved = Array(9).fill(false), challenge = {}, lengths = [70, 7, 8, 5];
  let storageAvailable = true;
  let animations = !reducedMotion.matches;
  let costs = { ...M.costs }, inspected = null;
  const currentCosts = () => mode === 'predict' ? M.costs : costs;
  const route = (candidate = state) => M.route(candidate, currentCosts());
  const explain = () => M.explanation(state, currentCosts());
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && saved.version === 1) {
      if (saved.state) {
        const migrated = { ...saved.state, routera: saved.state.routera ?? saved.state.l3a, routerb: saved.state.routerb ?? saved.state.l3b };
        if (Object.keys(state).every(key => typeof migrated[key] === 'boolean')) state = Object.fromEntries(Object.keys(state).map(key => [key, migrated[key]]));
      }
      if (M.validCosts(saved.costs)) costs = { ...saved.costs };
      if (Array.isArray(saved.first) && saved.first.length === 9) first = saved.first.map(v => typeof v === 'boolean' ? v : null);
      if (Array.isArray(saved.solved) && saved.solved.length === 9) solved = saved.solved.map((v, i) => v === true && first[i] !== null);
      if (Number.isInteger(saved.question) && saved.question >= 0 && saved.question < 9) question = saved.question;
      for (const key of M.links) challenge[key] = saved.challenge?.[key] === true;
      if (M.cable(saved.lengths || [])) lengths = saved.lengths;
      if (typeof saved.animations === 'boolean') animations = saved.animations && !reducedMotion.matches;
    }
  } catch { storageAvailable = false; }
  active = route();
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, state, first, solved, challenge, question, lengths, animations, costs })); }
    catch { storageAvailable = false; }
    $('storage-note').textContent = storageAvailable ? 'Priebeh sa ukladá iba lokálne v tomto prehliadači.' : 'Ukladanie nie je dostupné. Simulácia funguje, priebeh sa po zatvorení nemusí zachovať.';
  }
  const info = {
    pc: ['Počítač v miestnej sieti', '<p>Aplikácia vytvorí údaje. Sieťová karta ich vloží do ethernetového rámca a premení na signál na kábli. Odpoveď prijíma opačným smerom.</p><p>Do druhej budovy vedie cesta cez prístupový switch a router. Aj pri poruche routera môžu PC v tej istej miestnej sieti komunikovať cez funkčný prístupový switch.</p>'],
    access: ['Prístupový switch', '<p>Switch prepája zariadenia v miestnej sieti. V každej budove sú k nemu pripojené tri počítače.</p><p>Komunikácia v miestnej sieti môže pokračovať aj vtedy, keď spojenie do druhej budovy nefunguje.</p>'],
    router: ['Router', '<p>Router prečíta cieľovú IP adresu paketu, nájde vhodnú cestu v smerovacej tabuľke a odošle paket cez vybrané rozhranie. Pri prechode na ďalší ethernetový úsek vytvorí nový rámec.</p><p>Tu porovnáva nastavené ceny funkčných ciest. Je spoločným bodom všetkých troch trás: jeho porucha preruší komunikáciu medzi budovami aj pri zdravých spojoch.</p>'],
    sfp: ['SFP modul', '<p>Optický SFP modul v porte routera premieňa elektrický signál na svetlo a pri príjme svetlo späť na elektrický signál. Na oboch koncoch potrebujeme kompatibilný port a modul.</p><p>Typ vlákna, vlnová dĺžka, konektory a dosah musia zodpovedať zvoleným modulom.</p>'],
    poe: ['PoE injektor', '<p>PoE injektor napája smerové rádio cez ethernetový kábel a súčasne ním vedie dáta.</p><p>Injektor je na každej strane rádiového spoja. Medzi rádiami už vedie iba bezdrôtové spojenie.</p>'],
    antenna: ['Smerové rádio', '<p>Smerové rádio vytvára bezdrôtový spoj s rádiom v druhej budove. Potrebuje správne nasmerovanie, voľný výhľad a dostatočne voľnú Fresnelovu zónu.</p><p>Podmienky šírenia a rušenie môžu zhoršiť spoj. Každé rádio potrebuje napájanie, tu cez vlastný PoE injektor.</p>'],
    fiber: ['Optické prepojenie', '<p>SFP vysielač mení elektrický signál na modulované svetlo. Svetlo prechádza vláknom a prijímací SFP ho premení späť na elektrický signál.</p><p><strong>Výhoda:</strong> odolnosť voči elektromagnetickému rušeniu a elektrické oddelenie budov. <strong>Obmedzenie:</strong> vhodné vlákno, konektory, optika a polomer ohybu.</p><p><strong>Na oboch stranách:</strong> router s vhodným SFP portom a kompatibilný optický SFP modul, medzi nimi vlákno.</p>'],
    copper: ['Medený Ethernet', '<p>Dáta sa prenášajú zmenami elektrického signálu v krútených pároch. V modeli 1000BASE-T sa používajú štyri páry a viacúrovňové kódovanie PAM-5. Jeden bit preto neznamená jednoducho „prúd zapnutý / vypnutý“.</p><p><strong>Výhoda:</strong> bežné porty a káble. <strong>Obmedzenie:</strong> limit kanála 100 m vrátane prepojovacích káblov; pri budovách treba riešiť aj rušenie, prepätie a zemné potenciály.</p><p><strong>Na oboch stranách:</strong> medené ethernetové porty, vhodný kábel a konektory.</p>'],
    radio: ['Bezdrôtový spoj', '<p>Rádio mení dáta na modulovaný elektromagnetický signál. Anténa ho vyžiari, druhé rádio prijme a dekóduje späť na dáta. Informácia je v zmenách signálu, napríklad jeho fázy alebo amplitúdy; kreslené vlny nie sú jednotlivé bity.</p><p><strong>Výhoda:</strong> netreba kábel medzi budovami. <strong>Obmedzenie:</strong> vhodné podmienky, voľný výhľad, nasmerovanie a rušenie.</p><p><strong>Na oboch stranách:</strong> router, kábel, kompatibilný PoE injektor a smerové rádio.</p>'],
    lan: ['Medený kábel v miestnej sieti', '<p>Aj medzi PC, prístupovým switchom a routerom sa ethernetové dáta prenášajú elektrickým signálom cez medené páry. Switch rámec prijme a odošle na príslušný port.</p><p>Tento miestny kábel je spoločnou časťou cesty do druhej budovy. Prepínače porúch v tomto modeli ovládajú iba tri prepoje medzi budovami a oba routery.</p>'],
    'radio-wire': ['Ethernetový kábel pri rádiu', '<p>Od routera k rádiu idú dáta cez medený ethernetový kábel elektrickým signálom. PoE injektor pridá napájanie do úseku smerom k rádiu.</p><p>Až rádio prevedie dáta na modulovaný rádiový signál. Bezdrôtový prenos je iba medzi oboma anténami; na druhej strane sa dáta opäť prenesú po medenom kábli k routeru.</p>'],
    building: ['Miestna sieť v budove', '<p>Tri počítače prepája prístupový switch. Router zabezpečuje komunikáciu s druhou budovou a vyberá výstupnú cestu.</p><p>Rámec medzi miestnymi PC môže zostať iba v budove. Prenos do druhej budovy potrebuje funkčný router aj aspoň jeden funkčný prepoj.</p>']
  };
  const captions = {
    fiber: 'Svetelné impulzy putujú vláknom. Blikajúci bod predstavuje moduláciu svetla, nie skutočné tempo siete.',
    sfp: 'SFP prevádza elektrický signál na svetlo pri vysielaní a svetlo späť na elektrický signál pri príjme.',
    copper: 'Krivka ukazuje viac elektrických úrovní. Je to ukážka princípu, nie presný priebeh reálneho 1000BASE-T signálu.',
    lan: 'Medený kábel nesie elektricky zakódované dáta aj v miestnej sieti.',
    'radio-wire': 'Tento úsek rádiovej vetvy je medený Ethernet. Elektrický signál sa na rádiový zmení až v rádiu.',
    radio: 'Vlna znázorňuje modulovaný rádiový signál. Rádio na druhej strane obnoví prenášané dáta.',
    antenna: 'Smerová anténa vyžaruje a prijíma rádiový signál. Zmeny signálu nesú zakódované dáta.',
    poe: 'PoE injektor pridáva napájanie. Elektrické dátové signály a napájanie sa prenášajú rovnakým ethernetovým káblom.',
    pc: 'Sieťová karta vytvára a prijíma rámce. Ich bity sa na výstupe menia na fyzický signál.',
    access: 'Switch číta cieľovú MAC adresu. Pri známom cieli posiela rámec na príslušný port, nie automaticky na všetky porty.',
    router: 'Router číta cieľovú IP adresu a vyberá cestu. V ukážke použije funkčný prepoj s najnižšou cenou.',
    building: 'Dáta medzi miestnymi PC prechádzajú cez prístupový switch; do druhej siete pokračujú cez router.'
  };
  function renderInspector() {
    const hidden = !inspected || (mode === 'predict' && !revealed);
    $('info').hidden = hidden;
    if (hidden) { $('signal-demo').replaceChildren(); $('signal-demo').dataset.running = 'false'; return; }
    const { key, device, title } = inspected, item = info[key];
    $('info-title').textContent = title || item[0]; $('info-body').innerHTML = item[1];
    let status = 'Ukážka princípu spracovania dát v zariadení.';
    if (M.links.includes(key)) status = switching ? 'Prepočítavam trasu. Nižšie je samostatná ukážka princípu.' : routeStatus(key) + '. Nižšie je ukážka princípu; animácia neznamená živý prenos týmto spojom.';
    else if (device && !state[device]) status = '✕ Router má poruchu. Nižšie vidíš princíp jeho činnosti pri funkčnom stave.';
    else if (key === 'lan') status = 'Miestny medený úsek. Tri hlavné prepínače ho neodpájajú.';
    $('info-state').textContent = status;
    const demo = V.signal(key, animations, narrow.matches, currentCosts(), route());
    $('signal-demo').dataset.medium = demo.medium; $('signal-demo').dataset.running = String(animations);
    $('signal-demo').innerHTML = demo.svg + '<div class="signal-bits" aria-label="Príklad prenášaných dát: 1 0 1 1 0 0 1 0"><span>Príklad dát</span>' + [...'10110010'].map((bit,i) => '<b style="--bit-index:'+i+'">'+bit+'</b>').join('') + '</div>';
    $('signal-caption').textContent = (key==='router' && !route() ? 'Nie je dostupná cesta do druhej budovy. Router v ukážke paket neodošle na žiadny prepoj.' : captions[key]) + (animations ? '' : ' Animácie sú vypnuté; zobrazený je statický náhľad.');
  }
  function showInfo(key, device, title, keyboard = false) {
    if (!info[key]) return;
    inspected = { key, device, title }; renderInspector();
    if (keyboard) $('info-title').focus({ preventScroll:true });
    $('info').scrollIntoView({ block:'nearest', behavior:animations ? 'smooth' : 'instant' });
  }
  $('close-info').addEventListener('click', () => {
    const previous = inspected; inspected = null; renderInspector();
    [...$('diagram').querySelectorAll('[role=button]')].find(element => element.dataset.info===previous?.key && (!previous.device || element.dataset.device===previous.device) && (!previous.title || element.dataset.title===previous.title))?.focus({preventScroll:true});
  });
  function control(key, title) { return '<div class="control"><span id="control-label-' + key + '">' + title + '</span><button type="button" data-toggle="' + key + '" aria-label="' + title + ': funguje; prepnúť poruchu" aria-pressed="true">✓ Funguje</button></div>'; }
  $('link-controls').innerHTML = control('fiber', 'Optika') + control('copper', 'Meď') + control('radio', 'Rádio');
  $('device-controls').innerHTML = control('routera', 'Router · budova A') + control('routerb', 'Router · budova B');
  $('controls').addEventListener('click', e => { const button = e.target.closest('[data-toggle]'); if (!button || mode === 'predict') return; setState({ ...state, [button.dataset.toggle]: !state[button.dataset.toggle] }); });
  function syncCostInputs() { M.links.forEach(key => { $('cost-'+key).value = currentCosts()[key]; $('cost-'+key).setAttribute('aria-invalid','false'); }); $('cost-feedback').textContent = ''; }
  $('cost-form').addEventListener('submit', e => {
    e.preventDefault(); if (mode === 'predict') return;
    const proposed = Object.fromEntries(M.links.map(key => [key, Number($('cost-'+key).value)]));
    M.links.forEach(key => $('cost-'+key).setAttribute('aria-invalid', String(!Number.isInteger(proposed[key]) || proposed[key] < 1 || proposed[key] > 65535)));
    if (!M.validCosts(proposed)) { $('cost-feedback').textContent = 'Zadaj pre každý spoj celé číslo od 1 do 65 535. Doterajšie ceny zostávajú použité.'; return; }
    costs = proposed; setState(state); $('cost-feedback').textContent = '✓ Ceny boli použité v oboch smeroch. Sleduj výber trasy.';
  });
  $('default-costs').addEventListener('click', () => { if (mode === 'predict') return; costs = { ...M.costs }; syncCostInputs(); setState(state); $('cost-feedback').textContent = 'Obnovené pôvodné ceny 10 / 20 / 30.'; });
  function cancelPacket() { clearTimeout(packetTimer); packetBusy = false; }
  function setState(next) {
    revision++; cancelPacket(); $('packet-result').textContent = ''; clearTimeout(routeTimer);
    const previous = switching ? null : active;
    state = { ...next }; const target = route();
    switching = previous !== target; active = switching ? null : target;
    render(); save();
    if (switching) routeTimer = setTimeout(() => { switching = false; active = route(); render(); }, animations ? 1000 : 350);
  }
  function routeStatus(key) {
    if (!state[key]) return '✕ Porucha';
    if (!state.routera || !state.routerb) return '— Blokuje router';
    if (switching) return '… Prepočet cesty';
    return active === key ? '▶ Aktívny prenos' : '✓ Dostupná záloha';
  }
  function render() {
    const hidden = mode === 'predict' && !revealed;
    $('prediction-cover').hidden = !hidden; $('diagram-content').hidden = hidden;
    $('communication').textContent = hidden ? 'Čakám na predpoveď' : switching ? 'Hľadám náhradnú cestu…' : active ? '✓ Komunikácia medzi budovami: funguje' : '✕ Komunikácia medzi budovami: nefunguje';
    $('communication').dataset.status = hidden || switching ? 'waiting' : active ? 'up' : 'down';
    $('route-name').textContent = hidden ? 'Výsledok sa zobrazí po overení.' : switching ? 'Prepočítavam dostupné trasy' : active ? 'Použitý spoj: ' + M.labels[active] : 'Použitý spoj: žiadny';
    $('backup-count').textContent = hidden ? 'Zálohy: čakajú na overenie' : switching ? 'Zálohy: vyhodnocujem' : 'Dostupné záložné spoje: ' + M.backups(state);
    $('state-explanation').textContent = hidden ? 'Vyber odpoveď podľa cien a porúch uvedených v úlohe.' : switching ? 'Krátky ilustračný prepočet. Trvanie nepredstavuje meranie skutočného času prepnutia.' : explain();
    document.querySelectorAll('[data-toggle]').forEach(b => {
      const key = b.dataset.toggle; b.setAttribute('aria-pressed', String(state[key]));
      b.textContent = state[key] ? '✓ Funguje' : '✕ Porucha'; b.disabled = mode === 'predict';
      b.setAttribute('aria-label', (key === 'routera' ? 'Router v budove A' : key === 'routerb' ? 'Router v budove B' : M.labels[key]) + ': ' + (state[key] ? 'funguje; simulovať poruchu' : 'porucha; obnoviť'));
    });
    $('controls').hidden = hidden;
    $('restore').disabled = mode === 'predict'; $('send-packet').disabled = hidden || switching || packetBusy;
    $('quiz-badge').textContent = solved.filter(Boolean).length + '/9';
    $('challenge-badge').textContent = M.links.filter(k => challenge[k]).length + '/3';
    $('challenge-progress').innerHTML = M.links.map(k => '<li class="' + (challenge[k] ? 'done' : '') + '">' + (challenge[k] ? '✓ ' : '○ ') + M.labels[k] + (challenge[k] ? ' · overené' : ' · čaká na paket') + '</li>').join('');
    $('discussion').hidden = !M.links.every(k => challenge[k]);
    const prices = currentCosts();
    for (const key of M.links) {
      $('legend-'+key).textContent = (key==='radio'?'┄ ':'━ ') + M.labels[key] + ' · cena ' + prices[key];
      $('control-label-'+key).textContent = (key==='copper'?'Meď':M.labels[key]) + ' · ' + prices[key];
      $('cost-'+key).disabled = mode==='predict';
    }
    $('apply-costs').disabled = $('default-costs').disabled = mode==='predict';
    $('cost-mode-note').textContent = mode==='predict' ? 'Úlohy používajú pevné ceny 10 / 20 / 30. Tvoje vlastné nastavenie sa zachová pre ostatné režimy.' : 'Nižšia cena = vyššia prednosť. Zmena ovplyvní oba smery prenosu.';
    const order = [...M.links].sort((a,b) => prices[a]-prices[b]);
    $('cost-order').textContent = 'Poradie: ' + order.map(key => M.labels[key]+' ('+prices[key]+')').join(' → ') + (new Set(Object.values(prices)).size<3 ? '. Pri zhode model rozhoduje v poradí optika, meď, rádio; reálne OSPF môže použiť ECMP.' : '.');
    $('ospf-example').textContent = 'configure terminal\n' + ['fiber','copper','radio'].map((key,i) => 'interface GigabitEthernet0/'+i+'\n description '+({fiber:'OPTIKA',copper:'MED',radio:'RADIO'}[key])+'\n ip ospf 1 area 0\n ip ospf cost '+prices[key]+'\n exit').join('\n') + '\nend\nshow ip ospf interface brief\nshow ip route ospf';
    drawDiagram();
    renderInspector();
  }
  function drawDiagram() {
    const mobile = narrow.matches;
    const color = { copper: 'var(--copper)', fiber: 'var(--green)', radio: 'var(--orange)' };
    const p = a => a.join(',');
    const d = points => 'M' + points.map(p).join(' L');
    const localA = mobile ? [[80,90],[80,135],[210,135],[210,160],[210,230]] : [[65,105],[65,145],[140,145],[140,185],[140,235],[200,235],[200,285]];
    const localB = mobile ? [[210,840],[210,910],[210,935],[80,935],[80,1000]] : [[920,285],[920,235],[980,235],[980,185],[980,145],[905,145],[905,105]];
    const paths = mobile ? {
      copper: [[210,230],[70,230],[70,840],[210,840]],
      fiber: [[210,230],[210,840]],
      radio: [[210,230],[350,230],[350,840],[210,840]]
    } : {
      copper: [[200,285],[285,285],[285,170],[835,170],[835,285],[920,285]],
      fiber: [[200,285],[920,285]],
      radio: [[200,285],[285,285],[285,400],[835,400],[835,285],[920,285]]
    };
    let svg = '<svg viewBox="0 0 ' + (mobile ? '420 1080' : '1120 465') + '" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Budovy A a B s tromi samostatnými prepojmi">';
    for (const [side, x, y] of mobile ? [['A',10,10],['B',10,790]] : [['A',20,40],['B',860,40]]) {
      svg += '<rect class="building" data-info="building" data-title="Budova '+side+' · miestna sieť" role="button" tabindex="0" aria-label="Budova '+side+': miestna sieť" x="' + x + '" y="' + y + '" width="' + (mobile ? 400 : 240) + '" height="' + (mobile ? 270 : 305) + '" rx="18"/><text class="building-title" data-info="building" data-title="Budova '+side+' · miestna sieť" x="' + (x+18) + '" y="' + (y+30) + '">Budova ' + side + '</text>';
    }
    const connected = !!active && !switching;
    svg += '<path class="wire ' + (connected ? 'local-active' : '') + '" d="' + d(localA) + '"/><path class="wire ' + (connected ? 'local-active' : '') + '" d="' + d(localB) + '"/>';
    svg += '<path class="local-hit" data-info="lan" data-title="Káble v budove A" role="button" tabindex="0" aria-label="Medené káble v budove A: prenos elektrickým signálom" d="'+d(localA)+'"/><path class="local-hit" data-info="lan" data-title="Káble v budove B" role="button" tabindex="0" aria-label="Medené káble v budove B: prenos elektrickým signálom" d="'+d(localB)+'"/>';
    // Other PCs share the access switch but are not the animated conversation.
    const otherLocal = mobile ? 'M210,90 V135 M340,90 V135 H210 M210,1000 V935 M340,1000 V935 H210' : 'M140,105 V145 M215,105 V145 H140 M980,105 V145 M1055,105 V145 H980';
    svg += '<path class="wire" d="'+otherLocal+'"/><path class="local-hit" data-info="lan" role="button" tabindex="0" aria-label="Medené káble ostatných PC: prenos elektrickým signálom" d="'+otherLocal+'"/>';
    for (const key of ['copper','fiber','radio']) {
      const cls = 'route-line' + (active === key ? ' active' : '') + (!state[key] ? ' failed' : '');
      svg += '<path class="' + cls + '" stroke="' + color[key] + '" d="' + d(paths[key]) + '"/>';
      if (key === 'radio') {
        // Overlay white only between radios, then draw the actual wireless segment dashed.
        const air = mobile ? 'M350,462 L350,618' : 'M441,400 L679,400';
        svg += '<path d="' + air + '" stroke="var(--surface)" stroke-width="8" fill="none"/><path class="' + cls + '" d="' + air + '" stroke="' + color[key] + '" stroke-dasharray="9 8"/>';
        svg += '<path class="route-hit" d="'+air+'" data-info="radio" aria-hidden="true"/>';
        const wires = mobile ? ['M210,230 H350 V462','M350,618 V840 H210'] : ['M200,285 H285 V400 H441','M679,400 H835 V285 H920'];
        for (const wire of wires) svg += '<path class="local-hit" d="'+wire+'" data-info="radio-wire" role="button" tabindex="0" aria-label="Ethernetový kábel pri rádiu: elektrický prenos dát"/>';
      }
      if (key!=='radio') svg += '<path class="route-hit" d="' + d(paths[key]) + '" data-info="' + key + '" aria-hidden="true"/>';
    }
    const node = (x,y,label,key,w=80,h=40,on=false,failed=false,deviceId='',facing=1) => {
      const title = key==='poe' ? 'PoE injektor' : key==='antenna' ? 'Smerové rádio' : label;
      return '<g class="node device-'+key + (on ? ' active' : '') + (failed ? ' failed' : '') + '" data-info="'+key+'" data-device="'+deviceId+'" data-title="'+title+'" role="button" tabindex="0" aria-controls="info" aria-label="'+title+(failed?', porucha':'')+': vysvetlenie a prenos dát"><rect class="device-hit" x="'+(x-w/2)+'" y="'+(y-32)+'" width="'+w+'" height="76" rx="7"/><g class="device-drawing" transform="translate('+x+' '+y+')">'+V.device(key,facing)+'</g><text class="device-label" x="'+x+'" y="'+(y+37)+'">'+label+'</text></g>';
    };
    for (const side of ['A','B']) {
      const a = side === 'A';
      const pcXs = mobile ? [80,210,340] : a ? [65,140,215] : [905,980,1055];
      const pcY = mobile ? a ? 90 : 1000 : 105;
      pcXs.forEach((x,i) => { svg += node(x,pcY,'PC '+side+(i+1),'pc',62,48,connected && i===0); });
      const ax = mobile ? 210 : a ? 140 : 980, ay = mobile ? a ? 160 : 910 : 185;
      svg += node(ax,ay,'Prístupový switch','access',mobile ? 160 : 172,40,connected);
      svg += node(mobile ? 210 : a ? 200 : 920,mobile ? a ? 230 : 840 : 285,'Router '+side,'router',110,44,connected,!state[a ? 'routera':'routerb'],a?'routera':'routerb');
      if (mobile) {
        svg += node(210,a ? 338 : 738,'SFP','sfp',64,34,active==='fiber');
        svg += node(350,a ? 340 : 740,'PoE','poe',64,34,active==='radio');
        svg += node(350,a ? 442 : 638,'Rádio','antenna',70,40,active==='radio',false,'',a?1:-1);
      } else {
        svg += node(a ? 328 : 792,285,'SFP','sfp',60,34,active==='fiber');
        svg += node(a ? 328 : 792,400,'PoE','poe',60,34,active==='radio');
        svg += node(a ? 408 : 712,400,'Rádio','antenna',66,40,active==='radio',false,'',a?1:-1);
      }
    }
    for (const [i,key] of ['copper','fiber','radio'].entries()) {
      const x = mobile ? [70,210,350][i] : 560, y = mobile ? [506,553,506][i] : [139,254,369][i];
      svg += '<g data-info="' + key + '" role="button" tabindex="0" aria-label="' + M.labels[key] + ', cena ' + currentCosts()[key] + ', ' + routeStatus(key) + ': vysvetlenie"><text class="route-label" x="' + x + '" y="' + y + '" fill="' + color[key] + '">' + (mobile && key==='copper' ? 'Meď' : M.labels[key]) + '</text><text class="route-state" x="' + x + '" y="' + (y+21) + '">' + (mobile ? 'Cena ' + currentCosts()[key] : routeStatus(key)) + '</text>' + (mobile ? '<text class="route-state" x="' + x + '" y="' + (y+42) + '">' + routeStatus(key).replace('Dostupná záloha','Záloha').replace('Aktívny prenos','Aktívny').replace('Prepočet cesty','Prepočet') + '</text>' : '') + '</g>';
      if (!state[key]) {
        const fx = mobile ? x : 560, fy = mobile ? y+75 : [170,285,400][i];
        svg += '<circle cx="' + fx + '" cy="' + fy + '" r="11" fill="#b42d39"/><text x="' + fx + '" y="' + (fy+5) + '" text-anchor="middle" fill="white" font-size="17">×</text>';
      }
    }
    if (connected && animations) {
      const journey = localA.concat(paths[active].slice(1),localB.slice(1));
      const path = d(journey);
      svg += '<rect class="packet" data-medium="'+active+'" x="-5" y="-5" width="10" height="10" rx="2"><animateMotion dur="4.8s" repeatCount="indefinite" path="' + path + '" keyPoints="0;1;1" keyTimes="0;0.45;1" calcMode="linear"/></rect><rect class="packet reply" x="-5" y="-5" width="10" height="10" rx="2"><animateMotion dur="4.8s" repeatCount="indefinite" path="' + path + '" keyPoints="1;1;0" keyTimes="0;0.5;1" calcMode="linear"/></rect>';
    }
    svg += '</svg>';
    // Keep keyboard focus when redrawing a responsive or changed diagram.
    const focused = $('diagram').contains(document.activeElement) ? document.activeElement.dataset.info : null;
    $('diagram').innerHTML = svg;
    if (focused) $('diagram').querySelector('[role="button"][data-info="' + focused + '"]')?.focus({ preventScroll: true });
  }
  $('diagram').addEventListener('click', e => { const target = e.target.closest('[data-info]'); if (target) showInfo(target.dataset.info,target.dataset.device,target.dataset.title); });
  $('diagram').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const target = e.target.closest('[role=button]'); if (target) { e.preventDefault(); showInfo(target.dataset.info,target.dataset.device,target.dataset.title,true); } } });
  $('restore').addEventListener('click', () => { if (mode !== 'predict') setState(M.healthy()); });
  $('send-packet').addEventListener('click', () => {
    if (switching || packetBusy || (mode === 'predict' && !revealed)) return;
    if (!active) { $('packet-result').textContent = '✕ Paket nedorazil. ' + explain(); return; }
    const sentRevision = revision, sentRoute = active;
    const isolated = M.links.filter(k => state[k]).length === 1;
    packetBusy = true; $('send-packet').disabled = true;
    $('packet-result').textContent = '… Paket putuje z PC A1 do PC B1 a odpoveď späť.';
    packetTimer = setTimeout(() => {
      packetBusy = false;
      if (sentRevision !== revision || switching || route() !== sentRoute) return;
      if (isolated && mode !== 'predict') challenge[sentRoute] = true;
      $('packet-result').textContent = '✓ Paket aj odpoveď dorazili cez ' + ({fiber:'optiku',copper:'medený Ethernet',radio:'rádiový spoj'}[sentRoute]) + '.' + (isolated && mode !== 'predict' ? ' Samostatný spoj je overený.' : ' Pre výzvu nechaj zapnutý iba jeden spoj.');
      render(); save();
    }, animations ? 4800 : 100);
  });
  function chooseMode(next) {
    const wasPredict = mode==='predict';
    cancelPacket(); $('packet-result').textContent = ''; mode = next; syncCostInputs();
    document.querySelectorAll('[data-mode]').forEach(button => { const selected = button.dataset.mode === mode; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; $(button.getAttribute('aria-controls')).hidden = !selected; });
    if (mode === 'predict') loadQuestion(); else if (wasPredict) setState(state); else render();
  }
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => chooseMode(button.dataset.mode));
    button.addEventListener('keydown', e => {
      const tabs = [...document.querySelectorAll('[data-mode]')]; const index = tabs.indexOf(button);
      const target = e.key === 'ArrowRight' ? (index+1)%tabs.length : e.key === 'ArrowLeft' ? (index+tabs.length-1)%tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length-1 : null;
      if (target !== null) { e.preventDefault(); tabs[target].focus(); chooseMode(tabs[target].dataset.mode); }
    });
  });
  function loadQuestion() {
    cancelPacket(); $('packet-result').textContent = '';
    revealed = false; retrying = false;
    $('question-count').textContent = 'ÚLOHA ' + (question+1) + ' Z 9';
    $('question-title').textContent = M.scenarios[question].title;
    $('question-context').textContent = (question === 8 ? 'Pred obnovením ide prenos cez meď; rádio je tiež funkčné. Predpovedz stav po obnovení optiky.' : 'Každá úloha začína so všetkými funkčnými spojmi a routermi; potom nastane uvedená zmena.') + ' Ceny v úlohách: optika 10, meď 20, rádio 30.';
    $('answers').hidden = false; $('quiz-summary').hidden = true;
    document.querySelectorAll('[name=prediction]').forEach(input => { input.checked = false; input.disabled = false; });
    $('verify').hidden = false; $('verify').disabled = true; $('retry').hidden = true; $('next-question').hidden = true;
    $('quiz-feedback').textContent = '';
    clearTimeout(routeTimer); switching = false; state = { ...M.scenarios[question].before }; active = route(); revision++;
    render(); save();
  }
  $('answers').addEventListener('change', () => { $('verify').disabled = !document.querySelector('[name=prediction]:checked'); });
  $('verify').addEventListener('click', () => {
    const choice = document.querySelector('[name=prediction]:checked')?.value; if (!choice || $('verify').disabled) return;
    const scenario = M.scenarios[question]; revealed = true;
    // The answer comes from the same resulting state used by the live simulation.
    setState(scenario.state); const actual = route() || 'none'; const correct = choice === actual;
    if (first[question] === null) first[question] = correct;
    if (correct) solved[question] = true;
    $('quiz-feedback').dataset.correct = String(correct);
    $('quiz-feedback').textContent = (correct ? '✓ Správne. ' : '✕ Tentoraz nie. ') + 'Výsledok: ' + M.labels[actual] + '. ' + explain() + (retrying ? ' Počíta sa tvoja prvá odpoveď.' : '');
    document.querySelectorAll('[name=prediction]').forEach(input => { input.disabled = true; });
    $('verify').hidden = true; $('retry').hidden = correct; $('next-question').hidden = false;
    $('next-question').textContent = question === 8 ? 'Zobraziť výsledky' : 'Ďalšia úloha';
    render(); save();
  });
  $('retry').addEventListener('click', () => {
    retrying = true; revealed = false; clearTimeout(routeTimer); switching = false; cancelPacket(); revision++;
    $('packet-result').textContent = ''; state = { ...M.scenarios[question].before }; active = route();
    $('quiz-feedback').textContent = 'Nápoveda: ' + M.scenarios[question].hint;
    document.querySelectorAll('[name=prediction]').forEach(input => { input.checked = false; input.disabled = false; });
    $('verify').hidden = false; $('verify').disabled = true; $('retry').hidden = true; $('next-question').hidden = true; render();
  });
  $('next-question').addEventListener('click', () => {
    if (question < 8) { question++; loadQuestion(); $('question-title').tabIndex = -1; $('question-title').focus(); }
    else {
      $('answers').hidden = true; $('verify').hidden = true; $('retry').hidden = true; $('next-question').hidden = true;
      const topics = M.scenarios.filter((s,i) => first[i] === false).map(s => s.topic);
      $('quiz-summary').hidden = false;
      $('quiz-summary').innerHTML = '<h3>Správne prvé odpovede: ' + first.filter(v => v === true).length + ' / 9</h3><p>' + (topics.length ? 'Zopakuj si: ' + topics.join(', ') + '.' : 'Výborne. Rozumieš výberu trasy, zálohám aj spoločnému bodu poruchy.') + '</p><p>Úlohy opravené ďalším pokusom: ' + first.filter((v,i) => v === false && solved[i]).length + '.</p>';
      save();
    }
  });
  $('quiz-reset').addEventListener('click', () => { first = Array(9).fill(null); solved = Array(9).fill(false); question = 0; loadQuestion(); });
  const lengthIds = ['length-distance','length-a','length-b','length-patch'];
  const number = n => n.toLocaleString('sk-SK', { maximumFractionDigits: 9 });
  function updateLength() {
    const values = lengthIds.map(id => $(id).value.trim() === '' ? NaN : Number($(id).value)); const result = M.cable(values);
    lengthIds.forEach((id,i) => $(id).setAttribute('aria-invalid', String(!Number.isFinite(values[i]) || values[i] < 0 || values[i] > 10000)));
    $('length-result').dataset.status = result?.status || 'invalid';
    if (!result) { $('length-result').textContent = 'Zadaj všetky štyri dĺžky od 0 do 10 000 metrov.'; return; }
    lengths = values;
    $('length-result').textContent = values.map(number).join(' + ') + ' = ' + number(result.total) + ' m. ' + (result.status === 'over' ? '✕ Limit je prekročený o ' + number(-result.remaining) + ' m. Trasu treba skrátiť alebo návrh prepracovať.' : result.status === 'exact' ? '⚠ Presne 100 m: limit neprekračuješ, ale nemáš žiadnu dĺžkovú rezervu.' : '✓ V limite. Dĺžková rezerva: ' + number(result.remaining) + ' m.');
    save();
  }
  lengthIds.forEach((id,i) => { $(id).value = lengths[i]; $(id).addEventListener('input', updateLength); });
  $('animations').checked = animations;
  $('animations').addEventListener('change', () => { animations = $('animations').checked; render(); save(); });
  reducedMotion.addEventListener('change', e => { if (e.matches) { animations = false; $('animations').checked = false; render(); save(); } });
  narrow.addEventListener('change', () => { drawDiagram(); renderInspector(); });
  $('erase').addEventListener('click', () => {
    clearTimeout(routeTimer); cancelPacket(); revision++; switching = false; costs = { ...M.costs }; inspected = null; state = M.healthy(); active = route();
    first = Array(9).fill(null); solved = Array(9).fill(false); challenge = {}; question = 0; lengths = [70,7,8,5];
    lengthIds.forEach((id,i) => { $(id).value = lengths[i]; });
    $('packet-result').textContent = ''; updateLength(); chooseMode('free');
    try { localStorage.removeItem(storageKey); $('storage-note').textContent = 'Uložený priebeh bol vymazaný. Nové kroky sa budú ukladať iba v tomto prehliadači.'; } catch { $('storage-note').textContent = 'Ukladanie nie je dostupné. Priebeh aktuálnej relácie bol vymazaný.'; }
  });
  syncCostInputs(); updateLength(); render(); save();
})();
