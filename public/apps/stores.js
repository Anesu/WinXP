// ============================================================
//  STORES.JS — Data layer for WinXP productivity apps
//  Per-domain store adapters wrapping localStorage-backed fs.
//  One interface per domain. Implementation absorbs save, sort,
//  ID generation, bounds checking, and validation.
// ============================================================

// ── Core ────────────────────────────────────────────────────
const FILESYSTEM_KEY = 'win95_fs';
const BIBLE_CACHE_KEY = 'win95_bible_cache';

let fs = {};
let bibleCache = {};
let _saveTimer = null;

function saveFilesystem() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try { localStorage.setItem(FILESYSTEM_KEY, JSON.stringify(fs)); }
    catch (e) { /* quota exceeded — silent */ }
  }, 250);
}

function fmtDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function defaultFS() {
  return {
    todos: [
      { id: 't1', text: 'Try the Todo app', completed: false },
      { id: 't2', text: 'Start a Pomodoro session', completed: true },
      { id: 't3', text: 'Check the Calendar', completed: false },
    ],
    events: {},
    mails: [
      { id: 'm1', type: 'email', category: 'Personal', title: 'Meeting Request', subject: 'Meeting Request: [Topic]', body: 'Hi [Name],\n\nI hope you are doing well.\n\nI would like to schedule a quick meeting to discuss [Topic]. Please let me know if you are free at [Time] on [Date], or if another time works better.\n\nBest regards,\n[Sender]', created: Date.now(), updated: Date.now() },
      { id: 'm2', type: 'email', category: 'Personal', title: 'Weekly Status Update', subject: 'Status Update - Week of [Date]', body: 'Hi Team,\n\nHere is my status update for this week:\n\nAccomplishments:\n- [Accomplishment 1]\n- [Accomplishment 2]\n\nNext Steps:\n- [Next Step 1]\n\nBlockers:\n- [Blocker or None]\n\nBest regards,\n[Sender]', created: Date.now(), updated: Date.now() },
      { id: 'm3', type: 'email', category: 'Work', title: 'Project Handover', subject: 'Project Handover - [Project Name]', body: 'Hi [Name],\n\nI am writing to initiate the handover of [Project Name] as I will be transitioning off the project starting [Date].\n\nI have prepared the documentation and will be available for a walkthrough. Let me know when you are free.\n\nBest regards,\n[Sender]', created: Date.now(), updated: Date.now() },
    ],
    clippyPrompts: [
      { id: 'c1', category: 'Coding', title: 'Refactor JS Code', body: 'Analyze the following JavaScript code for readability, performance, and best practices. Suggest a refactored version with a summary of changes:\n\n[Code]', created: Date.now(), updated: Date.now() },
      { id: 'c2', category: 'Testing', title: 'Write Unit Tests', body: 'Generate comprehensive unit tests for the following code, covering edge cases and normal execution paths:\n\n[Code]', created: Date.now(), updated: Date.now() },
      { id: 'c3', category: 'General', title: 'Translate Text', body: 'Translate the following text into [Language], maintaining the original tone and context:\n\n[Text]', created: Date.now(), updated: Date.now() },
    ],
    notes: [
      { id: 'n1', title: 'Welcome', content: 'Welcome to Notepad!<br><br>Click <b>New</b> to create a note. Click a note title on the left to open it.<br><br>Use the toolbar above to <b>Bold</b>, <i>Italicize</i>, <u>Underline</u>, or make bullet lists.<br><br>All changes are saved automatically.', updated: Date.now() },
    ],
    journal: {},
    stickies: [],
    pomodoroSessions: [],
    recycleBin: [],
    iconOffsets: {},
    controlpanel: {},
    bibleBookmarks: {},
    backupMeta: { lastBackupAt: null, history: [] },
  };
}

function loadFilesystem() {
  try {
    const raw = localStorage.getItem(FILESYSTEM_KEY);
    if (raw) {
      const loaded = JSON.parse(raw);
      const defs = defaultFS();
      for (const key of Object.keys(defs)) {
        if (!(key in loaded)) loaded[key] = defs[key];
      }
      // Older/corrupt saves can store mails as null or a non-array, which
      // breaks TemplateManager (items.filter is not a function).
      if (!Array.isArray(loaded.mails)) loaded.mails = defs.mails.slice();
      if (!Array.isArray(loaded.mailCategories)) loaded.mailCategories = [];
      if (!Array.isArray(loaded.todos)) loaded.todos = defs.todos.slice();
      if (!Array.isArray(loaded.clippyPrompts)) loaded.clippyPrompts = defs.clippyPrompts.slice();
      if (!Array.isArray(loaded.notes)) loaded.notes = defs.notes.slice();
      if (!loaded.backupMeta) loaded.backupMeta = { lastBackupAt: null, history: [] };
      fs = loaded;
    } else {
      fs = defaultFS();
    }
  } catch (e) {
    fs = defaultFS();
  }
}

