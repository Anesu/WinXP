// ============================================================
//  WIN95.JS  —  Window Manager + Shell + App Controllers
//  v2.0 — Architecture: extracted data layer to stores.js.
//         All fs.* accesses replaced with store interfaces.
//         Stores auto-save; controllers no longer call saveFilesystem().
// ============================================================

// ===== GLOBAL CONSTANTS =====
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_MINI = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ===== GLOBAL STATE =====
const state = {
  windows: {},         // { id: { el, app, title, minimized, maximized, x, y, w, h } }
  zCounter: 10,
  activeWindowId: null,
  startMenuOpen: false,
  contextMenuOpen: false,
  selectedIcon: null,  // DOM element of currently selected desktop icon
  clockInterval: null,
};

// ===== EVENT BUS =====
const shellEvents = {
  listeners: {},
  on(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  },
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(fn => fn(data));
  }
};

// ===== INSTANCE STATE HELPERS =====
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

  // Inline onclick handlers pass the DOM Event, not an element or winId string.
  // A bare Event is truthy but is not a valid window key — normalize to target.
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
// ===== RECYCLE BIN =====
function moveToRecycleBin(type, data) {
  recycleBinStore.add(type, data);
  shellEvents.emit('store:recyclebin:changed');
}
function restoreFromRecycleBin(rbId) {
  const item = recycleBinStore.get(rbId);
  if (!item) return;
  if (item.type === 'note') {
    notesStore.add({ title: item.data.title || 'Restored', content: item.data.content || '' });
  } else if (item.type === 'todo') {
    todoStore.add({ text: item.data.text || '', dueDate: item.data.dueDate || null });
  } else if (item.type === 'event') {
    eventStore.add(item.data.key, item.data.event);
  }
  recycleBinStore.remove(rbId);
  shellEvents.emit('store:recyclebin:changed');
}
function emptyRecycleBin() {
  recycleBinStore.empty();
  shellEvents.emit('store:recyclebin:changed');
  if (typeof v98PlaySound === 'function') v98PlaySound('recycle');
  const winEl = findWinEl('recyclebin');
  if (winEl) renderRecycleBin(winEl);
}

function initRecycleBinApp(winId, el) {
  renderRecycleBin(el);
}
function renderRecycleBin(el) {
  const content = el.querySelector('#recyclebin-content');
  const status = el.querySelector('#recyclebin-status');
  const items = recycleBinStore.all();
  if (items.length === 0) {
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#808080;"><div style="font-size:48px;">🗑️</div><p>Recycle Bin is empty.</p></div>';
    status.textContent = '0 object(s)';
    return;
  }
  const typeLabels = { note: '📝 Note', todo: '✅ Task', event: '📅 Event' };
  let html = '<div style="padding:4px;">';
  items.forEach(rb => {
    const label = rb.type === 'note' ? (rb.data.title || 'Untitled') :
                  rb.type === 'todo' ? rb.data.text :
                  rb.type === 'event' ? rb.data.event.title : 'Unknown';
    html += '<div class="recyclebin-item">';
    html += '<span class="recyclebin-item-type">' + (typeLabels[rb.type] || '📄') + '</span>';
    html += '<span class="recyclebin-item-name">' + escapeHtml(label) + '</span>';
    html += '<span class="recyclebin-item-date">' + formatTime(rb.deletedAt) + '</span>';
    html += '<button class="recyclebin-restore-btn" onclick="restoreFromRecycleBin(\'' + rb.id + '\')">Restore</button>';
    html += '</div>';
  });
  html += '</div>';
  content.innerHTML = html;
  status.textContent = items.length + ' object(s)';
}
function restoreAllRecycleBin() {
  const items = recycleBinStore.all();
  items.forEach(rb => restoreFromRecycleBin(rb.id));
  const winEl = findWinEl('recyclebin');
  if (winEl) renderRecycleBin(winEl);
}

// ===== BOOT SEQUENCE =====
function skipBoot() {
  const boot = document.getElementById('boot-screen');
  if (boot.style.display === 'none') return;
  // Clear pending timers by accelerating transition
  boot.classList.add('fade-out');
  setTimeout(() => {
    boot.style.display = 'none';
    if (typeof v98PlaySound === 'function') v98PlaySound('startup');
    if (typeof v98InitDesktopChrome === 'function') v98InitDesktopChrome();
  }, 500);
}
function initBootScreen() {
  const boot = document.getElementById('boot-screen');
  const fill = boot.querySelector('.boot-progress-fill');
  const status = boot.querySelector('.boot-status');

  // Click anywhere to skip
  boot.addEventListener('click', skipBoot);

  // Animate progress bar
  requestAnimationFrame(() => {
    fill.style.width = '100%';
  });

  // Update status text
  setTimeout(() => { status.textContent = 'Loading system components...'; }, 800);
  setTimeout(() => { status.textContent = 'Preparing desktop...'; }, 1600);

  // Fade out after progress completes
  setTimeout(() => {
    boot.classList.add('fade-out');
  }, 2500);

  // Remove from DOM after fade
  setTimeout(() => {
    boot.style.display = 'none';
    if (typeof v98PlaySound === 'function') v98PlaySound('startup');
    if (typeof v98InitDesktopChrome === 'function') v98InitDesktopChrome();
  }, 3200);
}

// ===== SHUTDOWN =====
function shutdownSystem() {
  const screen = document.getElementById('shutdown-screen');
  screen.classList.remove('hidden');

  // Close any running timers via registry
  for (const [id, w] of Object.entries(state.windows)) {
    const ctrl = appControllers[w.app];
    if (ctrl && ctrl.cleanup) ctrl.cleanup(id);
    saveAppState(id);
  }

  // Refresh the page after a delay (simulates restart)
  setTimeout(() => {
    screen.classList.add('hidden');
    location.reload();
  }, 4000);
}

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  const cp = controlPanelStore.getAll();
  const clockEl = document.getElementById('clock');
  
  if (!clockEl) return;

  // Visibility toggle
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
  // Date tooltip
  clockEl.title = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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
      image: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='%23007a7a' opacity='0.4'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23006e6e' opacity='0.3'/%3E%3C/svg%3E\")"
    },
    slate: {
      color: '#405060',
      image: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='%233b4958' opacity='0.4'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23354250' opacity='0.3'/%3E%3C/svg%3E\")"
    },
    plum: {
      color: '#4a004a',
      image: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='%23420042' opacity='0.4'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%233a003a' opacity='0.3'/%3E%3C/svg%3E\")"
    },
    rose: {
      color: '#800040',
      image: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='%2375003b' opacity='0.4'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%236a0035' opacity='0.3'/%3E%3C/svg%3E\")"
    },
    charcoal: {
      color: '#2f353b',
      image: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='%232a2f35' opacity='0.4'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23252a2f' opacity='0.3'/%3E%3C/svg%3E\")"
    }
  };

  const selected = themes[theme] || themes.teal;
  desktop.style.backgroundColor = selected.color;
  desktop.style.backgroundImage = selected.image;
}

