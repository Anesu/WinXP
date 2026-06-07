// ===== MY COMPUTER — Explorer, backup/restore, properties =====

function isBackupFile(name) {
  const lower = (name || '').toLowerCase();
  return lower.endsWith('.winxp') || lower.endsWith('.win95');
}

const PC_ROOT_ITEMS = [
  { id: 'drive-c', type: 'drive', label: '(C:)', icon: '💾', desc: 'Local Disk' },
  { id: 'backup', type: 'action', action: 'backup', label: 'Backup to PC', icon: '📤', desc: 'Save all data to a .winxp file' },
  { id: 'restore', type: 'action', action: 'restore', label: 'Restore from PC', icon: '📥', desc: 'Load data from a .winxp or .win95 file' },
  { id: 'printers', type: 'action', action: 'printers', label: 'Printers', icon: '🖨️', desc: 'Installed printers' },
  { id: 'controlpanel', type: 'app', app: 'controlpanel', label: 'Control Panel', icon: '⚙️', desc: 'System settings' },
  { id: 'recyclebin', type: 'app', app: 'recyclebin', label: 'Recycle Bin', icon: '🗑️', desc: 'Deleted items' },
];

const PC_DRIVE_ITEMS = [
  { id: 'folder-documents', type: 'app', app: 'journal', label: 'Documents', icon: '📓', desc: 'Notepad notes' },
  { id: 'folder-mail', type: 'app', app: 'mail', label: 'Outlook Express', icon: '✉️', desc: 'Email templates' },
  { id: 'folder-calendar', type: 'app', app: 'calendar', label: 'Calendar', icon: '📅', desc: 'Events and schedule' },
  { id: 'folder-settings', type: 'app', app: 'controlpanel', label: 'Settings', icon: '⚙️', desc: 'Control Panel' },
  { id: 'folder-backups', type: 'folder', folder: 'backups', label: 'Backups', icon: '📁', desc: 'Backup and restore' },
  { id: 'shortcut-bible', type: 'app', app: 'bible', label: 'Bible', icon: '📖', desc: 'Shortcut to Bible' },
  { id: 'shortcut-todo', type: 'app', app: 'todo', label: 'Todo Tasks', icon: '✅', desc: 'Shortcut to Todo' },
  { id: 'shortcut-kanban', type: 'app', app: 'kanban', label: 'Kanban Board', icon: '📊', desc: 'Shortcut to Kanban' },
  { id: 'shortcut-pomodoro', type: 'app', app: 'pomodoro', label: 'Pomodoro', icon: '⏱️', desc: 'Shortcut to Pomodoro' },
  { id: 'shortcut-clippy', type: 'app', app: 'clippy', label: 'Office Assistant', icon: '📎', desc: 'Shortcut to Office Assistant' },
  { id: 'shortcut-recyclebin', type: 'app', app: 'recyclebin', label: 'Recycle Bin', icon: '🗑️', desc: 'Deleted items' },
];

const PC_BACKUP_ITEMS = [
  { id: 'backup', type: 'action', action: 'backup', label: 'Backup to PC', icon: '📤', desc: 'Download .winxp backup' },
  { id: 'restore', type: 'action', action: 'restore', label: 'Restore from PC', icon: '📥', desc: 'Load .winxp or .win95 backup' },
];

const PC_INSTALLED_APPS = [
  'bible', 'calendar', 'pomodoro', 'todo', 'kanban', 'mail', 'journal',
  'clippy', 'textdiff', 'qrtx', 'controlpanel', 'recyclebin', 'help',
];

function pcDefaultState() {
  return {
    path: 'root',
    selectedId: null,
    viewMode: 'icons',
    pendingRestore: null,
    historyBack: [],
    historyForward: [],
  };
}

function pcItemIconId(item) {
  if (item.app && typeof v98AppIconId === 'function') return v98AppIconId(item.app);
  return typeof v98PcIconId === 'function' ? v98PcIconId(item.id) : 'folder';
}

function pcIconHtml(item, size) {
  const iconId = pcItemIconId(item);
  const src = v98IconPath(iconId, size);
  return '<img class="v98-icon-img" src="' + src + '" width="' + size + '" height="' + size + '" alt="" draggable="false">';
}

