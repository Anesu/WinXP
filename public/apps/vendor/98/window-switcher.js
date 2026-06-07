// Alt+1 window switcher — vanilla port of 98.js src/window-switcher.js
(function() {
  let switcherEl = null;
  let listEl = null;
  let nameEl = null;
  let activeIndex = 0;

  function getOpenWindows() {
    return Object.entries(state.windows)
      .filter(function(entry) { return !entry[1].minimized; })
      .sort(function(a, b) {
        return (parseInt(b[1].el.style.zIndex, 10) || 0) - (parseInt(a[1].el.style.zIndex, 10) || 0);
      });
  }

  function activateWindow(winId) {
    const w = state.windows[winId];
    if (!w) return;
    if (w.minimized) restoreWindow(winId);
    focusWindow(winId);
  }

  function ensureSwitcher() {
    if (switcherEl) return;
    switcherEl = document.createElement('div');
    switcherEl.className = 'v98-window-switcher outset-deep hidden';
    listEl = document.createElement('ul');
    listEl.className = 'v98-window-switcher-list';
    nameEl = document.createElement('div');
    nameEl.className = 'v98-window-switcher-name inset-deep';
    switcherEl.appendChild(listEl);
    switcherEl.appendChild(nameEl);
  }

  function hideSwitcher() {
    if (switcherEl && switcherEl.parentNode) switcherEl.parentNode.removeChild(switcherEl);
    switcherEl = null;
  }

  function cycleSwitcher(backwards) {
    const items = listEl.querySelectorAll('.v98-window-switcher-item');
    if (!items.length) return;
    items[activeIndex].classList.remove('active');
    activeIndex = (activeIndex + (backwards ? -1 : 1) + items.length) % items.length;
    items[activeIndex].classList.add('active');
    nameEl.textContent = items[activeIndex].dataset.title || '';
  }

  function showSwitcher(backwards) {
    const wins = getOpenWindows();
    if (wins.length < 2) {
      if (wins.length === 1) activateWindow(wins[0][0]);
      return;
    }
    if (switcherEl && !switcherEl.classList.contains('hidden')) {
      cycleSwitcher(backwards);
      return;
    }
    ensureSwitcher();
    listEl.innerHTML = '';
    activeIndex = 0;
    wins.forEach(function(entry, i) {
      const winId = entry[0];
      const w = entry[1];
      const li = document.createElement('li');
      li.className = 'v98-window-switcher-item';
      li.dataset.winId = winId;
      li.dataset.title = w.title || winId;
      const app = w.app;
      const iconId = typeof v98AppIconId === 'function' ? v98AppIconId(app) : 'programs-folder';
      const img = document.createElement('img');
      img.src = v98IconPath(iconId, 32);
      img.width = 32;
      img.height = 32;
      img.alt = '';
      li.appendChild(img);
      if (winId === state.activeWindowId) {
        li.classList.add('active');
        activeIndex = i;
      }
      listEl.appendChild(li);
    });
    const active = listEl.querySelector('.active');
    nameEl.textContent = active ? active.dataset.title : '';
    switcherEl.classList.remove('hidden');
    document.body.appendChild(switcherEl);
  }

  function confirmSwitcher() {
    if (!switcherEl || switcherEl.classList.contains('hidden')) return;
    const active = listEl.querySelector('.active');
    if (active) activateWindow(active.dataset.winId);
    hideSwitcher();
  }

  window.addEventListener('keydown', function(e) {
    if (e.altKey && (e.key === '1' || e.code === 'Backquote' || e.code === 'Tab')) {
      e.preventDefault();
      showSwitcher(e.shiftKey);
    } else if (switcherEl) {
      hideSwitcher();
    }
  }, true);

  window.addEventListener('keyup', function(e) {
    if (!e.altKey) confirmSwitcher();
  }, true);

  window.addEventListener('blur', hideSwitcher);
})();