// ===== START MENU =====
function toggleStartMenu() {
  state.startMenuOpen = !state.startMenuOpen;
  const menu = document.getElementById('start-menu');
  const btn = document.getElementById('start-btn');
  if (state.startMenuOpen) {
    menu.classList.remove('hidden');
    btn.classList.add('active');
    closeContextMenu();
    document.querySelectorAll('.start-submenu').forEach(sm => sm.classList.add('hidden'));
    renderStartMenuDocuments();
  } else {
    menu.classList.add('hidden');
    btn.classList.remove('active');
    document.querySelectorAll('.start-submenu').forEach(sm => sm.classList.add('hidden'));
  }
}
function closeStartMenu() {
  if (state.startMenuOpen) {
    state.startMenuOpen = false;
    document.getElementById('start-menu').classList.add('hidden');
    document.getElementById('start-btn').classList.remove('active');
    document.querySelectorAll('.start-submenu').forEach(sm => sm.classList.add('hidden'));
  }
}

function renderStartMenuDocuments() {
  const submenu = document.getElementById('documents-submenu');
  if (!submenu) return;
  const notes = notesStore.all();
  const topNotes = notes.slice(0, 5);
  
  if (topNotes.length === 0) {
    submenu.innerHTML = '<div style="padding: 9px 16px; color: #808080; font-size: 11px; white-space: nowrap;">No recent documents</div>';
    return;
  }
  
  let html = '';
  topNotes.forEach(note => {
    html += '<div class="start-menu-item" onclick="openJournalNote(\'' + note.id + '\')">';
    html += '<span class="start-menu-item-icon">📝</span><span>' + escapeHtml(note.title || 'Untitled') + '</span>';
    html += '</div>';
  });
  submenu.innerHTML = html;
}

function openJournalNote(noteId) {
  openApp('journal');
  let winEl = null;
  for (const [id, w] of Object.entries(state.windows)) {
    if (w.app === 'journal') {
      winEl = w.el;
      break;
    }
  }
  if (winEl) {
    journalNotesLoad(noteId, winEl);
  }
}

// ===== DESKTOP CONTEXT MENU =====
function showContextMenu(e) {
  e.preventDefault();
  const menu = document.getElementById('context-menu');
  menu.classList.remove('hidden');
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
  // Keep menu in viewport
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (e.clientX - rect.width) + 'px';
  if (rect.bottom > window.innerHeight - 28) menu.style.top = (e.clientY - rect.height) + 'px';
  state.contextMenuOpen = true;
  closeStartMenu();
}

function closeContextMenu() {
  if (state.contextMenuOpen) {
    state.contextMenuOpen = false;
    document.getElementById('context-menu').classList.add('hidden');
  }
}

function arrangeIcons() {
  iconStore.reset();
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    icon.style.transform = '';
  });
  closeContextMenu();
}

function refreshDesktop() {
  closeContextMenu();
  // Brief flash effect
  const desktop = document.getElementById('desktop');
  desktop.style.opacity = '0.8';
  setTimeout(() => { desktop.style.opacity = '1'; }, 150);
}

function showDesktopProperties() {
  closeContextMenu();
  openApp('controlpanel');
  cpTab('display');
}

// ===== DESKTOP ICON SELECTION =====
function selectIcon(iconEl) {
  // Deselect all
  document.querySelectorAll('.desktop-icon.selected').forEach(el => el.classList.remove('selected'));
  // Select this one
  iconEl.classList.add('selected');
  state.selectedIcon = iconEl;
  closeContextMenu();
}

function deselectAllIcons() {
  document.querySelectorAll('.desktop-icon.selected').forEach(el => el.classList.remove('selected'));
  state.selectedIcon = null;
}

// ===== DESKTOP ICON DRAG =====
let iconDrag = null;

function initIconDrag() {
  // Restore saved positions
  if (!iconStore) iconStore.reset();
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    const app = icon.dataset.app;
    if (iconStore.get(app)) {
      icon.style.transform = 'translate(' + iconStore.get(app).x + 'px, ' + iconStore.get(app).y + 'px)';
    }
    icon.addEventListener('mousedown', iconMouseDown);
  });
}

function iconMouseDown(e) {
  if (e.button !== 0) return;
  const icon = e.currentTarget;
  // Don't drag when clicking the scrollbar or if a window is open
  selectIcon(icon);
  iconDrag = {
    icon: icon,
    sx: e.clientX, sy: e.clientY,
    moved: false,
  };
  e.stopPropagation(); // prevent desktop drag-select
  document.addEventListener('mousemove', iconMouseMove);
  document.addEventListener('mouseup', iconMouseUp);
}

function iconMouseMove(e) {
  if (!iconDrag) return;
  const dx = e.clientX - iconDrag.sx;
  const dy = e.clientY - iconDrag.sy;
  if (!iconDrag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
    iconDrag.moved = true;
    iconDrag.icon.classList.add('dragging');
  }
  if (iconDrag.moved) {
    const app = iconDrag.icon.dataset.app;
    const cur = iconStore[app] || { x: 0, y: 0 };
    iconDrag.icon.style.transform = 'translate(' + (cur.x + dx) + 'px, ' + (cur.y + dy) + 'px)';
  }
}

function iconMouseUp(e) {
  if (!iconDrag) return;
  if (iconDrag.moved) {
    const dx = e.clientX - iconDrag.sx;
    const dy = e.clientY - iconDrag.sy;
    const app = iconDrag.icon.dataset.app;
    const cur = iconStore[app] || { x: 0, y: 0 };
    // Save and snap to grid
    const rawX = cur.x + dx;
    const rawY = cur.y + dy;
    iconStore.set(app, Math.round(rawX / GRID_SIZE) * GRID_SIZE, Math.round(rawY / GRID_SIZE) * GRID_SIZE);
  }
  iconDrag.icon.classList.remove('dragging');
  iconDrag = null;
  document.removeEventListener('mousemove', iconMouseMove);
  document.removeEventListener('mouseup', iconMouseUp);
}

