(() => {
  'use strict';
  const tabs=[...document.querySelectorAll('[data-tab]')];
  const panels=tabs.map(tab=>document.getElementById(tab.getAttribute('aria-controls')));
  function showHash(scroll=false) {
    const target=document.getElementById(location.hash.slice(1));
    const panel=target?.closest('[role=tabpanel]') || panels[0];
    tabs.forEach((tab,index)=>{ const active=panels[index]===panel; tab.setAttribute('aria-selected',String(active)); tab.tabIndex=active?0:-1; panels[index].hidden=!active; });
    if(scroll && target) requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>{ history.replaceState(null,'','#'+tab.dataset.tab); showHash(); });
    tab.addEventListener('keydown',event=>{
      const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null;
      if(next!==null) { event.preventDefault(); tabs[next].click(); tabs[next].focus(); }
    });
  });
  addEventListener('hashchange',()=>showHash(true)); showHash(Boolean(location.hash));
  const themeButtons=[...document.querySelectorAll('[data-theme-choice]')];
  const showTheme=()=>themeButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===(document.documentElement.dataset.theme || 'auto'))));
  themeButtons.forEach(button=>button.addEventListener('click',()=>{
    const choice=button.dataset.themeChoice;
    if(choice==='auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme=choice;
    try { if(choice==='auto') localStorage.removeItem('pvalo-theme'); else localStorage.setItem('pvalo-theme',choice); } catch {}
    showTheme();
  })); showTheme();
  const checklist=document.querySelector('[data-lesson-checklist]');
  if(checklist) {
    const checks=[...checklist.querySelectorAll('[data-check]')], storageKey='pvalo-excel-'+document.body.dataset.lesson+'-checklist';
    let saved={}; try { saved=JSON.parse(localStorage.getItem(storageKey)||'{}')||{}; } catch {}
    function updateChecks() {
      const done=checks.filter(input=>input.checked).length;
      document.getElementById('check-count').textContent=done+' / '+checks.length;
      document.getElementById('check-progress').style.width=done/checks.length*100+'%';
      try { localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(checks.map(input=>[input.dataset.check,input.checked])))); } catch {}
    }
    checks.forEach(input=>{input.checked=saved[input.dataset.check]===true; input.addEventListener('change',updateChecks);});
    document.getElementById('reset-checks').addEventListener('click',()=>{checks.forEach(input=>{input.checked=false;}); updateChecks();}); updateChecks();
  }
  const formatButtons=[...document.querySelectorAll('[data-format-demo]')];
  formatButtons.forEach(button=>button.addEventListener('click',()=>{
    const formatted=button.dataset.formatDemo==='formatted';
    document.getElementById('format-example').classList.toggle('formatted',formatted);
    document.getElementById('format-description').textContent=formatted?'Zvýraznená hlavička, odsadenie a jednotný formát čísel zlepšujú čitateľnosť. Hodnoty zostali rovnaké.':'Údaje zostávajú čitateľné, ale chýba zvýraznenie hlavičky a oddelenie riadkov.';
    formatButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  }));
  const calculators={
    pizza:{inputs:[['E9','Počet žiakov',24],['E10','Kúskov na osobu',2.5],['E11','Kúskov v pizzi',8]],presets:[['24 žiakov',24],['31 žiakov',31]],calculate:v=>{
      if(!Number.isInteger(v[0])) throw Error('Počet žiakov musí byť celé číslo.');
      if(v[2]<=0) throw Error('Počet kúskov v jednej pizzi musí byť väčší než nula.');
      return [['E12','Potrebný počet pízz',v[0]*v[1]/v[2],'pizze','=E9*E10/E11'],['','Celé pizze na objednanie',Math.ceil(v[0]*v[1]/v[2]),'ks','Rozhodnutie človeka: zaokrúhlenie nahor']];
    }},
    coffee:{inputs:[['E9','Počet ľudí',40],['E10','Podiel záujemcov (0,7 = 70 %)',.7],['E11','Šálok na osobu',1.5],['E12','Kávy na šálku (g)',8],['E13','Vody na šálku (ml)',150]],presets:[['40 ľudí',40],['60 ľudí',60]],calculate:v=>{
      if(!Number.isInteger(v[0])) throw Error('Počet ľudí musí byť celé číslo.');
      if(v[1]>1) throw Error('Podiel zadaj od 0 do 1, napríklad 0,7 pre 70 %.');
      const people=v[0]*v[1], cups=people*v[2];
      return [['E14','Kávu si dá',people,'ľudí','=E9*E10'],['E15','Šálky spolu',cups,'šálok','=E14*E11'],['E16','Potrebná káva',cups*v[3],'g','=E15*E12'],['E17','Potrebná voda',cups*v[4]/1000,'l','=E15*E13/1000']];
    }},
    trip:{inputs:[['E9','Počet žiakov',28],['E10','Autobus za celú triedu (€)',420],['E11','Vstupné na osobu (€)',7.5],['E12','Obed na osobu (€)',8],['E13','Rezerva (0,1 = 10 %)',.1]],presets:[['28 žiakov',28],['24 žiakov',24]],calculate:v=>{
      if(!Number.isInteger(v[0])) throw Error('Počet žiakov musí byť celé číslo.');
      if(v[0]<=0) throw Error('Počet žiakov musí byť väčší než nula.');
      if(v[4]>1) throw Error('Rezervu zadaj ako podiel od 0 do 1.');
      const admission=v[0]*v[2], lunches=v[0]*v[3], base=v[1]+admission+lunches, reserve=base*v[4], total=base+reserve;
      return [['E14','Vstupné spolu',admission,'€','=E9*E11'],['E15','Obedy spolu',lunches,'€','=E9*E12'],['E16','Bez rezervy',base,'€','=E10+E14+E15'],['E17','Rezerva',reserve,'€','=E16*E13'],['E18','Celkové náklady',total,'€','=E16+E17'],['E19','Na jedného žiaka',total/v[0],'€','=E18/E9']];
    }}
  };
  const selector=document.getElementById('calculator-case');
  if(selector) {
    const inputs=document.getElementById('calculator-inputs'), result=document.getElementById('calculator-result'), presets=document.getElementById('calculator-presets');
    const number=n=>n.toLocaleString('sk-SK',{maximumFractionDigits:4});
    function calculate() {
      const values=[...inputs.querySelectorAll('input')].map(input=>input.value.trim()===''?NaN:Number(input.value));
      try {
        if(values.some(value=>!Number.isFinite(value)||value<0||value>1e9)) throw Error('Vyplň všetky vstupy nezápornými číslami najviac 1 000 000 000.');
        const rows=calculators[selector.value].calculate(values);
        if(rows.some(row=>!Number.isFinite(row[2]))) throw Error('Výsledok nie je dostupný. Skontroluj vstupy.');
        result.dataset.error='false';
        result.innerHTML=rows.map(([cell,label,value,unit,formula])=>'<div class="calculator-output-row"><span>'+label+(cell?' · <code>'+cell+'</code>':'')+'<small>'+formula+'</small></span><b>'+number(value)+' '+unit+'</b></div>').join('');
      } catch(error) { result.dataset.error='true'; result.textContent=error.message; }
    }
    function showCalculator() {
      const item=calculators[selector.value];
      inputs.innerHTML=item.inputs.map(([cell,label,value],i)=>'<label for="calc-input-'+i+'">'+label+' · <code>'+cell+'</code><input id="calc-input-'+i+'" type="number" min="0" max="1000000000" step="any" value="'+value+'"></label>').join('');
      presets.innerHTML=item.presets.map(([label,value])=>'<button type="button" data-preset="'+value+'">'+label+'</button>').join(''); calculate();
    }
    inputs.addEventListener('input',calculate);
    presets.addEventListener('click',event=>{const button=event.target.closest('[data-preset]'); if(button){inputs.querySelector('input').value=button.dataset.preset; calculate();}});
    selector.addEventListener('change',showCalculator); showCalculator();
  }
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const panel=entry.target.closest('[role=tabpanel]');
    if(!entry.isIntersecting||panel?.hidden) return;
    panel?.querySelectorAll('.toc a').forEach(link=>link.classList.toggle('on',link.hash==='#'+entry.target.id));
  }),{rootMargin:'-20% 0px -60% 0px'});
  document.querySelectorAll('.section,.step').forEach(section=>observer.observe(section));
})();
