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
