// Backup / restore filesystem API.
const BACKUP_SCHEMA_VERSION = 2;

const RESTORE_DOMAINS = [
  { id: 'journal',   label: 'Notepad' },
  { id: 'mail',      label: 'Outlook Express' },
  { id: 'calendar',  label: 'Calendar' },
  { id: 'todo',      label: 'Todo Tasks' },
  { id: 'bible',     label: 'Bible Bookmarks' },
  { id: 'bibleCache', label: 'Bible Verse Cache' },
  { id: 'pomodoro',  label: 'Pomodoro Sessions' },
  { id: 'clippy',    label: 'Office Assistant' },
  { id: 'stickies',  label: 'Stickies' },
  { id: 'recyclebin', label: 'Recycle Bin' },
  { id: 'icons',     label: 'Desktop Icon Positions' },
  { id: 'controlpanel', label: 'Control Panel Settings' },
];

function parseBackupJSON(jsonString) {
  const data = JSON.parse(jsonString);
  if (typeof data !== 'object' || data === null) throw new Error('Invalid backup data');

  // Legacy v1: raw filesystem object
  if (!('schemaVersion' in data) && ('todos' in data || 'notes' in data || 'mails' in data)) {
    return {
      schemaVersion: 1,
      exportedAt: null,
      fs: data,
      bibleCache: data.bibleCache || null,
      warnings: ['Legacy backup (v1). Bible cache may be incomplete.'],
    };
  }

  if (data.schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new Error('Backup was created by a newer version. Please update WinXP.');
  }

  const warnings = [];
  if (!data.fs || typeof data.fs !== 'object') throw new Error('Backup missing filesystem data');

  return {
    schemaVersion: data.schemaVersion || 1,
    exportedAt: data.exportedAt || null,
    fs: data.fs,
    bibleCache: data.bibleCache || null,
    warnings,
  };
}

function applyDomainFromBackup(targetFs, sourceFs, domain, sourceBibleCache) {
  const defs = defaultFS();
  if (domain === 'journal') {
    targetFs.notes = JSON.parse(JSON.stringify(sourceFs.notes || defs.notes));
    if (sourceFs.journal) targetFs.journal = JSON.parse(JSON.stringify(sourceFs.journal));
  } else if (domain === 'mail') {
    targetFs.mails = JSON.parse(JSON.stringify(sourceFs.mails || defs.mails));
    targetFs.mailCategories = JSON.parse(JSON.stringify(sourceFs.mailCategories || []));
  } else if (domain === 'calendar') {
    targetFs.events = JSON.parse(JSON.stringify(sourceFs.events || {}));
  } else if (domain === 'todo') {
    targetFs.todos = JSON.parse(JSON.stringify(sourceFs.todos || defs.todos));
  } else if (domain === 'bible') {
    targetFs.bibleBookmarks = JSON.parse(JSON.stringify(sourceFs.bibleBookmarks || {}));
  } else if (domain === 'bibleCache') {
    if (sourceBibleCache) bibleCache = JSON.parse(JSON.stringify(sourceBibleCache));
  } else if (domain === 'pomodoro') {
    targetFs.pomodoroSessions = JSON.parse(JSON.stringify(sourceFs.pomodoroSessions || []));
  } else if (domain === 'clippy') {
    targetFs.clippyPrompts = JSON.parse(JSON.stringify(sourceFs.clippyPrompts || defs.clippyPrompts));
  } else if (domain === 'stickies') {
    targetFs.stickies = JSON.parse(JSON.stringify(sourceFs.stickies || []));
  } else if (domain === 'recyclebin') {
    targetFs.recycleBin = JSON.parse(JSON.stringify(sourceFs.recycleBin || []));
  } else if (domain === 'icons') {
    targetFs.iconOffsets = JSON.parse(JSON.stringify(sourceFs.iconOffsets || {}));
  } else if (domain === 'controlpanel') {
    targetFs.controlpanel = JSON.parse(JSON.stringify(sourceFs.controlpanel || {}));
  }
}

function countDomainItems(sourceFs, domain, sourceBibleCache) {
  const defs = defaultFS();
  if (domain === 'journal') return (sourceFs.notes || []).length;
  if (domain === 'mail') return (sourceFs.mails || []).length;
  if (domain === 'calendar') return Object.keys(sourceFs.events || {}).length;
  if (domain === 'todo') return (sourceFs.todos || []).length;
  if (domain === 'bible') return Object.keys(sourceFs.bibleBookmarks || {}).length;
  if (domain === 'bibleCache') return Object.keys(sourceBibleCache || {}).length;
  if (domain === 'pomodoro') return (sourceFs.pomodoroSessions || []).length;
  if (domain === 'clippy') return (sourceFs.clippyPrompts || []).length;
  if (domain === 'stickies') return (sourceFs.stickies || []).length;
  if (domain === 'recyclebin') return (sourceFs.recycleBin || []).length;
  if (domain === 'icons') return Object.keys(sourceFs.iconOffsets || {}).length;
  if (domain === 'controlpanel') return Object.keys(sourceFs.controlpanel || {}).length;
  return 0;
}