// ── Bible Cache (separate key — large verse payloads) ─────
function loadBibleCache() {
  try {
    const raw = localStorage.getItem(BIBLE_CACHE_KEY);
    if (raw) bibleCache = JSON.parse(raw);
  } catch (e) { bibleCache = {}; }
}
function saveBibleCache() {
  try { localStorage.setItem(BIBLE_CACHE_KEY, JSON.stringify(bibleCache)); }
  catch (e) { /* fail silently */ }
}

// ============================================================
//  DOMAIN STORES
//  Each store wraps a slice of `fs` behind a small interface.
//  The caller never touches `fs` directly — only the store.
// ============================================================

// ── TodoStore ───────────────────────────────────────────────
function createTodoStore() {
  if (!fs.todos) fs.todos = [];
  const save = saveFilesystem;
  return {
    add(data) {
      const todo = { id: 't' + Date.now(), text: data.text || '', completed: false, status: data.status || 'todo', dueDate: data.dueDate || null, completedAt: null, created: Date.now() };
      fs.todos.push(todo);
      save();
      return todo;
    },
    toggle(id) {
      const todo = fs.todos.find(t => t.id === id);
      if (!todo) return null;
      todo.completed = !todo.completed;
      todo.completed ? todo.completedAt = Date.now() : delete todo.completedAt;
      todo.status = todo.completed ? 'done' : 'todo';
      save();
      return todo;
    },
    remove(id) {
      const idx = fs.todos.findIndex(t => t.id === id);
      if (idx === -1) return null;
      const [removed] = fs.todos.splice(idx, 1);
      save();
      return removed;
    },
    update(id, data) {
      const todo = fs.todos.find(t => t.id === id);
      if (!todo) return null;
      if (data.text !== undefined) todo.text = data.text;
      if (data.dueDate !== undefined) todo.dueDate = data.dueDate;
      if (data.status !== undefined) return this.updateStatus(id, data.status);
      save();
      return todo;
    },
    updateStatus(id, newStatus) {
      const todo = fs.todos.find(t => t.id === id);
      if (!todo) return null;
      todo.status = newStatus;
      todo.completed = (newStatus === 'done');
      if (todo.completed) {
        if (!todo.completedAt) todo.completedAt = Date.now();
      } else {
        delete todo.completedAt;
      }
      save();
      return todo;
    },
    get(id) { 
      const todo = fs.todos.find(t => t.id === id);
      if (todo && !todo.status) todo.status = todo.completed ? 'done' : 'todo';
      return todo || null;
    },
    all() { 
      return fs.todos.map(t => {
        if (!t.status) t.status = t.completed ? 'done' : 'todo';
        return t;
      }); 
    },
    active() { return this.all().filter(t => !t.completed); },
    completed() { return this.all().filter(t => t.completed); },
    reorder(fromIdx, toIdx) {
      const active = this.active();
      if (fromIdx < 0 || fromIdx >= active.length || toIdx < 0 || toIdx >= active.length) return;
      const fromTodo = active[fromIdx], toTodo = active[toIdx];
      const fi = fs.todos.indexOf(fromTodo), ti = fs.todos.indexOf(toTodo);
      if (fi === -1 || ti === -1) return;
      fs.todos.splice(fi, 1);
      fs.todos.splice(ti, 0, fromTodo);
      save();
    },
    clearCompleted() {
      const removed = fs.todos.filter(t => t.completed);
      fs.todos = this.active();
      if (removed.length) save();
      return removed;
    },
    countByDueDate(ds) { return fs.todos.filter(t => t.dueDate === ds && !t.completed).length; },
    hasByDueDate(ds) { return fs.todos.some(t => t.dueDate === ds && !t.completed); },
    countCompletedOn(ds) { return fs.todos.filter(t => t.completedAt && fmtDate(new Date(t.completedAt)) === ds).length; },
    hasCompletedOn(ds) { return fs.todos.some(t => t.completedAt && fmtDate(new Date(t.completedAt)) === ds); },
  };
}