function openSelectedIcon() {
  if (state.selectedIcon) {
    const app = state.selectedIcon.dataset.app;
    if (app) openApp(app);
  }
}

function navigateIcons(direction) {
  const icons = [...document.querySelectorAll('.desktop-icon')];
  if (icons.length === 0) return;
  let idx = icons.indexOf(state.selectedIcon);
  if (idx === -1) idx = 0;
  else if (direction === 'next') idx = (idx + 1) % icons.length;
  else if (direction === 'prev') idx = (idx - 1 + icons.length) % icons.length;
  selectIcon(icons[idx]);
}

// ===== DRAG-SELECT RECTANGLE =====
let dragSelectData = null;

function startDragSelect(e) {
  // Only on desktop background (not on icons, not on windows)
  if (e.target.closest('.desktop-icon') || e.target.closest('.win95-window') || e.target.closest('#taskbar')) return;
  if (e.button !== 0) return; // left button only

  const rect = document.getElementById('selection-rect');
  dragSelectData = {
    sx: e.clientX,
    sy: e.clientY,
  };
  rect.style.display = 'block';
  rect.style.left = e.clientX + 'px';
  rect.style.top = e.clientY + 'px';
  rect.style.width = '0px';
  rect.style.height = '0px';

  deselectAllIcons();
  closeContextMenu();
  closeStartMenu();
}

function onDragSelect(e) {
  if (!dragSelectData) return;
  const rect = document.getElementById('selection-rect');
  const x = Math.min(e.clientX, dragSelectData.sx);
  const y = Math.min(e.clientY, dragSelectData.sy);
  const w = Math.abs(e.clientX - dragSelectData.sx);
  const h = Math.abs(e.clientY - dragSelectData.sy);
  rect.style.left = x + 'px';
  rect.style.top = y + 'px';
  rect.style.width = w + 'px';
  rect.style.height = h + 'px';

  // Highlight icons within rectangle
  const selRect = rect.getBoundingClientRect();
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    const ir = icon.getBoundingClientRect();
    const overlap = !(ir.right < selRect.left || ir.left > selRect.right || ir.bottom < selRect.top || ir.top > selRect.bottom);
    if (overlap) {
      icon.classList.add('selected');
      state.selectedIcon = icon;
    } else {
      icon.classList.remove('selected');
    }
  });
}

function stopDragSelect() {
  if (!dragSelectData) return;
  dragSelectData = null;
  document.getElementById('selection-rect').style.display = 'none';
}

// ===== WINDOW MANAGER =====
function makeWindowId(app) {
  let n = 1;
  while (state.windows[app + '-' + n]) n++;
  return app + '-' + n;
}

function openApp(app) {
  if (typeof window.__winxpOpenApp === 'function') window.__winxpOpenApp(app);
}

// ============================================================
//  APP CONTROLLER REGISTRY — built from window.__winxpAppManifest
//  (injected by React AppShell from src/.../appRegistry.js)
// ============================================================
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

const appControllers = buildAppControllersFromManifest(window.__winxpAppManifest);

function getAppTitle(app) {
  const ctrl = appControllers[app];
  return ctrl ? ctrl.title : app;
}

function initAppContent(app, winId, el) {
  const ctrl = appControllers[app];
  if (ctrl && ctrl.init) ctrl.init(winId, el);
}

function focusWindow(winId) {
  if (!state.windows[winId]) return;
  state.zCounter += 2;
  state.windows[winId].el.style.zIndex = state.zCounter;
  state.activeWindowId = winId;

  // Stop any flashing for this window
  shellEvents.emit('window:focused', winId);

  // Update title bar visuals
  document.querySelectorAll('.win95-window').forEach(w => w.classList.add('unfocused'));
  state.windows[winId].el.classList.remove('unfocused');

  // Update taskbar
  document.querySelectorAll('.taskbar-window-btn').forEach(b => b.classList.remove('active'));
  const tbBtn = document.querySelector('.taskbar-window-btn[data-win-id="' + winId + '"]');
  if (tbBtn) tbBtn.classList.add('active');
}