function pcGetItems(path) {
  if (path === 'root') return PC_ROOT_ITEMS;
  if (path === 'drive-c') return PC_DRIVE_ITEMS;
  if (path === 'backups') return PC_BACKUP_ITEMS;
  return [];
}

function pcGetPathLabel(path) {
  if (path === 'root') return 'My Computer';
  if (path === 'drive-c') return 'Local Disk (C:)';
  if (path === 'backups') return 'Backups';
  return 'My Computer';
}

function pcGetWinState(winId) {
  const win = state.windows[winId];
  if (!win) return null;
  if (!win.appState) win.appState = pcDefaultState();
  return win.appState;
}

function initMyComputerApp(winId, el) {
  const pcState = pcGetWinState(winId);
  Object.assign(pcState, pcDefaultState(), pcState);

  const restoreInput = el.querySelector('.pc-restore-input');
  if (restoreInput) {
    restoreInput.addEventListener('change', (e) => pcRestore(e, winId));
  }

  const content = el.querySelector('.mycomputer-content');
  if (content) {
    content.addEventListener('click', (e) => pcOnContentClick(e, winId));
    content.addEventListener('dblclick', (e) => pcOnContentDblClick(e, winId));
    content.addEventListener('contextmenu', (e) => pcOnContextMenu(e, winId));
  }

  const body = el.querySelector('.win-body');
  if (body) {
    body.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      body.classList.add('pc-drop-active');
    });
    body.addEventListener('dragleave', (e) => {
      if (!body.contains(e.relatedTarget)) body.classList.remove('pc-drop-active');
    });
    body.addEventListener('drop', (e) => pcOnDrop(e, winId));
  }

  el.querySelector('.pc-tb-back')?.addEventListener('click', () => pcGoBack(winId));
  el.querySelector('.pc-tb-forward')?.addEventListener('click', () => pcGoForward(winId));
  el.querySelector('.pc-tb-up')?.addEventListener('click', () => pcNavigateUp(winId));
  el.querySelector('.pc-tb-view')?.addEventListener('click', () => {
    const pcState = pcGetWinState(winId);
    pcSetViewMode(winId, pcState.viewMode === 'list' ? 'icons' : 'list');
  });

  renderMyComputer(winId);
}

function pcNavigateTo(winId, path, action) {
  const pcState = pcGetWinState(winId);
  if (!pcState) return;
  if (path !== pcState.path) {
    if (action !== 'back' && action !== 'forward') {
      pcState.historyBack.push(pcState.path);
      pcState.historyForward = [];
    }
    pcState.path = path;
    pcState.selectedId = null;
    if (action !== 'initial' && typeof v98PlaySound === 'function') v98PlaySound('navigate');
  }
  renderMyComputer(winId);
}

function pcGoBack(winId) {
  const pcState = pcGetWinState(winId);
  if (!pcState.historyBack.length) return;
  pcState.historyForward.unshift(pcState.path);
  const prev = pcState.historyBack.pop();
  pcNavigateTo(winId, prev, 'back');
}

function pcGoForward(winId) {
  const pcState = pcGetWinState(winId);
  if (!pcState.historyForward.length) return;
  pcState.historyBack.push(pcState.path);
  const next = pcState.historyForward.shift();
  pcNavigateTo(winId, next, 'forward');
}

function pcUpdateToolbar(winId) {
  const win = state.windows[winId];
  if (!win) return;
  const pcState = pcGetWinState(winId);
  const back = win.el.querySelector('.pc-tb-back');
  const forward = win.el.querySelector('.pc-tb-forward');
  const up = win.el.querySelector('.pc-tb-up');
  if (back) back.disabled = pcState.historyBack.length === 0;
  if (forward) forward.disabled = pcState.historyForward.length === 0;
  if (up) up.disabled = pcState.path === 'root';
  const addrIcon = win.el.querySelector('.pc-address-icon');
  if (addrIcon) {
    const iconId = pcState.path === 'root' ? 'my-computer' : pcState.path === 'drive-c' ? 'hard-disk-drive' : 'folder-open';
    addrIcon.src = v98IconPath(iconId, 16);
  }
}

