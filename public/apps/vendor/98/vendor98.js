// 98.js-derived helpers: icons, sounds, desktop chrome (used with permission)
const V98_BASE = (typeof process !== 'undefined' && process.env && process.env.PUBLIC_URL)
  ? process.env.PUBLIC_URL + '/apps/vendor/98/'
  : (typeof window !== 'undefined' && window.APPS_PUBLIC_BASE)
    ? window.APPS_PUBLIC_BASE + 'vendor/98/'
    : '/apps/vendor/98/';

const V98_APP_ICONS = {
  mycomputer: 'my-computer',
  bible: 'chm',
  calendar: 'favorites-folder',
  pomodoro: 'task',
  todo: 'notepad',
  kanban: 'folder-open',
  recyclebin: 'recycle-bin',
  mail: 'mail',
  journal: 'my-documents-folder',
  clippy: 'help',
  textdiff: 'find-file',
  qrtx: 'settings',
  controlpanel: 'start-settings',
  help: 'help',
  run: 'programs-folder',
};

const V98_PC_ICONS = {
  'drive-c': 'hard-disk-drive',
  backup: 'folder',
  restore: 'folder-open',
  printers: 'printers-folder',
  controlpanel: 'start-settings',
  recyclebin: 'recycle-bin',
  'folder-documents': 'my-documents-folder',
  'folder-mail': 'mail',
  'folder-calendar': 'favorites-folder',
  'folder-settings': 'settings',
  'folder-backups': 'folder',
  'shortcut-bible': 'chm',
  'shortcut-todo': 'notepad',
  'shortcut-kanban': 'folder-open',
  'shortcut-pomodoro': 'task',
  'shortcut-clippy': 'help',
  'shortcut-recyclebin': 'recycle-bin',
};

const V98_SOUNDS = {
  navigate: V98_BASE + 'audio/START.WAV',
  error: V98_BASE + 'audio/CHORD.WAV',
  notify: V98_BASE + 'audio/NOTIFY.WAV',
  recycle: V98_BASE + 'audio/RECYCLE.WAV',
  startup: V98_BASE + 'audio/The Microsoft Sound.wav',
  logoff: V98_BASE + 'audio/LOGOFF.WAV',
  ding: V98_BASE + 'audio/DING.WAV',
};

const _v98AudioCache = {};

function v98IconPath(iconId, size) {
  return V98_BASE + 'images/icons/' + iconId + '-' + size + 'x' + size + '.png';
}

function v98AppIconId(app) {
  return V98_APP_ICONS[app] || 'programs-folder';
}

function v98PcIconId(itemId) {
  return V98_PC_ICONS[itemId] || 'folder';
}

function v98IconImg(iconId, size, alt) {
  const img = document.createElement('img');
  img.src = v98IconPath(iconId, size);
  img.width = size;
  img.height = size;
  img.alt = alt || '';
  img.draggable = false;
  img.className = 'v98-icon-img';
  return img;
}

function v98PlaySound(name) {
  if (controlPanelStore && !controlPanelStore.get('systemSounds', true)) return;
  const src = V98_SOUNDS[name];
  if (!src) return;
  try {
    if (!_v98AudioCache[name]) _v98AudioCache[name] = new Audio(src);
    const audio = _v98AudioCache[name];
    audio.currentTime = 0;
    const p = audio.play();
    if (p && p.catch) p.catch(function() {});
  } catch (e) { /* autoplay policy */ }
}

function v98ApplyDesktopIcons() {
  document.querySelectorAll('.desktop-icon[data-app]').forEach(function(icon) {
    const app = icon.dataset.app;
    let iconId = v98AppIconId(app);
    if (app === 'recyclebin' && typeof recycleBinStore !== 'undefined' && recycleBinStore.count() > 0) {
      iconId = 'recycle-bin-full';
    }
    let wrap = icon.querySelector('.desktop-icon-img');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'desktop-icon-img';
      icon.insertBefore(wrap, icon.firstChild);
    }
    wrap.innerHTML = '';
    wrap.appendChild(v98IconImg(iconId, 32, icon.querySelector('span')?.textContent || app));
    icon.classList.add('v98-desktop-icon');
  });
}

function v98InitDesktopChrome() {
  v98ApplyDesktopIcons();
  if (typeof shellEvents !== 'undefined') {
    shellEvents.on('store:recyclebin:changed', v98ApplyDesktopIcons);
  }
}