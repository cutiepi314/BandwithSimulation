(() => {
  const tabs = [...document.querySelectorAll('.network-lab-tabs [role="tab"]')];
  function activate(tab, focus = false) {
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
    if (focus) tab.focus();
  }
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
