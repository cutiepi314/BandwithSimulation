(() => {
  'use strict';
  const M = window.BackupModel, $ = id => document.getElementById('bk-' + id), root = document.getElementById('backup-lab');
  const fmt = (n,digits=0) => new Intl.NumberFormat('sk-SK',{maximumFractionDigits:digits}).format(n);
  const days=['Pondelok','Utorok','Streda','Štvrtok','Piatok','Sobota','Nedeľa'], short=['Po','Ut','St','Št','Pi','So','Ne'];
  const genitive=['pondelka','utorka','stredy','štvrtka','piatka','soboty','nedele'];
  const fromDay=d=>(/^(st|št|so)/.test(genitive[d]) ? 'zo ' : 'z ')+genitive[d];
  const changedWord=list=>list.length===1 ? 'zmenil sa ' : 'zmenili sa ';
  const files=[['projekt.docx',20],['rozpocet.xlsx',15],['fotky.zip',400],['databaza.db',250],['prezentacia.pptx',60],['web.zip',120],['poznamky.txt',1],['video.mp4',900]];
  const sizes=files.map(f=>f[1]), allMB=sizes.reduce((a,b)=>a+b,0), letters='ABCDEFGH';
  const typeName={full:'kompletná',inc:'inkrementálna',diff:'diferenciálna'}, cap=s=>s[0].toUpperCase()+s.slice(1);
  const planName={full:'Iba kompletné',inc:'Kompletná + inkrementálne',diff:'Kompletná + diferenciálne',custom:'Vlastný plán'};
  const setWord=n=>n===1 ? 'sada' : n>1 && n<5 ? 'sady' : 'sád';
  const fileList=list=>list.length ? list.map(i=>files[i][0]).join(', ') : 'nič';
  const changeSets={default:[[],[0,6],[1,3],[0,4],[3,6],[5],[2]],busy:[[],[3],[3,6],[3],[0,3],[3],[3]],none:[[],[],[],[],[],[],[]]};
  let topic='week', strategy='inc', schedule=M.plan('inc',7), changes=changeSets.default.map(d=>[...d]), cursor=6, backups=[], playTimer=null;
  let restoreDay=6, corrupted=[], restoreStep=null, restoreTimer=null;
  function pause() {
    clearInterval(playTimer); clearInterval(restoreTimer); playTimer=restoreTimer=null;
    for (const [id,label] of [['play','▶ Prehrať týždeň'],['restore-play','▶ Prehrať obnovu']]) { $(id).textContent=label; $(id).setAttribute('aria-pressed','false'); }
  }
  function showTopic(next) {
    pause(); topic=next;
    root.querySelectorAll('[data-bk-topic]').forEach(button => { const active=button.dataset.bkTopic===next; button.setAttribute('aria-pressed',String(active)); $(button.dataset.bkTopic).hidden=!active; });
  }
  root.querySelectorAll('[data-bk-topic]').forEach(button => button.addEventListener('click',()=>showTopic(button.dataset.bkTopic)));

  function renderWeek() {
    root.querySelectorAll('[data-bk-strategy]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.bkStrategy===strategy)));
    const head=`<div class="bk-row bk-head" aria-hidden="true"><span>Deň</span><span>Typ zálohy</span>${files.map((f,i)=>`<span title="${f[0]} · ${f[1]} MB"><b>${letters[i]}</b><small>${f[0]}</small><small>${fmt(f[1])} MB</small></span>`).join('')}<span>Veľkosť zálohy</span></div>`;
    $('grid').innerHTML=head+backups.map(b=>{
      const d=b.day, future=d>cursor;
      const cells=files.map((f,i)=>{
        const changed=changes[d].includes(i), stored=!future && b.files.includes(i);
        const label=`${days[d]}, ${letters[i]} ${f[0]}: ${changed ? 'zmenený' : 'bez zmeny'}${future ? '' : stored ? ', v zálohe' : ', nie je v zálohe'}`;
        return `<button type="button" class="bk-cell${stored ? ' bk-in' : ''}" data-bk-cell="${d},${i}" aria-pressed="${changed}" aria-label="${label}" title="${label}"${d===0 ? ' disabled' : ''}>${changed ? '✎' : ''}</button>`;
      }).join('');
      const options=['full','inc','diff'].map(t=>`<option value="${t}"${schedule[d]===t ? ' selected' : ''}>${cap(typeName[t])}</option>`).join('');
      return `<div class="bk-row bk-${b.type}${future ? ' bk-future' : ''}${d===cursor ? ' bk-current' : ''}"><button type="button" class="bk-day" data-bk-pick="${d}">${days[d]}</button><select data-bk-type="${d}" aria-label="Typ zálohy – ${days[d]}"${d===0 ? ' disabled' : ''}>${options}</select>${cells}<div class="bk-size">${future ? 'ešte nebola' : fmt(b.size)+' MB'}<span style="width:${future ? 0 : b.size/allMB*100}%"></span></div></div>`;
    }).join('');
    const b=backups[cursor], chain=M.chain(backups,cursor), stored=backups.slice(0,cursor+1).reduce((sum,x)=>sum+x.size,0);
    $('m-stored-label').textContent=cursor ? `Uložené ${short[0]} – ${short[cursor]}` : 'Uložené v pondelok';
    $('m-stored').textContent=fmt(stored); $('m-size-label').textContent=`Záloha – ${days[cursor]}`;
    $('m-size').textContent=fmt(b.size)+' MB'; $('m-size-note').textContent=cap(typeName[b.type])+` · ${b.files.length} z 8 súborov`;
    $('m-sets').textContent=String(chain.length); $('m-sets-note').textContent=chain.map(d=>short[d]).join(' → ');
    $('m-saving').textContent=fmt((1-stored/(allMB*(cursor+1)))*100)+' %';
    let text;
    if (cursor===0) text=`${days[0]}: východiskový stav. Prvá záloha musí byť kompletná – skopíruje všetkých 8 súborov (${fmt(b.size)} MB) a vynuluje archívne bity.`;
    else {
      const changed=changes[cursor], parent=b.parent, older=b.files.filter(i=>!changed.includes(i));
      text=`${days[cursor]}: ${changed.length ? changedWord(changed)+fileList(changed) : 'žiadny súbor sa nezmenil'}. `;
      if (b.type==='full') text+=`Kompletná záloha aj tak skopíruje všetkých 8 súborov (${fmt(b.size)} MB) a vynuluje archívne bity.`;
      else if (b.type==='inc') text+=`Inkrementálna záloha uloží iba zmeny od ${parent===cursor-1 ? 'včerajšej zálohy' : 'zálohy '+fromDay(parent)}: ${fileList(b.files)} → ${fmt(b.size)} MB. Archívne bity sa vynulujú.${older.length ? ` (${fileList(older)} – ${changedWord(older)}skôr, ale diferenciálna záloha medzitým archívny bit nevynulovala.)` : ''}`;
      else text+=`Diferenciálna záloha uloží všetko zmenené od ${backups[parent].type==='full' ? 'kompletnej' : 'inkrementálnej'} zálohy ${fromDay(parent)}: ${fileList(b.files)} → ${fmt(b.size)} MB.${older.length ? ` Znova ukladá aj staršie zmeny (${fileList(older)}), lebo ich archívny bit stále svieti.` : ' Archívne bity nechá nastavené, takže tieto súbory uloží aj zajtra.'}`;
    }
    $('explanation').textContent=`${text} Obnova tohto stavu: ${chain.map(d=>`${short[d]} (${typeName[backups[d].type]})`).join(' → ')} – ${chain.length} ${setWord(chain.length)}.`;
    $('prev').disabled=cursor===0; $('next').disabled=cursor===6;
    $('bit-day').textContent=days[cursor];
    $('bits').innerHTML=files.map((f,i)=>{
      const bit=v=>`<span class="bk-bit${v ? ' bk-on' : ''}">${Number(v)}</span>`;
      return `<tr><td>${letters[i]} · ${f[0]}</td><td>${bit(b.bitsBefore[i])}</td><td>${bit(b.bitsAfter[i])}</td></tr>`;
    }).join('');
  }
  function renderRestore() {
    $('restore-plan').textContent=planName[strategy];
    $('restore-day').value=String(restoreDay);
    const r=M.restore(backups,restoreDay,corrupted), n=r.sets.length;
    const firstBad=r.sets.findIndex(d=>corrupted.includes(d)), limit=firstBad<0 ? n : firstBad;
    const applied=Math.min(restoreStep ?? n, limit), used=r.sets.slice(0,applied), finished=restoreStep===null || restoreStep>=limit;
    $('sets').innerHTML=backups.map(b=>{
      const order=r.sets.indexOf(b.day), bad=corrupted.includes(b.day);
      return `<button type="button" class="bk-set bk-${b.type}${order>=0 ? ' bk-chain' : ''}${b.day>restoreDay ? ' bk-later' : ''}" data-bk-set="${b.day}" aria-pressed="${bad}" aria-label="${days[b.day]}, ${typeName[b.type]} záloha, ${fmt(b.size)} MB${order>=0 ? ', '+(order+1)+'. v reťazi obnovy' : ''}${bad ? ', poškodená' : ''}"><strong>${short[b.day]}</strong>${cap(typeName[b.type])}<small>${fmt(b.size)} MB</small>${order>=0 ? `<span class="bk-order">${order+1}.</span>` : ''}</button>`;
    }).join('');
    const target=backups[restoreDay].versions;
    let stale=0;
    $('restored').innerHTML=files.map((f,i)=>{
      const source=used.reduce((found,d)=>backups[d].files.includes(i) ? d : found,null);
      if (source===null) { stale++; return `<div class="bk-file"><strong>${f[0]}</strong><small>zatiaľ chýba</small></div>`; }
      const version=backups[source].versions[i], old=version!==target[i]; if (old) stale++;
      return `<div class="bk-file bk-got bk-${backups[source].type}${restoreStep!==null && source===used[used.length-1] ? ' bk-fresh' : ''}"><strong>${f[0]}</strong><small>verzia ${version} · zo zálohy ${short[source]}</small>${old ? '<small>⚠ nie je najnovšia</small>' : ''}</div>`;
    }).join('');
    const percent=n ? applied/n*100 : 0;
    $('restore-bar').style.width=percent+'%'; $('restore-progress').setAttribute('aria-valuenow',String(Math.round(percent)));
    const chainText=r.sets.map(d=>`${short[d]} (${typeName[backups[d].type]})`).join(' → ');
    const box=$('restore-explanation');
    box.classList.toggle('bk-error',!r.ok && finished);
    if (!finished) box.textContent=`Nahraté ${applied} z ${n} ${setWord(n)}. Každá ďalšia sada prepíše súbory novšími verziami. Reťaz: ${chainText}.`;
    else if (r.ok) box.textContent=`Na obnovu stavu ${fromDay(restoreDay)} potrebuješ ${n} ${setWord(n)}: ${chainText}. Načítaš ${fmt(r.readMB)} MB a všetkých 8 súborov má najnovšiu verziu.`;
    else box.textContent=`Reťaz je prerušená: záloha ${r.missing.map(d=>short[d]).join(', ')} je poškodená, takže ${stale} ${stale===1 ? 'súbor nemá' : stale<5 ? 'súbory nemajú' : 'súborov nemá'} správnu verziu ${fromDay(restoreDay)}. ${r.latest===null ? 'Nedá sa obnoviť žiadny úplný stav – poškodená je kompletná záloha, na ktorej všetko stojí.' : `Najnovší úplný stav, ktorý ešte vieš obnoviť, je ${fromDay(r.latest)} (${short[r.latest]}).`}`;
    $('restore-compare').innerHTML=['full','inc','diff'].map(s=>{
      const bs=M.simulate({sizes,changes,schedule:M.plan(s,7)}), x=M.restore(bs,restoreDay,corrupted);
      return `<tr><td>${planName[s]}</td><td>${x.sets.length}</td><td>${fmt(x.readMB)} MB</td><td>${x.ok ? '✓ obnovené' : '✕ najnovšie '+(x.latest===null ? 'nič' : short[x.latest])}</td></tr>`;
    }).join('');
  }
  function renderCompare() {
    const c=M.compare({sizes,changes,days:7}), kinds=['full','inc','diff'];
    $('bars').innerHTML=short.map((day,d)=>`<div class="bk-bar-day"><b>${day}</b><div class="bk-bar-group">${kinds.map(k=>`<div class="bk-bar bk-${k}"><span style="width:${c[k].backups[d].size/allMB*100}%"></span>${fmt(c[k].backups[d].size)} MB</div>`).join('')}</div></div>`).join('');
    $('totals').innerHTML=kinds.map(k=>`<div class="bk-${k}"><strong>${fmt(c[k].totalMB)} MB</strong><span>${planName[k]} · spolu za týždeň</span></div>`).join('');
    const sunday=k=>{const r=M.restore(c[k].backups,6); return `${r.sets.length} ${setWord(r.sets.length)} · ${fmt(r.readMB)} MB`;};
    const peak=k=>fmt(Math.max(...c[k].backups.slice(1).map(b=>b.size)))+' MB';
    const rows=[['Čo uloží','všetky súbory','zmeny od poslednej zálohy','zmeny od poslednej kompletnej'],
      ['Miesto za týždeň',...kinds.map(k=>fmt(c[k].totalMB)+' MB')],['Najväčšia záloha Ut – Ne',...kinds.map(peak)],
      ['Obnova stavu z nedele',...kinds.map(sunday)],['Čas zálohovania','najdlhší','najkratší','rastie počas týždňa'],
      ['Čas obnovy','najkratší','najdlhší','stredný'],['Archívny bit','vynuluje','vynuluje','nechá nastavený'],
      ['Jedna poškodená sada','stratí sa jeden deň','prerušia sa všetky ďalšie dni','stratí sa jeden deň']];
    $('summary').innerHTML=rows.map(([name,...cells])=>`<tr><th scope="row">${name}</th>${cells.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('');
  }
  function renderAll() {
    backups=M.simulate({sizes,changes,schedule});
    renderWeek(); renderRestore(); renderCompare();
  }

  root.querySelectorAll('[data-bk-strategy]').forEach(button=>button.addEventListener('click',()=>{
    if (button.dataset.bkStrategy==='custom') return;
    pause(); strategy=button.dataset.bkStrategy; schedule=M.plan(strategy,7); restoreStep=null; renderAll();
  }));
  $('grid').addEventListener('click',event=>{
    const cell=event.target.closest('[data-bk-cell]'), pick=event.target.closest('[data-bk-pick]');
    if (cell) {
      const [d,i]=cell.dataset.bkCell.split(',').map(Number);
      changes[d]=changes[d].includes(i) ? changes[d].filter(x=>x!==i) : [...changes[d],i].sort((a,b)=>a-b);
      restoreStep=null; renderAll(); $('grid').querySelector(`[data-bk-cell="${d},${i}"]`).focus();
    }
    if (pick) { pause(); cursor=Number(pick.dataset.bkPick); renderWeek(); $('grid').querySelector(`[data-bk-pick="${cursor}"]`).focus(); }
  });
  $('grid').addEventListener('change',event=>{
    const select=event.target.closest('[data-bk-type]'); if (!select) return;
    const d=Number(select.dataset.bkType); schedule[d]=select.value;
    strategy=['full','inc','diff'].find(s=>M.plan(s,7).every((t,i)=>t===schedule[i])) || 'custom';
    cursor=Math.max(cursor,d); restoreStep=null; renderAll(); $('grid').querySelector(`[data-bk-type="${d}"]`).focus();
  });
  $('prev').addEventListener('click',()=>{pause();cursor=Math.max(0,cursor-1);renderWeek();});
  $('next').addEventListener('click',()=>{pause();cursor=Math.min(6,cursor+1);renderWeek();});
  $('all').addEventListener('click',()=>{pause();cursor=6;renderWeek();});
  $('play').addEventListener('click',()=>{
    if (playTimer!==null) { pause(); return; }
    if (cursor===6) cursor=0;
    $('play').textContent='Ⅱ Pozastaviť'; $('play').setAttribute('aria-pressed','true'); renderWeek();
    playTimer=setInterval(()=>{ cursor++; renderWeek(); if (cursor>=6) pause(); },1600);
  });
  root.querySelectorAll('[data-bk-changes]').forEach(button=>button.addEventListener('click',()=>{
    const kind=button.dataset.bkChanges; pause();
    changes=kind==='random' ? short.map((_,d)=>d ? files.flatMap((f,i)=>Math.random()<(f[1]>500 ? .1 : .3) ? [i] : []) : []) : changeSets[kind].map(d=>[...d]);
    cursor=6; restoreStep=null; renderAll();
  }));

  $('restore-day').replaceChildren(...days.map((day,d)=>{ const option=document.createElement('option'); option.value=String(d); option.textContent=`${day} večer (${short[d]})`; return option; }));
  $('restore-day').addEventListener('change',()=>{pause();restoreDay=Number($('restore-day').value);restoreStep=null;renderRestore();});
  $('sets').addEventListener('click',event=>{
    const set=event.target.closest('[data-bk-set]'); if (!set) return;
    const d=Number(set.dataset.bkSet); pause();
    corrupted=corrupted.includes(d) ? corrupted.filter(x=>x!==d) : [...corrupted,d]; restoreStep=null;
    renderRestore(); $('sets').querySelector(`[data-bk-set="${d}"]`).focus();
  });
  const restoreLimit=()=>{ const sets=M.chain(backups,restoreDay), bad=sets.findIndex(d=>corrupted.includes(d)); return bad<0 ? sets.length : bad; };
  function stepRestore() {
    const limit=restoreLimit();
    restoreStep=restoreStep===null || restoreStep>=limit ? Math.min(1,limit) : restoreStep+1;
    renderRestore();
    return restoreStep>=limit;
  }
  $('restore-step').addEventListener('click',()=>{pause();stepRestore();});
  $('restore-play').addEventListener('click',()=>{
    if (restoreTimer!==null) { pause(); return; }
    restoreStep=0; renderRestore();
    $('restore-play').textContent='Ⅱ Pozastaviť'; $('restore-play').setAttribute('aria-pressed','true');
    restoreTimer=setInterval(()=>{ if (stepRestore()) pause(); },1000);
  });
  $('restore-repair').addEventListener('click',()=>{pause();corrupted=[];restoreStep=null;renderRestore();});

  const questions=[
    ['V pondelok je kompletná záloha, potom každý večer inkrementálna. V piatok ráno zlyhá disk. Ktoré zálohy potrebuješ?',['Iba štvrtkovú inkrementálnu','Pondelkovú kompletnú a štvrtkovú inkrementálnu','Pondelkovú kompletnú a všetky inkrementálne Ut, St, Št','Všetky inkrementálne, kompletnú nie'],2,'Každá inkrementálna obsahuje iba zmeny od predchádzajúcej zálohy, preto treba celú reťaz Po → Ut → St → Št.'],
    ['Rovnaká situácia, ale každý večer sa robí diferenciálna záloha. Čo potrebuješ?',['Pondelkovú kompletnú a štvrtkovú diferenciálnu','Iba štvrtkovú diferenciálnu','Všetky diferenciálne Ut, St, Št','Iba pondelkovú kompletnú'],0,'Diferenciálna obsahuje všetky zmeny od poslednej kompletnej zálohy, takže stačí kompletná + posledná diferenciálna.'],
    ['Každý deň sa zmení rovnaké množstvo iných súborov. Ktorá záloha bude počas týždňa rásť?',['Kompletná','Inkrementálna','Diferenciálna','Žiadna'],2,'Diferenciálna nevynuluje archívny bit, preto zakaždým znova ukladá aj zmeny z predchádzajúcich dní.'],
    ['Ktorý typ zálohy archívny bit NEvynuluje?',['Kompletná','Inkrementálna','Diferenciálna'],2,'Kompletná aj inkrementálna bit vynulujú. Diferenciálna ho nechá, a tak sa ďalšia diferenciálna dozvie o všetkých zmenách od kompletnej.'],
    ['Ktorá kombinácia zaberie najmenej miesta a denné zálohovanie je najrýchlejšie?',['Iba kompletné','Kompletná + inkrementálne','Kompletná + diferenciálne'],1,'Inkrementálna ukladá iba to, čo sa zmenilo od poslednej zálohy. Platí sa za to pomalšou a citlivejšou obnovou.'],
    ['Plán: kompletná v pondelok, potom inkrementálne. Stredajšia záloha je poškodená. Ktorý najnovší stav vieš úplne obnoviť?',['Nedeľný','Utorkový','Piatkový','Žiadny'],1,'Reťaz sa v stredu preruší. Neskoršie inkrementálne zálohy bez nej nemajú úplné dáta, posledný celý stav je Po + Ut.'],
    ['Plán: kompletná v pondelok, potom diferenciálne. Stredajšia záloha je poškodená. Ktorý najnovší stav vieš obnoviť?',['Utorkový','Nedeľný','Žiadny','Iba pondelkový'],1,'Nedeľná diferenciálna potrebuje iba pondelkovú kompletnú. Stredajšia sada do jej obnovy nepatrí.'],
    ['V utorok sa nezmenil žiadny súbor. Čo uloží utorková inkrementálna záloha?',['Všetky súbory','Nič – nie je čo uložiť','Všetky pondelkové súbory znova'],1,'Bez zmien nemá žiadny súbor nastavený archívny bit, záloha je prázdna (v praxi iba záznam o tom, že prebehla).'],
    ['Prečo sa aj pri inkrementálnych zálohách pravidelne robí nová kompletná?',['Inkrementálne bez nej vôbec nefungujú','Skráti reťaz na obnovu a zníži riziko, že ju preruší jedna chybná sada','Kompletná zaberá menej miesta'],1,'Nová kompletná začne novú reťaz. Obnova potom potrebuje menej sád a staršie sady možno zrotovať.'],
    ['Čo znamená pravidlo 3-2-1?',['3 zálohy denne, 2 týždenne, 1 mesačne','3 kópie dát, 2 rôzne typy médií, 1 kópia mimo pracoviska','3 disky v RAID, 2 servery, 1 cloud'],1,'Viac kópií na rôznych médiách a mimo pracoviska chráni aj pred požiarom, krádežou či ransomvérom.']
  ];
  let question=0, score=0, answered=false, tried=false;
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
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.BackupLab={pause,getState:()=>({topic,strategy,cursor,schedule:[...schedule],sizes:backups.map(b=>b.size),playing:playTimer!==null || restoreTimer!==null,restore:M.restore(backups,restoreDay,corrupted),restoreStep})};
  renderAll(); renderQuiz();
})();
