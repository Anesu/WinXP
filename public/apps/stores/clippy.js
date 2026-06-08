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
