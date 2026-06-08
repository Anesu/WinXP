// Bootstrap: load persisted data, migrate, and expose store singletons.
loadFilesystem();
loadBibleCache();

if (fs.bibleCache) {
  bibleCache = Object.assign({}, bibleCache, fs.bibleCache);
  delete fs.bibleCache;
  saveFilesystem();
  saveBibleCache();
}

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
