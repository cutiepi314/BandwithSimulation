(() => {
  const tabs = [...document.querySelectorAll('.network-lab-tabs [role="tab"]')];
  // Accepts a slug (#spracovanie-ramcov) or the tab number (#3).
  function findTab(key) {
    const text = String(key ?? '').toLowerCase();
    return tabs.find(tab => tab.dataset.slug === text) || tabs[Number(text) - 1];
  }
  function activate(tab, focus = false, announce = true) {
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    }
    if (tab.id !== 'throughput-tab') window.NetworkFlow?.pause();
    else requestAnimationFrame(() => window.NetworkFlow?.redraw());
    if (tab.id !== 'encapsulation-tab') window.EncapsulationLab?.pause();
    if (tab.id !== 'switching-tab') window.SwitchingLab?.pause();
    if (tab.id !== 'speed-tab') window.SpeedLab?.pause();
    if (tab.id !== 'backup-tab') window.BackupLab?.pause();
    if (focus) tab.focus();
    if (announce) window.setNetworkLabTab?.(tab.dataset.slug);
  }
  window.openNetworkLabTab = key => {
    const tab = findTab(key);
    if (tab) activate(tab, false, false);
  };
  const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];
  function showTheme(choice) {
    for (const button of themeButtons) button.setAttribute('aria-pressed', String(button.dataset.themeChoice === choice));
  }
  themeButtons.forEach(button => button.addEventListener('click', () => {
    window.setNetworkLabTheme?.(button.dataset.themeChoice);
    showTheme(button.dataset.themeChoice);
  }));
  showTheme(document.documentElement.dataset.themePreference || 'auto');
  const initialTab = findTab(document.documentElement.dataset.initialTab);
  if (initialTab) activate(initialTab, false, false);
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); activate(tabs[next], true); }
    });
  });
})();