// ===== DRAG =====
let dragData = null;
function startDrag(e, winId) {
  e.preventDefault();
  const w = state.windows[winId];
  if (!w || w.maximized) return;
  dragData = { winId, sx: e.clientX, sy: e.clientY, ox: w.x, oy: w.y };
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
}
function onDrag(e) {
  if (!dragData) return;
  const w = state.windows[dragData.winId];
  if (!w) return;
  const dx = e.clientX - dragData.sx;
  const dy = e.clientY - dragData.sy;
  w.x = dragData.ox + dx;
  w.y = Math.max(0, dragData.oy + dy); // prevent titlebar going off-screen top
  w.el.style.left = w.x + 'px';
  w.el.style.top = w.y + 'px';
}
function stopDrag() {
  if (!dragData) { dragData = null; return; }
  const w = state.windows[dragData.winId];
  // Snap to top → maximize with visual cue
  if (w && !w.maximized && w.y < 8) {
    // Brief flash to indicate snap
    w.el.style.transition = 'box-shadow 0.15s';
    w.el.style.boxShadow = '0 0 12px rgba(0,0,128,0.5), 2px 2px 6px rgba(0,0,0,0.3)';
    setTimeout(() => {
      w.el.style.boxShadow = '';
      w.el.style.transition = '';
    }, 180);
    toggleMaximizeWin(dragData.winId);
  }
  dragData = null;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

// ===== RESIZE =====
let resizeData = null;
function startResize(e, winId, dir) {
  e.preventDefault();
  e.stopPropagation();
  const w = state.windows[winId];
  if (!w || w.maximized) return;
  resizeData = { winId, dir, sx: e.clientX, sy: e.clientY, ow: w.w, oh: w.h, ox: w.x, oy: w.y };
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
}
function onResize(e) {
  if (!resizeData) return;
  const w = state.windows[resizeData.winId];
  if (!w) return;
  const d = resizeData;
  const dx = e.clientX - d.sx;
  const dy = e.clientY - d.sy;
  const dir = d.dir;

  let nw = d.ow, nh = d.oh, nx = d.ox, ny = d.oy;

  if (dir.includes('e')) { nw = Math.max(200, d.ow + dx); }
  if (dir.includes('w')) { nw = Math.max(200, d.ow - dx); nx = d.ox + dx; if (nw === 200) nx = d.ox + d.ow - 200; }
  if (dir.includes('s')) { nh = Math.max(100, d.oh + dy); }
  if (dir.includes('n')) { nh = Math.max(100, d.oh - dy); ny = d.oy + dy; if (nh === 100) ny = d.oy + d.oh - 100; }

  w.w = nw; w.h = nh; w.x = nx; w.y = ny;
  w.el.style.width = nw + 'px';
  w.el.style.height = nh + 'px';
  w.el.style.left = nx + 'px';
  w.el.style.top = ny + 'px';
}
function stopResize() {
  resizeData = null;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
}

// ===== MIN / MAX / CLOSE =====
function minimizeWindow(btn) {
  const winEl = btn.closest('.win95-window');
  const winId = winEl.dataset.winId;
  if (!winId || !state.windows[winId]) return;

  const w = state.windows[winId];

  // Animate toward taskbar button
  const tbBtn = document.querySelector('.taskbar-window-btn[data-win-id="' + winId + '"]');
  if (tbBtn) {
    const winRect = winEl.getBoundingClientRect();
    const tbRect = tbBtn.getBoundingClientRect();

    // Create an animated clone
    const clone = winEl.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.left = winRect.left + 'px';
    clone.style.top = winRect.top + 'px';
    clone.style.width = winRect.width + 'px';
    clone.style.height = winRect.height + 'px';
    clone.style.margin = '0';
    clone.classList.add('minimize-clone');
    clone.style.zIndex = '99999';
    clone.style.pointerEvents = 'none';
    document.body.appendChild(clone);

    // Trigger animation
    requestAnimationFrame(() => {
      clone.style.left = tbRect.left + 'px';
      clone.style.top = tbRect.top + 'px';
      clone.style.width = tbRect.width + 'px';
      clone.style.height = tbRect.height + 'px';
      clone.style.opacity = '0.4';
    });

    // Clean up after transition
    setTimeout(() => clone.remove(), 350);
  }

  // Hide the real window
  w.minimized = true;
  winEl.style.display = 'none';
  focusNextWindow(winId);
  updateTaskbarButton(winId);
}

function maximizeWindow(btn) {
  const winEl = btn.closest('.win95-window');
  const winId = winEl.dataset.winId;
  if (!winId || !state.windows[winId]) return;
  toggleMaximizeWin(winId);
}

function toggleMaximizeWin(winId) {
  const w = state.windows[winId];
  if (!w) return;
  const winEl = w.el;
  if (w.maximized) {
    // Restore
    w.maximized = false;
    winEl.classList.remove('maximized');
    winEl.style.left = w.x + 'px';
    winEl.style.top = w.y + 'px';
    winEl.style.width = w.w + 'px';
    winEl.style.height = w.h + 'px';
  } else {
    // Maximize — save current geometry first
    const rect = winEl.getBoundingClientRect();
    const layerRect = document.getElementById('window-layer').getBoundingClientRect();
    w.x = rect.left - layerRect.left;
    w.y = rect.top - layerRect.top;
    w.w = rect.width;
    w.h = rect.height;
    w.maximized = true;
    winEl.classList.add('maximized');
  }
}

function closeWindow(btn) {
  const winEl = btn.closest('.win95-window');
  const winId = winEl.dataset.winId;
  if (!winId || !state.windows[winId]) return;
  // Clean up app resources via registry
  const ctrl = appControllers[state.windows[winId].app];
  if (ctrl && ctrl.cleanup) ctrl.cleanup(winId);
  // Save app state before closing
  saveAppState(winId);
  winEl.remove();
  removeTaskbarButton(winId);
  const wasActive = state.activeWindowId === winId;
  delete state.windows[winId];
  if (wasActive) focusNextWindow(null);
}

function restoreWindow(winId) {
  const w = state.windows[winId];
  if (!w) return;
  w.minimized = false;
  w.el.style.display = '';
  focusWindow(winId);
  updateTaskbarButton(winId);
}

function focusNextWindow(skipId) {
  let found = null;
  for (const [id, w] of Object.entries(state.windows)) {
    if (id === skipId) continue;
    if (!w.minimized) found = id;
  }
  if (found) focusWindow(found);
  else state.activeWindowId = null;
}

// ===== TASKBAR BUTTONS =====
function addTaskbarButton(winId) {
  const w = state.windows[winId];
  const btn = document.createElement('button');
  btn.className = 'taskbar-window-btn';
  btn.dataset.winId = winId;
  btn.textContent = w.title;
  btn.addEventListener('click', () => {
    if (state.windows[winId]) {
      if (state.windows[winId].minimized) {
        restoreWindow(winId);
      } else if (state.activeWindowId === winId) {
        minimizeWindow(w.el.querySelector('.win-btn-min'));
      } else {
        focusWindow(winId);
      }
    }
    closeStartMenu();
    closeContextMenu();
  });
  document.getElementById('taskbar-windows').appendChild(btn);
}
function updateTaskbarButton(winId) {
  const btn = document.querySelector('.taskbar-window-btn[data-win-id="' + winId + '"]');
  if (!btn) return;
  const w = state.windows[winId];
  if (state.activeWindowId === winId && !w.minimized) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
}
function removeTaskbarButton(winId) {
  const btn = document.querySelector('.taskbar-window-btn[data-win-id="' + winId + '"]');
  if (btn) btn.remove();
}

// ===== SAVE APP STATE BEFORE CLOSE =====
function saveAppState(winId) {
  const w = state.windows[winId];
  if (!w) return;
  // Journal notes auto-save on editor blur/change — no explicit save needed
}

// ===== GLOBAL EVENT HANDLERS =====

// Desktop click — deselect icons, close menus
document.getElementById('desktop').addEventListener('click', (e) => {
  if (!e.target.closest('.desktop-icon')) {
    deselectAllIcons();
    closeStartMenu();
    closeContextMenu();
  }
});

// Desktop right-click — show context menu
document.getElementById('desktop').addEventListener('contextmenu', (e) => {
  showContextMenu(e);
});

// Desktop drag-select
document.getElementById('desktop').addEventListener('mousedown', (e) => {
  startDragSelect(e);
});
document.addEventListener('mousemove', (e) => {
  onDragSelect(e);
});
document.addEventListener('mouseup', () => {
  stopDragSelect();
});

// Close menus on outside click
document.addEventListener('click', (e) => {
  if (state.startMenuOpen && !e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
    closeStartMenu();
  }
  if (state.contextMenuOpen && !e.target.closest('#context-menu') && !e.target.closest('.desktop-icon')) {
    closeContextMenu();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (document.querySelector('.lockscreen-overlay')) {
    if (e.target && e.target.closest('.lock-pin-dialog')) {
      return;
    }
    e.preventDefault();
    return;
  }
  // Win+R or Alt+R — open Run dialog
  if ((e.metaKey && e.key === 'r') || (e.altKey && e.key === 'r')) {
    e.preventDefault();
    openApp('run');
    return;
  }

  // Win key — toggle Start menu
  if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Win') {
    e.preventDefault();
    toggleStartMenu();
    return;
  }

  // Alt+F4 — close active window
  if (e.altKey && e.key === 'F4') {
    e.preventDefault();
    if (state.activeWindowId && state.windows[state.activeWindowId]) {
      const w = state.windows[state.activeWindowId];
      const closeBtn = w.el.querySelector('.win-btn-close');
      if (closeBtn) closeWindow(closeBtn);
    }
  }

  // F5 — refresh desktop
  if (e.key === 'F5' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    refreshDesktop();
  }

  // Arrow keys — navigate desktop icons
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    navigateIcons('next');
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    navigateIcons('prev');
  }

  // Enter — open selected icon
  if (e.key === 'Enter') {
    e.preventDefault();
    openSelectedIcon();
  }

  // Escape — close context menu or deselect
  if (e.key === 'Escape') {
    closeContextMenu();
    closeStartMenu();
  }

  // Ctrl+S — save in Journal notes
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    const activeWin = state.activeWindowId ? state.windows[state.activeWindowId] : null;
    if (activeWin && activeWin.app === 'journal') {
      journalNotesAutoSave();
    }
  }
  // Ctrl+Esc — open Start menu
  if ((e.ctrlKey && e.key === 'Escape') || (e.ctrlKey && e.key === 'Esc')) {
    e.preventDefault();
    toggleStartMenu();
  }
});

