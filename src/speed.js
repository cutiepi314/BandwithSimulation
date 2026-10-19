(() => {
  'use strict';
  const M = window.SpeedModel, $ = id => document.getElementById('sp-' + id), root = document.getElementById('speed-lab');
  const fmt = (n,digits=2) => new Intl.NumberFormat('sk-SK',{maximumFractionDigits:digits}).format(n);
  const rate = n => n >= 1000 ? fmt(n/1000)+' Gb/s' : fmt(n)+' Mb/s';
  const speeds = [10,50,100,1000,2500,5000,10000];
  function speedOptions(id, selected, choices=speeds) {
    $(id).replaceChildren(...choices.map(n => { const option=document.createElement('option'); option.value=String(n); option.textContent=rate(n); option.selected=n===selected; return option; }));
  }
  for(let i=0;i<3;i++) speedOptions('link-'+i,i===1 ? 100 : 1000);
  speedOptions('uplink',1000); speedOptions('server',1000); speedOptions('timing-rate',100);
  let topic='path', transferTimer=null, queueTimer=null, duplexTimer=null, transferred=0, transferElapsed=0, halfPhase=0;
  let pathConfig=null, pathResult=null;
  function pause() {
    clearInterval(transferTimer); clearInterval(queueTimer); clearInterval(duplexTimer);
    transferTimer=queueTimer=duplexTimer=null; root.classList.remove('sp-moving','sp-duplex-moving');
    for(const [id,label] of [['transfer-play','▶ Spustiť prenos'],['queue-play','▶ Spustiť'],['duplex-play','▶ Prehrať smery']]) {
      $(id).textContent=label; $(id).setAttribute('aria-pressed','false');
    }
  }
  function showTopic(next) {
    pause(); topic=next;
    root.querySelectorAll('[data-sp-topic]').forEach(button => { const active=button.dataset.spTopic===next; button.setAttribute('aria-pressed',String(active)); $(button.dataset.spTopic).hidden=!active; });
  }
  root.querySelectorAll('[data-sp-topic]').forEach(button => button.addEventListener('click',()=>showTopic(button.dataset.spTopic)));
  function renderTransfer() {
    const percent=pathConfig ? transferred/pathConfig.fileMB*100 : 0;
    $('transfer-bar').style.width=percent+'%'; $('transfer-progress').setAttribute('aria-valuenow',String(Math.round(percent)));
    $('transfer-status').textContent=!pathConfig ? 'Zadaj platné nastavenia súboru.' : `${transferred>=pathConfig.fileMB ? 'Hotovo. ' : ''}${fmt(transferred,1)} / ${fmt(pathConfig.fileMB)} MB · ${fmt(transferElapsed,1)} s modelového času · animácia 10× zrýchlená.`;
  }
  function renderPath() {
    pause(); transferred=transferElapsed=0;
    const file=Number($('file').value);
    if (!$('file').checkValidity() || !Number.isFinite(file) || file<1) {
      pathConfig=null; $('path-error').hidden=false; $('path-error').textContent='Zadaj celú veľkosť súboru od 1 do 1 000 000 MB. Výpočty ostávajú z posledného platného nastavenia.';
      $('transfer-play').disabled=true; renderTransfer(); return;
    }
    $('path-error').hidden=true; $('transfer-play').disabled=false;
    pathConfig={ links:[0,1,2].map(i=>Number($('link-'+i).value)), diskMBps:Number($('disk').value), efficiency:Number($('efficiency').value), fileMB:file };
    pathResult=M.path(pathConfig);
    const r=pathResult;
    $('efficiency-value').textContent=pathConfig.efficiency+' %';
    $('path-limit').textContent=fmt(r.linkLimit); $('path-goodput').textContent=fmt(r.goodput);
    $('path-mbytes').textContent=fmt(r.megabytes); $('path-seconds').textContent=fmt(r.seconds)+' s';
    $('path-size-note').textContent=fmt(file)+' MB · bez rozbehu';
    const labels=['PC','SW1','SW2','Server'], links=['PC → SW1','SW1 → SW2','SW2 → server'];
    const flowHeight=10+6*Math.log10(Math.max(r.goodput,1)/10);
    $('route').innerHTML=labels.map((name,i)=>{
      const node=`<div class="sp-node${i===3 && r.diskLimited ? ' sp-hot' : ''}">${name}${i===3 && pathConfig.diskMBps ? '<div class="sp-muted">'+fmt(pathConfig.diskMBps)+' MB/s</div>' : ''}</div>`;
      if(i===3) return node;
      const height=12+6*Math.log10(pathConfig.links[i]/10);
      return node+`<div class="sp-link${r.bottlenecks.includes(i) ? ' sp-limited' : ''}"><strong>${rate(pathConfig.links[i])}</strong><div class="sp-pipe" style="height:${height}px;--sp-flow:${Math.min(100,Math.max(8,flowHeight/height*100))}%"><span class="sp-water"></span></div><small>${links[i]}</small></div>`;
    }).join('');
    const limits=r.bottlenecks.map(i=>links[i]); if(r.diskLimited) limits.push('disk / aplikácia servera');
    $('path-explanation').textContent=`Obmedzenie: ${limits.join(' a ')}. Strop pred modelovou réžiou je ${rate(r.limit)}. ${pathConfig.efficiency<100 ? 'Po použití '+pathConfig.efficiency+' % užitočnej časti zostáva '+rate(r.goodput)+'. ' : ''}Jeden prenos neprekročí kapacitu najslabšieho článku; rýchlosti po ceste sa nesčítavajú.`;
    renderTransfer();
  }
  root.querySelectorAll('[data-sp-path-input]').forEach(input=>input.addEventListener(input.tagName==='SELECT' ? 'change' : 'input',renderPath));
  const presets={bottleneck:{links:[1000,100,1000],disk:0},upgrade:{links:[1000,1000,1000],disk:0},adapter:{links:[100,1000,1000],disk:0},disk:{links:[1000,1000,1000],disk:40}};
  root.querySelectorAll('[data-sp-preset]').forEach(button=>button.addEventListener('click',()=>{
    const preset=presets[button.dataset.spPreset]; preset.links.forEach((n,i)=>$('link-'+i).value=String(n)); $('disk').value=String(preset.disk); renderPath();
  }));
  $('transfer-reset').addEventListener('click',()=>{pause();transferred=transferElapsed=0;renderTransfer();});
  $('transfer-play').addEventListener('click',()=>{
    if(transferTimer!==null) {pause();return;}
    if(!pathConfig) return;
    if(transferred>=pathConfig.fileMB) transferred=transferElapsed=0;
    $('transfer-play').textContent='Ⅱ Pozastaviť'; $('transfer-play').setAttribute('aria-pressed','true'); root.classList.add('sp-moving');
    let last=performance.now();
    transferTimer=setInterval(()=>{
      const now=performance.now(), dt=Math.min((now-last)/1000*10, pathResult.seconds-transferElapsed); last=now;
      transferElapsed=Math.min(pathResult.seconds,transferElapsed+dt); transferred=Math.min(pathConfig.fileMB,transferElapsed*pathResult.goodput/8);
      if(pathResult.seconds-transferElapsed<1e-8) {transferred=pathConfig.fileMB;pause();}
      renderTransfer();
    },100);
  });

  const emptyQueue=()=>({queued:0,sent:0,dropped:0,elapsed:0});
  let queue=emptyQueue();
  function sharingConfig() {return {clients:Number($('client-count').value),demand:Number($('demand').value),uplink:Number($('uplink').value),server:Number($('server').value),bufferMB:Number($('buffer').value)};}
  function renderQueue() {
    const c=sharingConfig(), r=M.sharing(c), fraction=queue.queued/c.bufferMB;
    $('queue-clock').textContent='t = '+fmt(queue.elapsed,1)+' s';
    $('queue-slots').innerHTML=Array.from({length:20},(_,i)=>`<span class="sp-slot${i<Math.ceil(fraction*20) ? ' sp-filled' : ''}${fraction>=1-1e-9 ? ' sp-full' : ''}"></span>`).join('');
    $('queue-slots').setAttribute('aria-label',`Zaplnenie bufferu: ${fmt(queue.queued)} z ${c.bufferMB} MB`);
    $('queue-size').textContent=fmt(queue.queued); $('queue-dropped').textContent=fmt(queue.dropped);
    $('queue-wait').textContent=fmt(queue.queued*8/r.capacity*1000);
    $('queue-explanation').textContent=`Obsadené ${fmt(queue.queued)} / ${c.bufferMB} MB. `+(fraction>=1-1e-9 && r.excess>0 ? 'Buffer je plný; ďalší nadbytočný tok sa zahadzuje. ' : '')+(r.excess>0 ? `Front rastie o ${fmt(r.growthMB)} MB/s, kým sa nezaplní. Z prázdneho stavu sa zaplní za ${fmt(r.fillSeconds,3)} s.` : c.demand===0 ? 'Prísun je zastavený. Čakajúce dáta môžu odtiecť cez výstup.' : 'Ponúkaný tok neprekračuje výstup. Nové preťaženie nevzniká.');
  }
  function renderSharing(reset=true) {
    if(reset) {pause();queue=emptyQueue();}
    const c=sharingConfig(), r=M.sharing(c);
    $('demand-value').textContent=rate(c.demand);
    $('clients').innerHTML=Array.from({length:c.clients},(_,i)=>`<div class="sp-client">PC${i+1}<strong>${fmt(r.perClient)} Mb/s</strong><small>modelový podiel</small><small>ponúka ${rate(c.demand)}</small></div>`).join('');
    $('offered').textContent=`Ponúkané spolu: ${rate(r.offered)}`;
    $('output').textContent=`Spoločná cesta: ${rate(r.capacity)}`;
    $('sharing-explanation').textContent=`${fmt(r.capacity)} Mb/s ÷ ${c.clients} PC = najviac ${fmt(r.capacity/c.clients)} Mb/s na PC pri rovnomernom delení. `+(r.perClient<c.demand ? `Ponuka prevyšuje kapacitu o ${rate(r.excess)}. ` : `Každý PC ponúka iba ${rate(c.demand)}. `)+`Modelový užitočný podiel je ${fmt(r.perClient/8)} MB/s na PC pred réžiou.`;
    renderQueue();
  }
  for(const id of ['client-count','uplink','server','buffer']) $(id).addEventListener('change',()=>renderSharing());
  $('demand').addEventListener('input',()=>renderSharing());
  function sharingPreset(clients,demand) { $('client-count').value=String(clients); $('demand').value=String(demand); $('uplink').value=$('server').value='1000'; renderSharing(); }
  $('preset-four').addEventListener('click',()=>sharingPreset(4,1000)); $('preset-two').addEventListener('click',()=>sharingPreset(2,800));
  function queueTick(dt) {queue=M.queueStep(queue,sharingConfig(),dt);renderQueue();}
  $('queue-step').addEventListener('click',()=>{pause();queueTick(1);});
  $('queue-reset').addEventListener('click',()=>{pause();queue=emptyQueue();renderQueue();});
  $('queue-drain').addEventListener('click',()=>{$('demand').value='0';renderSharing(false);});
  $('queue-play').addEventListener('click',()=>{
    if(queueTimer!==null) {pause();return;}
    $('queue-play').textContent='Ⅱ Pozastaviť'; $('queue-play').setAttribute('aria-pressed','true');
    queueTimer=setInterval(()=>queueTick(.1),100);
  });

  function renderNegotiation() {
    const a=$('pc-cap').value.split(',').map(Number), b=$('switch-cap').value.split(',').map(Number), agreed=M.negotiate(a,b);
    $('negotiated').textContent=`Dohodnú ${rate(agreed)}, full-duplex. Vyberá sa najvyšší spoločný podporovaný režim. Rýchlejší port nezvýši možnosti pomalšieho adaptéra.`;
    $('port-status').textContent=`Switch# show interfaces status\nPort     Status      Vlan   Duplex   Speed\nGi0/1    connected   1      a-full   a-${agreed}`;
  }
  $('pc-cap').addEventListener('change',renderNegotiation); $('switch-cap').addEventListener('change',renderNegotiation);
  function renderDuplex() {
    const mode=$('duplex-mode').value;
    $('duplex-rate').querySelector('[value="1000"]').disabled=mode!=='full';
    if(mode!=='full' && $('duplex-rate').value==='1000') $('duplex-rate').value='100';
    const r=Number($('duplex-rate').value), out=mode!=='half' || halfPhase%2===0, incoming=mode!=='half' || halfPhase%2===1;
    $('lane-out').textContent=`PC → SW1 · ${out ? rate(r) : 'čaká'}`;
    $('lane-in').textContent=`PC ← SW1 · ${incoming ? rate(r) : 'čaká'}`;
    $('lane-out').className='sp-lane'+(out ? ' sp-live' : '')+(mode==='mismatch' ? ' sp-collision' : '');
    $('lane-in').className='sp-lane'+(incoming ? ' sp-live' : '')+(mode==='mismatch' ? ' sp-collision' : '');
    $('duplex-explanation').textContent=mode==='full' ? `${rate(r)} v každom smere súčasne. Súčet oboch smerov ${rate(r*2)} neznamená ${rate(r*2)} pre jeden jednosmerný súbor.` : mode==='half' ? 'Strany sa striedajú. V tomto okamihu vysiela '+(out ? 'PC' : 'switch')+'. Časový podiel medzi smermi závisí od prevádzky; nejde automaticky o polovicu rýchlosti.' : 'Duplex mismatch: jeden koniec je full, druhý half. Pri prekrývaní prenosov sa môžu objaviť chyby a kolízie na half-duplex strane. Linka môže svietiť ako pripojená, no výkon je zlý.';
  }
  for(const id of ['duplex-mode','duplex-rate']) $(id).addEventListener('change',()=>{pause();halfPhase=0;renderDuplex();});
  $('duplex-step').addEventListener('click',()=>{pause();halfPhase++;renderDuplex();});
  $('duplex-play').addEventListener('click',()=>{
    if(duplexTimer!==null) {pause();return;}
    $('duplex-play').textContent='Ⅱ Pozastaviť'; $('duplex-play').setAttribute('aria-pressed','true');
    root.classList.add('sp-duplex-moving');
    duplexTimer=setInterval(()=>{halfPhase++;renderDuplex();},1000);
  });

  function renderTiming() {
    const c={bytes:Number($('frame-bytes').value),rate:Number($('timing-rate').value),propagation:Number($('propagation').value),processing:Number($('processing').value),queue:Number($('latency-queue').value)};
    const r=M.timing(c), faster=M.timing({...c,rate:c.rate*10});
    $('serialization').textContent=`${fmt(c.bytes)} B × 8 = ${fmt(c.bytes*8)} bitov. Pri ${rate(c.rate)} trvá vyslanie ${fmt(r.serializationUs,3)} μs.`;
    $('propagation-value').textContent=fmt(c.propagation)+' ms'; $('processing-value').textContent=fmt(c.processing)+' ms'; $('latency-queue-value').textContent=fmt(c.queue)+' ms';
    $('one-way').textContent=fmt(r.oneWay,3); $('rtt').textContent=fmt(r.rtt,3); $('rtt-faster').textContent=fmt(faster.rtt,3);
    const parts=[r.serializationUs/1000,c.propagation,c.processing,c.queue], labels=['Vysielanie','Šírenie','Spracovanie','Front'];
    $('latency-stages').innerHTML=parts.map((n,i)=>`<span style="flex:${Math.max(n,.001)}" title="${labels[i]}: ${fmt(n,4)} ms" aria-label="${labels[i]}: ${fmt(n,4)} ms"></span>`).join('');
  }
  for(const id of ['frame-bytes','timing-rate']) $(id).addEventListener('change',renderTiming);
  for(const id of ['propagation','processing','latency-queue']) $(id).addEventListener('input',renderTiming);

  const questions=[
    ['PC → SW1: 1 Gb/s, SW1 → SW2: 100 Mb/s, SW2 → server: 1 Gb/s. Aký je ideálny strop jedného prenosu?', ['100 Mb/s','1 Gb/s','2,1 Gb/s'],0,'Úzke hrdlo je 100 Mb/s linka medzi switchmi. Kapacity za sebou sa nesčítavajú.'],
    ['Štyri PC zdieľajú 1 Gb/s uplink. Koľko ideálne vychádza na jeden PC pri rovnomernom delení?', ['1 000 Mb/s · 125 MB/s','250 Mb/s · 31,25 MB/s','250 MB/s'],1,'1 000 ÷ 4 = 250 Mb/s. Potom 250 ÷ 8 = 31,25 MB/s pred réžiou.'],
    ['Dva vstupy ponúkajú po 800 Mb/s, spoločný výstup má 1 Gb/s. Čo spôsobí dlhé preťaženie?', ['Vyššiu rýchlosť výstupného portu','Žiadny front, všetky porty sú gigabitové','Rast frontu a po zaplnení zahadzovanie'],2,'Ponúkaných 1 600 Mb/s prevyšuje výstup o 600 Mb/s. Väčší buffer iba oddiali zaplnenie.'],
    ['Linka má 1 Gb/s full-duplex. Zvládne jeden súbor jedným smerom 2 Gb/s?', ['Nie, jeden smer má najviac 1 Gb/s','Áno, full-duplex zdvojnásobí jeden smer','Iba pri prázdnom bufferi'],0,'1 Gb/s tam a 1 Gb/s späť môžu prebiehať súčasne. Súčet patrí obom smerom.'],
    ['PC podporuje 10/100, switch 10/100/1 000. Auto je na oboch stranách a kábel vyhovuje. Čo dohodnú?', ['1 000 Mb/s full-duplex','100 Mb/s full-duplex','10 Mb/s, lebo je spoločných viac režimov'],1,'Najvyšší spoločný režim je 100 Mb/s full-duplex. Limitom je adaptér PC.'],
    ['Internet má 50 Mb/s, LAN 1 Gb/s. Aký je ideálny strop sťahovania z internetu?', ['125 MB/s','50 MB/s','6,25 MB/s'],2,'Obmedzením tejto cesty je internetová prípojka: 50 ÷ 8 = 6,25 MB/s pred réžiou.'],
    ['Koľko ideálne trvá prenos 1 GB = 1 000 MB pri 100 Mb/s?', ['80 s','8 s','10 s'],0,'1 000 MB × 8 = 8 000 Mb; 8 000 ÷ 100 = 80 s bez réžie.'],
    ['PC aj switch podporujú gigabit, ale linka ukazuje 100 Mb/s. Čo overíš?', ['Iba veľkosť bufferu','Stav a nastavenia oboch koncov, kábel a iný port','Zapnem Auto-MDIX, ktoré zvýši rýchlosť portu'],1,'Skontroluj dohodnutú rýchlosť a duplex, možnosti adaptéra a funkčný kábel. Auto-MDIX rieši zapojenie, nie zvýšenie kapacity.'],
    ['Zrýchlim port zo 100 Mb/s na 1 Gb/s. Bude ping vždy desaťkrát nižší?', ['Áno, ide o ten istý údaj','Áno, ak zapnem full-duplex','Nie, zostáva šírenie, spracovanie aj čakanie'],2,'Rýchlejšia linka skráti čas vysielania. Ostatné zložky latencie sa tým nemusia zmeniť.']
  ];
  let question=0, answered=false, tried=false, score=0;
  function renderQuiz() {
    const q=questions[question]; $('quiz-count').textContent=`Otázka ${question+1} / ${questions.length}`; $('quiz-question').textContent=q[0];
    $('quiz-next').disabled=!answered || question===questions.length-1;
    $('quiz-next').textContent=question===questions.length-1 && answered ? 'Všetko vyriešené' : 'Ďalšia otázka →';
    $('quiz-score').textContent=`Správne na prvý pokus: ${score} / ${question+(answered ? 1 : 0)}`;
    $('quiz-answers').replaceChildren(...q[1].map((label,i)=>{
      const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=answered;
      button.addEventListener('click',()=>{
        if(i!==q[2]) {tried=true;$('quiz-feedback').textContent='Skús ešte raz. '+q[3];return;}
        if(!tried) score++;answered=true;renderQuiz();$('quiz-feedback').textContent='Správne. '+q[3]+(question===questions.length-1 ? ` Hotovo: ${score} z ${questions.length} na prvý pokus.` : '');
      }); return button;
    }));
  }
  $('quiz-next').addEventListener('click',()=>{if(!answered || question===questions.length-1)return;question++;answered=tried=false;$('quiz-feedback').textContent='';renderQuiz();});
  $('quiz-reset').addEventListener('click',()=>{question=score=0;answered=tried=false;$('quiz-feedback').textContent='';renderQuiz();});
  $('go-switch').addEventListener('click',()=>document.getElementById('switching-tab').click());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.SpeedLab={pause,getState:()=>({topic,playing:transferTimer!==null || queueTimer!==null || duplexTimer!==null,path:pathResult ? {...pathResult} : null,transferred,queue:{...queue}})};
  renderPath();renderSharing();renderNegotiation();renderDuplex();renderTiming();renderQuiz();
})();