function renderMyComputer(winId) {
  const win = state.windows[winId];
  if (!win) return;
  const pcState = pcGetWinState(winId);
  const el = win.el;
  const items = pcGetItems(pcState.path);
  const content = el.querySelector('.mycomputer-content');
  const statusEl = el.querySelector('.win-statusbar');
  const addressEl = el.querySelector('.pc-address-path');
  const titleEl = el.querySelector('.win-title');

  if (addressEl) addressEl.textContent = pcGetPathLabel(pcState.path);
  if (titleEl) titleEl.textContent = pcState.path === 'root' ? 'My Computer' : pcGetPathLabel(pcState.path);

  content.classList.toggle('pc-view-list', pcState.viewMode === 'list');
  content.classList.toggle('pc-view-icons', pcState.viewMode !== 'list');

  let html = '';
  if (pcState.viewMode === 'list') {
    html += '<div class="pc-list-header"><span>Name</span><span>Type</span><span>Details</span></div>';
    items.forEach(item => {
      const sel = item.id === pcState.selectedId ? ' selected' : '';
      html += '<div class="pc-list-row' + sel + '" data-pc-id="' + item.id + '">';
      html += '<span class="pc-list-name"><span class="pc-list-icon">' + pcIconHtml(item, 16) + '</span> ' + escapeHtml(item.label) + '</span>';
      html += '<span class="pc-list-type">' + escapeHtml(pcItemTypeLabel(item)) + '</span>';
      html += '<span class="pc-list-desc">' + escapeHtml(item.desc || '') + '</span>';
      html += '</div>';
    });
  } else {
    items.forEach(item => {
      const sel = item.id === pcState.selectedId ? ' selected' : '';
      html += '<div class="mycomputer-icon' + sel + '" data-pc-id="' + item.id + '">';
      html += '<div class="v98-pc-icon">' + pcIconHtml(item, 32) + '</div>';
      html += escapeHtml(item.label);
      if (item.desc) html += '<div class="mycomputer-icon-desc">' + escapeHtml(item.desc) + '</div>';
      html += '</div>';
    });
  }
  content.innerHTML = html;

  pcApplySelection(content, pcState.selectedId);
  pcUpdateStatusBar(winId);
  pcUpdateToolbar(winId);
}

function pcApplySelection(content, selectedId) {
  if (!content) return;
  content.querySelectorAll('[data-pc-id]').forEach(el => {
    el.classList.toggle('selected', el.dataset.pcId === selectedId);
  });
}

function pcUpdateStatusBar(winId) {
  const win = state.windows[winId];
  if (!win) return;
  const pcState = pcGetWinState(winId);
  const statusEl = win.el.querySelector('.win-statusbar');
  const count = pcGetItems(pcState.path).length;
  const selLabel = pcState.selectedId ? ' — 1 object selected' : '';
  if (statusEl) statusEl.textContent = count + ' object(s)' + selLabel;
}

function pcItemTypeLabel(item) {
  if (item.type === 'drive') return 'Local Disk';
  if (item.type === 'folder') return 'File Folder';
  if (item.type === 'app') return 'Shortcut';
  if (item.type === 'action') return 'System Tool';
  return 'Object';
}

function pcFindItem(id, path) {
  return pcGetItems(path).find(i => i.id === id) || null;
}

function pcOnContentClick(e, winId) {
  const row = e.target.closest('[data-pc-id]');
  const pcState = pcGetWinState(winId);
  const content = e.currentTarget;
  if (!row) {
    pcState.selectedId = null;
    pcApplySelection(content, null);
    pcUpdateStatusBar(winId);
    return;
  }
  pcState.selectedId = row.dataset.pcId;
  pcApplySelection(content, pcState.selectedId);
  pcUpdateStatusBar(winId);
}

function pcOnContentDblClick(e, winId) {
  const row = e.target.closest('[data-pc-id]');
  if (!row) return;
  e.preventDefault();
  pcOpenItem(winId, row.dataset.pcId);
}