// ===== SHOW DESKTOP =====
let showDesktopActive = false;
let showDesktopSaved = []; // { winId, wasMinimized }

function toggleShowDesktop() {
  if (showDesktopActive) {
    // Restore windows
    showDesktopSaved.forEach(({ winId }) => {
      if (state.windows[winId] && state.windows[winId].minimized) {
        restoreWindow(winId);
      }
    });
    showDesktopSaved = [];
    showDesktopActive = false;
  } else {
    // Minimize all visible windows
    showDesktopSaved = [];
    for (const [winId, w] of Object.entries(state.windows)) {
      if (!w.minimized) {
        showDesktopSaved.push({ winId, wasMinimized: false });
        // We need to trigger the minimize without the animation for speed
        w.minimized = true;
        w.el.style.display = 'none';
        updateTaskbarButton(winId);
      }
    }
    state.activeWindowId = null;
    showDesktopActive = true;
  }
  closeStartMenu();
  closeContextMenu();
}

// ===== SUBMENU TOGGLE =====
function toggleSubmenu(e, submenuId) {
  e.stopPropagation();
  const submenu = document.getElementById(submenuId);
  if (!submenu) return;
  // Close all other submenus first, except ancestor/parent submenus
  document.querySelectorAll('.start-submenu').forEach(sm => {
    if (sm.id !== submenuId && !sm.contains(submenu)) {
      sm.classList.add('hidden');
    }
  });
  submenu.classList.toggle('hidden');

  // Smart edge detection — shift menu to fit within screen
  if (!submenu.classList.contains('hidden')) {
    // Default position
    submenu.style.top = '-2px';
    submenu.style.bottom = 'auto';
    submenu.style.left = '100%';
    submenu.style.right = 'auto';
    
    let rect = submenu.getBoundingClientRect();
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;
    
    // Vertical: shift upward if overflowing bottom
    if (rect.bottom > viewH - 30) {
      const overflowY = rect.bottom - (viewH - 30);
      let newTop = -2 - overflowY;
      submenu.style.top = newTop + 'px';
      
      // Ensure it doesn't overflow top
      rect = submenu.getBoundingClientRect();
      if (rect.top < 0) {
        submenu.style.top = (newTop - rect.top) + 'px';
      }
    }
    
    // Horizontal: flip to left side if overflowing right
    rect = submenu.getBoundingClientRect();
    if (rect.right > viewW) {
      submenu.style.left = 'auto';
      submenu.style.right = '100%';
    }
  }
}

// ===== RECYCLE BIN ICON STATE =====
function updateRecycleBinIcon() {
  const full = recycleBinStore.count() > 0;
  const icon = document.querySelector('.desktop-icon[data-app="recyclebin"]');
  if (icon) {
    icon.dataset.full = full ? 'true' : 'false';
    const img = icon.querySelector('.desktop-icon-img');
    if (img) img.textContent = '🗑️';
  }
  window.dispatchEvent(
    new CustomEvent('winxp:recyclebin', { detail: { full } }),
  );
}

// ===== DATE/TIME DIALOG =====
function showDateTimeDialog() {
  // Check if already open
  if (document.querySelector('.datetime-overlay')) return;
  const tpl = document.getElementById('tpl-datetime-dialog');
  const clone = tpl.content.firstElementChild.cloneNode(true);
  document.body.appendChild(clone);
  renderDateTimeCalendar();
  updateDateTimeDisplay();
  // Update clock live
  const interval = setInterval(updateDateTimeDisplay, 1000);
  clone.dataset.intervalId = interval;
}

function closeDateTimeDialog() {
  const overlay = document.querySelector('.datetime-overlay');
  if (!overlay) return;
  const interval = parseInt(overlay.dataset.intervalId);
  if (interval) clearInterval(interval);
  overlay.remove();
}

function renderDateTimeCalendar() {
  const cal = document.querySelector('#datetime-calendar');
  if (!cal) return;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const months = MONTHS_FULL;
  const days = DAYS_MINI;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '<div class="dt-cal-header">';
  html += '<span>' + months[month] + ' ' + year + '</span>';
  html += '</div>';
  html += '<div class="dt-cal-grid">';
  days.forEach(d => html += '<div class="dt-cal-day-header">' + d + '</div>');
  for (let i = 0; i < firstDay; i++) html += '<div class="dt-cal-day" style="color:#ccc;"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    let cls = 'dt-cal-day';
    if (d === today) cls += ' today';
    html += '<div class="' + cls + '">' + d + '</div>';
  }
  html += '</div>';
  cal.innerHTML = html;
}