// ── EventStore ──────────────────────────────────────────────
function createEventStore() {
  if (!fs.events) fs.events = {};
  const save = saveFilesystem;
  const dateKey = (y, m, d) => y + '-' + (m + 1) + '-' + d;
  return {
    add(dateStr, data) {
      if (!fs.events[dateStr]) fs.events[dateStr] = [];
      const ev = { id: 'e' + Date.now(), title: data.title || '', time: data.time || '' };
      fs.events[dateStr].push(ev);
      fs.events[dateStr].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      save();
      return ev;
    },
    remove(dateStr, id) {
      if (!fs.events[dateStr]) return null;
      const idx = fs.events[dateStr].findIndex(e => e.id === id);
      if (idx === -1) return null;
      const [removed] = fs.events[dateStr].splice(idx, 1);
      if (!fs.events[dateStr].length) delete fs.events[dateStr];
      save();
      return removed;
    },
    forDate(dateStr) { return fs.events[dateStr] ? fs.events[dateStr].slice() : []; },
    hasOn(dateStr) { return !!(fs.events[dateStr] && fs.events[dateStr].length); },
    countOn(dateStr) { return fs.events[dateStr] ? fs.events[dateStr].length : 0; },
    raw() { return fs.events; }, // for backup serialization
  };
}

// ── MailStore ───────────────────────────────────────────────
function createMailStore() {
  if (!Array.isArray(fs.mails)) fs.mails = defaultFS().mails.slice();
  if (!Array.isArray(fs.mailCategories)) fs.mailCategories = [];
  const save = saveFilesystem;
  const LOCKED = new Set(['Personal', 'Work']);
  return {
    add(data) {
      const mail = { id: 'm' + Date.now(), type: data.type || 'email', category: data.category || 'Personal', title: data.title || '', subject: data.subject || '', body: data.body || '', created: Date.now(), updated: Date.now() };
      fs.mails.push(mail);
      save();
      return mail;
    },
    update(id, data) {
      const mail = fs.mails.find(m => m.id === id);
      if (!mail) return null;
      ['type', 'category', 'title', 'subject', 'body'].forEach(k => { if (data[k] !== undefined) mail[k] = data[k]; });
      mail.updated = Date.now();
      save();
      return mail;
    },
    remove(id) {
      const idx = fs.mails.findIndex(m => m.id === id);
      if (idx === -1) return null;
      const [removed] = fs.mails.splice(idx, 1);
      save();
      return removed;
    },
    get(id) { return fs.mails.find(m => m.id === id) || null; },
    all() { return fs.mails.slice(); },
    byCategory(cat) { return fs.mails.filter(m => m.category === cat); },
    search(q) {
      const lq = q.toLowerCase();
      return fs.mails.filter(m => m.title.toLowerCase().includes(lq) || m.subject.toLowerCase().includes(lq) || m.body.toLowerCase().includes(lq) || m.category.toLowerCase().includes(lq));
    },
    categories() {
      const customCats = fs.mailCategories || [];
      return ['All', ...customCats, ...LOCKED];
    },
    customCategories() {
      return fs.mailCategories ? fs.mailCategories.slice() : [];
    },
    addCategory(name) {
      if (LOCKED.has(name)) return false;
      if (!fs.mailCategories) fs.mailCategories = [];
      if (fs.mailCategories.includes(name)) return false;
      fs.mailCategories.push(name);
      save();
      return true;
    },
    deleteCategory(name) {
      if (LOCKED.has(name)) return false;
      fs.mailCategories = (fs.mailCategories || []).filter(c => c !== name);
      // Reassign templates in this category to Personal
      fs.mails.forEach(m => { if (m.category === name) m.category = 'Personal'; });
      save();
      return true;
    },
    isLockedCategory(name) { return LOCKED.has(name); },
    categoryCounts() {
      const counts = {};
      this.categories().forEach(c => counts[c] = 0);
      fs.mails.forEach(m => counts[m.category] = (counts[m.category] || 0) + 1);
      return counts;
    },
  };
}

