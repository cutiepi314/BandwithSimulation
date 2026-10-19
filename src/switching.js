(() => {
  'use strict';
  const M = window.SwitchingModel;
  const $ = id => document.getElementById('sw-' + id);
  const root = $('learning').parentElement;
  const names = { unknown: 'Unknown unicast · flooding', known: 'Known unicast', broadcast: 'Broadcast · flooding', filtered: 'Filtrovanie · rovnaký port' };
  let topic = 'learning', timer = null, forwardTimer = null, bufferTimer = null;
  let sequence = M.lesson, frameIndex = 0, phase = 0, baseTable = [], history = [], clock = 0, custom = false;
  const getVlans = () => $('vlans').checked ? [1,1,2,2] : [1,1,1,1];
  const currentFrame = () => ({ source: sequence[frameIndex][0], destination: sequence[frameIndex][1] });
  const result = () => M.process(baseTable, currentFrame(), getVlans(), clock);
  const visibleTable = () => phase >= 1 ? result().table : baseTable;
  const portText = ports => ports.length ? ports.map(p => 'Fa0/' + p).join(', ') : 'žiadny port';
  function pause() {
    clearInterval(timer); clearInterval(forwardTimer); clearInterval(bufferTimer);
    timer = forwardTimer = bufferTimer = null;
    for (const [id,label] of [['play','▶ Prehrať'],['forward-play','▶ Prehrať'],['buffer-play','▶ Spustiť']]) {
      $(id).textContent = label; $(id).setAttribute('aria-pressed','false');
    }
    drawNetwork(result());
  }
  function showTopic(next) {
    pause(); topic = next;
    root.querySelectorAll('[data-sw-topic]').forEach(button => {
      const selected = button.dataset.swTopic === topic;
      button.setAttribute('aria-pressed', String(selected));
      $(button.dataset.swTopic).hidden = !selected;
    });
  }
  root.querySelectorAll('[data-sw-topic]').forEach(button => button.addEventListener('click', () => showTopic(button.dataset.swTopic)));
  function tableHTML(table, highlight) {
    return table.length ? table.map(row => `<tr${row.mac === highlight ? ' class="sw-learned"' : ''}><td>${row.vlan}</td><td><code>${row.mac}</code></td><td>Fa0/${row.port}</td></tr>`).join('') : '<tr><td colspan="3">Zatiaľ žiadny záznam</td></tr>';
  }
  function drawNetwork(r) {
    const positions = [[100,75],[540,75],[100,295],[540,295]], vlans = getVlans();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let content = '<title id="sw-net-title">Štyri PC pripojené k switchu SW1</title><desc id="sw-net-description">' + (phase === 3 ? names[r.kind] + '. Výstup: ' + portText(r.ports) : 'Vstup Fa0/' + r.ingress + '. ' + ['Príjem rámca','Učenie source MAC','Vyhľadanie destination MAC'][phase]) + '</desc>';
    positions.forEach(([x,y],i) => {
      const p = i+1, input = p === r.ingress, output = phase === 3 && r.ports.includes(p);
      const accepted = r.destination === M.BROADCAST || r.destination === M.mac(p);
      const endX = x < 300 ? 255 : 385, endY = y < 180 ? 155 : 215;
      content += `<path class="sw-wire ${input ? 'sw-input' : output ? 'sw-output' : ''}" d="M${x},${y} L${endX},${endY}"/>`;
      content += `<rect class="sw-node" x="${x-62}" y="${y-32}" width="124" height="64" rx="10"${output ? ' style="stroke:var(' + (accepted ? '--sw-green' : '--sw-orange') + ')"' : ''}/><text x="${x}" y="${y-6}" text-anchor="middle" font-size="17" font-weight="700">PC${p}</text><text x="${x}" y="${y+15}" text-anchor="middle" font-size="11">M${p} · …:0${p} · VLAN ${vlans[i]}</text>`;
      content += `<text x="${x < 300 ? 200 : 440}" y="${y < 180 ? 119 : 255}" text-anchor="middle" font-size="11">Fa0/${p}</text>`;
      if ((phase === 0 && input) || output) {
        const start = input ? [x,y] : [endX,endY], end = input ? [endX,endY] : [x,y];
        content += timer !== null && !reduce ? `<circle r="6" class="${input ? 'sw-dot' : 'sw-dot-out'}"><animateMotion dur="1.4s" repeatCount="indefinite" path="M${start[0]},${start[1]} L${end[0]},${end[1]}"/></circle>` : `<circle r="6" class="${input ? 'sw-dot' : 'sw-dot-out'}" cx="${(start[0]+end[0])/2}" cy="${(start[1]+end[1])/2}"/>`;
      }
      if (output) content += `<text x="${x}" y="${y+49}" text-anchor="middle" font-size="10" style="fill:var(${accepted ? '--sw-green' : '--sw-orange'})">${accepted ? 'Prijme rámec' : 'Iná cieľová MAC → ignoruje'}</text>`;
    });
    content += '<rect class="sw-node" x="255" y="140" width="130" height="90" rx="13" style="fill:var(--accent);stroke:var(--primary)"/><text x="320" y="177" text-anchor="middle" font-size="23" font-weight="700">SW1</text><text x="320" y="202" text-anchor="middle" font-size="11">L2 switch</text>';
    $('network').innerHTML = `<svg class="sw-diagram" viewBox="0 0 640 365" role="img" aria-labelledby="sw-net-title sw-net-description">${content}</svg>`;
  }
  function renderLearning() {
    const r = result(), frame = currentFrame();
    drawNetwork(r);
    $('source').textContent = r.source; $('destination').textContent = r.destination;
    $('frame-count').textContent = custom ? 'Vlastný rámec' : `Rámec ${frameIndex+1} / ${sequence.length}`;
    $('clock').textContent = `t = ${clock} s`;
    $('mac-table').innerHTML = tableHTML(visibleTable(), phase >= 1 ? r.source : null);
    const decision = r.kind === 'known' ? `Destination MAC pozná: ${r.destination} → ${portText(r.ports)}.` : r.kind === 'unknown' ? `Destination ${r.destination} v tejto VLAN nepozná. Použije ostatné porty VLAN ${r.vlan}; cieľová MAC zostáva nezmenená.` : r.kind === 'broadcast' ? `FF:FF:FF:FF:FF:FF je broadcast. Odošle ho ostatným portom VLAN ${r.vlan}, aj pri plnej tabuľke.` : 'Cieľ je dostupný cez ten istý port, cez ktorý rámec prišiel. Switch ho ďalej neprepošle.';
    const captions = [
      [`PC${frame.source} → ${frame.destination === 'broadcast' ? 'všetci v rovnakej VLAN' : 'PC'+frame.destination}`, `Rámec prichádza cez Fa0/${frame.source}. Sleduj najprv source MAC a potom destination MAC. Ukážka pracuje s platným rámcom; FCS skúmaj v druhej téme.`],
      [r.learned ? 'Nový záznam zo SOURCE MAC' : 'Obnovenie záznamu zo SOURCE MAC', `${r.source} → Fa0/${frame.source}, VLAN ${r.vlan}. Switch sa učí adresu odosielateľa, nie príjemcu.`],
      [names[r.kind], decision],
      [r.ports.length ? 'Výstup: ' + portText(r.ports) : 'Rámec sa ďalej neprepošle', decision + (r.kind === 'unknown' ? ' Ostatné PC s inou cieľovou MAC rámec ignorujú.' : '')]
    ];
    $('step-title').textContent = captions[phase][0]; $('step-text').textContent = captions[phase][1];
    $('table-note').textContent = phase >= 1 ? `${r.learned ? 'Naučené' : 'Obnovené'}: M${frame.source} → Fa0/${frame.source}. Cieľ sa samotným doručením nenaučí.` : 'Tabuľka pred spracovaním tohto rámca.';
    [...$('stages').children].forEach((item,i) => item.classList.toggle('sw-active',i <= phase));
    $('prev').disabled = frameIndex === 0 && phase === 0;
    $('next').disabled = frameIndex === sequence.length-1 && phase === 3;
    $('next').textContent = phase === 3 && frameIndex < sequence.length-1 ? 'Ďalší rámec →' : 'Ďalší krok →';
  }
  function advance() {
    if (phase < 3) phase++;
    else if (frameIndex < sequence.length-1) { history[frameIndex] = baseTable.map(row => ({...row})); baseTable = result().table; frameIndex++; phase = 0; }
    else { pause(); return; }
    renderLearning();
    if (frameIndex === sequence.length-1 && phase === 3) pause();
  }
  function startSequence(frames, own = false, table = []) {
    pause(); sequence = frames; custom = own; baseTable = table; history = []; frameIndex = phase = 0; renderLearning();
  }
  $('next').addEventListener('click', () => { pause(); advance(); });
  $('prev').addEventListener('click', () => { pause(); if (phase) phase--; else if (frameIndex) { frameIndex--; baseTable = history[frameIndex].map(row => ({...row})); phase=3; } renderLearning(); });
  $('play').addEventListener('click', () => {
    if (timer !== null) { pause(); return; }
    if (frameIndex === sequence.length-1 && phase === 3) startSequence(sequence,custom);
    timer = setInterval(advance,1800); $('play').textContent = 'Ⅱ Pozastaviť'; $('play').setAttribute('aria-pressed','true'); renderLearning();
  });
  $('reset').addEventListener('click', () => startSequence(sequence,custom));
  $('lesson').addEventListener('click', () => { $('vlans').checked=false; startSequence(M.lesson); });
  $('custom').addEventListener('click', () => startSequence([[Number($('custom-source').value), $('custom-destination').value === 'broadcast' ? 'broadcast' : Number($('custom-destination').value)]], true, visibleTable()));
  $('clear').addEventListener('click', () => startSequence(sequence,custom));
  $('age').addEventListener('click', () => { const table = visibleTable(), frame = sequence[frameIndex]; clock += 300; startSequence([frame],true,M.age(table,clock)); $('table-note').textContent = 'Uplynulo 300 s bez prevádzky: neobnovené dynamické záznamy vypršali. Ďalší rámec ich môže znovu naučiť.'; });
  $('vlans').addEventListener('change', () => startSequence(sequence,custom));
  $('demo-vlan').addEventListener('click', () => { showTopic('learning'); $('vlans').checked=true; startSequence([[1,'broadcast']],true); });

  function renderForward() {
    const time = Number($('forward-time').value), cut = $('method').value === 'cut', bad = $('corrupt').value === 'bad';
    const received = Math.min(time,100), sent = !cut && bad ? 0 : Math.max(0,Math.min(100,time-(cut ? 8 : 110)));
    $('rx-bar').style.width = received+'%'; $('tx-bar').style.width = sent+'%';
    $('rx-label').textContent = `Prijaté ${received} %${received === 100 ? ' · FCS dorazilo' : ''}`;
    $('tx-label').textContent = !cut && bad && time >= 100 ? 'Zahodený · žiadny výstup' : `Odoslané ${sent} %`;
    let status;
    if (cut) status = time < 8 ? 'Switch čaká na prečítanie destination MAC.' : time < 100 ? 'Odosielanie sa už začalo, hoci zvyšok rámca vrátane FCS ešte prichádza.' : bad ? 'Poškodený rámec už smeruje k príjemcovi. Jeho sieťová karta pri kontrole FCS odhalí chybu a rámec zahodí.' : 'Príjem je dokončený; výstup sa začal ešte počas prijímania.';
    else status = time < 100 ? 'Switch najprv prijíma celý rámec. Na výstupe zatiaľ nič neposiela.' : bad ? 'CRC nesúhlasí s prijatým FCS. Switch rámec zahodí a neodošle ho.' : time < 110 ? 'Celý rámec je prijatý. Switch overuje FCS pred odoslaním.' : 'FCS je platné. Až teraz switch odošle rámec.';
    $('forward-status').textContent = status;
  }
  for (const id of ['method','corrupt']) $(id).addEventListener('change', () => { pause(); $('forward-time').value=0; renderForward(); });
  $('forward-time').addEventListener('input', () => { pause(); renderForward(); });
  $('forward-reset').addEventListener('click', () => { pause(); $('forward-time').value=0; renderForward(); });
  $('forward-play').addEventListener('click', () => {
    if (forwardTimer !== null) { pause(); return; }
    if (Number($('forward-time').value) >= 210) $('forward-time').value=0;
    $('forward-play').textContent='Ⅱ Pozastaviť'; $('forward-play').setAttribute('aria-pressed','true');
    forwardTimer=setInterval(() => { $('forward-time').value = Math.min(210,Number($('forward-time').value)+2); renderForward(); if (Number($('forward-time').value)===210) pause(); },60);
  });

  const emptyBuffer = () => ({ queues: [[],[],[],[]], sent: 0, dropped: 0 });
  let buffer = emptyBuffer();
  const slot = filled => `<span class="sw-slot${filled ? ' sw-filled' : ''}">${filled ? '→4' : '·'}</span>`;
  function renderBuffer() {
    const shared = $('buffer-mode').value === 'shared', count = buffer.queues.reduce((n,q) => n+q.length,0);
    $('buffer-view').innerHTML = shared ? '<p class="sw-muted">Spoločná pamäť · všetky porty</p><div class="sw-slots">'+Array.from({length:16},(_,i)=>slot(i<count)).join('')+'</div>' : buffer.queues.map((q,i)=>`<p class="sw-muted">Fa0/${i+1} · ${q.length} / 4</p><div class="sw-slots">${Array.from({length:4},(_,j)=>slot(j<q.length)).join('')}</div>`).join('');
    $('buffer-waiting').textContent=count; $('buffer-sent').textContent=buffer.sent; $('buffer-dropped').textContent=buffer.dropped;
    $('buffer-status').textContent = count === (shared ? 16 : 4) ? 'Front Fa0/4 je plný. Ďalšie príchody bez voľného miesta sa zahodia.' : !count ? 'Buffer je prázdny. Spusť prísun rámcov.' : `Vo fronte pre Fa0/4 čaká ${count} rámcov. Výstup zvládne jeden za krok.`;
  }
  function tickBuffer() { buffer=M.bufferTick(buffer,Number($('buffer-load').value),1,$('buffer-mode').value); renderBuffer(); }
  $('buffer-tick').addEventListener('click', () => { pause(); tickBuffer(); });
  $('buffer-reset').addEventListener('click', () => { pause(); buffer=emptyBuffer(); renderBuffer(); });
  $('buffer-mode').addEventListener('change', () => { pause(); buffer=emptyBuffer(); renderBuffer(); });
  $('buffer-play').addEventListener('click', () => { if (bufferTimer !== null) { pause(); return; } $('buffer-play').textContent='Ⅱ Pozastaviť'; $('buffer-play').setAttribute('aria-pressed','true'); bufferTimer=setInterval(tickBuffer,800); });

  let exerciseIndex=0, exerciseTable=[], solved=false, score=0, tried=false;
  const letter = n => String.fromCharCode(64+n);
  const exerciseMac = row => ({...row, mac: row.mac.slice(0,-2)+'0'+letter(Number(row.mac.slice(-1)))});
  function renderExercise() {
    const [source,destination]=M.exercise[exerciseIndex], r=M.process(exerciseTable,{source,destination});
    $('exercise-count').textContent=`Rámec ${exerciseIndex+1} / 6`;
    $('question').textContent=`${letter(source)} → ${destination === 'broadcast' ? 'FF:FF:FF:FF:FF:FF' : letter(destination)}`;
    $('exercise-table').innerHTML=tableHTML(exerciseTable.map(exerciseMac));
    $('exercise-score').textContent=`Správne na prvý pokus: ${score} / ${solved ? exerciseIndex+1 : exerciseIndex}`;
    $('exercise-next').disabled=!solved || exerciseIndex===5;
    $('exercise-next').textContent=solved && exerciseIndex===5 ? 'Všetkých 6 rámcov vyriešených' : 'Ďalší rámec →';
    const options = [[1],[2],[3],[4],[1,2,3,4].filter(p=>p!==source),[]];
    $('answers').replaceChildren(...options.map(ports => {
      const button=document.createElement('button'); button.type='button'; button.textContent=portText(ports)+(ports.length>1 ? ' · flooding' : ''); button.disabled=solved;
      button.addEventListener('click', () => {
        const correct=ports.join(',')===r.ports.join(',');
        if (!correct) { tried=true; $('exercise-feedback').textContent='Skús ešte raz. Nauč sa source a hľadaj destination v tabuľke z predchádzajúcich krokov. Vstupný port sa vynecháva.'; return; }
        if (!tried) score++;
        solved=true; exerciseTable=r.table;
        renderExercise();
        $('exercise-feedback').textContent=`Správne. ${r.learned ? 'Naučí' : 'Obnoví'} ${letter(source)} → Fa0/${source}. ${names[r.kind]}; výstup: ${portText(r.ports)}.`+(exerciseIndex===5 ? ` Hotovo! Na prvý pokus: ${score} zo 6.` : '');
      });
      return button;
    }));
  }
  $('exercise-next').addEventListener('click', () => { if (!solved || exerciseIndex>=5) return; exerciseIndex++; solved=tried=false; $('exercise-feedback').textContent=''; renderExercise(); });
  $('exercise-reset').addEventListener('click', () => { exerciseIndex=score=0; exerciseTable=[]; solved=tried=false; $('exercise-feedback').textContent=''; renderExercise(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.SwitchingLab = { pause, getState: () => ({ topic, frameIndex, phase, table: visibleTable().map(row=>({...row})), playing: timer!==null || forwardTimer!==null || bufferTimer!==null, clock }) };
  renderLearning(); renderForward(); renderBuffer(); renderExercise();
})();