function updateDateTimeDisplay() {
  const timeEl = document.querySelector('#datetime-clock-time');
  const dateEl = document.querySelector('#datetime-clock-date');
  if (!timeEl || !dateEl) return;
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  timeEl.textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') + ' ' + ampm;
  const months = MONTHS_FULL;
  dateEl.textContent = months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
}

// ===== GRID SNAP (icon drag) =====
const GRID_SIZE = 76; // icon cell size in px
function snapToGrid(x, y) {
  const desktop = document.getElementById('desktop');
  const rect = desktop.getBoundingClientRect();
  const relX = x - rect.left;
  const relY = y - rect.top;
  const snappedX = Math.round(relX / GRID_SIZE) * GRID_SIZE;
  const snappedY = Math.round(relY / GRID_SIZE) * GRID_SIZE;
  return { x: snappedX + rect.left, y: snappedY + rect.top };
}

// ===== RUN DIALOG CONTROLLER =====
function runCheckKey(e, inputEl) {
  if (e.key === 'Enter') {
    const dialog = inputEl.closest('.win95-window');
    const btn = dialog.querySelector('.win95-button'); // OK button
    if (btn) runExecute(btn);
  }
}

function runExecute(btn) {
  const win = btn.closest('.win95-window');
  const input = win.querySelector('#run-input');
  if (!input) return;
  const cmd = input.value.trim().toLowerCase();
  if (!cmd) return;

  // Map commands to app names
  const commandMap = {
    'control': 'controlpanel',
    'control panel': 'controlpanel',
    'bible': 'bible',
    'mail': 'mail',
    'outlook': 'mail',
    'todo': 'todo',
    'tasks': 'todo',
    'kanban': 'kanban',
    'winban': 'kanban',
    'journal': 'journal',
    'notes': 'journal',
    'calendar': 'calendar',
    'diff': 'textdiff',
    'textdiff': 'textdiff',
    'clippy': 'clippy',
    'copilot': 'clippy',
    'recycle': 'recyclebin',
    'recyclebin': 'recyclebin',
    'help': 'help',
    'search': 'search',
    'lock': 'lock',
    'qrtx': 'qrtx',
    'qr': 'qrtx',
    'transmitter': 'qrtx'
  };

  const app = commandMap[cmd];
  if (app === 'lock') {
    closeWindow(btn);
    showLockScreen();
  } else if (app) {
    closeWindow(btn);
    openApp(app);
  } else {
    alert("Windows cannot find '" + input.value.trim() + "'.\n\nMake sure you typed the name correctly, and then try again.");
  }
}


// ===== TEMPLATE MANAGER SYSTEM (v2.0 Refactor) =====