// ── ClippyStore ─────────────────────────────────────────────
function createClippyStore() {
  if (!fs.clippyPrompts) fs.clippyPrompts = [];
  const save = saveFilesystem;
  return {
    add(data) {
      const p = { id: 'c' + Date.now(), category: data.category || 'General', title: data.title || '', body: data.body || '', created: Date.now(), updated: Date.now() };
      fs.clippyPrompts.push(p);
      save();
      return p;
    },
    update(id, data) {
      const p = fs.clippyPrompts.find(c => c.id === id);
      if (!p) return null;
      ['category', 'title', 'body'].forEach(k => { if (data[k] !== undefined) p[k] = data[k]; });
      p.updated = Date.now();
      save();
      return p;
    },
    remove(id) {
      const idx = fs.clippyPrompts.findIndex(c => c.id === id);
      if (idx === -1) return null;
      const [removed] = fs.clippyPrompts.splice(idx, 1);
      save();
      return removed;
    },
    get(id) { return fs.clippyPrompts.find(c => c.id === id) || null; },
    all() { return fs.clippyPrompts.slice(); },
    byCategory(cat) { return fs.clippyPrompts.filter(c => c.category === cat); },
    search(q) {
      const lq = q.toLowerCase();
      return fs.clippyPrompts.filter(c => c.title.toLowerCase().includes(lq) || c.body.toLowerCase().includes(lq) || c.category.toLowerCase().includes(lq));
    },
    categories() { return [...new Set(fs.clippyPrompts.map(c => c.category))].sort(); },
    categoryCounts() {
      const counts = {};
      this.categories().forEach(c => counts[c] = 0);
      fs.clippyPrompts.forEach(c => counts[c.category] = (counts[c.category] || 0) + 1);
      return counts;
    },
  };
}

// ── NotesStore ──────────────────────────────────────────────
function createNotesStore() {
  if (!fs.notes) fs.notes = [];
  const save = saveFilesystem;
  return {
    add(data) {
      const note = { id: 'n' + Date.now(), title: data.title || 'Untitled', content: data.content || '', updated: Date.now() };
      fs.notes.push(note);
      save();
      return note;
    },
    update(id, data) {
      const note = fs.notes.find(n => n.id === id);
      if (!note) return null;
      if (data.title !== undefined) note.title = data.title;
      if (data.content !== undefined) note.content = data.content;
      note.updated = Date.now();
      save();
      return note;
    },
    remove(id) {
      const idx = fs.notes.findIndex(n => n.id === id);
      if (idx === -1) return null;
      const [removed] = fs.notes.splice(idx, 1);
      save();
      return removed;
    },
    get(id) { return fs.notes.find(n => n.id === id) || null; },
    all() { return fs.notes.slice().sort((a, b) => (b.updated || 0) - (a.updated || 0)); },
    recent(n) { return this.all().slice(0, n || 5); },
    search(q) {
      const lq = q.toLowerCase();
      return fs.notes.filter(n => {
        if (n.title.toLowerCase().includes(lq)) return true;
        const div = document.createElement('div');
        div.innerHTML = n.content || '';
        return (div.textContent || '').toLowerCase().includes(lq);
      });
    },
  };
}

// ── PomodoroStore ───────────────────────────────────────────
function createPomodoroStore() {
  if (!fs.pomodoroSessions) fs.pomodoroSessions = [];
  const save = saveFilesystem;
  return {
    log(data) {
      const s = { date: data.date || Date.now(), duration: data.duration || 25, linkedTaskId: data.linkedTaskId || null };
      fs.pomodoroSessions.unshift(s);
      if (fs.pomodoroSessions.length > 20) fs.pomodoroSessions = fs.pomodoroSessions.slice(0, 20);
      save();
      return s;
    },
    recent(n) { return (fs.pomodoroSessions || []).slice(0, n || 5); },
    all() { return (fs.pomodoroSessions || []).slice(); },
    countOnDate(ds) {
      return (fs.pomodoroSessions || []).filter(s => fmtDate(new Date(s.date)) === ds).length;
    },
    clear() { fs.pomodoroSessions = []; save(); }
  };
}

// ── RecycleBinStore ─────────────────────────────────────────
function createRecycleBinStore() {
  if (!fs.recycleBin) fs.recycleBin = [];
  const save = saveFilesystem;
  return {
    add(type, data) {
      const item = { id: 'rb' + Date.now(), type, data: JSON.parse(JSON.stringify(data)), deletedAt: Date.now() };
      fs.recycleBin.push(item);
      save();
      return item;
    },
    remove(id) {
      const idx = fs.recycleBin.findIndex(r => r.id === id);
      if (idx === -1) return null;
      const [removed] = fs.recycleBin.splice(idx, 1);
      save();
      return removed;
    },
    get(id) { return fs.recycleBin.find(r => r.id === id) || null; },
    all() { return fs.recycleBin.slice(); },
    count() { return fs.recycleBin.length; },
    empty() { fs.recycleBin = []; save(); },
  };
}

