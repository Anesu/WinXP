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