const TemplateManager = {
  init(app, winId, el, config) {
    state.windows[winId].appState = {
      app,
      activeFolder: 'All',
      activeId: null,
      editing: false,
      varId: null,
      varData: {}
    };
    this._bindTemplateEvents(winId, el, config);
    this.renderFolders(winId);
    this.renderList(winId);
    this.showPlaceholder(winId);
    this.updateStatus(winId);
  },

  _bindTemplateEvents(winId, el, config) {
    const sidebar = el.querySelector(config.selectors.sidebar);
    const listPane = el.querySelector(config.selectors.list);
    if (sidebar && !sidebar.dataset.tmBound) {
      sidebar.dataset.tmBound = '1';
      sidebar.addEventListener('click', (e) => {
        const folderEl = e.target.closest('.mail-folder');
        if (!folderEl || !folderEl.dataset.folder) return;
        TemplateManager.selectFolder(winId, folderEl.dataset.folder);
      });
    }
    if (listPane && !listPane.dataset.tmBound) {
      listPane.dataset.tmBound = '1';
      listPane.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.mail-list-item');
        if (!itemEl || !itemEl.dataset.id) return;
        TemplateManager.selectItem(winId, itemEl.dataset.id);
      });
    }
  },

  getState(winIdOrEl) {
    const { state: tState, el, winId } = getAppStateAndEl(winIdOrEl);
    if (!tState || !tState.app) return null;
    const config = tState.app === 'mail' ? mailConfig : clippyConfig;
    return { tState, el, winId, app: tState.app, config };
  },

  getItems(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return [];
    return res.config.store.all() || [];
  },

  getItem(winIdOrEl, id) {
    const res = this.getState(winIdOrEl);
    if (!res) return null;
    return res.config.store.get(id);
  },

  getCount(winIdOrEl, folder) {
    const items = this.getItems(winIdOrEl);
    if (!folder || folder === 'All') return items.length;
    return items.filter(item => item.category === folder).length;
  },

  getFilteredItems(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return [];
    const { tState, el, config } = res;
    let items = config.store.all() || [];
    if (tState.activeFolder !== 'All') {
      items = items.filter(item => item.category === tState.activeFolder);
    }
    const searchEl = el.querySelector(config.selectors.search);
    if (searchEl) {
      const q = searchEl.value.toLowerCase().trim();
      if (q) {
        items = items.filter(item =>
          item.title.toLowerCase().includes(q) ||
          (item.subject && item.subject.toLowerCase().includes(q)) ||
          item.body.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
    }
    return items;
  },

  renderFolders(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    const sidebar = el.querySelector(config.selectors.sidebar);
    if (!sidebar) return;
    const cats = config.categories.get();
    let html = '';
    cats.forEach(cat => {
      const count = this.getCount(winId, cat);
      const active = tState.activeFolder === cat ? ' active' : '';
      const icon = config.categoryIcons[cat] || '📁';
      html += '<div class="mail-folder' + active + '" data-folder="' + escapeHtml(cat) + '">';
      html += '<span class="mail-folder-icon">' + icon + '</span>';
      html += cat;
      html += '<span class="mail-folder-count">' + count + '</span>';
      html += '</div>';
    });
    sidebar.innerHTML = html;
  },

  selectFolder(winIdOrEl, folder) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    tState.activeId = null;
    tState.editing = false;
    tState.activeFolder = folder;
    this.renderFolders(winId);
    this.renderList(winId);
    this.showPlaceholder(winId);
    const searchEl = el.querySelector(config.selectors.search);
    if (searchEl) searchEl.value = '';
    this.updateStatus(winId);
  },

  renderList(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    const pane = el.querySelector(config.selectors.list);
    if (!pane) return;
    const items = this.getFilteredItems(winId);
    if (items.length === 0) {
      pane.innerHTML = '<div class="mail-list-empty">No templates found.</div>';
      return;
    }
    let html = '';
    items.forEach(item => {
      const active = item.id === tState.activeId ? ' active' : '';
      html += '<div class="mail-list-item' + active + '" data-id="' + escapeHtml(item.id) + '">';
      html += '<div class="mail-list-item-subject">' + escapeHtml(item.title) + '</div>';
      html += '<div class="mail-list-item-meta">';
      html += '<span>' + item.category + '</span>';
      html += '<span>' + formatMailDate(item.updated) + '</span>';
      html += '</div></div>';
    });
    pane.innerHTML = html;
  },

  selectItem(winIdOrEl, id) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, winId } = res;
    tState.activeId = id;
    tState.editing = false;
    this.renderList(winId);
    this.renderPreview(winId);
  },

  renderPreview(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    const pane = el.querySelector(config.selectors.preview);
    if (!pane) return;
    const item = this.getItem(winId, tState.activeId);
    if (!item) {
      this.showPlaceholder(winId);
      return;
    }
    const vars = extractVariables((item.subject || '') + ' ' + item.body);
    if (config.customPreview) {
      config.customPreview(pane, item, vars);
    } else {
      pane.innerHTML =
        '<div class="mail-preview-content">' +
        '<span class="mail-preview-category">' + item.category + '</span>' +
        (item.subject ? '<div class="mail-preview-subject">' + escapeHtml(item.subject) + '</div>' : '') +
        '<div class="mail-preview-body">' + escapeHtml(item.body) + '</div>' +
        (vars.length > 0 ? '<div style="margin-top:8px;font-size:10px;color:#808080;">Variables: ' + vars.map(v => '[' + v + ']').join(', ') + '</div>' : '') +
        '</div>';
    }
  },

  showPlaceholder(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { el, config } = res;
    const pane = el.querySelector(config.selectors.preview);
    if (!pane) return;
    if (config.customPlaceholder) {
      config.customPlaceholder(pane);
    } else {
      pane.innerHTML = config.placeholders.preview;
    }
  },

  new(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    tState.activeId = null;
    tState.editing = true;
    this.renderList(winId);
    this.renderEditor(winId, null);
    el.querySelector(config.selectors.status).textContent = 'Creating new template...';
  },

  edit(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    if (!tState.activeId) return;
    const item = this.getItem(winId, tState.activeId);
    if (!item) return;
    tState.editing = true;
    this.renderEditor(winId, item);
    el.querySelector(config.selectors.status).textContent = 'Editing: ' + item.title;
  },

  renderEditor(winIdOrEl, item) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { el, config, winId } = res;
    const pane = el.querySelector(config.selectors.preview);
    if (!pane) return;
    if (config.customEditor) {
      config.customEditor(pane, item);
    } else {
      const cats = config.categories.get().filter(c => c !== 'All');
      const categoryOptions = cats.map(c => '<option value="' + c + '"' + (item && item.category === c ? ' selected' : '') + '>' + c + '</option>').join('');
      let html = '<div class="mail-editor-form">';
      html += '<label>Category</label>';
      html += '<select class="mail-editor-category-select" id="' + config.fields.category.id + '">';
      html += categoryOptions;
      html += '</select>';
      if (config.fields.subject) {
        html += '<label>Subject Line</label>';
        html += '<input class="win95-input" id="' + config.fields.subject.id + '" placeholder="' + config.fields.subject.placeholder + '" value="' + (item ? escapeHtml(item.subject) : '') + '">';
      }
      html += '<label>Template Title</label>';
      html += '<input class="win95-input" id="' + config.fields.title.id + '" placeholder="' + config.fields.title.placeholder + '" value="' + (item ? escapeHtml(item.title) : '') + '">';
      html += '<label>' + config.fields.body.label + ' <span style="font-weight:normal;color:#808080;">' + config.fields.body.note + '</span></label>';
      html += '<textarea class="' + config.fields.body.class + '" id="' + config.fields.body.id + '" placeholder="' + config.fields.body.placeholder + '">' + (item ? escapeHtml(item.body) : '') + '</textarea>';
      html += '<div class="mail-editor-buttons">';
      html += '<button class="win95-button" onclick="' + config.callbacks.save + '()" style="font-weight:bold;">💾 Save</button>';
      html += '<button class="win95-button" onclick="' + config.callbacks.cancelEdit + '()">Cancel</button>';
      html += '</div></div>';
      pane.innerHTML = html;
    }
  },

  save(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    const category = el.querySelector('#' + config.fields.category.id)?.value || 'Personal';
    const title = el.querySelector('#' + config.fields.title.id)?.value?.trim() || 'Untitled';
    const subject = config.fields.subject ? el.querySelector('#' + config.fields.subject.id)?.value?.trim() || '' : '';
    const body = el.querySelector('#' + config.fields.body.id)?.value?.trim() || '';
    const data = { category, title, body };
    if (config.fields.subject) data.subject = subject;
    
    if (tState.activeId) {
      config.store.update(tState.activeId, data);
    } else {
      const newItem = config.store.add(data);
      tState.activeId = newItem.id;
    }
    tState.editing = false;
    this.renderFolders(winId);
    this.renderList(winId);
    this.renderPreview(winId);
    el.querySelector(config.selectors.status).textContent = 'Saved: ' + title;
  },

  cancelEdit(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, winId } = res;
    tState.editing = false;
    if (tState.activeId) this.renderPreview(winId);
    else this.showPlaceholder(winId);
    this.renderList(winId);
    this.updateStatus(winId);
  },

  delete(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, config, winId } = res;
    if (!tState.activeId) return;
    const item = this.getItem(winId, tState.activeId);
    if (!item) return;
    if (!confirm('Delete template "' + item.title + '"?')) return;
    config.store.remove(tState.activeId);
    tState.activeId = null;
    this.renderFolders(winId);
    this.renderList(winId);
    this.showPlaceholder(winId);
    this.updateStatus(winId);
  },

  copy(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, config, winId } = res;
    if (tState.editing) {
      alert("Please save or cancel your changes before copying.");
      return;
    }
    if (!tState.activeId) return;
    const item = this.getItem(winId, tState.activeId);
    if (!item) return;
    const vars = extractVariables((item.subject || '') + ' ' + item.body);
    if (vars.length === 0) {
      this.doCopy(winId, item, {});
    } else {
      tState.varId = item.id;
      tState.varData = {};
      this.showVariableDialog(winId, vars);
    }
  },

  showVariableDialog(winIdOrEl, vars) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { el, config } = res;
    const pane = el.querySelector(config.selectors.preview);
    const tpl = document.getElementById(config.templates.variables);
    const clone = tpl.content.firstElementChild.cloneNode(true);
    pane.innerHTML = '';
    pane.appendChild(clone);
    const list = pane.querySelector(config.selectors.varList);
    let html = '';
    vars.forEach(v => {
      if (config.customVarItem) {
        html += config.customVarItem(v);
      } else {
        html += '<label>' + v + '</label>';
        html += '<input class="mail-var-input" data-var="' + v + '" placeholder="Enter ' + v + '...">';
      }
    });
    list.innerHTML = html;
  },

  varCancel(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, winId } = res;
    tState.varId = null;
    tState.varData = {};
    this.renderPreview(winId);
  },

  varCopy(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, winId } = res;
    if (!tState.varId) return;
    const item = this.getItem(winId, tState.varId);
    if (!item) return;
    const data = {};
    el.querySelectorAll(res.config.selectors.varInput).forEach(input => {
      data[input.dataset.var] = input.value || ('[' + input.dataset.var + ']');
    });
    this.doCopy(winId, item, data);
    tState.varId = null;
    tState.varData = {};
    this.renderPreview(winId);
  },

  doCopy(winIdOrEl, item, vars) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { el, config } = res;
    const text = config.formatCopyText(item, vars);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        el.querySelector(config.selectors.status).textContent = config.messages.copied;
      }).catch(() => { this.fallbackCopy(winId, text); });
    } else {
      this.fallbackCopy(winId, text);
    }
  },

  fallbackCopy(winIdOrEl, text) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { el, config } = res;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    el.querySelector(config.selectors.status).textContent = config.messages.copied;
  },

  updateStatus(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { el, config, winId } = res;
    el.querySelector(config.selectors.status).textContent = this.getCount(winId) + config.messages.countSuffix;
  }
};

