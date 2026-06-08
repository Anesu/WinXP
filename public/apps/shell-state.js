// Minimal window registry for embedded apps running inside the React shell.
const state = {
  windows: {},
  zCounter: 10,
  activeWindowId: null,
};

function getActiveWinId(el) {
  if (el && el.closest) {
    const winEl = el.closest('.win95-window');
    if (winEl && winEl.dataset.winId) return winEl.dataset.winId;
  }
  const e = window.event;
  const winEl = e ? e.target.closest('.win95-window') : null;
  if (winEl && winEl.dataset.winId) return winEl.dataset.winId;
  return state.activeWindowId;
}

function getAppStateAndEl(winIdOrEl) {
  let winId = null;
  let el = null;

  let node = winIdOrEl;
  if (node && node.target && typeof node.target.closest === 'function') {
    node = node.target;
  }

  if (typeof winIdOrEl === 'string') {
    winId = winIdOrEl;
  } else if (node && typeof node.closest === 'function') {
    const winEl = node.closest('.win95-window');
    winId = winEl ? winEl.dataset.winId : null;
    el = winEl;
  }

  if (!winId) {
    winId = getActiveWinId(node && typeof node.closest === 'function' ? node : null);
  }
  const win = state.windows[winId];
  if (!win) return { state: null, el: null, winId: null };
  if (!win.appState) win.appState = {};
  return { state: win.appState, el: win.el, winId };
}