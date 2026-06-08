// Embedded runtime: window registry, manifest controllers, ShellAPI registration.

function openApp(app) {
  ShellAPI.openApp(app);
}

function cleanupPomodoro(winId) {
  if (pomodoroState[winId]) {
    clearInterval(pomodoroState[winId].interval);
    delete pomodoroState[winId];
  }
}

function cleanupQrtx(winId) {
  const w = state.windows[winId];
  if (w && w.qrtxState && w.qrtxState.loopIntervalId) {
    clearInterval(w.qrtxState.loopIntervalId);
  }
}

const CLEANUP_HANDLERS = {
  pomodoro: cleanupPomodoro,
  qrtx: cleanupQrtx,
};

function buildAppControllersFromManifest(manifest) {
  const controllers = {};
  if (!manifest || !Array.isArray(manifest)) return controllers;
  manifest.forEach(function(entry) {
    var init = null;
    if (entry.useCpInit) {
      init = function() {
        if (typeof cpInit === 'function') cpInit();
      };
    } else if (entry.initFn) {
      init = function(winId, el) {
        var fn = window[entry.initFn];
        if (typeof fn === 'function') fn(winId, el);
      };
    }
    controllers[entry.appKey] = {
      title: entry.title,
      init: init,
      cleanup: entry.cleanup ? CLEANUP_HANDLERS[entry.cleanup] : null,
    };
  });
  return controllers;
}

const appControllers = buildAppControllersFromManifest(ShellAPI.getManifest());

function getAppTitle(app) {
  const ctrl = appControllers[app];
  return ctrl ? ctrl.title : app;
}

function initAppContent(app, winId, el) {
  const ctrl = appControllers[app];
  if (ctrl && ctrl.init) ctrl.init(winId, el);
}

function registerAppWindow(winId, el, app) {
  state.windows[winId] = {
    el,
    app,
    title: getAppTitle(app),
    minimized: false,
    maximized: false,
    appState: {},
  };
  state.activeWindowId = winId;
}

function unregisterAppWindow(winId) {
  const win = state.windows[winId];
  if (!win) return;
  const ctrl = appControllers[win.app];
  if (ctrl && ctrl.cleanup) ctrl.cleanup(winId);
  delete state.windows[winId];
}

function setActiveAppWindow(winId) {
  state.activeWindowId = winId;
}

function initEmbeddedApp(app, winId, el) {
  registerAppWindow(winId, el, app);
  initAppContent(app, winId, el);
}

const registerWin95Window = registerAppWindow;
const unregisterWin95Window = unregisterAppWindow;
const initWin95App = initEmbeddedApp;

// Legacy template onclick stubs — React owns window chrome.
function minimizeWindow() {}
function maximizeWindow() {}
function closeWindow() {}

function updateClock() {
  const now = new Date();
  const cp = controlPanelStore.getAll();
  const clockEl = document.getElementById('clock');
  if (!clockEl) return;

  if (cp.showClock === false) {
    clockEl.style.display = 'none';
  } else {
    clockEl.style.display = '';
  }

  let timeStr = '';
  if (cp.clockFormat === '24') {
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    timeStr = h + ':' + m;
  } else {
    let h = now.getHours();
    const m = now.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const mm = m < 10 ? '0' + m : m;
    timeStr = h + ':' + mm + ' ' + ampm;
  }

  clockEl.textContent = timeStr;
  clockEl.title = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function updateDesktopTheme() {
  const desktop = document.getElementById('desktop');
  if (!desktop) return;
  const cp = controlPanelStore.getAll();
  const theme = cp.desktopTheme || 'teal';

  const themes = {
    teal: {
      color: '#008080',
      image: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='%23007a7a' opacity='0.4'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23006e6e' opacity='0.3'/%3E%3C/svg%3E\")",
    },
    slate: {
      color: '#405060',
      image: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='%233b4958' opacity='0.4'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23354250' opacity='0.3'/%3E%3C/svg%3E\")",
    },
    plum: {
      color: '#4a004a',
      image: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='%23420042' opacity='0.4'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%233a003a' opacity='0.3'/%3E%3C/svg%3E\")",
    },
    rose: {
      color: '#800040',
      image: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='%2375003b' opacity='0.4'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%236a0035' opacity='0.3'/%3E%3C/svg%3E\")",
    },
    charcoal: {
      color: '#2f353b',
      image: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='%232a2f35' opacity='0.4'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23252a2f' opacity='0.3'/%3E%3C/svg%3E\")",
    },
  };

  const selected = themes[theme] || themes.teal;
  desktop.style.backgroundColor = selected.color;
  desktop.style.backgroundImage = selected.image;
}

function updateRecycleBinIcon() {
  const full = recycleBinStore.count() > 0;
  const icon = document.querySelector('.desktop-icon[data-app="recyclebin"]');
  if (icon) {
    icon.dataset.full = full ? 'true' : 'false';
    const img = icon.querySelector('.desktop-icon-img');
    if (img) img.textContent = '🗑️';
  }
  ShellAPI.notify(ShellAPI.events.RECYCLEBIN, { full });
}

function showAboutWindows() {
  const tpl = document.getElementById('tpl-about-windows');
  if (!tpl) return;
  const clone = tpl.content.firstElementChild.cloneNode(true);
  document.body.appendChild(clone);
  const memEl = clone.querySelector('#about-memory');
  const resEl = clone.querySelector('#about-resources');
  if (memEl) memEl.textContent = Math.round(window.performance?.memory?.jsHeapSizeLimit / 1024 || 65536).toLocaleString() + ' KB';
  if (resEl) resEl.textContent = Math.floor(70 + Math.random() * 25) + '% free';
}

function closeAboutWindows() {
  const overlay = document.querySelector('.about-overlay');
  if (overlay) overlay.remove();
}

if (typeof initFileDrop === 'function') initFileDrop();
if (typeof initAutoBackupOnExit === 'function') initAutoBackupOnExit();

shellEvents.on('pomodoro:update', data => {
  ShellAPI.notify(ShellAPI.events.POMODORO, data);
});
shellEvents.on('window:flash_start', winId => {
  ShellAPI.notify(ShellAPI.events.WINDOW_FLASH_START, winId);
});
shellEvents.on('window:flash_stop', winId => {
  ShellAPI.notify(ShellAPI.events.WINDOW_FLASH_STOP, winId);
});
shellEvents.on('window:focused', winId => {
  ShellAPI.notify(ShellAPI.events.WINDOW_FLASH_STOP, winId);
});
shellEvents.on('store:recyclebin:changed', updateRecycleBinIcon);
updateRecycleBinIcon();

ShellAPI.registerEmbedded({
  mount: initEmbeddedApp,
  unmount: unregisterAppWindow,
});

setInterval(() => {
  for (const [id, w] of Object.entries(state.windows)) {
    if (w.app === 'journal' && !w.minimized && typeof journalNotesAutoSave === 'function') {
      journalNotesAutoSave();
    }
  }
}, 5000);