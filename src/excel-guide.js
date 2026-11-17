(() => {
  'use strict';

  const tabs = [...document.querySelectorAll('[data-tab]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));

  function fromHash(scrollToSection = false) {
    const key = location.hash.slice(1);
    const target = document.getElementById(key);
    const activePanel = target?.closest('[role="tabpanel"]') || panels[0];
    tabs.forEach((tab, index) => {
      const selected = panels[index] === activePanel;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[index].hidden = !selected;
    });
    if (scrollToSection && target) {
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      history.replaceState(null, '', '#' + tab.dataset.tab);
      fromHash();
    });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      tabs[next].click();
      tabs[next].focus();
    });
  });
  addEventListener('hashchange', () => fromHash(true));
  fromHash(Boolean(location.hash));

  const root = document.documentElement;
  const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];
  const showTheme = () => themeButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === (root.dataset.theme || 'auto')));
  });
  themeButtons.forEach(button => button.addEventListener('click', () => {
    const choice = button.dataset.themeChoice;
    if (choice === 'auto') delete root.dataset.theme;
    else root.dataset.theme = choice;
    try {
      if (choice === 'auto') localStorage.removeItem('pvalo-theme');
      else localStorage.setItem('pvalo-theme', choice);
    } catch {}
    showTheme();
  }));
  showTheme();

  function coordinates(address) {
    const [, column, row] = address.match(/^([A-Z])(\d+)$/);
    return { column: column.charCodeAt(0) - 65, row: Number(row) };
  }
  function includes(range, address) {
    const [first, last = first] = range.split(':').map(coordinates);
    const cell = coordinates(address);
    return cell.column >= first.column && cell.column <= last.column && cell.row >= first.row && cell.row <= last.row;
  }

  const demo = document.getElementById('address-demo');
  const columns = ['A', 'B', 'C', 'D', 'E'];
  const exampleValues = { A1: 'Ananás', B1: 'Jablko', C1: 'Hruška', D1: 'Granátové jablko', B2: '30,50 €', D2: '15:30:00', A3: '3/4', C3: '03.02.2026' };
  const demoHead = demo.createTHead().insertRow();
  ['', ...columns].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    if (label) th.scope = 'col';
    demoHead.append(th);
  });
  const demoBody = demo.createTBody();
  for (let row = 1; row <= 7; row++) {
    const tr = demoBody.insertRow();
    const heading = document.createElement('th');
    heading.textContent = row;
    heading.scope = 'row';
    tr.append(heading);
    columns.forEach(column => {
      const address = column + row;
      const td = tr.insertCell();
      td.dataset.address = address;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.cell = address;
      button.textContent = exampleValues[address] || '';
      button.setAttribute('aria-label', address + (exampleValues[address] ? ': ' + exampleValues[address] : ': prázdna bunka'));
      td.append(button);
    });
  }
  function showRange(range) {
    const [first, last] = range.split(':');
    demo.querySelectorAll('[data-address]').forEach(cell => {
      const selected = includes(range, cell.dataset.address);
      cell.classList.toggle('selected', selected);
      cell.firstElementChild.setAttribute('aria-pressed', String(selected));
    });
    document.getElementById('demo-address').textContent = range;
    document.querySelectorAll('[data-range]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.range === range)));
    if (last) {
      const a = coordinates(first);
      const b = coordinates(last);
      const width = b.column - a.column + 1;
      const height = b.row - a.row + 1;
      document.getElementById('range-description').textContent = `${range}: od bunky ${first} po ${last}, počet stĺpcov ${width}, počet riadkov ${height}, spolu ${width * height} buniek.`;
    } else {
      const cell = coordinates(first);
      document.getElementById('range-description').textContent = `Vybraná je bunka ${first}: stĺpec ${first[0]}, riadok ${cell.row}.`;
    }
  }
  demo.addEventListener('click', event => {
    const button = event.target.closest('[data-cell]');
    if (button) showRange(button.dataset.cell);
  });
  document.querySelectorAll('[data-range]').forEach(button => button.addEventListener('click', () => showRange(button.dataset.range)));
  showRange('C1');

  const yellowRanges = ['A8:A13', 'B4:B16', 'C2:G18', 'H4:H16', 'I8:I13'];
  const blueRanges = ['C5:D7', 'F5:G7'];
  const blackRanges = ['C15:G15', 'E16', 'F17', 'G16'];
  const whiteRanges = ['D6', 'G6'];
  const sourceCharacters = { D6: '●', G6: '●', C15: 'ggggg', D15: 'gggg', E15: 'gggg', F15: 'gggg', G15: 'gggg', E16: 'gggg', F16: 'gggg', G16: 'gggg', F17: 'gggg' };
  const pixelGrid = document.getElementById('pixel-preview');
  const pixelHead = pixelGrid.createTHead().insertRow();
  ['', ...'ABCDEFGHI'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    if (label) th.scope = 'col';
    pixelHead.append(th);
  });
  const pixelBody = pixelGrid.createTBody();
  for (let row = 1; row <= 18; row++) {
    const tr = pixelBody.insertRow();
    const heading = document.createElement('th');
    heading.textContent = row;
    heading.scope = 'row';
    tr.append(heading);
    for (const column of 'ABCDEFGHI') {
      const cell = tr.insertCell();
      cell.dataset.pixel = column + row;
    }
  }
  function showPixelStage(stage) {
    document.querySelectorAll('[data-pixel-stage]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pixelStage === stage)));
    pixelGrid.querySelectorAll('[data-pixel]').forEach(cell => {
      const address = cell.dataset.pixel;
      let fill = yellowRanges.some(range => includes(range, address)) ? '#ffce1a' : '#fff';
      if (stage !== 'yellow' && blueRanges.some(range => includes(range, address))) fill = '#1671c5';
      cell.style.backgroundColor = fill;
      cell.style.color = '#111';
      cell.textContent = stage === 'final' ? sourceCharacters[address] || '' : '';
      cell.classList.toggle('eye', stage === 'final' && whiteRanges.includes(address));
      if (stage === 'final') {
        if (blackRanges.some(range => includes(range, address))) cell.style.color = '#111';
        if (address === 'F16') cell.style.color = '#e32136';
        if (whiteRanges.includes(address)) cell.style.color = '#fff';
      }
    });
  }
  document.querySelectorAll('[data-pixel-stage]').forEach(button => button.addEventListener('click', () => showPixelStage(button.dataset.pixelStage)));
  showPixelStage('final');

  const storageKey = 'pvalo-excel-h01-checklist';
  const checks = [...document.querySelectorAll('[data-check]')];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch {}
  function updateChecks() {
    const count = checks.filter(input => input.checked).length;
    document.getElementById('check-count').textContent = `${count} / ${checks.length}`;
    document.getElementById('check-progress').style.width = `${count / checks.length * 100}%`;
    try { localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(checks.map(input => [input.dataset.check, input.checked])))); } catch {}
  }
  checks.forEach(input => {
    input.checked = saved[input.dataset.check] === true;
    input.addEventListener('change', updateChecks);
  });
  document.getElementById('reset-checks').addEventListener('click', () => {
    checks.forEach(input => { input.checked = false; });
    updateChecks();
  });
  updateChecks();

  const tocLinks = [...document.querySelectorAll('.toc a')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.closest('[role="tabpanel"]').hidden) return;
      const toc = entry.target.closest('[role="tabpanel"]').querySelector('.toc');
      tocLinks.filter(link => toc.contains(link)).forEach(link => link.classList.toggle('on', link.hash === '#' + entry.target.id));
    });
  }, { rootMargin: '-20% 0px -60% 0px' });
  document.querySelectorAll('.section, .step').forEach(section => observer.observe(section));
})();