function extractVariables(text) {
  const matches = text.match(/\[([^\]]+)\]/g);
  if (!matches) return [];
  const seen = new Set();
  return matches.map(m => m.slice(1, -1)).filter(v => {
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}

function formatMailDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  const min = m < 10 ? '0' + m : m;
  if (isToday) return 'Today ' + hr + ':' + min + ' ' + ampm;
  return MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate();
}


// ===== HELPERS =====

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  const min = m < 10 ? '0' + m : m;
  if (isToday) return 'Today ' + hr + ':' + min + ' ' + ampm;
  return MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate() + ' ' + hr + ':' + min + ' ' + ampm;
}
function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}
function findWinEl(app) {
  for (const [id, w] of Object.entries(state.windows)) {
    if (w.app === app && !w.minimized) return w.el;
  }
  return null;
}
function findWinElById(id) {
  return state.windows[id]?.el || null;
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


// ===== ABOUT WINDOWS & INIT =====

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

// ===== TASKBAR INTEGRATIONS =====
const flashState = {};
function startWindowFlash(winId) {
  stopWindowFlash(winId);
  const btn = document.querySelector('.taskbar-window-btn[data-win-id="' + winId + '"]');
  if (!btn) return;
  let visible = true;
  flashState[winId] = {
    interval: setInterval(() => {
      visible = !visible;
      btn.classList.toggle('pomodoro-flash', visible);
    }, 400),
    timeout: setTimeout(() => stopWindowFlash(winId), 8000)
  };
}
function stopWindowFlash(winId) {
  if (flashState[winId]) {
    clearInterval(flashState[winId].interval);
    clearTimeout(flashState[winId].timeout);
    delete flashState[winId];
  }
  const btn = document.querySelector('.taskbar-window-btn[data-win-id="' + winId + '"]');
  if (btn) btn.classList.remove('pomodoro-flash');
}
function updatePomodoroTaskbar(data) {
  const existing = document.querySelector('.taskbar-pomodoro');
  if (existing) existing.remove();
  if (!data) return;
  const tray = document.getElementById('taskbar-tray');
  const indicator = document.createElement('span');
  indicator.className = 'taskbar-pomodoro' + (data.isWork ? ' running' : ' break');
  const m = String(data.minutes).padStart(2, '0');
  const s = String(data.seconds).padStart(2, '0');
  indicator.textContent = (data.isWork ? '🍅' : '☕') + ' ' + m + ':' + s;
  indicator.title = data.isWork ? 'Focus session in progress' : 'Break in progress';
  indicator.onclick = function() {
    for (const [wid, w] of Object.entries(state.windows)) {
      if (w.app === 'pomodoro' && !w.minimized) { focusWindow(wid); return; }
    }
    openApp('pomodoro');
  };
  tray.insertBefore(indicator, tray.firstChild);
}

// ===== EMBEDDED APP BRIDGE =====
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

// Legacy aliases (internal app scripts)
const registerWin95Window = registerAppWindow;
const unregisterWin95Window = unregisterAppWindow;
const initWin95App = initEmbeddedApp;

function minimizeWindow() {}
function maximizeWindow() {}
function closeWindow() {}

if (typeof initFileDrop === 'function') initFileDrop();
if (typeof initAutoBackupOnExit === 'function') initAutoBackupOnExit();

// Bridge legacy shell events to the React Luna taskbar
shellEvents.on('pomodoro:update', data => {
  window.dispatchEvent(new CustomEvent('winxp:pomodoro', { detail: data }));
});
shellEvents.on('window:flash_start', winId => {
  window.dispatchEvent(
    new CustomEvent('winxp:window-flash-start', { detail: winId }),
  );
});
shellEvents.on('window:flash_stop', winId => {
  window.dispatchEvent(
    new CustomEvent('winxp:window-flash-stop', { detail: winId }),
  );
});
shellEvents.on('window:focused', winId => {
  window.dispatchEvent(
    new CustomEvent('winxp:window-flash-stop', { detail: winId }),
  );
});
shellEvents.on('store:recyclebin:changed', updateRecycleBinIcon);
updateRecycleBinIcon();

setInterval(() => {
  for (const [id, w] of Object.entries(state.windows)) {
    if (w.app === 'journal' && !w.minimized && typeof journalNotesAutoSave === 'function') {
      journalNotesAutoSave();
    }
  }
}, 5000);