function pcHandleAction(action, event) {
  const { winId } = getAppStateAndEl(event);
  if (!winId) return;
  if (action === 'backup') pcBackup(winId);
  else if (action === 'restore') pcRestoreClick(winId);
  else if (action === 'view-icons') {
    const pcState = pcGetWinState(winId);
    pcSetViewMode(winId, pcState.viewMode === 'list' ? 'icons' : 'list');
  }
  else if (action === 'view-list') pcSetViewMode(winId, 'list');
  else if (action === 'help') pcOpenHelp();
  else if (action === 'up') pcNavigateUp(winId);
}

function pcOpenItem(winId, itemId) {
  const pcState = pcGetWinState(winId);
  const item = pcFindItem(itemId, pcState.path);
  if (!item) return;

  if (item.type === 'drive') {
    pcNavigateTo(winId, 'drive-c', 'open');
    return;
  }
  if (item.type === 'folder') {
    pcNavigateTo(winId, item.folder, 'open');
    return;
  }
  if (item.type === 'app' && item.app) {
    openApp(item.app);
    pcSetStatus(winId, 'Opened ' + item.label);
    return;
  }
  if (item.type === 'action') {
    if (item.action === 'backup') pcBackup(winId);
    else if (item.action === 'restore') pcRestoreClick(winId);
    else if (item.action === 'printers') pcShowPrinters(winId);
  }
}

function pcNavigateUp(winId) {
  const pcState = pcGetWinState(winId);
  let next = pcState.path;
  if (pcState.path === 'backups') next = 'drive-c';
  else if (pcState.path === 'drive-c') next = 'root';
  else return;
  pcNavigateTo(winId, next, 'up');
}

function pcSetViewMode(winId, mode) {
  const pcState = pcGetWinState(winId);
  pcState.viewMode = mode;
  renderMyComputer(winId);
}

function pcSetStatus(winId, text) {
  const win = state.windows[winId];
  if (!win) return;
  const statusEl = win.el.querySelector('.win-statusbar');
  if (statusEl) statusEl.textContent = text;
}

function pcShowProgress(winId, pct, label) {
  const win = state.windows[winId];
  if (!win) return;
  let bar = win.el.querySelector('.pc-progress');
  if (!bar) {
    const body = win.el.querySelector('.win-body');
    bar = document.createElement('div');
    bar.className = 'pc-progress';
    bar.innerHTML = '<div class="pc-progress-label"></div><div class="pc-progress-track"><div class="pc-progress-fill"></div></div>';
    body.insertBefore(bar, body.querySelector('.win-content'));
  }
  bar.querySelector('.pc-progress-label').textContent = label || 'Working...';
  bar.querySelector('.pc-progress-fill').style.width = Math.min(100, pct) + '%';
  bar.classList.remove('hidden');
}

function pcHideProgress(winId) {
  const win = state.windows[winId];
  if (!win) return;
  const bar = win.el.querySelector('.pc-progress');
  if (bar) bar.classList.add('hidden');
}

function pcBackup(winId) {
  if (!winId) {
    const winEl = findWinEl('mycomputer');
    winId = winEl && winEl.dataset.winId;
  }
  const id = winId;
  if (id) pcShowProgress(id, 10, 'Preparing backup...');

  setTimeout(() => {
    if (id) pcShowProgress(id, 40, 'Serializing filesystem...');
    const data = filesystem.exportJSON();
    if (id) pcShowProgress(id, 70, 'Writing backup file...');

    const now = new Date();
    const ts = fmtDate(now) + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    const fileName = 'winxp-backup-' + ts + '.winxp';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    filesystem.recordBackup({ fileName, type: 'manual' });
    if (id) {
      pcShowProgress(id, 100, 'Backup complete');
      setTimeout(() => pcHideProgress(id), 600);
      pcSetStatus(id, 'Backup saved: ' + fileName);
    }
  }, 80);
}

function pcRestoreClick(winId) {
  if (!winId) {
    const winEl = findWinEl('mycomputer');
    winId = winEl && winEl.dataset.winId;
  }
  if (!winId || !state.windows[winId]) return;
  const input = state.windows[winId].el.querySelector('.pc-restore-input');
  if (input) input.click();
}

