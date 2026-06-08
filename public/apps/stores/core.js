// Shared filesystem + bible cache primitives.
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

function flushFilesystem() {
  clearTimeout(_saveTimer);
  _saveTimer = null;
  try { localStorage.setItem(FILESYSTEM_KEY, JSON.stringify(fs)); }
  catch (e) { /* quota exceeded — silent */ }
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