// ============================================================
//  FILESYSTEM PUBLIC INTERFACE
// ============================================================
const filesystem = {
  BACKUP_SCHEMA_VERSION,
  RESTORE_DOMAINS,

  exportJSON() {
    const payload = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: Date.now(),
      appVersion: 'winxp',
      fs: fs,
      bibleCache: bibleCache,
    };
    return JSON.stringify(payload, null, 2);
  },

  getBackupPreview(jsonString) {
    const parsed = parseBackupJSON(jsonString);
    const sourceFs = parsed.fs;
    const domains = RESTORE_DOMAINS.map(d => ({
      id: d.id,
      label: d.label,
      count: countDomainItems(sourceFs, d.id, parsed.bibleCache),
    }));
    const totalBytes = new Blob([jsonString]).size;
    return {
      schemaVersion: parsed.schemaVersion,
      exportedAt: parsed.exportedAt,
      fileSize: totalBytes,
      fileSizeLabel: totalBytes < 1024 ? totalBytes + ' B' :
        totalBytes < 1048576 ? (totalBytes / 1024).toFixed(1) + ' KB' :
        (totalBytes / 1048576).toFixed(1) + ' MB',
      domains,
      warnings: parsed.warnings,
    };
  },

  importJSON(jsonString, options) {
    const opts = options || {};
    const parsed = parseBackupJSON(jsonString);
    const domains = opts.domains;

    if (!domains || domains.length === 0 || domains.includes('all')) {
      const oldBookmarks = fs.bibleBookmarks || {};
      for (const key in oldBookmarks) delete oldBookmarks[key];

      fs = parsed.fs;
      if (!fs.bibleBookmarks) fs.bibleBookmarks = {};
      Object.assign(oldBookmarks, fs.bibleBookmarks);
      fs.bibleBookmarks = oldBookmarks;

      if (parsed.bibleCache) {
        bibleCache = JSON.parse(JSON.stringify(parsed.bibleCache));
        saveBibleCache();
      }
      saveFilesystem();
      return { warnings: parsed.warnings };
    }

    const warnings = parsed.warnings.slice();
    for (const domain of domains) {
      if (!RESTORE_DOMAINS.some(d => d.id === domain)) {
        warnings.push('Unknown restore domain: ' + domain);
        continue;
      }
      applyDomainFromBackup(fs, parsed.fs, domain, parsed.bibleCache);
      if (domain === 'bibleCache') saveBibleCache();
    }
    saveFilesystem();
    return { warnings };
  },

  recordBackup(meta) {
    if (!fs.backupMeta) fs.backupMeta = { lastBackupAt: null, history: [] };
    const entry = {
      at: Date.now(),
      fileName: meta && meta.fileName ? meta.fileName : null,
      type: meta && meta.type ? meta.type : 'manual',
    };
    fs.backupMeta.lastBackupAt = entry.at;
    fs.backupMeta.history.unshift(entry);
    if (fs.backupMeta.history.length > 10) fs.backupMeta.history.length = 10;
    saveFilesystem();
    return entry;
  },

  getLastBackup() {
    if (!fs.backupMeta) return null;
    return fs.backupMeta.lastBackupAt || null;
  },

  getStorageStats() {
    const bibleCacheKeys = Object.keys(bibleCache || {});
    const bibleCacheBytes = new Blob([JSON.stringify(bibleCache)]).size;
    const fsBytes = new Blob([JSON.stringify(fs)]).size;
    return {
      notes: (fs.notes || []).length,
      mails: (fs.mails || []).length,
      events: Object.keys(fs.events || {}).length,
      todos: (fs.todos || []).length,
      bibleBookmarks: Object.keys(fs.bibleBookmarks || {}).length,
      bibleCacheEntries: bibleCacheKeys.length,
      pomodoroSessions: (fs.pomodoroSessions || []).length,
      clippyPrompts: (fs.clippyPrompts || []).length,
      stickies: (fs.stickies || []).length,
      recycleBin: (fs.recycleBin || []).length,
      desktopIcons: Object.keys(fs.iconOffsets || {}).length,
      fsBytes,
      bibleCacheBytes,
      totalBytes: fsBytes + bibleCacheBytes,
      lastBackupAt: filesystem.getLastBackup(),
    };
  },

  saveAutoBackup() {
    try {
      localStorage.setItem('win95_auto_backup', filesystem.exportJSON());
      filesystem.recordBackup({ type: 'auto-exit' });
      return true;
    } catch (e) { return false; }
  },

  resetDomain(name) {
    const defs = defaultFS();
    if (name === 'journal') {
      fs.notes = defs.notes;
    } else if (name === 'mail') {
      fs.mails = defs.mails;
      fs.mailCategories = [];
    } else if (name === 'bible') {
      for (const key in fs.bibleBookmarks) {
        delete fs.bibleBookmarks[key];
      }
    } else if (name === 'pomodoro') {
      fs.pomodoroSessions = [];
    } else if (name === 'clippy') {
      fs.clippyPrompts = defs.clippyPrompts;
    } else if (name === 'todo') {
      fs.todos = defs.todos;
    } else if (name === 'calendar') {
      fs.events = {};
    }
    saveFilesystem();
  }
};
