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