// ── ControlPanelStore ───────────────────────────────────────
function createControlPanelStore() {
  if (!fs.controlpanel) fs.controlpanel = {};
  const save = saveFilesystem;
  return {
    get(key, fallback) { return key in fs.controlpanel ? fs.controlpanel[key] : fallback; },
    set(key, value) { fs.controlpanel[key] = value; save(); },
    getAll() { return Object.assign({}, fs.controlpanel); },
    getWorkDuration() { return this.get('pomodoroWork', 25); },
    getBreakDuration() { return this.get('pomodoroBreak', 5); },
    getClockFormat() { return this.get('clockFormat', '12'); },
    getShowClock() { return this.get('showClock', true); },
    getDesktopTheme() { return this.get('desktopTheme', 'teal'); },
    getMailSender() { return this.get('mailSender', ''); },
    getMailSignature() { return this.get('mailSignature', ''); },
    getPinEnabled() { return this.get('lockPinEnabled', false); },
    getPinCode() { return this.get('lockPin', ''); },
    setPin(code) { this.set('lockPin', code); this.set('lockPinEnabled', !!code); },
    clearPin() { this.set('lockPin', ''); this.set('lockPinEnabled', false); },
  };
}

// ── IconStore ───────────────────────────────────────────────
function createIconStore() {
  if (!fs.iconOffsets) fs.iconOffsets = {};
  const save = saveFilesystem;
  return {
    get(app) { return fs.iconOffsets[app] || null; },
    set(app, x, y) { fs.iconOffsets[app] = { x, y }; save(); },
    remove(app) { delete fs.iconOffsets[app]; save(); },
    all() { return Object.assign({}, fs.iconOffsets); },
    reset() { fs.iconOffsets = {}; save(); },
  };
}

// ── BibleBookmarkStore ──────────────────────────────────────
function createBibleBookmarkStore() {
  if (!fs.bibleBookmarks) fs.bibleBookmarks = {};
  const save = saveFilesystem;
  return new Proxy(fs.bibleBookmarks, {
    get(target, prop) {
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      save();
      return true;
    },
    deleteProperty(target, prop) {
      delete target[prop];
      save();
      return true;
    }
  });
}

// ── StickiesStore ───────────────────────────────────────────
function createStickiesStore() {
  if (!fs.stickies) fs.stickies = [];
  const save = saveFilesystem;
  return {
    add(data) {
      const s = { id: 's' + Date.now(), text: data.text || '', created: Date.now(), updated: Date.now() };
      fs.stickies.push(s);
      save();
      return s;
    },
    update(id, text) {
      const s = fs.stickies.find(st => st.id === id);
      if (!s) return null;
      s.text = text;
      s.updated = Date.now();
      save();
      return s;
    },
    remove(id) {
      const idx = fs.stickies.findIndex(st => st.id === id);
      if (idx === -1) return null;
      const [removed] = fs.stickies.splice(idx, 1);
      save();
      return removed;
    },
    get(id) { return fs.stickies.find(st => st.id === id) || null; },
    all() { return fs.stickies.slice(); },
  };
}

// ============================================================
//  INIT — load filesystem and bible cache on script load
// ============================================================
loadFilesystem();
loadBibleCache();

// Migrate old bibleCache from fs if it was stored there
if (fs.bibleCache) {
  bibleCache = Object.assign({}, bibleCache, fs.bibleCache);
  delete fs.bibleCache;
  saveFilesystem();
  saveBibleCache();
}

// ============================================================
//  CREATE STORE INSTANCES
//  These are the global singletons used by all controllers.
//  Available to app scripts as: todoStore, eventStore, etc.
// ============================================================
//  BACKUP SCHEMA (v2 includes bible cache + metadata)
// ============================================================
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

// ============================================================
const todoStore      = createTodoStore();
const eventStore     = createEventStore();
const mailStore      = createMailStore();
const clippyStore    = createClippyStore();
const notesStore     = createNotesStore();
const pomodoroStore  = createPomodoroStore();
const recycleBinStore = createRecycleBinStore();
const controlPanelStore = createControlPanelStore();
const iconStore      = createIconStore();
const bibleBookmarkStore = createBibleBookmarkStore();
const stickiesStore  = createStickiesStore();