function pcRestore(e, winId) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const preview = filesystem.getBackupPreview(ev.target.result);
      pcShowRestoreDialog(winId, file.name, ev.target.result, preview);
    } catch (err) {
      alert('Invalid backup file. Please select a valid .winxp or .win95 backup file.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function pcShowRestoreDialog(winId, fileName, jsonString, preview) {
  const win = state.windows[winId];
  if (!win) return;
  const existing = win.el.querySelector('.pc-restore-dialog');
  if (existing) existing.remove();

  const exported = preview.exportedAt ? new Date(preview.exportedAt).toLocaleString() : 'Unknown';
  let domainHtml = '';
  preview.domains.forEach(d => {
    domainHtml += '<label class="pc-restore-domain"><input type="checkbox" data-domain="' + d.id + '" checked> ';
    domainHtml += escapeHtml(d.label) + ' (' + d.count + ')</label>';
  });

  let warnHtml = '';
  if (preview.warnings && preview.warnings.length) {
    warnHtml = '<div class="pc-restore-warn">' + preview.warnings.map(w => escapeHtml(w)).join('<br>') + '</div>';
  }

  const dlg = document.createElement('div');
  dlg.className = 'pc-restore-dialog';
  dlg.innerHTML =
    '<div class="pc-dialog-panel">' +
      '<div class="pc-dialog-title">Restore from Backup</div>' +
      '<div class="pc-dialog-body">' +
        '<p><b>File:</b> ' + escapeHtml(fileName) + '</p>' +
        '<p><b>Size:</b> ' + escapeHtml(preview.fileSizeLabel) + ' &nbsp; <b>Schema:</b> v' + preview.schemaVersion + '</p>' +
        '<p><b>Exported:</b> ' + escapeHtml(exported) + '</p>' +
        warnHtml +
        '<div class="pc-restore-options">' +
          '<label><input type="radio" name="pc-restore-mode-' + winId + '" value="all" checked> Replace all data (full restore)</label>' +
          '<label><input type="radio" name="pc-restore-mode-' + winId + '" value="selective"> Selective restore</label>' +
        '</div>' +
        '<div class="pc-restore-domains hidden">' + domainHtml + '</div>' +
      '</div>' +
      '<div class="pc-dialog-btns">' +
        '<button class="win95-button pc-dialog-cancel">Cancel</button>' +
        '<button class="win95-button pc-dialog-ok" style="font-weight:bold;">Restore</button>' +
      '</div>' +
    '</div>';

  dlg.querySelector('.pc-dialog-cancel').onclick = () => dlg.remove();
  dlg.querySelectorAll('input[name="pc-restore-mode-' + winId + '"]').forEach(r => {
    r.onchange = () => {
      const selective = dlg.querySelector('input[value="selective"]').checked;
      dlg.querySelector('.pc-restore-domains').classList.toggle('hidden', !selective);
    };
  });
  dlg.querySelector('.pc-dialog-ok').onclick = () => {
    const selective = dlg.querySelector('input[value="selective"]').checked;
    let domains = ['all'];
    if (selective) {
      domains = [];
      dlg.querySelectorAll('.pc-restore-domain input:checked').forEach(cb => {
        domains.push(cb.dataset.domain);
      });
      if (!domains.length) {
        alert('Select at least one domain to restore.');
        return;
      }
    }
    if (!confirm('Restore from "' + fileName + '"? Current data for selected areas will be replaced.')) return;
    try {
      pcShowProgress(winId, 30, 'Restoring data...');
      const result = filesystem.importJSON(jsonString, { domains });
      dlg.remove();
      shellEvents.emit('store:recyclebin:changed');
      pcShowProgress(winId, 100, 'Restore complete');
      let msg = 'Restore complete!';
      if (result.warnings && result.warnings.length) msg += ' ' + result.warnings.join(' ');
      pcSetStatus(winId, msg + ' Reloading...');
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      pcHideProgress(winId);
      alert('Restore failed: ' + (err.message || 'Invalid backup file'));
    }
  };

  win.el.querySelector('.win-body').appendChild(dlg);
}

function pcOnDrop(e, winId) {
  e.preventDefault();
  e.stopPropagation();
  const win = state.windows[winId];
  if (win) win.el.querySelector('.win-body').classList.remove('pc-drop-active');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  if (!isBackupFile(file.name)) {
    alert('Only .winxp or .win95 backup files are accepted.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const preview = filesystem.getBackupPreview(ev.target.result);
      pcShowRestoreDialog(winId, file.name, ev.target.result, preview);
    } catch (err) {
      alert('Invalid backup file.');
    }
  };
  reader.readAsText(file);
}

function pcOnContextMenu(e, winId) {
  const row = e.target.closest('[data-pc-id]');
  if (!row) return;
  e.preventDefault();
  const pcState = pcGetWinState(winId);
  const itemId = row.dataset.pcId;
  pcState.selectedId = itemId;
  renderMyComputer(winId);

  const item = pcFindItem(itemId, pcState.path);
  if (!item) return;

  closeContextMenu();
  const menu = document.getElementById('pc-context-menu');
  if (!menu) return;

  menu.innerHTML = '';
  const addItem = (label, fn, disabled) => {
    const div = document.createElement('div');
    div.className = 'context-menu-item' + (disabled ? ' disabled' : '');
    div.textContent = label;
    if (!disabled) div.onclick = () => { menu.classList.add('hidden'); fn(); };
    menu.appendChild(div);
  };

  if (item.type === 'drive') {
    addItem('Open', () => pcOpenItem(winId, itemId));
    addItem('Properties', () => pcShowDriveProperties(winId));
  } else if (item.type === 'app' && item.app) {
    addItem('Open', () => pcOpenItem(winId, itemId));
    addItem('Send to Desktop', () => pcSendToDesktop(item.app, winId));
  } else if (item.type === 'folder' || item.type === 'action') {
    addItem('Open', () => pcOpenItem(winId, itemId));
  }

  menu.classList.remove('hidden');
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (e.clientX - rect.width) + 'px';
  if (rect.bottom > window.innerHeight - 28) menu.style.top = (e.clientY - rect.height) + 'px';
}

function pcShowDriveProperties(winId) {
  const win = state.windows[winId];
  if (!win) return;
  const existing = win.el.querySelector('.pc-properties-dialog');
  if (existing) existing.remove();

  const stats = filesystem.getStorageStats();
  const lastBackup = stats.lastBackupAt ? new Date(stats.lastBackupAt).toLocaleString() : 'Never';
  const usedLabel = stats.totalBytes < 1024 ? stats.totalBytes + ' B' :
    stats.totalBytes < 1048576 ? (stats.totalBytes / 1024).toFixed(1) + ' KB' :
    (stats.totalBytes / 1048576).toFixed(1) + ' MB';

  const autoBackup = controlPanelStore.get('autoBackupOnExit', false);

  const dlg = document.createElement('div');
  dlg.className = 'pc-properties-dialog';
  dlg.innerHTML =
    '<div class="pc-dialog-panel">' +
      '<div class="pc-dialog-title">(C:) Properties</div>' +
      '<div class="pc-dialog-body pc-props-body">' +
        '<div class="pc-props-row"><span class="pc-props-icon">💾</span><div><b>Local Disk (C:)</b><br>WinXP Virtual Filesystem</div></div>' +
        '<hr>' +
        '<p><b>Used space:</b> ' + escapeHtml(usedLabel) + '</p>' +
        '<p><b>Notes:</b> ' + stats.notes + ' &nbsp; <b>Outlook Express:</b> ' + stats.mails + ' &nbsp; <b>Events:</b> ' + stats.events + '</p>' +
        '<p><b>Todos:</b> ' + stats.todos + ' &nbsp; <b>Bible bookmarks:</b> ' + stats.bibleBookmarks + '</p>' +
        '<p><b>Bible cache:</b> ' + stats.bibleCacheEntries + ' entries &nbsp; <b>Recycle Bin:</b> ' + stats.recycleBin + '</p>' +
        '<p><b>Last backup:</b> ' + escapeHtml(lastBackup) + '</p>' +
        '<p><b>Installed programs:</b></p>' +
        '<div class="pc-props-apps">' + PC_INSTALLED_APPS.map(a => escapeHtml(getAppTitle(a))).join(', ') + '</div>' +
        '<label class="pc-auto-backup"><input type="checkbox" class="pc-auto-backup-cb"' + (autoBackup ? ' checked' : '') + '> Auto-backup on exit (saved locally)</label>' +
      '</div>' +
      '<div class="pc-dialog-btns">' +
        '<button class="win95-button pc-dialog-ok" style="font-weight:bold;width:75px;">OK</button>' +
      '</div>' +
    '</div>';

  dlg.querySelector('.pc-dialog-ok').onclick = () => {
    const cb = dlg.querySelector('.pc-auto-backup-cb');
    controlPanelStore.set('autoBackupOnExit', cb.checked);
    dlg.remove();
  };
  win.el.querySelector('.win-body').appendChild(dlg);
}

function pcShowPrinters(winId) {
  const win = state.windows[winId];
  if (!win) return;
  const dlg = document.createElement('div');
  dlg.className = 'pc-printers-dialog';
  dlg.innerHTML =
    '<div class="pc-dialog-panel">' +
      '<div class="pc-dialog-title">Printers</div>' +
      '<div class="pc-dialog-body" style="text-align:center;padding:20px;">' +
        '<div style="font-size:40px;">🖨️</div>' +
        '<p>No printers are installed.</p>' +
        '<p style="font-size:10px;color:#808080;">Connect a printer via Control Panel when hardware support is added.</p>' +
      '</div>' +
      '<div class="pc-dialog-btns"><button class="win95-button pc-dialog-ok" style="font-weight:bold;">OK</button></div>' +
    '</div>';
  dlg.querySelector('.pc-dialog-ok').onclick = () => dlg.remove();
  win.el.querySelector('.win-body').appendChild(dlg);
  pcSetStatus(winId, '0 printer(s) installed');
}

function pcOpenHelp() {
  openApp('help');
  setTimeout(() => {
    const helpWin = findWinEl('help');
    if (!helpWin) return;
    const section = helpWin.querySelector('#help-backup-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 200);
}

function pcSendToDesktop(app, winId) {
  const icon = document.querySelector('.desktop-icon[data-app="' + app + '"]');
  if (!icon) {
    alert('No desktop shortcut available for this item.');
    return;
  }
  const offsets = iconStore.all();
  const used = Object.values(offsets);
  let x = 0, y = 0;
  const step = typeof GRID_SIZE !== 'undefined' ? GRID_SIZE : 32;
  for (let row = 0; row < 20; row++) {
    let found = false;
    for (let col = 0; col < 8; col++) {
      x = col * step;
      y = row * step;
      if (!used.some(p => p.x === x && p.y === y)) { found = true; break; }
    }
    if (found) break;
  }
  iconStore.set(app, x, y);
  icon.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  selectIcon(icon);
  pcSetStatus(winId, 'Shortcut sent to desktop: ' + getAppTitle(app));
}

// Desktop drop (keep existing behavior, route through restore dialog)
function initFileDrop() {
  const desktop = document.getElementById('desktop');
  if (!desktop) return;
  desktop.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
  desktop.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!isBackupFile(file.name)) {
      alert('Only .winxp or .win95 backup files are accepted. Drop onto My Computer, or use Restore from PC.');
      return;
    }
    openApp('mycomputer');
    setTimeout(() => {
      const winEl = findWinEl('mycomputer');
      if (!winEl) return;
      const winId = winEl.dataset.winId;
      const reader = new FileReader();
      reader.onload = function(ev) {
        try {
          const preview = filesystem.getBackupPreview(ev.target.result);
          pcShowRestoreDialog(winId, file.name, ev.target.result, preview);
        } catch (err) {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    }, 300);
  });
}

function initAutoBackupOnExit() {
  window.addEventListener('beforeunload', () => {
    if (controlPanelStore.get('autoBackupOnExit', false)) {
      filesystem.saveAutoBackup();
    }
  });
}

document.addEventListener('mousedown', (e) => {
  const menu = document.getElementById('pc-context-menu');
  if (!menu || menu.classList.contains('hidden')) return;
  if (!e.target.closest('#pc-context-menu') && !e.target.closest('.mycomputer-content')) {
    menu.classList.add('hidden');
  }
});

initFileDrop();
initAutoBackupOnExit();