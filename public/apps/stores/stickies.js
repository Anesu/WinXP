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
